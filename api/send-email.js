import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@everypetmatters.org';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { to, subject, body, html } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      text: body,
      html: html || body?.replace(/\n/g, '<br>'),
    });
    if (error) throw error;
    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
