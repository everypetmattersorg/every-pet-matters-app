import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generateRandomEmail() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result}@every-pet.local`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Deactivate any existing cloaked emails for this user
    await base44.asServiceRole.entities.CloakedEmail.filter(
      { user_email: user.email },
      '-created_at',
      1000
    ).then(async (emails) => {
      for (const email of emails) {
        if (email.is_active) {
          await base44.asServiceRole.entities.CloakedEmail.update(email.id, {
            is_active: false
          });
        }
      }
    });

    // Generate new cloaked email
    const cloaked_email = generateRandomEmail();
    
    const newCloakedEmail = await base44.asServiceRole.entities.CloakedEmail.create({
      user_email: user.email,
      cloaked_email,
      is_active: true,
      email_count: 0
    });

    return Response.json({
      cloaked_email,
      id: newCloakedEmail.id,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});