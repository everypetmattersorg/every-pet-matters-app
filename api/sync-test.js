export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Load all connections
  const r = await fetch(`${supabaseUrl}/rest/v1/shelter_connections?select=*`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const connections = await r.json();

  const results = [];

  for (const conn of connections) {
    const result = { shelter: conn.shelter_name, platform: conn.software_platform };

    if (conn.software_platform?.toLowerCase() === 'shelterluv') {
      try {
        const slRes = await fetch(
          `https://www.shelterluv.com/api/v1/animals?offset=0&limit=5&status_type=publishable`,
          { headers: { 'X-Api-Key': conn.api_key } }
        );
        const slData = await slRes.json();
        result.status = slRes.status;
        result.animal_count = slData.total_count;
        result.sample = slData.animals?.slice(0, 1).map(a => a.Name);
        result.error = slData.error || null;
      } catch (e) {
        result.error = e.message;
      }
    } else if (conn.software_platform?.toLowerCase() === 'adopt-a-pet') {
      try {
        const apRes = await fetch(
          `https://api.adoptapet.com/search/pet_search?key=${conn.api_key}&shelter_id=${conn.organization_id}&v=2&output=json&count=5&start=1`
        );
        const apData = await apRes.json();
        result.status = apRes.status;
        result.keys = Object.keys(apData);
        result.total = apData.total_count || apData.totalCount || apData.total;
        result.sample_keys = apData.pets?.[0] ? Object.keys(apData.pets[0]) : (apData.pet?.[0] ? Object.keys(apData.pet[0]) : 'no pets key');
        result.raw_snippet = JSON.stringify(apData).slice(0, 400);
      } catch (e) {
        result.error = e.message;
      }
    }

    results.push(result);
  }

  return res.status(200).json(results);
}
