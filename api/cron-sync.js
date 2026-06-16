const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getActiveConnections() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shelter_connections?select=*&status=neq.disconnected`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch connections: ${res.status}`);
  return res.json();
}

async function triggerSync(endpoint, connectionId, baseUrl) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connection_id: connectionId }),
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { /* leave as {} */ }
  return { ok: res.ok, status: res.status, data, raw: text.slice(0, 300) };
}

export default async function handler(req, res) {
  // Vercel Cron requests are authenticated automatically when CRON_SECRET is set
  if (process.env.CRON_SECRET) {
    const auth = req.headers['authorization'];
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const baseUrl = `https://${req.headers.host}`;

  try {
    const connections = await getActiveConnections();
    const results = [];

    for (const conn of connections) {
      const platform = conn.software_platform?.toLowerCase();
      let endpoint = null;
      if (platform === 'shelterluv') endpoint = '/api/sync-shelterluv';
      else if (platform === 'adopt-a-pet') endpoint = '/api/sync-adoptapet';

      if (!endpoint) {
        results.push({ shelter_name: conn.shelter_name, skipped: true, reason: `Unsupported platform: ${conn.software_platform}` });
        continue;
      }

      const result = await triggerSync(endpoint, conn.id, baseUrl);
      results.push({ shelter_name: conn.shelter_name, platform, ...result });
    }

    return res.status(200).json({ synced_at: new Date().toISOString(), results });
  } catch (err) {
    console.error('cron-sync error:', err);
    return res.status(500).json({ error: err.message });
  }
}
