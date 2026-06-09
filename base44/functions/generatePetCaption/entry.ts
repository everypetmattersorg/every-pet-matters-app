import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { pet, captionType } = await req.json();

    const typeInstructions = captionType === 'rescue'
      ? `This pet urgently needs rescue. Write a heartfelt, urgent caption to help find this animal a foster or rescue. Emphasize the urgency and need for immediate action.`
      : `This pet is available for adoption or fostering. Write an uplifting, engaging caption to help find this animal a loving home.`;

    const prompt = `You are a social media expert for animal rescue. Generate an engaging social media caption for a pet named ${pet.name}.

Pet details:
- Name: ${pet.name}
- Species: ${pet.pet_type || pet.species || 'unknown'}
- Breed: ${pet.breed || 'Mixed'}
- Age: ${pet.age || (pet.age_years ? `${pet.age_years} years` : '') || 'unknown'}
- Gender: ${pet.gender || 'unknown'}
- Description: ${pet.description || pet.bio || 'A wonderful companion looking for a home'}
- Energy level: ${pet.energy_level || 'unknown'}
- Good with kids: ${pet.good_with_kids !== undefined ? (pet.good_with_kids ? 'yes' : 'no') : (pet.kid_friendly || 'unknown')}
- Good with dogs: ${pet.good_with_dogs !== undefined ? (pet.good_with_dogs ? 'yes' : 'no') : (pet.dog_friendly || 'unknown')}
- Special needs: ${pet.special_needs ? (pet.special_needs_description || 'yes') : 'none'}
- Rescue/shelter: ${pet.rescue_name || pet.contact_name || 'local rescue'}

${typeInstructions}

Requirements:
- 2-4 sentences of emotional, engaging copy
- Include 8-12 relevant hashtags (mix of popular and niche animal rescue tags)
- Use 3-6 relevant emojis naturally within the text and hashtags
- Keep it under 300 characters before hashtags
- End with a call to action

Return ONLY the caption text with hashtags, no extra commentary.`;

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
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const aiData = await aiResponse.json();
    const caption = aiData.content[0].text;

    return Response.json({ caption });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});