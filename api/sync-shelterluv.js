import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { connection_id } = req.body || {};
  if (!connection_id) return res.status(400).json({ error: 'connection_id is required' });

  // Load the shelter connection
  const { data: conn, error: connErr } = await supabase
    .from('shelter_connections')
    .select('*')
    .eq('id', connection_id)
    .single();

  if (connErr || !conn) return res.status(404).json({ error: 'Connection not found' });

  const { api_key, shelter_name, software_platform } = conn;

  if (software_platform?.toLowerCase() !== 'shelterluv') {
    return res.status(400).json({ error: `Sync not supported for platform: ${software_platform}` });
  }

  try {
    // Fetch animals from ShelterLuv API (paginated)
    let offset = 0;
    const limit = 100;
    let allAnimals = [];

    while (true) {
      const slRes = await fetch(
        `https://www.shelterluv.com/api/v1/animals?offset=${offset}&limit=${limit}&status_type=publishable`,
        { headers: { 'X-Api-Key': api_key } }
      );

      if (!slRes.ok) {
        const errText = await slRes.text();
        throw new Error(`ShelterLuv API error ${slRes.status}: ${errText}`);
      }

      const slData = await slRes.json();
      const animals = slData.animals || [];
      allAnimals = allAnimals.concat(animals);

      if (animals.length < limit) break;
      offset += limit;
    }

    // Map ShelterLuv animals → pets table columns
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

    // Upsert using source_id as the conflict key
    let upserted = 0;
    const BATCH = 50;
    for (let i = 0; i < pets.length; i += BATCH) {
      const batch = pets.slice(i, i + BATCH);
      const { error: upsertErr } = await supabase
        .from('pets')
        .upsert(batch, { onConflict: 'source_id', ignoreDuplicates: false });
      if (upsertErr) throw new Error('Upsert failed: ' + upsertErr.message);
      upserted += batch.length;
    }

    // Update last_sync and pets_synced on the connection
    await supabase
      .from('shelter_connections')
      .update({
        last_sync: new Date().toISOString(),
        pets_synced: upserted,
        status: 'active',
      })
      .eq('id', connection_id);

    return res.status(200).json({ success: true, animals_synced: upserted, shelter: shelter_name });
  } catch (err) {
    await supabase
      .from('shelter_connections')
      .update({ status: 'error', notes: `Last sync error: ${err.message}` })
      .eq('id', connection_id);

    return res.status(500).json({ error: err.message });
  }
}
