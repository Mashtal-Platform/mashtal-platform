const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || (SMTP_USER ? `Mashtal <${SMTP_USER}>` : 'noreply@mashtal.com');

function isSmtpConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

let cachedTransporter = null;

function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return cachedTransporter;
}

/**
 * Send verification email with link. Link format: FRONTEND_URL#verify-email?token=TOKEN
 * If SMTP is not configured, logs the link to console (development fallback).
 */
async function sendVerificationEmail(toEmail, token) {
  const verificationUrl = `${FRONTEND_URL}#verify-email?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();

  if (!transporter) {
    console.log('[Email] SMTP not configured. Verification link (dev):', verificationUrl);
    return;
  }

  const mailOptions = {
    from: MAIL_FROM,
    to: toEmail,
    subject: 'Verify your Mashtal account',
    text: `Welcome to Mashtal! Please verify your email by clicking the link below:\n\n${verificationUrl}\n\nThis link expires in 24 hours. If you did not create an account, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2>Verify your Mashtal account</h2>
        <p>Welcome to Mashtal! Please verify your email by clicking the button below.</p>
        <p><a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px;">Verify email</a></p>
        <p>Or copy this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Verification email sent to ${toEmail} (id: ${info.messageId})`);
}

module.exports = { sendVerificationEmail, isSmtpConfigured };
