export const dynamic = 'force-dynamic';
import { getPushSubscription } from '@/app/models/PushSubscription';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { verifyCustomerToken } from '@/app/lib/customerAuth';

const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'CustomerStorefrontJWTsecretKey2024';

export async function GET() {
  return Response.json({
    success: true,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { subscription, role = 'customer', userEmail } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return Response.json({ success: false, message: 'Invalid push subscription payload' }, { status: 400 });
    }

    let customerId = null;
    let email = userEmail || null;

    // Detect customer session
    if (role === 'customer') {
      const customer = verifyCustomerToken(request);
      if (customer) {
        customerId = customer.id || customer._id;
        if (!email) email = customer.email;
      } else {
        const cookieStore = await cookies();
        const cookie = cookieStore.get('store_token')?.value;
        if (cookie) {
          try {
            const dec = jwt.verify(cookie, CUSTOMER_JWT_SECRET);
            if (dec) {
              customerId = dec.id || dec._id;
              if (!email) email = dec.email;
            }
          } catch (e) {}
        }
      }
    }

    const PushModel = await getPushSubscription();
    const userAgent = request.headers.get('user-agent') || '';

    // Upsert subscription by endpoint
    const record = await PushModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        },
        role: role === 'admin' ? 'admin' : 'customer',
        customerId,
        userEmail: email ? email.toLowerCase().trim() : null,
        userAgent
      },
      { upsert: true, new: true }
    );

    return Response.json({
      success: true,
      message: 'Push subscription registered successfully',
      id: record._id
    });
  } catch (error) {
    console.error('[web-push subscribe POST Error]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return Response.json({ success: false, message: 'Endpoint is required' }, { status: 400 });
    }

    const PushModel = await getPushSubscription();
    await PushModel.deleteOne({ endpoint });

    return Response.json({ success: true, message: 'Subscription removed' });
  } catch (error) {
    console.error('[web-push subscribe DELETE Error]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
