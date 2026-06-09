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

    const body = buildEmail(`
      <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hi ${user.full_name || 'there'},</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Your password for your <strong>every pet matters</strong> account has been successfully changed.
      </p>
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#92400e;font-size:14px;margin:0;">
          ⚠️ If you did not make this change, please contact us immediately at
          <a href="mailto:hello@everypetmatters.com" style="color:#2c5443;">hello@everypetmatters.com</a> or visit
          <a href="https://everypetmatters.com" style="color:#2c5443;">everypetmatters.com</a> to reset your password.
        </p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">
        For your security, we recommend using a strong, unique password and never sharing it with anyone.
      </p>
    `);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'every pet matters <bark@everypetmatters.org>', to: [user.email], subject: 'Your password has been changed', html: body })
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});