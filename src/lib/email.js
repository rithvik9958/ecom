import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const rawResendKey = (process.env.RESEND_API_KEY || '').replace(/['"]/g, '').trim();
const resend = rawResendKey ? new Resend(rawResendKey) : null;
const fromEmail = process.env.EMAIL_SEND_FROM || 'onboarding@resend.dev';
const toEmail = process.env.EMAIL_SEND_TO || 'hello@example.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const getEmailWrapper = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7f6;
      margin: 0;
      padding: 0;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background-color: #0f172a;
      padding: 24px 32px;
      text-align: center;
    }
    .header img {
      max-height: 60px;
      margin-bottom: 15px;
      background: white;
      padding: 8px;
      border-radius: 6px;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin-top: 0;
      color: #555555;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    .data-table th, .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #eeeeee;
      text-align: left;
    }
    .data-table th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #444444;
      width: 35%;
      font-size: 14px;
    }
    .data-table td {
      font-size: 15px;
      color: #1a1a1a;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #eeeeee;
    }
    .footer p {
      margin: 0;
      font-size: 13px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://jindalmetal.com/images/logo.png" alt="Jindal Metals & Alloys" />
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from the Jindal Metals & Alloys website.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendNewEnquiryEmail = async (data) => {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Skipping email dispatch.");
    return;
  }

  const {
    companyName, contactPerson, email, contactNo, address,
    standard, grade, thicknessMin, thicknessMax, widthMin, widthMax,
    qty, surfaceFinish, hardness, selectOne, uts, ys, elongation,
    endUse, specialRequirements
  } = data;

  const content = `
    <p style="font-size: 16px; color: #333;">You have received a new inquiry from the website contact form.</p>
    
    <h3 style="margin-top: 32px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">Contact Information</h3>
    <table class="data-table" style="margin-top: 16px;">
      <tbody>
        <tr><th>Company Name</th><td>${companyName || '-'}</td></tr>
        <tr><th>Contact Person</th><td>${contactPerson || '-'}</td></tr>
        <tr><th>Email Address</th><td><a href="mailto:${email}" style="color: #0066cc;">${email || '-'}</a></td></tr>
        <tr><th>Contact No.</th><td>${contactNo || '-'}</td></tr>
        <tr><th>Address</th><td>${address || '-'}</td></tr>
      </tbody>
    </table>

    <h3 style="margin-top: 32px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">Material Requirements</h3>
    <table class="data-table" style="margin-top: 16px;">
      <tbody>
        <tr><th>Standard</th><td>${standard || '-'}</td></tr>
        <tr><th>Grade</th><td>${grade || '-'}</td></tr>
        <tr><th>Thickness</th><td>Min: ${thicknessMin || '-'} mm &nbsp;|&nbsp; Max: ${thicknessMax || '-'} mm</td></tr>
        <tr><th>Width</th><td>Min: ${widthMin || '-'} mm &nbsp;|&nbsp; Max: ${widthMax || '-'} mm</td></tr>
        <tr><th>Quantity (Kg)</th><td>${qty || '-'}</td></tr>
        <tr><th>Surface Finish</th><td>${surfaceFinish || '-'}</td></tr>
        <tr><th>Hardness</th><td>${hardness || '-'}</td></tr>
      </tbody>
    </table>

    <h3 style="margin-top: 32px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">Mechanical Properties & Other Details</h3>
    <table class="data-table" style="margin-top: 16px;">
      <tbody>
        <tr><th>Select One Option</th><td>${selectOne || '-'}</td></tr>
        <tr><th>UTS (N/mm²)</th><td>${uts || '-'}</td></tr>
        <tr><th>YS (N/mm²)</th><td>${ys || '-'}</td></tr>
        <tr><th>Elongation %</th><td>${elongation || '-'}</td></tr>
        <tr><th>End Use</th><td>${endUse || '-'}</td></tr>
        <tr><th>Special Requirements</th><td>${specialRequirements || '-'}</td></tr>
      </tbody>
    </table>
  `;

  const html = getEmailWrapper("New Website Inquiry", content);

  try {
    const response = await resend.emails.send({
      from: `Jindal Metals Website <${fromEmail}>`,
      to: [toEmail],
      subject: `New Website Enquiry: ${companyName}`,
      html: html,
      replyTo: email,
    });
    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

export const sendUpdatedEnquiryEmail = async (data) => {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Skipping email dispatch.");
    return;
  }

  const {
    companyName, contactPerson, email, contactNo,
    standard, grade, thicknessMin, thicknessMax, widthMin, widthMax,
    qty, surfaceFinish, hardness, selectOne, uts, ys, elongation,
    endUse, specialRequirements
  } = data;

  const content = `
    <p>A lead has provided technical specifications for their inquiry.</p>
    
    <h3 style="margin-top: 32px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #eeeeee; padding-bottom: 8px;">Contact Info</h3>
    <table class="data-table" style="margin-top: 16px;">
      <tbody>
        <tr><th>Company Name</th><td>${companyName || '-'}</td></tr>
        <tr><th>Contact Person</th><td>${contactPerson || '-'}</td></tr>
        <tr><th>Email</th><td><a href="mailto:${email}" style="color: #0066cc;">${email || '-'}</a></td></tr>
        <tr><th>Contact No.</th><td>${contactNo || '-'}</td></tr>
      </tbody>
    </table>

    <h3 style="margin-top: 32px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #eeeeee; padding-bottom: 8px;">Material Requirements</h3>
    <table class="data-table" style="margin-top: 16px;">
      <tbody>
        <tr><th>Standard</th><td>${standard || '-'}</td></tr>
        <tr><th>Grade</th><td>${grade || '-'}</td></tr>
        <tr><th>Thickness</th><td>Min: ${thicknessMin || '-'} mm | Max: ${thicknessMax || '-'} mm</td></tr>
        <tr><th>Width</th><td>Min: ${widthMin || '-'} mm | Max: ${widthMax || '-'} mm</td></tr>
        <tr><th>Quantity (Kg)</th><td>${qty || '-'}</td></tr>
        <tr><th>Surface Finish</th><td>${surfaceFinish || '-'}</td></tr>
        <tr><th>Hardness</th><td>${hardness || '-'}</td></tr>
      </tbody>
    </table>

    <h3 style="margin-top: 32px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #eeeeee; padding-bottom: 8px;">Mechanical Properties & Other</h3>
    <table class="data-table" style="margin-top: 16px;">
      <tbody>
        <tr><th>Select One Option</th><td>${selectOne || '-'}</td></tr>
        <tr><th>UTS (N/mm²)</th><td>${uts || '-'}</td></tr>
        <tr><th>YS (N/mm²)</th><td>${ys || '-'}</td></tr>
        <tr><th>Elongation %</th><td>${elongation || '-'}</td></tr>
        <tr><th>End Use</th><td>${endUse || '-'}</td></tr>
        <tr><th>Special Requirements</th><td>${specialRequirements || '-'}</td></tr>
      </tbody>
    </table>
  `;

  const html = getEmailWrapper("Technical Details Provided", content);

  try {
    const response = await resend.emails.send({
      from: `Website <${fromEmail}>`,
      to: [toEmail],
      subject: `Technical Details Added by ${contactPerson} (${companyName})`,
      html: html,
      replyTo: email,
    });
    console.log("Updated Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to send updated email:", error);
    throw error;
  }
};

export const sendTestEmail = async (testToEmail, subject, htmlContent) => {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  // Replace common variables with dummy data for the test
  let processedHtml = htmlContent || '';
  processedHtml = processedHtml.replace(/\{\{userName\}\}/g, 'John Doe (Test)');
  processedHtml = processedHtml.replace(/\{\{companyName\}\}/g, 'Acme Corp');
  processedHtml = processedHtml.replace(/\{\{resetLink\}\}/g, 'https://example.com/reset');
  processedHtml = processedHtml.replace(/\{\{contactEmail\}\}/g, 'test@example.com');
  processedHtml = processedHtml.replace(/\{\{supportPhone\}\}/g, '+1 (555) 123-4567');

  const finalHtml = processedHtml;
  try {
    const response = await resend.emails.send({
      from: `Jindal Admin <${fromEmail}>`,
      to: [testToEmail],
      subject: `[TEST] ${subject || "Template Preview"}`,
      html: finalHtml,
    });
    console.log("Test Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to send test email:", error);
    throw error;
  }
};

/**
 * sendPasswordResetEmail — sends a branded password-reset link to a customer.
 *
 * @param {string} toUserEmail  - Recipient email address
 * @param {string} userName     - Recipient's display name
 * @param {string} resetToken   - Signed JWT reset token
 *
 * If RESEND_API_KEY is not configured, the reset URL is printed to the
 * server console so developers can test the flow locally.
 */
export const sendPasswordResetEmail = async (toUserEmail, userName, resetToken) => {
  const resetUrl = `${BASE_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  if (!resend) {
    // Dev fallback — log the reset URL so it can be tested without email
    console.warn('[Email] RESEND_API_KEY not set. Password reset URL:', resetUrl);
    return { devUrl: resetUrl };
  }

  const content = `
    <p>Hi ${userName || 'there'},</p>
    <p>We received a request to reset the password for your account associated with this email address.</p>
    <p>Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
    <p style="text-align:center; margin: 32px 0;">
      <a href="${resetUrl}"
         style="display:inline-block; padding:14px 32px; background:#111111; color:#ffffff;
                text-decoration:none; border-radius:8px; font-weight:700; font-size:15px;
                letter-spacing:0.02em;">
        Reset Password
      </a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break:break-all; font-size:13px; color:#555555;">
      <a href="${resetUrl}" style="color:#0066cc;">${resetUrl}</a>
    </p>
    <p style="margin-top:32px; font-size:13px; color:#888888;">
      If you did not request a password reset, you can safely ignore this email.
      Your password will not change until you click the link above.
    </p>
  `;

  const html = getEmailWrapper('Reset Your Password', content);

  try {
    const response = await resend.emails.send({
      from: `EShop <${fromEmail}>`,
      to: [toUserEmail],
      subject: 'Reset your EShop password',
      html,
    });
    console.log('[Email] Password reset email sent:', response);
    return response;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Generic email sender using Resend with graceful fallback in development.
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!to) return { success: false, message: 'Recipient is required' };
  
  if (!resend) {
    console.log(`[Email Dev] Mock sent to: ${to} | Subject: ${subject}`);
    return { success: true, mocked: true };
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];
    const response = await resend.emails.send({
      from: `EShop <${fromEmail}>`,
      to: recipients,
      subject: subject || 'Notification from EShop',
      html: html || '',
    });
    console.log('[Email] Sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return { success: false, error: error.message };
  }
};

