import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { api_key, organization_id, shelter_name, connection_id } = req.body || {};
  if (!api_key || !organization_id) return res.status(400).json({ error: 'api_key and organization_id are required' });

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

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let upserted = 0;
    for (let i = 0; i < pets.length; i += 50) {
      const { error } = await supabase.from('pets').upsert(pets.slice(i, i + 50), { onConflict: 'source_id' });
      if (error) throw new Error('DB upsert failed: ' + error.message);
      upserted += Math.min(50, pets.length - i);
    }

    if (connection_id) {
      await supabase.from('shelter_connections')
        .update({ last_sync: new Date().toISOString(), pets_synced: upserted, status: 'active' })
        .eq('id', connection_id);
    }

    return res.status(200).json({ success: true, animals_synced: upserted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
