import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rescue_email } = await req.json();

    if (user.email !== rescue_email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get API credentials
    const integrations = await base44.asServiceRole.entities.RescueAPIIntegration.filter({
      rescue_email: rescue_email,
      api_provider: 'petfinder',
      is_active: true
    });

    if (!integrations.length) {
      return Response.json({ error: 'No active Petfinder integration found' }, { status: 400 });
    }

    const integration = integrations[0];
    const startTime = Date.now();

    // Get Petfinder access token
    const tokenRes = await fetch('https://api.petfinder.com/v2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${integration.api_key}&client_secret=${integration.api_secret}`,
    });

    if (!tokenRes.ok) {
      throw new Error('Failed to authenticate with Petfinder');
    }

    const { access_token } = await tokenRes.json();

    // Fetch animals from Petfinder
    let allAnimals = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const petsRes = await fetch(
        `https://api.petfinder.com/v2/animals?organization=${integration.petfinder_organization_id}&limit=${limit}&page=${page}`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (!petsRes.ok) break;

      const data = await petsRes.json();
      allAnimals = allAnimals.concat(data.animals || []);

      if (!data.pagination?.next_page) break;
      page++;
    }

    // Map Petfinder animals to AdoptablePet format
    const adoptablePets = allAnimals.map((animal) => ({
      name: animal.name,
      pet_type: animal.type.toLowerCase(),
      breed: animal.breeds?.primary || 'Unknown',
      age_years: calculateYears(animal.age),
      age_months: calculateMonths(animal.age),
      gender: animal.gender?.toLowerCase() || 'unknown',
      color: animal.colors?.primary || '',
      description: animal.description || '',
      photo_url: animal.photos?.[0]?.full || '',
      extra_photos: animal.photos?.slice(1).map((p) => p.full) || [],
      rescue_name: integration.rescue_email.split('@')[0],
      rescue_email: rescue_email,
      rescue_phone: '',
      rescue_website: '',
      good_with_kids: animal.environment?.children === true,
      good_with_dogs: animal.environment?.dogs === true,
      good_with_cats: animal.environment?.cats === true,
      energy_level: mapEnergyLevel(animal.attributes?.energy_level),
      special_needs: animal.attributes?.special_needs || false,
      status: animal.status === 'adoptable' ? 'available' : animal.status,
      external_id: animal.id.toString(),
    }));

    // Upsert pets into database
    let synced = 0;
    for (const pet of adoptablePets) {
      const existing = await base44.asServiceRole.entities.AdoptablePet.filter({
        external_id: pet.external_id,
      });

      if (existing.length) {
        await base44.asServiceRole.entities.AdoptablePet.update(existing[0].id, pet);
      } else {
        await base44.asServiceRole.entities.AdoptablePet.create(pet);
      }
      synced++;
    }

    // Log sync
    const duration = Math.round((Date.now() - startTime) / 1000);
    await base44.asServiceRole.entities.SyncLog.create({
      rescue_email,
      api_provider: 'petfinder',
      sync_type: 'pets',
      status: 'success',
      pets_synced: synced,
      duration_seconds: duration,
    });

    // Update last sync timestamp
    await base44.asServiceRole.entities.RescueAPIIntegration.update(integration.id, {
      last_sync: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      pets_synced: synced,
      duration_seconds: duration,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateYears(ageString) {
  if (!ageString) return 0;
  const match = ageString.match(/(\d+)\s*years?/i);
  return match ? parseInt(match[1]) : 0;
}

function calculateMonths(ageString) {
  if (!ageString) return 0;
  const match = ageString.match(/(\d+)\s*months?/i);
  return match ? parseInt(match[1]) : 0;
}

function mapEnergyLevel(petfinderLevel) {
  if (!petfinderLevel) return 'medium';
  const lower = petfinderLevel.toLowerCase();
  if (lower.includes('high')) return 'high';
  if (lower.includes('low')) return 'low';
  return 'medium';
}