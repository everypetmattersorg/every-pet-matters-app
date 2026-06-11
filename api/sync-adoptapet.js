export const config = { maxDuration: 60 };

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

  const { data: conn, error: connErr } = await supabase
    .from('shelter_connections')
    .select('*')
    .eq('id', connection_id)
    .single();

  if (connErr || !conn) return res.status(404).json({ error: 'Connection not found' });

  const { api_key, organization_id, shelter_name } = conn;

  try {
    // Adopt-a-Pet API: returns JSON array of pets
    const apRes = await fetch(
      `https://api.adoptapet.com/search/pet_search?key=${api_key}&shelter_id=${organization_id}&v=2&output=json&count=500&start=1`,
    );

    if (!apRes.ok) {
      const errText = await apRes.text();
      throw new Error(`Adopt-a-Pet API error ${apRes.status}: ${errText}`);
    }

    const apData = await apRes.json();
    // Response shape: { status: "Success", pets: [...] } or { status: "Success", pet: [...] }
    const animals = apData.pets || apData.pet || [];

    if (!Array.isArray(animals)) {
      throw new Error('Unexpected Adopt-a-Pet API response shape: ' + JSON.stringify(apData).slice(0, 200));
    }

    const pets = animals.map((a) => ({
      name: a.pet_name || a.name || '',
      species: a.species || a.pet_type || '',
      breed: [a.primary_breed, a.secondary_breed].filter(Boolean).join(' / ') || a.breed || '',
      age: a.age || '',
      gender: a.sex || a.gender || '',
      description: a.description || '',
      photo_url: a.photo?.large || a.photo?.medium || a.large_results_photo_url || a.thumbnail_url || '',
      adoption_status: 'available',
      source: shelter_name || '',
      source_id: `adoptapet_${a.id || a.pet_id}`,
      url: a.detail_url || a.url || '',
    }));

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

    return res.status(200).json({ success: true, animals_synced: upserted, shelter: shelter_name });
  } catch (err) {
    await supabase
      .from('shelter_connections')
      .update({ status: 'error', notes: `Last sync error: ${err.message}` })
      .eq('id', connection_id);

    return res.status(500).json({ error: err.message });
  }
}
