import nodemailer from "nodemailer";
import { 
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN
} from "../config/env.js";

const ACADEMY_EMAIL = "academy@vialifecoach.org";
const SUPPORT_EMAIL = "support@vialifecoach.org";

const createTransporter = (userEmail) => {
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

export const sendEmail = async ({ to, subject, html, text, from }) => {
  const fromEmail = from === "support" ? SUPPORT_EMAIL : ACADEMY_EMAIL;
  const transporter = createTransporter(fromEmail);
  try {
    const info = await transporter.sendMail({
      from: `"vialifecoach" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
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
  const subject = "Reset your password token";
  const html = `Your reset token is ${token}`;
  const text = `Your reset token is ${token}`;
  return sendEmail({ to, subject, html, text, from });
};
