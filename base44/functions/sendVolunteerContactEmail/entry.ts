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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { volunteer_email, volunteer_name, rescue_email } = await req.json();
    
    if (!volunteer_email || !rescue_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rescueName = user.display_name || user.full_name;

    const body = buildEmail(`
      <h2 style="color:#1f2937;font-size:20px;margin:0 0 16px;">You've been matched with a rescue! 🐾</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hi ${volunteer_name},
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        <strong>${rescueName}</strong> found your volunteer profile on every pet matters and is interested in connecting with you. Your volunteer interests match their open opportunities!
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#166534;font-size:14px;margin:0 0 6px;font-weight:600;">Next steps</p>
        <p style="color:#166534;font-size:14px;margin:0;">They'll be reaching out to discuss how you can help. Feel free to contact them directly at <a href="mailto:${rescue_email}" style="color:#2c5443;">${rescue_email}</a>.</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://everypetmatters.com/Volunteer" style="background:#2c5443;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
          View Volunteer Opportunities →
        </a>
      </div>
    `);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'every pet matters <bark@everypetmatters.org>', to: [volunteer_email], subject: 'A rescue on every pet matters wants to connect with you!', html: body })
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});