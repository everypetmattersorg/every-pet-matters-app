export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test: can we reach Supabase at all?
  let supabaseOk = false;
  let supabaseError = null;
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/shelter_connections?select=id&limit=1`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    supabaseOk = r.ok;
    if (!r.ok) supabaseError = `${r.status} ${await r.text()}`;
  } catch (e) {
    supabaseError = e.message;
  }

  return res.status(200).json({
    env: {
      VITE_SUPABASE_URL: supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: serviceKey ? 'SET (' + serviceKey.length + ' chars)' : 'MISSING',
    },
    supabaseOk,
    supabaseError,
  });
}
