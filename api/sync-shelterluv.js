export const config = { maxDuration: 60 };

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { connection_id } = req.body || {};
  if (!connection_id) return res.status(400).json({ error: 'connection_id is required' });

  console.log('[shelterluv-sync] loading connection', connection_id);

  const { data: conn, error: connErr } = await supabase
    .from('shelter_connections')
    .select('*')
    .eq('id', connection_id)
    .single();

  if (connErr || !conn) {
    console.error('[shelterluv-sync] connection not found', connErr?.message);
    return res.status(404).json({ error: 'Connection not found: ' + (connErr?.message || '') });
  }

  const { api_key, shelter_name, software_platform } = conn;
  console.log('[shelterluv-sync] platform:', software_platform, 'shelter:', shelter_name);

  if (software_platform?.toLowerCase() !== 'shelterluv') {
    return res.status(400).json({ error: `Sync not supported for platform: ${software_platform}` });
  }

  try {
    let offset = 0;
    const limit = 100;
    let allAnimals = [];

    while (true) {
      console.log('[shelterluv-sync] fetching offset', offset);
      const slRes = await fetchWithTimeout(
        `https://www.shelterluv.com/api/v1/animals?offset=${offset}&limit=${limit}&status_type=publishable`,
        { headers: { 'X-Api-Key': api_key } },
        25000
      );

      if (!slRes.ok) {
        const errText = await slRes.text();
        throw new Error(`ShelterLuv API ${slRes.status}: ${errText.slice(0, 300)}`);
      }

      const slData = await slRes.json();
      const animals = slData.animals || [];
      console.log('[shelterluv-sync] got', animals.length, 'animals at offset', offset);
      allAnimals = allAnimals.concat(animals);

      if (animals.length < limit) break;
      offset += limit;
    }

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

    console.log('[shelterluv-sync] upserting', pets.length, 'pets');
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

    await supabase
      .from('shelter_connections')
      .update({ last_sync: new Date().toISOString(), pets_synced: upserted, status: 'active' })
      .eq('id', connection_id);

    console.log('[shelterluv-sync] done:', upserted, 'synced');
    return res.status(200).json({ success: true, animals_synced: upserted, shelter: shelter_name });
  } catch (err) {
    console.error('[shelterluv-sync] error:', err.message);
    await supabase
      .from('shelter_connections')
      .update({ status: 'error', notes: `Last sync error: ${err.message}` })
      .eq('id', connection_id);

    return res.status(500).json({ error: err.message });
  }
}
