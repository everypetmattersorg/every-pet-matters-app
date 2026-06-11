const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseGet(table, filter) {
  const params = new URLSearchParams({ select: '*', ...filter });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase GET ${table} failed: ${res.status}`);
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
  if (!res.ok) throw new Error(`Supabase upsert ${table} failed: ${res.status} ${await res.text()}`);
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
  if (!res.ok) throw new Error(`Supabase PATCH ${table} failed: ${res.status}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { connection_id } = req.body || {};
  if (!connection_id) return res.status(400).json({ error: 'connection_id is required' });

  const rows = await supabaseGet('shelter_connections', { id: `eq.${connection_id}` });
  const conn = rows?.[0];
  if (!conn) return res.status(404).json({ error: 'Connection not found' });

  const { api_key, organization_id, shelter_name } = conn;
  if (!api_key || !organization_id) return res.status(400).json({ error: 'Missing api_key or organization_id on connection' });

  try {
    const apRes = await fetch(
      `https://api.adoptapet.com/search/pet_search?key=${api_key}&shelter_id=${organization_id}&v=2&output=json&count=500&start=1`
    );
    if (!apRes.ok) throw new Error(`Adopt-a-Pet API ${apRes.status}: ${await apRes.text().then(t => t.slice(0, 200))}`);

    const apData = await apRes.json();
    const animals = apData.pets || apData.pet || [];
    if (!Array.isArray(animals)) throw new Error('Unexpected Adopt-a-Pet response: ' + JSON.stringify(apData).slice(0, 200));

    const pets = animals.map((a) => ({
      name: a.pet_name || a.name || '',
      species: a.species || a.pet_type || '',
      breed: [a.primary_breed, a.secondary_breed].filter(Boolean).join(' / ') || a.breed || '',
      age: a.age || '',
      gender: a.sex || a.gender || '',
      description: a.description || '',
      photo_url: a.photo?.large || a.large_results_photo_url || a.thumbnail_url || '',
      adoption_status: 'available',
      source: shelter_name || '',
      source_id: `adoptapet_${a.id || a.pet_id}`,
      url: a.detail_url || a.url || '',
    }));

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
