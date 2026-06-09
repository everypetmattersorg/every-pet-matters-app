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

    const { invitee_email, invitee_name } = await req.json();
    
    if (!invitee_email) {
      return Response.json({ error: 'invitee_email is required' }, { status: 400 });
    }

    const subject = `You're invited to join every pet matters!`;
    
    const body = buildEmail(`
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi ${invitee_name || 'there'},</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        <strong>${user.full_name}</strong> has invited you to join <strong>every pet matters</strong> — a community platform dedicated to connecting adoptable pets with loving homes, supporting rescues and shelters, and building a network of pet lovers.
      </p>
      <p style="color:#374151;font-size:15px;font-weight:600;margin:0 0 8px;">What you can do:</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Browse adoptable pets from rescues and shelters</li>
        <li>Report lost and found pets</li>
        <li>Connect with volunteers and donors</li>
        <li>Share your pet's story</li>
        <li>Find pet services and discounts</li>
        <li>Support animal welfare organizations</li>
      </ul>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://everypetmatters.com" style="background:#2c5443;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
          Join every pet matters →
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">Questions? Reply to this email or visit <a href="https://everypetmatters.com" style="color:#2c5443;">everypetmatters.com</a>.</p>
    `);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'every pet matters <bark@everypetmatters.org>', to: [invitee_email], subject, html: body })
    });

    return Response.json({ success: true, message: `Invite email sent to ${invitee_email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});