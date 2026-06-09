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
            You're receiving this because you have pet preferences set on every pet matters.
            You can update your preferences anytime in your <a href="https://everypetmatters.com/UserProfile" style="color:#2c5443;">account settings</a>.
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

    const body = await req.json();
    const pet = body.data;

    if (!pet || !pet.urgent) {
      return Response.json({ success: false, message: 'Pet is not marked as urgent' });
    }

    // Fetch all users' preferences
    const allPreferences = await base44.asServiceRole.entities.Preferences.list();
    
    const matchingUsers = allPreferences.filter(pref => {
      if (pref.preferred_pet_types && !pref.preferred_pet_types.includes(pet.pet_type)) return false;
      if (pref.preferred_energy_level && pet.energy_level && pref.preferred_energy_level !== pet.energy_level) return false;
      if (pet.special_needs && !pref.willing_special_needs) return false;
      return true;
    });

    const emailPromises = matchingUsers.map(pref =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'every pet matters <bark@everypetmatters.org>',
          to: [pref.user_email],
          subject: `🚨 Urgent: ${pet.name} needs help right away`,
          html: buildEmail(`
          <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#991b1b;font-weight:700;font-size:15px;margin:0;">🚨 Urgent Alert — This pet needs immediate help</p>
          </div>
          <h2 style="color:#1f2937;font-size:22px;margin:0 0 4px;">${pet.name}</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 20px;text-transform:capitalize;">${pet.pet_type || 'Pet'}${pet.breed ? ` · ${pet.breed}` : ''}</p>
          ${pet.urgency_reason ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:20px;"><p style="color:#92400e;font-size:14px;margin:0;"><strong>Reason:</strong> ${pet.urgency_reason}</p></div>` : ''}
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${pet.age ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:130px;">Age</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-size:13px;">${pet.age}</td></tr>` : ''}
            ${pet.energy_level ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Energy Level</td><td style="padding:8px 0;color:#1f2937;font-size:13px;text-transform:capitalize;">${pet.energy_level}</td></tr>` : ''}
          </table>
          <div style="text-align:center;">
            <a href="https://everypetmatters.com/Urgent" style="background:#b91c1c;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
              View Urgent Cases →
            </a>
          </div>
        `)
        })
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ 
      success: true, 
      message: `Sent urgent pet alert to ${matchingUsers.length} matching users` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});