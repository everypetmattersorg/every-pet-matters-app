export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const r = await fetch(`${supabaseUrl}/rest/v1/shelter_connections?select=*`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const connections = await r.json();

  const platforms = connections?.map(c => ({ id: c.id, shelter_name: c.shelter_name, software_platform: c.software_platform }));
  const slConn = connections?.find(c => c.software_platform?.toLowerCase() === 'shelterluv');
  const apConn = connections?.find(c => c.software_platform?.toLowerCase().includes('adopt'));

  const result = {};

  if (slConn) {
    const slRes = await fetch(
      `https://www.shelterluv.com/api/v1/animals?offset=0&limit=1&status_type=publishable`,
      { headers: { 'X-Api-Key': slConn.api_key } }
    );
    const slData = await slRes.json();
    result.shelterluv_raw = slData.animals?.[0] || null;
  }

  if (apConn) {
    result.adoptapet_conn = { has_api_key: !!apConn.api_key, organization_id: apConn.organization_id };
    const apRes = await fetch(
      `https://api.adoptapet.com/search/pet_search?key=${apConn.api_key}&shelter_id=${apConn.organization_id}&v=2&output=json&count=1&start=1&species=dog&city_or_zip=00000&geo_range=10000`
    );
    const apData = await apRes.json();
    result.adoptapet_response = apData;
    const pets = apData.pets || apData.pet || [];
    result.adoptapet_raw = Array.isArray(pets) ? pets[0] : (pets || null);
  } else {
    result.adoptapet_conn = 'not found';
  }

  // Check shelter_status values present in the pets table
  const petsRes = await fetch(
    `${supabaseUrl}/rest/v1/pets?select=shelter_status&adoption_status=eq.Available`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  const petsRaw = await petsRes.json();
  const statusCounts = {};
  for (const p of (Array.isArray(petsRaw) ? petsRaw : [])) {
    const s = p.shelter_status || '(null)';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  result.shelter_status_counts = statusCounts;

  return res.status(200).json({ platforms, ...result });
}
