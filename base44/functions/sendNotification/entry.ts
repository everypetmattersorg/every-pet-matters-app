import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

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
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const {
      user_email,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      action_url,
      send_email = true,
    } = payload;

    if (!user_email || !type || !title || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch user preferences
    const preferences = await base44.asServiceRole.entities.NotificationPreference.filter(
      { user_email },
      undefined,
      1
    );

    const prefs = preferences?.[0] || {};

    const typeMap = {
      application: "email_on_applications",
      appointment: "email_on_appointments",
      vaccination: "email_on_medication",
      medication: "email_on_medication",
      event: "email_on_events",
    };

    const preferenceKey = typeMap[type];
    const emailEnabled = preferenceKey ? prefs[preferenceKey] !== false : true;

    // Create notification record
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      action_url,
      is_read: false,
      sent_at: new Date().toISOString(),
    });

    // Send email if enabled
    if (send_email && emailEnabled) {
      try {
        const emailBody = buildEmail(`
          <h2 style="color:#1f2937;font-size:20px;margin:0 0 16px;">${title}</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${message}</p>
          ${action_url ? `
          <div style="text-align:center;margin:24px 0;">
            <a href="${action_url}" style="background:#2c5443;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
              View Details →
            </a>
          </div>` : ''}
        `);
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'every pet matters <bark@everypetmatters.org>', to: [user_email], subject: title, html: emailBody })
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return Response.json({
      success: true,
      notification_id: notification.id,
      email_sent: send_email && emailEnabled,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});