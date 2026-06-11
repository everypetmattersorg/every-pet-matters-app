export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const r = await fetch(`${supabaseUrl}/rest/v1/shelter_connections?select=*&software_platform=ilike.shelterluv`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const connections = await r.json();
  const conn = connections?.[0];
  if (!conn) return res.status(200).json({ error: 'no shelterluv connection found' });

  const slRes = await fetch(
    `https://www.shelterluv.com/api/v1/animals?offset=0&limit=2&status_type=publishable`,
    { headers: { 'X-Api-Key': conn.api_key } }
  );
  const slData = await slRes.json();
  const sample = slData.animals?.slice(0, 2).map(a => ({ name: a.Name, Photos: a.Photos }));

  return res.status(200).json({ sample });
}
