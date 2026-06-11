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

async function supabasePatch(table, id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
}

async function fetchShelterLuvPage(api_key, offset, limit) {
  const res = await fetch(
    `https://www.shelterluv.com/api/v1/animals?offset=${offset}&limit=${limit}&status_type=publishable`,
    { headers: { 'X-Api-Key': api_key } }
  );
  if (!res.ok) throw new Error(`ShelterLuv API ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
  const data = await res.json();
  return { animals: data.animals || [], total: data.total_count || 0 };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { connection_id } = req.body || {};
  if (!connection_id) return res.status(400).json({ error: 'connection_id is required' });

  try {
    const rows = await supabaseGet('shelter_connections', { id: `eq.${connection_id}` });
    const conn = rows?.[0];
    if (!conn) return res.status(404).json({ error: 'Connection not found' });

    const { api_key, shelter_name } = conn;
    if (!api_key) return res.status(400).json({ error: 'No API key on connection' });

    // Fetch first page to get total count
    const limit = 100;
    const first = await fetchShelterLuvPage(api_key, 0, limit);
    const total = first.total || first.animals.length;

    // Fetch remaining pages in parallel
    const pageCount = Math.ceil(total / limit);
    const offsets = Array.from({ length: pageCount - 1 }, (_, i) => (i + 1) * limit);
    const rest = await Promise.all(offsets.map(offset => fetchShelterLuvPage(api_key, offset, limit)));

    const allAnimals = [first, ...rest].flatMap(p => p.animals);

    const pets = allAnimals.map((a) => ({
      name: a.Name || '',
      species: a.Type || '',
      breed: [a.PrimaryBreed, a.SecondaryBreed].filter(Boolean).join(' / ') || '',
      age: a.Age || '',
      gender: a.Sex || '',
      description: a.Description || '',
      photo_url: a.Photos?.[0]?.large || a.Photos?.[0]?.medium || '',
      adoption_status: 'available',
      source: shelter_name || '',
      source_id: `shelterluv_${a.ID}`,
      url: a.AdoptionUrl || '',
    }));

    // Upsert all at once
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/pets?on_conflict=source%2Csource_id`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(pets),
    });
    if (!upsertRes.ok) throw new Error(`Upsert failed: ${upsertRes.status} ${await upsertRes.text()}`);

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
