import nodemailer from 'nodemailer';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const { to, subject, body } = req.body || {};
  if (
    typeof to !== 'string' ||
    !emailPattern.test(to.trim()) ||
    typeof subject !== 'string' ||
    !subject.trim() ||
    subject.length > 200 ||
    typeof body !== 'string' ||
    !body.trim() ||
    body.length > 20000
  ) {
    return res.status(400).json({
      success: false,
      error: 'Provide a valid recipient, a subject up to 200 characters, and a message up to 20,000 characters.',
    });
  }

  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!user || !appPassword) {
    return res.status(500).json({
      success: false,
      error: 'Server Mail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD in Vercel.',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: appPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    await transporter.sendMail({
      from: user,
      to: to.trim(),
      subject: subject.trim(),
      text: body,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Gmail SMTP delivery failed:', error);
    return res.status(502).json({
      success: false,
      error: 'Gmail could not send this email. Check the Gmail account and App Password settings, then try again.',
    });
  }
}
