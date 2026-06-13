export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const r = await fetch(`${supabaseUrl}/rest/v1/shelter_connections?select=*`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const connections = await r.json();

  const slConn = connections?.find(c => c.software_platform?.toLowerCase() === 'shelterluv');
  const apConn = connections?.find(c => c.software_platform?.toLowerCase() === 'adopt-a-pet');

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
    const apRes = await fetch(
      `https://api.adoptapet.com/search/pet_search?key=${apConn.api_key}&shelter_id=${apConn.organization_id}&v=2&output=json&count=1&start=1&species=dog`
    );
    const apData = await apRes.json();
    const pets = apData.pets || apData.pet || [];
    result.adoptapet_raw = Array.isArray(pets) ? pets[0] : null;
  }

  return res.status(200).json(result);
}
