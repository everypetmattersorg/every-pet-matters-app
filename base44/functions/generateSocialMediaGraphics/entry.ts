import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const pet = body.data;

    if (!pet || !pet.photo_url) {
      return Response.json({ success: false, message: 'Pet must have a photo' });
    }

    // Generate graphics for Instagram (1080x1350) and Facebook (1200x628)
    const graphics = await generateGraphics(pet);

    // Save the graphics URLs to the pet record
    await base44.asServiceRole.entities.Pet.update(pet.id, {
      social_media_graphics: graphics
    });

    return Response.json({ 
      success: true,
      graphics: graphics
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateGraphics(pet) {
  const graphics = {};

  // Instagram graphic (1080x1350)
  graphics.instagram = await createGraphic({
    width: 1080,
    height: 1350,
    pet: pet
  });

  // Facebook graphic (1200x628)
  graphics.facebook = await createGraphic({
    width: 1200,
    height: 628,
    pet: pet
  });

  return graphics;
}

async function createGraphic({ width, height, pet }) {
  // Create SVG-based graphic
  const tags = [];
  if (pet.pet_type) tags.push(pet.pet_type.charAt(0).toUpperCase() + pet.pet_type.slice(1));
  if (pet.energy_level) tags.push(pet.energy_level);
  if (pet.urgent) tags.push('🚨 URGENT');
  if (pet.special_needs) tags.push('Special Needs');

  const tagsText = tags.join(' • ');

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background with pet photo -->
      <defs>
        <pattern id="bgImage" patternUnits="userSpaceOnUse" width="${width}" height="${height}">
          <image href="${pet.photo_url}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgImage)"/>
      
      <!-- Dark overlay -->
      <rect width="${width}" height="${height}" fill="rgba(0,0,0,0.4)"/>
      
      <!-- Bottom gradient -->
      <defs>
        <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.7);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height * 0.4}" y="${height * 0.6}" fill="url(#bottomGradient)"/>
      
      <!-- Pet name -->
      <text x="${width * 0.05}" y="${height * 0.85}" font-family="Arial, sans-serif" font-size="${Math.floor(width * 0.12)}" font-weight="bold" fill="white">
        ${pet.name}
      </text>
      
      <!-- Tags -->
      <text x="${width * 0.05}" y="${height * 0.93}" font-family="Arial, sans-serif" font-size="${Math.floor(width * 0.04)}" fill="#FFD700">
        ${tagsText}
      </text>
      
      <!-- Rescue info -->
      ${pet.rescue_name ? `
        <text x="${width * 0.05}" y="${height * 0.97}" font-family="Arial, sans-serif" font-size="${Math.floor(width * 0.035)}" fill="rgba(255,255,255,0.9)">
          ${pet.rescue_name}
        </text>
      ` : ''}
    </svg>
  `;

  // Convert SVG to image using LLM with image generation
  const response = await fetch('https://api.example.com/svg-to-png', {
    method: 'POST',
    body: svg
  }).catch(() => null);

  // Fallback: return SVG as data URI
  const svgDataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
  return svgDataUri;
}