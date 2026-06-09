import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildEmail(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#2c5443;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">🐾 every pet matters</h1>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
          ${content}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
            every pet matters · <a href="https://everypetmatters.com" style="color:#2c5443;">everypetmatters.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const ADMIN_EMAIL = 'erin@everypetmatters.org';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data: newUser, event } = payload;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const userName = newUser?.full_name || 'Unknown';
    const userEmail = newUser?.email || 'Unknown';
    const joinedAt = newUser?.created_date
      ? new Date(newUser.created_date).toLocaleString('en-US', { timeZone: 'America/Phoenix' })
      : new Date().toLocaleString();

    const body = buildEmail(`
      <h2 style="color:#1f2937;font-size:18px;margin:0 0 16px;">🎉 New user signed up</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:120px;">Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-size:14px;font-weight:600;">${userName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-size:14px;">${userEmail}</td></tr>
        <tr><td style="padding:10px 0;color:#6b7280;font-size:14px;">Joined</td>
            <td style="padding:10px 0;color:#1f2937;font-size:14px;">${joinedAt}</td></tr>
      </table>
      <div style="text-align:center;">
        <a href="https://everypetmatters.com/AdminDashboard" style="background:#2c5443;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
          View Admin Dashboard →
        </a>
      </div>
    `);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'every pet matters <bark@everypetmatters.org>', to: [ADMIN_EMAIL], subject: `New user signed up: ${userName}`, html: body })
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error notifying admin of new user:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});