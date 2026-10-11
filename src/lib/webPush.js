import webpush from 'web-push';
import { getPushSubscription } from '@/app/models/PushSubscription';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BKXCQsMuqcMnjtgZXdo79BDvFyvaghUzRETm3mpoJa2D7nDwcNZVCaBHhkwXiF6g0d_DCvhQ7GXnEJEO43X8QpE';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'bBMXNRTuvjEF5J-AiqR_LhimvXSNfYb2Jw6aJg41U7k';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@eshop.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
} catch (e) {
  console.warn('[WebPush Init Warning]', e?.message);
}

/**
 * Sends a push notification to a specific browser subscription object.
 * Auto-deletes subscription if expired or unregistered (HTTP 410 / 404).
 */
export async function sendSinglePush(subRecord, payload) {
  if (!subRecord || !subRecord.endpoint) return false;

  const pushSubscription = {
    endpoint: subRecord.endpoint,
    keys: {
      p256dh: subRecord.keys?.p256dh,
      auth: subRecord.keys?.auth
    }
  };

  const stringifiedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

  try {
    await webpush.sendNotification(pushSubscription, stringifiedPayload);
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log(`[WebPush] Subscription expired (${err.statusCode}). Cleaning up endpoint:`, subRecord.endpoint);
      try {
        const PushModel = await getPushSubscription();
        await PushModel.deleteOne({ endpoint: subRecord.endpoint });
      } catch (cleanErr) {}
    } else {
      console.error('[WebPush Dispatch Error]:', err?.message || err);
    }
    return false;
  }
}

/**
 * Dispatches a native push notification to a specific customer by ID or Email.
 */
export async function sendPushToCustomer({ customerId, email, payload }) {
  try {
    const PushModel = await getPushSubscription();
    const query = { role: 'customer', $or: [] };

    if (customerId) query.$or.push({ customerId: String(customerId) });
    if (email) query.$or.push({ userEmail: email.toLowerCase().trim() });

    if (query.$or.length === 0) return 0;

    const subscriptions = await PushModel.find(query);
    let sentCount = 0;

    for (const sub of subscriptions) {
      const ok = await sendSinglePush(sub, payload);
      if (ok) sentCount++;
    }

    return sentCount;
  } catch (err) {
    console.error('[sendPushToCustomer Error]', err);
    return 0;
  }
}

/**
 * Dispatches a native push notification to all subscribed Admin devices.
 */
export async function sendPushToAdmins(payload) {
  try {
    const PushModel = await getPushSubscription();
    const adminSubs = await PushModel.find({ role: 'admin' });
    let sentCount = 0;

    for (const sub of adminSubs) {
      const ok = await sendSinglePush(sub, payload);
      if (ok) sentCount++;
    }

    return sentCount;
  } catch (err) {
    console.error('[sendPushToAdmins Error]', err);
    return 0;
  }
}

/**
 * Broadcasts a marketing / flash sale push notification to all subscribed customer devices.
 */
export async function broadcastPushToAll(payload) {
  try {
    const PushModel = await getPushSubscription();
    const allSubs = await PushModel.find({ role: 'customer' });
    let sentCount = 0;

    for (const sub of allSubs) {
      const ok = await sendSinglePush(sub, payload);
      if (ok) sentCount++;
    }

    return sentCount;
  } catch (err) {
    console.error('[broadcastPushToAll Error]', err);
    return 0;
  }
}
