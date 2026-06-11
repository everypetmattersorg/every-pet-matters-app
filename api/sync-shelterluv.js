export const config = { maxDuration: 60 };

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { api_key, shelter_name, connection_id } = req.body || {};
  if (!api_key) return res.status(400).json({ error: 'api_key is required' });

  try {
    // Fetch animals from ShelterLuv API (paginated)
    let offset = 0;
    const limit = 100;
    let allAnimals = [];

    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      let slRes;
      try {
        slRes = await fetch(
          `https://www.shelterluv.com/api/v1/animals?offset=${offset}&limit=${limit}&status_type=publishable`,
          { headers: { 'X-Api-Key': api_key }, signal: controller.signal }
        );
      } finally {
        clearTimeout(timer);
      }

      if (!slRes.ok) {
        const errText = await slRes.text();
        throw new Error(`ShelterLuv API ${slRes.status}: ${errText.slice(0, 300)}`);
      }

      const slData = await slRes.json();
      const animals = slData.animals || [];
      allAnimals = allAnimals.concat(animals);
      if (animals.length < limit) break;
      offset += limit;
    }

    // Map to pets table schema
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

    // Upsert via service role (bypasses RLS)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let upserted = 0;
    for (let i = 0; i < pets.length; i += 50) {
      const { error } = await supabase
        .from('pets')
        .upsert(pets.slice(i, i + 50), { onConflict: 'source_id' });
      if (error) throw new Error('DB upsert failed: ' + error.message);
      upserted += Math.min(50, pets.length - i);
    }

    if (connection_id) {
      await supabase
        .from('shelter_connections')
        .update({ last_sync: new Date().toISOString(), pets_synced: upserted, status: 'active' })
        .eq('id', connection_id);
    }

    return res.status(200).json({ success: true, animals_synced: upserted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
