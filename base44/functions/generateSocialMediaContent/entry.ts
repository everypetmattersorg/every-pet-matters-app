import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !event) {
      return Response.json({ error: 'Missing event or data' }, { status: 400 });
    }

    const petId = event.entity_id;
    const entityName = event.entity_name;

    // Generate engaging caption based on pet details
    const caption = generateCaption(data);

    // Generate social media graphic
    const graphicUrl = await generateGraphic(data);

    // Store the generated content back on the pet record
    if (entityName === 'AdoptablePet') {
      await base44.asServiceRole.entities.AdoptablePet.update(petId, {
        social_media_caption: caption,
        social_media_graphic_url: graphicUrl,
      });
    } else if (entityName === 'Pet') {
      await base44.asServiceRole.entities.Pet.update(petId, {
        social_media_caption: caption,
        social_media_graphic_url: graphicUrl,
      });
    }

    return Response.json({
      success: true,
      petId,
      caption,
      graphicUrl,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

function generateCaption(pet) {
  const petType = pet.pet_type || pet.species || 'pet';
  const name = pet.name || 'Meet this amazing';
  const breed = pet.breed ? ` ${pet.breed}` : '';
  const energy = pet.energy_level ? `${pet.energy_level}-energy ` : '';
  const urgent = pet.is_urgent || pet.urgent ? '🚨 URGENT: ' : '';

  let caption = `${urgent}Meet ${name}!`;

  if (breed) caption += `\n${petType.charAt(0).toUpperCase() + petType.slice(1)}${breed}`;

  if (pet.age_years || pet.age_months || pet.age) {
    const age = pet.age_years || pet.age || 'young and sweet';
    caption += `\n${age} years old and full of love`;
  }

  if (pet.description) {
    caption += `\n\n"${pet.description.substring(0, 80)}${pet.description.length > 80 ? '...' : ''}"`;
  }

  caption += `\n\n🐾 Ready for their forever home?\n✨ Apply to adopt today!`;

  if (pet.is_urgent && pet.e_list_date) {
    caption += `\n⏰ Deadline: ${new Date(pet.e_list_date).toLocaleDateString()}`;
  }

  return caption;
}

async function generateGraphic(pet) {
  // Fallback to primary photo if available
  if (!pet.photo_url && !pet.photo_urls?.[0]) {
    return null;
  }

  const photoUrl = pet.photo_url || pet.photo_urls?.[0];

  // Create a simple graphic with text overlay
  // For now, return the photo URL and let the frontend handle graphic overlay
  // In production, you'd use an image generation service like Canva API or custom image generation
  return photoUrl;
}