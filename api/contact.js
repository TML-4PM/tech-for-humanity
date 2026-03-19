// api/contact.js — Vercel serverless function
// Receives contact form submission, writes lead to cap_leads via bridge

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, org, type, message, source } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email required' });
  }

  const BRIDGE = process.env.BRIDGE_URL ||
    'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke';
  const API_KEY = process.env.BRIDGE_API_KEY;

  const safe = (s) => (s || '').replace(/'/g, "''").slice(0, 500);
  const metadata = JSON.stringify({ org: org || '', type: type || '', message: message || '' });

  const sql = `INSERT INTO cap_leads (email, name, source, status, metadata)
    VALUES ('${safe(email)}', '${safe(name)}', '${safe(source || 'tech4humanity-main')}', 'new', '${safe(metadata)}'::jsonb)
    ON CONFLICT DO NOTHING
    RETURNING id`;

  try {
    const r = await fetch(BRIDGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ fn: 'troy-sql-executor', sql })
    });
    const data = await r.json();
    return res.status(200).json({ ok: true, id: data?.rows?.[0]?.id || null });
  } catch (err) {
    // Fail silently — don't block UX on infra issues
    return res.status(200).json({ ok: true, note: 'queued' });
  }
}
