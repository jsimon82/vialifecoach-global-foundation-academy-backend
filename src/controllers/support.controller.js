import { sendEmail } from "../services/email.service.js";
import { validateEmail, sanitizeInput } from "../utils/validator.js";
import { catchAsync } from "../utils/asyncHelpers.js";

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

  res.status(200).json({ message: "Support ticket sent" });
}

export async function _submitBooking(req, res) {
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

  const emailSubject = `[Booking request] ${sanitized.subject}`;
  const emailText = `Name: ${sanitized.name}\nEmail: ${sanitized.email}\n\n${sanitized.message}`;

  await sendEmail({
    to: "academy@vialifecoach.org",
    subject: emailSubject,
    text: emailText,
    html: `<p><strong>Name:</strong> ${sanitized.name}</p><p><strong>Email:</strong> ${sanitized.email}</p><p>${sanitized.message}</p>`,
    from: "academy",
  });

  res.status(200).json({ message: "Booking request sent" });
}

// wrapped exports for Express
export const submitTicket = catchAsync(_submitTicket);
export const submitBooking = catchAsync(_submitBooking);
