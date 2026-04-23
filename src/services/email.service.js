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
  const baseUrl = FRONTEND_URL || "http://localhost:5173";
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
