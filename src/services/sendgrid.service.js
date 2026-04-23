import nodemailer from 'nodemailer';

// SendGrid alternative email service
export const sendEmailViaSendGrid = async ({ to, subject, html, text, from }) => {
  try {
    // Using SendGrid SMTP as an alternative
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey', // SendGrid uses 'apikey' as the username
        pass: process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY'
      }
    });

    const info = await transporter.sendMail({
      from: from === "support" ? "support@vialifecoach.org" : from,
      to,
      subject,
      text,
      html,
    });

    console.log('✅ SendGrid email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ SendGrid email failed:', error);
    throw error;
  }
};

// Fallback email service that tries multiple providers
export const sendEmailWithFallback = async ({ to, subject, html, text, from }) => {
  const providers = [
    { name: 'Zoho', send: () => import('./email.service.js').then(m => m.sendEmail({ to, subject, html, text, from })) },
    { name: 'SendGrid', send: () => sendEmailViaSendGrid({ to, subject, html, text, from }) },
    { name: 'Gmail', send: () => sendViaGmail({ to, subject, html, text, from }) }
  ];

  for (const provider of providers) {
    try {
      console.log(`📧 Trying ${provider.name}...`);
      const result = await provider.send();
      console.log(`✅ ${provider.name} succeeded!`);
      return result;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('All email providers failed');
};

// Gmail SMTP alternative
async function sendViaGmail({ to, subject, html, text, from }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || 'your-gmail@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    }
  });

  const info = await transporter.sendMail({
    from: from === "support" ? "support@vialifecoach.org" : from,
    to,
    subject,
    text,
    html,
  });

  console.log('✅ Gmail email sent:', info.messageId);
  return info;
}
