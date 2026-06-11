export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Step 1: check env vars
  if (!supabaseUrl || !serviceKey) {
    return res.status(200).json({
      step: 'env-check',
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      serviceKey: serviceKey ? 'SET' : 'MISSING',
    });
  }

  // Step 2: try a Supabase REST call
  let supabaseStatus = null;
  let supabaseBody = null;
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/shelter_connections?select=id&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    supabaseStatus = r.status;
    supabaseBody = await r.text();
  } catch (e) {
    supabaseBody = 'FETCH ERROR: ' + e.message;
  }

  return res.status(200).json({
    step: 'supabase-test',
    supabaseUrl: supabaseUrl.slice(0, 40),
    serviceKeyLength: serviceKey.length,
    supabaseStatus,
    supabaseBody: supabaseBody?.slice(0, 300),
  });
}
