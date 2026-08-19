import nodemailer from "nodemailer";
import { 
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USE_TLS,
  EMAIL_USE_SSL,
  EMAIL_HOST_USER,
  EMAIL_HOST_PASSWORD,
  EMAIL_FROM_SUPPORT,
  EMAIL_FROM_ACADEMY,
  EMAIL_FROM_PARTNERSHIP,
  EMAIL_FROM_INFO,
  FRONTEND_URL
} from "../config/env.js";
import { pool } from "../config/postgres.js";

const ACADEMY_EMAIL = "academy@vialifecoach.org";
const SUPPORT_EMAIL = "support@vialifecoach.org";

function parseBool(value) {
  if (typeof value === "boolean") return value;
  if (value == null) return false;
  return String(value).toLowerCase() === "true";
}

const hasZohoConfig =
  EMAIL_HOST &&
  EMAIL_PORT &&
  EMAIL_HOST_USER &&
  EMAIL_HOST_PASSWORD;

const createTransporter = (userEmail) => {
  if (hasZohoConfig) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: parseBool(EMAIL_USE_SSL),
      requireTLS: parseBool(EMAIL_USE_TLS),
      auth: {
        user: EMAIL_HOST_USER,
        pass: EMAIL_HOST_PASSWORD,
      },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: userEmail,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
    },
  });
};

function resolveFrom(from) {
  if (!from || from === "support") {
    return EMAIL_FROM_SUPPORT || SUPPORT_EMAIL;
  }
  if (from === "academy") {
    return EMAIL_FROM_ACADEMY || ACADEMY_EMAIL;
  }
  if (from === "partnership") {
    return EMAIL_FROM_PARTNERSHIP || "partnership@vialifecoach.org";
  }
  if (from === "info") {
    return EMAIL_FROM_INFO || "info@vialifecoach.org";
  }
  if (typeof from === "string" && from.includes("@")) {
    return from;
  }
  return EMAIL_FROM_SUPPORT || SUPPORT_EMAIL;
}

export const sendEmail = async ({ to, subject, html, text, from, replyTo, attachments }) => {
  const fromEmail = resolveFrom(from);
  const transporter = createTransporter(EMAIL_HOST_USER || SUPPORT_EMAIL);
  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      replyTo: replyTo,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments
    });

    console.log(`Email sent from ${fromEmail}:`, info.messageId);
    return info;
  } catch (err) {
    console.error(`Error sending email from ${fromEmail}:`, err);
    throw err;
  }
};

// verification email
export const sendVerificationEmail = async (to, token, from) => {
  const subject = "Verify your email address";
  const html = `Your verification token is ${token}`;
  const text = `Your verification token is ${token}`;
  return sendEmail({ to, subject, html, text, from });
};

// password reset email
export const sendPasswordResetEmail = async (to, token, from) => {
  const subject = "Reset your password";
  const baseUrl = FRONTEND_URL || "https://academy.vialifecoach.org";
  const resetLink = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Hello,</p>
    <p>We received a request to reset your password. Click the link below to set a new password:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;
  const text = `Reset your password using this link: ${resetLink}`;
  return sendEmail({ to, subject, html, text, from });
};

async function getEventEmailTemplate(type) {
  const templateName = type === 'confirmation' ? 'Event Registration Confirmation' : 'Event Reminder';

  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM email_templates
       WHERE LOWER(template_name) = LOWER($1)
         AND is_active = true
         AND (event_type IS NULL OR LOWER(event_type) = 'all')
       ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
       LIMIT 1`,
      [templateName]
    );

    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching email template from PostgreSQL:', error.message);
    return null;
  }
}

// Event email functionality
export const sendEventEmail = async ({ type, recipient, event, registration, custom_message }) => {
  try {
    const template = await getEventEmailTemplate(type);
    if (!template) {
      return sendDefaultEventEmail({ type, recipient, event, registration, custom_message });
    }

    // Replace template variables
    let subject = template.subject;
    let htmlContent = template.html_content;
    let textContent = template.text_content;

    const replacements = {
      '{{event_title}}': event.title,
      '{{event_date}}': new Date(event.event_date).toLocaleString(),
      '{{event_duration}}': event.event_duration || 60,
      '{{event_type}}': event.event_type,
      '{{first_name}}': registration.first_name,
      '{{last_name}}': registration.last_name,
      '{{email}}': registration.email
    };

    // Replace placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
      subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      htmlContent = htmlContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // Add custom message for reminders
    if (type === 'reminder' && custom_message) {
      htmlContent = `<p>${custom_message}</p><br/>` + htmlContent;
      textContent = `${custom_message}\n\n` + textContent;
    }

    return sendEmail({
      to: recipient,
      subject,
      html: htmlContent,
      text: textContent,
      from: EMAIL_FROM_SUPPORT || SUPPORT_EMAIL
    });

  } catch (error) {
    console.error('Error sending event email:', error);
    throw error;
  }
};

// Default event email fallback
const sendDefaultEventEmail = async ({ type, recipient, event, registration, custom_message }) => {
  const subject = type === 'confirmation' 
    ? `Registration Confirmed: ${event.title}`
    : `Reminder: ${event.title} starts soon!`;

  const html = `
    <h2>${type === 'confirmation' ? 'Registration Confirmed!' : 'Event Reminder'}</h2>
    <p>Dear ${registration.first_name} ${registration.last_name},</p>
    ${type === 'confirmation' 
      ? `<p>Thank you for registering for <strong>${event.title}</strong>.</p>`
      : `<p>This is a friendly reminder that <strong>${event.title}</strong> is starting soon.</p>`
    }
    <p><strong>Event Details:</strong></p>
    <ul>
      <li>Date: ${new Date(event.event_date).toLocaleString()}</li>
      <li>Duration: ${event.event_duration || 60} minutes</li>
      <li>Type: ${event.event_type}</li>
    </ul>
    ${custom_message ? `<p>${custom_message}</p>` : ''}
    <p>${type === 'confirmation' ? 'We look forward to seeing you there!' : 'Don\'t miss out!'}</p>
    <p>Best regards,<br>ViaLife Coach Team</p>
  `;

  const text = `
${type === 'confirmation' ? 'Registration Confirmed!' : 'Event Reminder'}

Dear ${registration.first_name} ${registration.last_name},

${type === 'confirmation' 
  ? `Thank you for registering for ${event.title}.`
  : `This is a friendly reminder that ${event.title} is starting soon.`
}

Event Details:
Date: ${new Date(event.event_date).toLocaleString()}
Duration: ${event.event_duration || 60} minutes
Type: ${event.event_type}

${custom_message ? `${custom_message}\n` : ''}
${type === 'confirmation' ? 'We look forward to seeing you there!' : 'Don\'t miss out!'}

Best regards,
ViaLife Coach Team
  `;

  return sendEmail({
    to: recipient,
    subject,
    html,
    text,
    from: EMAIL_FROM_SUPPORT || SUPPORT_EMAIL
  });
};
