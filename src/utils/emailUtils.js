import nodemailer from "nodemailer";
import { AppError } from "./appError.js";

/**
 * Send email using Gmail & Nodemailer
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Using Gmail
      auth: {
        user: process.env.NODEMAILER_GMAIL_USER, // Your Gmail
        pass: process.env.NODEMAILER_GMAIL_PASS, // App password (not your Gmail password!)
      },
    });

    console.log(
      "process.env.NODEMAILER_GMAIL_USER = ",
      process.env.NODEMAILER_GMAIL_USER
    );
    console.log(
      "process.env.NODEMAILER_GMAIL_PASS, = ",
      process.env.NODEMAILER_GMAIL_PASS
    );

    // 2. Mail options
    const mailOptions = {
      from: `Blogify`,
      to,
      subject,
      text,
      html,
    };

    // 3. Send mail
    const info = await transporter.sendMail(mailOptions);
    console.log("sent");
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new AppError("Failed to send email", 500);
  }
};
