import { sendEmail } from "../services/email.service.js";
import { validateEmail, sanitizeInput } from "../utils/validator.js";
import { catchAsync } from "../utils/asyncHelpers.js";
import { pool } from "../config/postgres.js";

// Generic payload validation for both endpoints
function validateSupportPayload(body) {
  const errors = [];
  const { name, email, subject, message } = body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Name is required");
  }
  if (!email || !validateEmail(email)) {
    errors.push("Valid email is required");
  }
  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    errors.push("Subject is required");
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    errors.push("Message is required");
  }
  return errors;
}

function validateBookingPayload(body) {
  const errors = [];
  const { name, email, date, time, topic } = body || {};
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Name is required");
  }
  if (!email || !validateEmail(email)) {
    errors.push("Valid email is required");
  }
  if (!date || typeof date !== "string" || date.trim().length === 0) {
    errors.push("Preferred date is required");
  }
  if (!time || typeof time !== "string" || time.trim().length === 0) {
    errors.push("Preferred time is required");
  }
  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    errors.push("Session topic is required");
  }
  return errors;
}

// raw implementations (useful for testing without Express wrapper)
export async function _submitTicket(req, res) {
  const errors = validateSupportPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const { name, email, subject, message } = req.body;
  const sanitized = {
    name: sanitizeInput(name),
    email: sanitizeInput(email),
    subject: sanitizeInput(subject),
    message: sanitizeInput(message),
  };

  const emailSubject = `[Support ticket] ${sanitized.subject}`;
  const emailText = `Name: ${sanitized.name}\nEmail: ${sanitized.email}\n\n${sanitized.message}`;

  await sendEmail({
    to: "support@vialifecoach.org",
    subject: emailSubject,
    text: emailText,
    html: `<p><strong>Name:</strong> ${sanitized.name}</p><p><strong>Email:</strong> ${sanitized.email}</p><p>${sanitized.message}</p>`,
    from: "support",
  });

  res.status(200).json({ success: true, message: "Support ticket sent" });
}

export async function _submitBooking(req, res) {
  const errors = validateBookingPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const { name, email, phone, date, time, topic, message } = req.body;
  const sanitized = {
    name: sanitizeInput(name),
    email: sanitizeInput(email),
    phone: phone ? sanitizeInput(phone) : "",
    date: sanitizeInput(date),
    time: sanitizeInput(time),
    topic: sanitizeInput(topic),
    message: message ? sanitizeInput(message) : "",
  };

  const emailSubject = `[Booking request] ${sanitized.topic}`;
  const emailText = `Name: ${sanitized.name}\nEmail: ${sanitized.email}\nPhone: ${sanitized.phone || "—"}\nPreferred Date: ${sanitized.date}\nPreferred Time: ${sanitized.time}\nTopic: ${sanitized.topic}\n\nAdditional Notes:\n${sanitized.message || "—"}`;

  // Save booking as a support ticket so it appears in Admin Portal
  try {
    await pool.query(
      `INSERT INTO support_tickets
        (subject, message, status, priority, requester_name, requester_email, channel)
       VALUES ($1, $2, 'open', 'normal', $3, $4, 'booking')`,
      [
        emailSubject,
        emailText,
        sanitized.name,
        sanitized.email,
      ]
    );
  } catch (dbError) {
    console.error("Failed to save booking as support ticket:", dbError);
  }

  await sendEmail({
    to: "support@vialifecoach.org",
    subject: emailSubject,
    text: emailText,
    html: `<p><strong>Name:</strong> ${sanitized.name}</p>
<p><strong>Email:</strong> ${sanitized.email}</p>
<p><strong>Phone:</strong> ${sanitized.phone || "—"}</p>
<p><strong>Preferred Date:</strong> ${sanitized.date}</p>
<p><strong>Preferred Time:</strong> ${sanitized.time}</p>
<p><strong>Topic:</strong> ${sanitized.topic}</p>
<p><strong>Additional Notes:</strong> ${sanitized.message || "—"}</p>`,
    from: "support",
  });

  res.status(200).json({ success: true, message: "Booking request sent" });
}

// wrapped exports for Express
export const submitTicket = catchAsync(_submitTicket);
export const submitBooking = catchAsync(_submitBooking);
