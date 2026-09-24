export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { prompt, response_json_schema, file_urls } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const systemPrompt = response_json_schema
    ? 'You are a helpful assistant. Respond with valid JSON only — no markdown, no explanation, just the JSON object.'
    : 'You are a helpful assistant.';

  // Build message content — support image URLs if provided
  const userContent = [];
  if (file_urls?.length) {
    for (const url of file_urls) {
      userContent.push({ type: 'image_url', image_url: { url } });
    }
  }
  userContent.push({ type: 'text', text: prompt });

  try {
    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('invoke-llm error:', err);
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    if (response_json_schema) {
      try {
        return res.status(200).json({ result: JSON.parse(text) });
      } catch {
        return res.status(200).json({ result: text });
      }
    }

    return res.status(200).json({ result: text });
  } catch (err) {
    console.error('invoke-llm error:', err.message, err.cause ?? '');
    return res.status(500).json({ error: err.message, cause: String(err.cause ?? '') });
  }
}
