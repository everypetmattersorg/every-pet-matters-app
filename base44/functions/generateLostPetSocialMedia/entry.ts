import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { petId } = await req.json();

    if (!petId) {
      return Response.json({ error: 'petId is required' }, { status: 400 });
    }

    const pet = await base44.asServiceRole.entities.LostFoundPet.get(petId);

    if (!pet || pet.status !== 'lost') {
      return Response.json({ error: 'Pet not found or not a lost pet' }, { status: 404 });
    }

    // Generate caption with AI via Claude
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: `Create an urgent, compassionate social media post caption for a lost pet. The post should encourage people to share and help reunite the pet with its owner.

Pet Details:
- Name: ${pet.name || 'Unknown'}
- Species: ${pet.species}
- Breed: ${pet.breed || 'Unknown'}
- Color: ${pet.color || 'Unknown'}
- Size: ${pet.size || 'Unknown'}
- Last seen: ${pet.last_seen_location || 'Unknown location'}
- Date: ${pet.last_seen_date || 'Recently'}
- Description: ${pet.description || 'N/A'}
- Contact: ${pet.reporter_name} - ${pet.reporter_phone || pet.reporter_email}
${pet.reward_offered ? `- Reward offered: $${pet.reward_amount}` : ''}

Generate a concise, emotional caption (max 280 characters) that includes relevant hashtags and a call to action. Return ONLY the caption text, no extra commentary.` }]
      })
    });
    const aiData = await aiResponse.json();
    const caption = aiData.content[0].text;

    // Generate graphic using primary photo if available
    let graphic = null;
    if (pet.photo_urls && pet.photo_urls.length > 0) {
      const photoUrl = pet.photo_urls[0];
      const svgGraphic = createLostPetGraphic(pet, photoUrl);
      const graphicFile = new Blob([svgGraphic], { type: 'image/svg+xml' });
      const graphicResponse = await base44.integrations.Core.UploadFile({
        file: graphicFile
      });
      graphic = graphicResponse.file_url;
    }

    // Update pet with generated content
    await base44.asServiceRole.entities.LostFoundPet.update(petId, {
      social_media_graphic: graphic,
      social_media_caption: caption
    });

    return Response.json({
      success: true,
      caption,
      graphic,
      petId
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function createLostPetGraphic(pet, photoUrl) {
  const name = pet.name || 'Lost Pet';
  const breed = pet.breed || pet.species;
  const location = pet.last_seen_location || 'Unknown Location';
  const phone = pet.reporter_phone || pet.reporter_email;

  return `
    <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#af501d;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8f3f15;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1080" height="1350" fill="url(#bgGradient)"/>
      
      <!-- Top banner with LOST alert -->
      <rect width="1080" height="180" fill="#ff4444" opacity="0.9"/>
      <text x="540" y="120" font-size="72" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        🚨 LOST PET 🚨
      </text>
      
      <!-- Pet info section -->
      <rect x="40" y="220" width="1000" height="800" fill="white" rx="20"/>
      
      <!-- Pet name -->
      <text x="540" y="280" font-size="56" font-weight="bold" text-anchor="middle" fill="#1a1a1a" font-family="Arial, sans-serif">
        ${name}
      </text>
      
      <!-- Breed/Type -->
      <text x="540" y="340" font-size="32" text-anchor="middle" fill="#666" font-family="Arial, sans-serif">
        ${breed}
      </text>
      
      <!-- Location info -->
      <text x="540" y="420" font-size="28" font-weight="bold" text-anchor="middle" fill="#af501d" font-family="Arial, sans-serif">
        Last Seen: ${location}
      </text>
      
      <!-- Contact info -->
      <text x="540" y="500" font-size="24" text-anchor="middle" fill="#333" font-family="Arial, sans-serif">
        Contact: ${phone}
      </text>
      
      <!-- Help text -->
      <text x="540" y="600" font-size="20" text-anchor="middle" fill="#666" font-family="Arial, sans-serif">
        If you see this pet, please contact immediately!
      </text>
      <text x="540" y="650" font-size="20" text-anchor="middle" fill="#666" font-family="Arial, sans-serif">
        Share this post to help bring them home
      </text>
      
      <!-- Bottom banner with hashtags -->
      <rect x="0" y="1100" width="1080" height="250" fill="#1a1a1a"/>
      <text x="540" y="1170" font-size="28" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        #LostPet #Help #Share #FindHome
      </text>
      <text x="540" y="1250" font-size="24" text-anchor="middle" fill="#ffcc00" font-family="Arial, sans-serif">
        every pet matters
      </text>
    </svg>
  `;
}