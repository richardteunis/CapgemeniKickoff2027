// Vercel serverless function — proxies the concierge chat to the Anthropic API.
// Requires env var ANTHROPIC_API_KEY (Project Settings → Environment Variables).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000)
    })) : [];
    if (!messages.length || messages[0].role !== 'user') return res.status(400).json({ error: 'Bad request' });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
        max_tokens: Math.min(Number(body.max_tokens) || 400, 600),
        system: String(body.system || '').slice(0, 20000),
        messages
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'Upstream error' });
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
