import { getEcomProductAlert } from '@/app/models/EcomProductAlert';
import { createStoreNotification } from '@/lib/sendNotification';

async function dispatchAlertEmail({ to, subject, html }) {
  try {
    const emailModule = await import('@/lib/email');
    if (typeof emailModule.sendEmail === 'function') {
      return await emailModule.sendEmail({ to, subject, html });
    }
    console.log(`[Alert Email Log] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.log('[Alert Email Error]:', err?.message);
  }
}

/**
 * Automatically checks and notifies customers when product stock is replenished or price drops.
 */
export async function processProductAlerts({
  productId,
  productObjectId,
  productCustomId,
  newStock,
  oldStock = 0,
  newPrice,
  oldPrice = 0,
  productTitle = 'Product',
  productThumbnail = '',
  productSlug = ''
}) {
  const candidateIds = [
    productId ? String(productId) : null,
    productObjectId ? String(productObjectId) : null,
    productCustomId ? String(productCustomId) : null,
    productSlug ? String(productSlug) : null
  ].filter(Boolean);

  if (candidateIds.length === 0) return { notifiedStock: 0, notifiedPriceDrop: 0 };

  let notifiedStock = 0;
  let notifiedPriceDrop = 0;

  try {
    const AlertModel = await getEcomProductAlert();
    const productLink = `/products/${productSlug || productCustomId || productId}`;

    // ── 1. CHECK BACK-IN-STOCK ALERTS ──
    if (Number(newStock) > 0) {
      const stockAlerts = await AlertModel.find({
        productId: { $in: candidateIds },
        type: 'back_in_stock',
        status: 'pending'
      });

      console.log(`[AlertNotifier] Found ${stockAlerts.length} pending back-in-stock alert(s) for IDs:`, candidateIds);

      for (const alert of stockAlerts) {
        // A. In-App Website Notification (Resolves customerId by ID or Email!)
        try {
          await createStoreNotification({
            customerId: alert.customerId,
            email: alert.email,
            title: '🎉 Back in Stock!',
            message: `Great news! "${productTitle || alert.productTitle}" is back in stock. Order now before units run out!`,
            type: 'alert',
            link: productLink,
            metadata: {
              productId: String(productId || alert.productId),
              alertType: 'back_in_stock',
              thumbnail: productThumbnail || alert.productThumbnail
            }
          });
        } catch (e) {
          console.error('[AlertNotifier] In-app stock notification error:', e);
        }

        // B. Email Notification
        if (alert.email) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
              <h2 style="color: #111; margin-bottom: 8px;">🎉 It's Back in Stock!</h2>
              <p style="color: #555; font-size: 15px;">Good news! The item you were watching is now available to order.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 5px; color: #111;">${productTitle || alert.productTitle}</h3>
                <p style="margin: 0; font-weight: bold; color: #16a34a;">₹${Number(newPrice || oldPrice || 0).toLocaleString('en-IN')}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${productLink}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
                View &amp; Buy Product
              </a>
            </div>
          `;
          await dispatchAlertEmail({
            to: alert.email,
            subject: `🎉 Back in Stock: ${productTitle || alert.productTitle}`,
            html
          });
        }

        // C. Web Push Notification
        try {
          const { sendPushToCustomer } = await import('@/lib/webPush');
          sendPushToCustomer({
            customerId: alert.customerId,
            email: alert.email,
            payload: {
              title: `🎉 Back in Stock: ${productTitle || alert.productTitle}`,
              body: `The item you were watching is now back in stock for ₹${Number(newPrice || oldPrice || 0).toLocaleString('en-IN')}!`,
              url: productLink,
              image: productThumbnail || alert.productThumbnail
            }
          }).catch(() => {});
        } catch (e) {}

        alert.status = 'notified';
        alert.notifiedAt = new Date();
        await alert.save();
        notifiedStock++;
      }
    }

    // ── 2. CHECK PRICE-DROP ALERTS ──
    if (newPrice != null && Number(newPrice) > 0) {
      const priceDropAlerts = await AlertModel.find({
        productId: { $in: candidateIds },
        type: 'price_drop',
        status: 'pending',
        targetPrice: { $gte: Number(newPrice) }
      });

      console.log(`[AlertNotifier] Found ${priceDropAlerts.length} pending price-drop alert(s) for IDs:`, candidateIds);

      for (const alert of priceDropAlerts) {
        // A. In-App Website Notification (Resolves customerId by ID or Email!)
        try {
          await createStoreNotification({
            customerId: alert.customerId,
            email: alert.email,
            title: '📉 Price Drop Alert!',
            message: `"${productTitle || alert.productTitle}" just dropped to ₹${Number(newPrice).toLocaleString('en-IN')}! (Your target was ₹${alert.targetPrice.toLocaleString('en-IN')})`,
            type: 'alert',
            link: productLink,
            metadata: {
              productId: String(productId || alert.productId),
              alertType: 'price_drop',
              newPrice,
              targetPrice: alert.targetPrice,
              thumbnail: productThumbnail || alert.productThumbnail
            }
          });
        } catch (e) {
          console.error('[AlertNotifier] In-app price drop notification error:', e);
        }

        // B. Email Notification
        if (alert.email) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
              <h2 style="color: #111; margin-bottom: 8px;">📉 Price Drop Alert!</h2>
              <p style="color: #555; font-size: 15px;">The item you wanted has reached your target price!</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 5px; color: #111;">${productTitle || alert.productTitle}</h3>
                <p style="margin: 0; font-size: 16px;">New Price: <strong style="color: #16a34a;">₹${Number(newPrice).toLocaleString('en-IN')}</strong> (Target was: ₹${alert.targetPrice.toLocaleString('en-IN')})</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${productLink}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
                Claim Deal Now
              </a>
            </div>
          `;
          await dispatchAlertEmail({
            to: alert.email,
            subject: `📉 Price Dropped for ${productTitle || alert.productTitle} to ₹${newPrice}!`,
            html
          });
        }

        // C. Web Push Notification
        try {
          const { sendPushToCustomer } = await import('@/lib/webPush');
          sendPushToCustomer({
            customerId: alert.customerId,
            email: alert.email,
            payload: {
              title: `📉 Price Dropped: ${productTitle || alert.productTitle}`,
              body: `New price is ₹${Number(newPrice).toLocaleString('en-IN')} (Your target: ₹${alert.targetPrice.toLocaleString('en-IN')})!`,
              url: productLink,
              image: productThumbnail || alert.productThumbnail
            }
          }).catch(() => {});
        } catch (e) {}

        alert.status = 'notified';
        alert.notifiedAt = new Date();
        await alert.save();
        notifiedPriceDrop++;
      }
    }
  } catch (error) {
    console.error('[processProductAlerts Error]', error);
  }

  return { notifiedStock, notifiedPriceDrop };
}
