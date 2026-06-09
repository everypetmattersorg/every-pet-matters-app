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
            Update them anytime in your <a href="https://everypetmatters.com/UserProfile" style="color:#2c5443;">account settings</a>.
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
    const payload = await req.json();

    const pet = payload.data || payload.pet;
    const petId = payload.event?.entity_id || payload.pet_id;

    if (!pet && !petId) {
      return Response.json({ error: 'No pet data provided' }, { status: 400 });
    }

    const adoptablePet = pet || await base44.asServiceRole.entities.AdoptablePet.get(petId);

    if (!adoptablePet) {
      return Response.json({ error: 'Pet not found' }, { status: 404 });
    }

    if (adoptablePet.status && adoptablePet.status !== 'available') {
      return Response.json({ skipped: true, reason: 'Pet not available' });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const usersWithPrefs = allUsers.filter(u => u.preferences && u.email);

    const notifPrefs = await base44.asServiceRole.entities.NotificationPreference.list();
    const optedOutEmails = new Set(
      notifPrefs.filter(p => p.notifications_enabled === false).map(p => p.user_email)
    );

    let notified = 0;

    for (const user of usersWithPrefs) {
      if (optedOutEmails.has(user.email)) continue;

      const prefs = user.preferences;

      if (prefs.preferred_pet_types?.length > 0) {
        if (!prefs.preferred_pet_types.includes(adoptablePet.pet_type)) continue;
      }

      if (prefs.preferred_size?.length > 0) {
        const petSize = getSizeFromWeight(adoptablePet.weight_lbs);
        if (petSize && !prefs.preferred_size.includes(petSize)) continue;
      }

      if (prefs.preferred_age && prefs.preferred_age !== 'any') {
        const ageYears = adoptablePet.age_years || 0;
        if (!ageMatches(ageYears, prefs.preferred_age)) continue;
      }

      if (prefs.have_kids && adoptablePet.good_with_kids === false) continue;

      if (prefs.have_pets) {
        const hasDog = adoptablePet.good_with_dogs === false;
        const hasCat = adoptablePet.good_with_cats === false;
        if (hasDog && hasCat) continue;
      }

      if (prefs.activity_level) {
        const energyMap = { low: 'low', moderate: 'medium', high: 'high' };
        const expectedEnergy = energyMap[prefs.activity_level];
        if (expectedEnergy && adoptablePet.energy_level && adoptablePet.energy_level !== expectedEnergy) continue;
      }

      const petName = adoptablePet.name || 'A new pet';
      const petType = adoptablePet.pet_type || 'pet';
      const rescueName = adoptablePet.rescue_name || 'a rescue';

      const emailBody = buildEmail(`
        <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi ${user.full_name || 'there'},</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          A new ${petType} named <strong>${petName}</strong> was just added — and they match your adoption preferences! 🎉
        </p>
        ${adoptablePet.photo_url ? `<div style="text-align:center;margin:0 0 20px;"><img src="${adoptablePet.photo_url}" alt="${petName}" style="max-width:100%;border-radius:12px;max-height:280px;object-fit:cover;" /></div>` : ''}
        <h3 style="color:#1f2937;font-size:16px;margin:0 0 12px;">About ${petName}</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${adoptablePet.breed ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:130px;">Breed</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-size:13px;">${adoptablePet.breed}</td></tr>` : ''}
          ${adoptablePet.age_years != null ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Age</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-size:13px;">${adoptablePet.age_years} year(s)</td></tr>` : ''}
          ${adoptablePet.gender ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">Gender</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-size:13px;text-transform:capitalize;">${adoptablePet.gender}</td></tr>` : ''}
          ${adoptablePet.energy_level ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Energy Level</td><td style="padding:8px 0;color:#1f2937;font-size:13px;text-transform:capitalize;">${adoptablePet.energy_level}</td></tr>` : ''}
        </table>
        ${adoptablePet.description ? `<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;font-style:italic;">"${adoptablePet.description.slice(0, 200)}${adoptablePet.description.length > 200 ? '...' : ''}"</p>` : ''}
        <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">Listed by <strong style="color:#374151;">${rescueName}</strong>${adoptablePet.rescue_city ? ` in ${adoptablePet.rescue_city}${adoptablePet.rescue_state ? ', ' + adoptablePet.rescue_state : ''}` : ''}.</p>
        <div style="text-align:center;">
          <a href="https://everypetmatters.com/Adopt" style="background:#2c5443;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Meet ${petName} →
          </a>
        </div>
      `);

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'every pet matters <bark@everypetmatters.org>', to: [user.email], subject: `🐾 ${petName} matches your preferences — available now!`, html: emailBody })
      });

      notified++;
    }

    return Response.json({ success: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getSizeFromWeight(weightLbs) {
  if (!weightLbs) return null;
  if (weightLbs <= 20) return 'small';
  if (weightLbs <= 60) return 'medium';
  return 'large';
}

function ageMatches(ageYears, preferredAge) {
  switch (preferredAge) {
    case 'kitten_puppy': return ageYears < 1;
    case 'young_adult': return ageYears >= 1 && ageYears <= 3;
    case 'adult': return ageYears > 3 && ageYears <= 7;
    case 'senior': return ageYears > 7;
    default: return true;
  }
}