import { Resend } from "resend";
import { AppError } from "./appError.js";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_GMAIL_USER, // Replace with your verified domain/sender
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Email sending failed:", error);
      throw new AppError("Failed to send email", 500);
    }

    return data;
  } catch (err) {
    console.error("Email sending failed:", err);
    throw new AppError("Failed to send email", 500);
  }
};
