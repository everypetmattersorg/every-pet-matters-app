export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { prompt, response_json_schema, file_urls } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const systemPrompt = response_json_schema
    ? 'You are a helpful assistant. Respond with valid JSON only — no markdown, no explanation, just the JSON object.'
    : 'You are a helpful assistant.';

  const userContent = [];
  if (file_urls?.length) {
    for (const url of file_urls) {
      userContent.push({ type: 'image', source: { type: 'url', url } });
    }
  }
  userContent.push({ type: 'text', text: prompt });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('ANTHROPIC_API_KEY present:', !!apiKey, 'length:', apiKey?.length ?? 0);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('invoke-llm error:', err);
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

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
