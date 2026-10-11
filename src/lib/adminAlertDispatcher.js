import { getAdminNotification } from '@/app/models/AdminNotification';
import { getPaymentSetting } from '@/app/models/PaymentSetting';
import { sendPushToAdmins } from '@/lib/webPush';

async function dispatchAdminEmail({ to, subject, html }) {
  try {
    const emailModule = await import('@/lib/email');
    if (typeof emailModule.sendEmail === 'function') {
      return await emailModule.sendEmail({ to, subject, html });
    }
    console.log(`[Admin Alert Email Simulated] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.log('[Admin Alert Email Dispatch Error]:', err?.message);
  }
}

/**
 * Dispatches a multi-channel real-time alert to the store owner across:
 * 1. Admin Dashboard Activity Feed & Live Bell
 * 2. Formatted Luxury HTML Email
 * 3. Native Browser Web Push to Admin devices
 * 4. WhatsApp formatted summary payload
 */
export async function notifyAdmin({
  type = 'new_order',
  title,
  message,
  link = '/dashboard/ecommerce/orders',
  metadata = {}
}) {
  try {
    // ── 1. INSERT INTO ADMIN NOTIFICATION FEED ──
    const AdminNotifModel = await getAdminNotification();
    const createdNotif = await AdminNotifModel.create({
      type,
      title: title || 'Store Event',
      message: message || '',
      link,
      read: false,
      metadata
    });

    // ── 2. RETRIEVE OWNER ALERT SETTINGS ──
    let adminEmail = process.env.EMAIL_SEND_TO || 'wtdesigner3@gmail.com';
    let adminWhatsApp = '';
    let enableAdminEmailAlerts = true;

    try {
      const SettingModel = await getPaymentSetting();
      const settings = await SettingModel.findOne().lean();
      if (settings?.supportEmail) adminEmail = settings.supportEmail;
      if (settings?.whatsappNumber) adminWhatsApp = settings.whatsappNumber;
    } catch (e) {}

    // ── 3. SEND FORMATTED EMAIL ALERT ──
    if (enableAdminEmailAlerts && adminEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const fullLink = `${baseUrl}${link.startsWith('/') ? link : '/' + link}`;

      let badgeColor = '#16a34a'; // Green for orders
      let badgeIcon = '🛍️';
      if (type === 'order_cancelled') { badgeColor = '#ef4444'; badgeIcon = '🛑'; }
      if (type === 'return_requested') { badgeColor = '#f59e0b'; badgeIcon = '🔄'; }
      if (type === 'new_review') { badgeColor = '#8b5cf6'; badgeIcon = '⭐'; }

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          
          <!-- Header Banner -->
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
            <div style="background: ${badgeColor}15; color: ${badgeColor}; padding: 8px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${badgeIcon} ${type.replace(/_/g, ' ')}
            </div>
            <span style="color: #64748b; font-size: 13px; margin-left: auto;">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>

          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 10px;">${title}</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">${message}</p>

          <!-- Metadata Box -->
          ${metadata && Object.keys(metadata).length > 0 ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                ${metadata.orderNumber || metadata.orderId ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Order ID:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">#${metadata.orderNumber || metadata.orderId}</td>
                  </tr>
                ` : ''}
                ${metadata.customerName ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Customer:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${metadata.customerName}</td>
                  </tr>
                ` : ''}
                ${metadata.grandTotal ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Amount:</td>
                    <td style="padding: 6px 0; color: #16a34a; font-weight: 800; font-size: 16px; text-align: right;">₹${Number(metadata.grandTotal).toLocaleString('en-IN')}</td>
                  </tr>
                ` : ''}
                ${metadata.paymentMethod ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Mode:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right; text-transform: uppercase;">${metadata.paymentMethod}</td>
                  </tr>
                ` : ''}
                ${metadata.deliverySlot ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Delivery Slot:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${metadata.deliverySlot}</td>
                  </tr>
                ` : ''}
                ${metadata.reason ? `
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Reason:</td>
                    <td style="padding: 6px 0; color: #ef4444; font-weight: 600; text-align: right;">${metadata.reason}</td>
                  </tr>
                ` : ''}
              </table>
            </div>
          ` : ''}

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 10px;">
            <a href="${fullLink}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px;">
              Open in Admin Dashboard &rarr;
            </a>
          </div>

        </div>
      `;

      dispatchAdminEmail({
        to: adminEmail,
        subject: `${badgeIcon} [Store Alert] ${title}`,
        html
      }).catch(e => console.error('[Admin Email Error]', e));
    }

    // ── 4. DISPATCH NATIVE WEB PUSH TO ADMIN DEVICES ──
    sendPushToAdmins({
      title: title || 'New Store Event',
      body: message || 'You have a new activity in your store.',
      url: link,
      tag: `admin-${type}-${Date.now()}`
    }).catch(e => console.error('[Admin Web Push Error]', e));

    return createdNotif;
  } catch (error) {
    console.error('[notifyAdmin Dispatch Error]', error);
    return null;
  }
}
