import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function mapAge(ageMonths) {
  if (!ageMonths && ageMonths !== 0) return 'Unknown';
  if (ageMonths < 6) return 'Baby';
  if (ageMonths < 24) return 'Young';
  if (ageMonths < 96) return 'Adult';
  return 'Senior';
}

function mapSize(weightLbs) {
  if (!weightLbs) return 'Unknown';
  if (weightLbs < 15) return 'Small';
  if (weightLbs < 40) return 'Medium';
  if (weightLbs < 80) return 'Large';
  return 'Extra Large';
}

const DEFAULT_ADOPTABLE_STATUSES = ['Adoption Available', 'Available Foster'];

function hasChanged(existing, petData) {
  const fields = ['name', 'species', 'breed', 'age', 'gender', 'size', 'weight', 'description', 'photo_url', 'vaccinated', 'spayed_neutered', 'kid_friendly', 'dog_friendly', 'cat_friendly', 'energy_level', 'rescue_name', 'contact_name', 'contact_email', 'contact_phone'];
  for (const f of fields) {
    if (existing[f] !== petData[f]) return true;
  }
  const existingPhotos = (existing.photo_urls || []).length;
  const newPhotos = (petData.photo_urls || []).length;
  if (existingPhotos !== newPhotos) return true;
  return false;
}

async function fetchPage(apiKey, offset, limit = 100) {
  let retries = 0;
  let backoff = 3000;
  while (retries < 5) {
    const res = await fetch(
      `https://www.shelterluv.com/api/v1/animals?limit=${limit}&offset=${offset}`,
      { headers: { 'X-Api-Key': apiKey } }
    );
    if (res.status === 429) {
      console.log(`[Rate limited offset=${offset}] Waiting ${backoff}ms...`);
      await new Promise(r => setTimeout(r, backoff));
      backoff *= 2;
      retries++;
      continue;
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ShelterLuv API error (HTTP ${res.status}): ${errText.slice(0, 200)}`);
    }
    return await res.json();
  }
  throw new Error(`ShelterLuv API: Rate limit exceeded after 5 retries at offset ${offset}`);
}

async function fetchAllAnimals(apiKey, adoptableStatuses) {
  const firstData = await fetchPage(apiKey, 0, 1);
  const totalCount = firstData.total_count || 0;

  if (totalCount === 0) return [];

  const PAGE_SIZE = 100;
  const SCAN_WINDOW = 5000;
  const adoptableAnimals = [];

  const startOffset = Math.max(0, totalCount - SCAN_WINDOW);
  let offset = startOffset;

  while (offset <= totalCount) {
    const data = await fetchPage(apiKey, offset, PAGE_SIZE);
    const page = data.animals || [];

    if (page.length === 0) break;

    const adoptable = page.filter(a => {
      const s = (a.Status || '').toLowerCase().trim();
      return adoptableStatuses.some(st => s === st.toLowerCase().trim());
    });

    adoptableAnimals.push(...adoptable);
    console.log(`[offset=${offset}] scanned=${page.length}, adoptable=${adoptable.length}, total_adoptable=${adoptableAnimals.length}`);

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log(`Done. Found ${adoptableAnimals.length} adoptable animals in last ${SCAN_WINDOW} records.`);
  return adoptableAnimals;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { connection_id } = body;

    let connections;
    if (connection_id) {
      connections = await base44.asServiceRole.entities.ShelterConnection.filter({ id: connection_id });
    } else {
      connections = await base44.asServiceRole.entities.ShelterConnection.filter({
        software_platform: 'ShelterLuv',
        status: 'active',
      });
    }

    let totalCreated = 0;
    let totalUpdated = 0;
    const results = [];

    for (const conn of connections) {
      if (!conn.api_key) {
        results.push({ shelter: conn.shelter_name, skipped: true, reason: 'Missing api_key' });
        continue;
      }

      try {
        let created = 0;
        let updated = 0;
        let skipped = 0;

        const adoptableStatuses = conn.shelterluv_adoptable_statuses || DEFAULT_ADOPTABLE_STATUSES;

        const animals = await fetchAllAnimals(conn.api_key, adoptableStatuses);
        const adoptableIds = new Set(animals.map(a => String(a.ID)));

        const existingPets = await base44.asServiceRole.entities.Pet.filter({
          source: conn.shelter_name,
        });

        let deleteCount = 0;
        for (const pet of existingPets) {
          if (!adoptableIds.has(pet.source_id)) {
            if (pet.adoption_status === 'Transferred' || pet.adoption_status === 'Adopted') {
              continue;
            }
            await base44.asServiceRole.entities.Pet.delete(pet.id);
            deleteCount++;
            if (deleteCount % 10 === 0) await new Promise(r => setTimeout(r, 500));
          }
        }
        console.log(`Deleted ${deleteCount} pets no longer adoptable.`);

        for (const animal of animals) {
          const sourceId = String(animal.ID);

          const photoUrls = (animal.Photos || []).map(p => {
            if (typeof p === 'string') return p;
            return p.URL || p.url || '';
          }).filter(Boolean);

          if (photoUrls.length === 0 && animal.CoverPhoto) {
            photoUrls.push(animal.CoverPhoto);
          }

          const weightLbs = parseFloat(animal.CurrentWeightPounds || animal.Weight) || null;

          const petData = {
            name: animal.Name || 'Unknown',
            species: animal.Type || 'Unknown',
            breed: animal.Breed || 'Unknown',
            age: mapAge(animal.Age),
            gender: animal.Sex === 'Male' ? 'Male' : animal.Sex === 'Female' ? 'Female' : 'Unknown',
            size: mapSize(weightLbs),
            weight: weightLbs,
            description: animal.Description || '',
            photo_url: photoUrls[0] || '',
            photo_urls: photoUrls,
            location: conn.shelter_name,
            contact: conn.contact_email || '',
            rescue_name: conn.shelter_name || '',
            contact_name: conn.contact_name || conn.shelter_name || '',
            contact_email: conn.contact_email || '',
            contact_phone: conn.contact_phone || '',
            source: conn.shelter_name,
            source_id: sourceId,
            adoption_status: 'Available',
            vaccinated: animal.IsCurrentVaccinations === true || animal.IsCurrentVaccinations === 'true',
            spayed_neutered: animal.Altered === 'Yes',
            kid_friendly: animal.GoodWithKids === 'Yes' ? 'yes' : animal.GoodWithKids === 'No' ? 'no' : 'unsure',
            dog_friendly: animal.GoodWithDogs === 'Yes' ? 'yes' : animal.GoodWithDogs === 'No' ? 'no' : 'unsure',
            cat_friendly: animal.GoodWithCats === 'Yes' ? 'yes' : animal.GoodWithCats === 'No' ? 'no' : 'unsure',
            energy_level: (() => { const e = (animal.EnergyLevel || animal.ActivityLevel || '').toLowerCase(); if (e.includes('low')) return 'low'; if (e.includes('high')) return 'high'; if (e.includes('med') || e.includes('moderate')) return 'medium'; return null; })(),
          };

          const existing = existingPets.find(p => p.source_id === sourceId);

          if (existing) {
            if (hasChanged(existing, petData)) {
              await base44.asServiceRole.entities.Pet.update(existing.id, petData);
              updated++;
            } else {
              skipped++;
            }
          } else {
            await base44.asServiceRole.entities.Pet.create(petData);
            created++;
          }
        }

        totalCreated += created;
        totalUpdated += updated;

        const updateData = {
          status: 'active',
          last_sync: new Date().toISOString(),
          pets_synced: created + updated,
          notes: '',
        };
        if (!adoptableStatuses || adoptableStatuses.length === 0) {
          updateData.shelterluv_adoptable_statuses = DEFAULT_ADOPTABLE_STATUSES;
        }
        await base44.asServiceRole.entities.ShelterConnection.update(conn.id, updateData);

        await base44.asServiceRole.entities.SyncLog.create({
          rescue_email: conn.contact_email,
          api_provider: 'ShelterLuv',
          sync_type: 'pets',
          status: 'success',
          pets_synced: created + updated,
          error_message: '',
          details: {
            created,
            updated,
            skipped,
            statuses: adoptableStatuses.join(', '),
          },
        });

        console.log(`Writes: ${created} created, ${updated} updated, ${skipped} skipped.`);
        results.push({ shelter: conn.shelter_name, created, updated, skipped, total: animals.length });

      } catch (err) {
        console.error(`Error syncing ${conn.shelter_name}:`, err.message);
        await base44.asServiceRole.entities.ShelterConnection.update(conn.id, {
          status: 'error',
          notes: `Sync error: ${err.message}`,
        });
        results.push({ shelter: conn.shelter_name, error: err.message });
      }
    }

    return Response.json({
      success: true,
      connectionsProcessed: connections.length,
      totalCreated,
      totalUpdated,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});