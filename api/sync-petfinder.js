const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseGet(table, filter) {
  const params = new URLSearchParams({ select: '*', ...filter });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase GET ${table} ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supabaseUpsert(table, rows, onConflict) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status} ${await res.text()}`);
}

async function supabasePatch(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase PATCH failed: ${res.status}`);
}

async function getPetfinderToken(clientId, clientSecret) {
  const res = await fetch('https://api.petfinder.com/v2/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Petfinder auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function fetchPetfinderPage(token, orgId, page) {
  const params = new URLSearchParams({
    organization: orgId,
    status: 'adoptable',
    limit: '100',
    page: String(page),
  });
  const res = await fetch(`https://api.petfinder.com/v2/animals?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Petfinder animals fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Petfinder uses text age categories — map to approximate years
function parseAge(ageStr) {
  switch ((ageStr || '').toLowerCase()) {
    case 'baby':   return { age_years: 0, age_months: 3 };
    case 'young':  return { age_years: 1, age_months: null };
    case 'adult':  return { age_years: 4, age_months: null };
    case 'senior': return { age_years: 9, age_months: null };
    default:       return { age_years: null, age_months: null };
  }
}

function toYesNo(val) {
  if (val === true) return 'yes';
  if (val === false) return 'no';
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { connection_id } = req.body || {};
  if (!connection_id) return res.status(400).json({ error: 'connection_id is required' });

  try {
    const rows = await supabaseGet('shelter_connections', { id: `eq.${connection_id}` });
    const conn = rows?.[0];
    if (!conn) return res.status(404).json({ error: 'Connection not found' });

    const { api_key: clientId, api_secret: clientSecret, organization_id: orgId, shelter_name } = conn;
    if (!clientId || !clientSecret) return res.status(400).json({ error: 'Petfinder requires api_key (client ID) and api_secret (client secret)' });
    if (!orgId) return res.status(400).json({ error: 'organization_id (Petfinder org ID) is required' });

    // Get shelter location fallback from shelter_details
    const detailsRows = await supabaseGet('shelter_details', { shelter_name: `eq.${shelter_name}` });
    const details = detailsRows?.[0];
    const fallbackCity = details?.city || '';
    const fallbackState = details?.state || '';

    const token = await getPetfinderToken(clientId, clientSecret);

    // Fetch all pages
    let allAnimals = [];
    let page = 1;
    while (true) {
      const data = await fetchPetfinderPage(token, orgId, page);
      const animals = data.animals || [];
      allAnimals = allAnimals.concat(animals);
      const { total_count, count, current_page } = data.pagination || {};
      if (!animals.length || allAnimals.length >= total_count || animals.length < 100) break;
      page++;
    }

    const pets = allAnimals.map((a) => {
      const { age_years, age_months } = parseAge(a.age);
      const breeds = [a.breeds?.primary, a.breeds?.secondary].filter(Boolean);
      const photo = a.photos?.[0]?.large || a.photos?.[0]?.medium || '';
      const city = a.contact?.address?.city || fallbackCity;
      const state = a.contact?.address?.state || fallbackState;
      return {
        name: a.name || '',
        species: a.species || '',
        breed: breeds.join(' / ') || '',
        age: a.age || '',
        age_years,
        age_months,
        gender: a.gender || '',
        size: a.size || '',
        color: a.colors?.primary || '',
        description: a.description || '',
        photo_url: photo,
        shelter_status: a.status || null,
        adoption_status: 'Available',
        source: shelter_name || '',
        rescue_name: shelter_name || '',
        rescue_city: city,
        rescue_state: state,
        source_id: `petfinder_${a.id}`,
        url: a.url || '',
        spayed_neutered: a.attributes?.spayed_neutered ?? null,
        house_trained: a.attributes?.house_trained != null ? (a.attributes.house_trained ? 'yes' : 'no') : null,
        vaccinated: a.attributes?.shots_current ?? null,
        special_needs: a.attributes?.special_needs ?? null,
        kid_friendly: toYesNo(a.environment?.children),
        dog_friendly: toYesNo(a.environment?.dogs),
        cat_friendly: toYesNo(a.environment?.cats),
      };
    });

    for (let i = 0; i < pets.length; i += 50) {
      await supabaseUpsert('pets', pets.slice(i, i + 50), 'source_id');
    }

    await supabasePatch('shelter_connections', connection_id, {
      last_sync: new Date().toISOString(),
      pets_synced: pets.length,
      status: 'active',
    });

    return res.status(200).json({ success: true, animals_synced: pets.length });
  } catch (err) {
    await supabasePatch('shelter_connections', connection_id, { status: 'error', notes: err.message }).catch(() => {});
    return res.status(500).json({ error: err.message });
  }
}
