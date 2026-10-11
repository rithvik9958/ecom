import { getEcomProductAlert } from '@/app/models/EcomProductAlert';
import { getEcomNotification } from '@/app/models/EcomNotification';

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
  newStock,
  oldStock = 0,
  newPrice,
  oldPrice = 0,
  productTitle = 'Product',
  productThumbnail = '',
  productSlug = ''
}) {
  if (!productId) return { notifiedStock: 0, notifiedPriceDrop: 0 };

  let notifiedStock = 0;
  let notifiedPriceDrop = 0;

  try {
    const AlertModel = await getEcomProductAlert();
    const NotificationModel = await getEcomNotification();
    const productLink = `/products/${productSlug || productId}`;

    // ── 1. CHECK BACK-IN-STOCK ALERTS ──
    if (newStock > 0 && oldStock <= 0) {
      const stockAlerts = await AlertModel.find({
        productId: String(productId),
        type: 'back_in_stock',
        status: 'pending'
      });

      for (const alert of stockAlerts) {
        // A. In-App Website Notification
        if (alert.customerId) {
          try {
            await NotificationModel.create({
              customerId: alert.customerId,
              title: '🎉 Back in Stock!',
              message: `Great news! "${productTitle}" is back in stock. Order now before units run out!`,
              type: 'alert',
              link: productLink,
              metadata: {
                productId: String(productId),
                alertType: 'back_in_stock',
                thumbnail: productThumbnail
              }
            });
          } catch (e) {
            console.error('[Notifier] In-app notification error:', e);
          }
        }

        // B. Email Notification
        if (alert.email) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
              <h2 style="color: #111; margin-bottom: 8px;">🎉 It's Back in Stock!</h2>
              <p style="color: #555; font-size: 15px;">Good news! The item you were watching is now available to order.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 5px; color: #111;">${productTitle}</h3>
                <p style="margin: 0; font-weight: bold; color: #16a34a;">₹${Number(newPrice || oldPrice || 0).toLocaleString('en-IN')}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${productLink}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
                View &amp; Buy Product
              </a>
            </div>
          `;
          await dispatchAlertEmail({
            to: alert.email,
            subject: `🎉 Back in Stock: ${productTitle}`,
            html
          });
        }

        alert.status = 'notified';
        alert.notifiedAt = new Date();
        await alert.save();
        notifiedStock++;
      }
    }

    // ── 2. CHECK PRICE-DROP ALERTS ──
    if (newPrice != null && Number(newPrice) < Number(oldPrice)) {
      const priceDropAlerts = await AlertModel.find({
        productId: String(productId),
        type: 'price_drop',
        status: 'pending',
        targetPrice: { $gte: Number(newPrice) }
      });

      for (const alert of priceDropAlerts) {
        // A. In-App Website Notification
        if (alert.customerId) {
          try {
            await NotificationModel.create({
              customerId: alert.customerId,
              title: '📉 Price Drop Alert!',
              message: `"${productTitle}" just dropped to ₹${Number(newPrice).toLocaleString('en-IN')}! (Your target was ₹${alert.targetPrice.toLocaleString('en-IN')})`,
              type: 'alert',
              link: productLink,
              metadata: {
                productId: String(productId),
                alertType: 'price_drop',
                newPrice,
                targetPrice: alert.targetPrice,
                thumbnail: productThumbnail
              }
            });
          } catch (e) {
            console.error('[Notifier] In-app price drop notification error:', e);
          }
        }

        // B. Email Notification
        if (alert.email) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
              <h2 style="color: #111; margin-bottom: 8px;">📉 Price Drop Alert!</h2>
              <p style="color: #555; font-size: 15px;">The item you wanted has reached your target price!</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 5px; color: #111;">${productTitle}</h3>
                <p style="margin: 0; font-size: 16px;">New Price: <strong style="color: #16a34a;">₹${Number(newPrice).toLocaleString('en-IN')}</strong> (Target was: ₹${alert.targetPrice.toLocaleString('en-IN')})</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${productLink}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
                Claim Deal Now
              </a>
            </div>
          `;
          await dispatchAlertEmail({
            to: alert.email,
            subject: `📉 Price Dropped for ${productTitle} to ₹${newPrice}!`,
            html
          });
        }

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

