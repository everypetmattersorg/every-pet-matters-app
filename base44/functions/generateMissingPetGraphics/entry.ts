import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const pets = await base44.asServiceRole.entities.Pet.list();
    const petsNeedingGraphics = pets.filter(pet => !pet.social_media_graphics?.instagram || !pet.social_media_graphics?.facebook);

    let generated = 0;
    const errors = [];

    for (const pet of petsNeedingGraphics) {
      try {
        await base44.functions.invoke('generateSocialMediaGraphics', {
          petId: pet.id,
          petName: pet.name || pet.pet_type,
          petStatus: pet.status,
          petType: pet.pet_type
        });
        generated++;
      } catch (error) {
        errors.push({ petId: pet.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      total: petsNeedingGraphics.length,
      generated,
      errors,
      message: `Generated graphics for ${generated}/${petsNeedingGraphics.length} pets`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});