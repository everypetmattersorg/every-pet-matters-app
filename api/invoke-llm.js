import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { prompt, response_json_schema, file_urls } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    // Build message content — support image URLs if provided
    const contentParts = [];
    if (file_urls?.length) {
      for (const url of file_urls) {
        contentParts.push({ type: 'image', source: { type: 'url', url } });
      }
    }
    contentParts.push({ type: 'text', text: prompt });

    // If caller wants structured JSON, instruct the model to return only JSON
    const systemPrompt = response_json_schema
      ? 'You are a helpful assistant. Respond with valid JSON only — no markdown, no explanation, just the JSON object.'
      : 'You are a helpful assistant.';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: contentParts }],
    });

    const text = message.content[0]?.text ?? '';

    if (response_json_schema) {
      try {
        return res.status(200).json({ result: JSON.parse(text) });
      } catch {
        return res.status(200).json({ result: text });
      }
    }

    return res.status(200).json({ result: text });
  } catch (err) {
    console.error('invoke-llm error:', err);
    return res.status(500).json({ error: err.message });
  }
}
