/**
 * Email System using Resend
 * Optional integration - requires RESEND_API_KEY environment variable
 */

import { logger } from '@/lib/logger';

let resend: any = null;

try {
  const Resend = require('resend').Resend;
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  logger.warn('Resend email service not configured. Email functionality will be disabled.');
}

const FROM_EMAIL = process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@axiora.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(',')[0] || 'admin@axiora.com';

export interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterEmailPayload {
  email: string;
  name?: string;
}

export async function sendContactFormEmail(data: ContactEmailPayload) {
  try {
    // Send to user
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'We received your message',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Thank you for reaching out, ${data.name}!</h2>
          <p>We received your message and will get back to you as soon as possible.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <h3>Your Message:</h3>
          <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
        </div>
      `,
    });

    // Send to admin
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `New Contact Form Submission: ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to send contact email:', error);
    throw error;
  }
}

export async function sendNewsletterWelcomeEmail(data: NewsletterEmailPayload) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'Welcome to Axiora Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h1 style="color: #0a0e27;">Welcome to Axiora!</h1>
          <p>Thank you for subscribing to our newsletter, ${data.name || 'subscriber'}!</p>
          
          <h3>What to expect:</h3>
          <ul>
            <li>🚀 Weekly updates on AI, IoT, and Web Development</li>
            <li>💡 Exclusive project insights and lessons learned</li>
            <li>🔬 Research findings and experimental results</li>
            <li>📚 Learning resources and industry trends</li>
          </ul>
          
          <hr style="border: none; border-top: 2px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            You'll hear from us soon. If you have any questions, feel free to reply to this email.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to send newsletter email:', error);
    throw error;
  }
}

export async function sendAdminNotificationEmail(
  subject: string,
  message: string,
  metadata?: Record<string, any>
) {
  try {
    const metadataHtml = metadata
      ? `<h3>Metadata:</h3><pre>${JSON.stringify(metadata, null, 2)}</pre>`
      : '';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[Axiora Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${escapeHtml(subject)}</h2>
          <p>${message}</p>
          ${metadataHtml}
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to send admin notification:', error);
    throw error;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// For server-side usage
export async function sendBulkNewsletter(
  subject: string,
  htmlContent: string,
  emails: string[]
) {
  try {
    const results = await Promise.allSettled(
      emails.map((email) =>
        resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: htmlContent,
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { successful, failed, total: emails.length };
  } catch (error) {
    logger.error('Failed to send bulk newsletter:', error);
    throw error;
  }
}
