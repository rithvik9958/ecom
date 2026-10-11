export const dynamic = 'force-dynamic';
import { getEcomNotification } from '@/app/models/EcomNotification';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import mongoose from 'mongoose';

const CUSTOMER_JWT_SECRET =
  process.env.CUSTOMER_JWT_SECRET || 'CustomerStorefrontJWTsecretKey2024';

async function getAuthCustomerId(request) {
  // 1. Authorization header Bearer token
  const customer = verifyCustomerToken(request);
  if (customer && (customer.id || customer._id)) {
    return customer.id || customer._id;
  }
  
  // 2. Customer Cookies
  const cookieStore = await cookies();
  const customerCookie = cookieStore.get('store_token')?.value || cookieStore.get('customer_token')?.value;
  if (customerCookie) {
    try {
      const decoded = jwt.verify(customerCookie, CUSTOMER_JWT_SECRET);
      if (decoded?.id || decoded?._id) return decoded.id || decoded._id;
    } catch (e) {}
  }

  // 3. Fallback Admin/User Cookie
  const token = cookieStore.get('token')?.value;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      if (decoded?.id || decoded?._id) return decoded.id || decoded._id;
    } catch (e) {}
  }
  return null;
}

function buildCustomerQuery(customerId) {
  const ids = [customerId];
  try {
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      ids.push(new mongoose.Types.ObjectId(customerId));
    }
  } catch (e) {}
  return { customerId: { $in: ids } };
}

export async function GET(request) {
  try {
    const customerId = await getAuthCustomerId(request);
    if (!customerId) {
      return Response.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const Notification = await getEcomNotification();
    const customerQuery = buildCustomerQuery(customerId);
    let notifications = await Notification.find(customerQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Auto-seed welcoming contextual notifications if none exist
    if (!notifications || notifications.length === 0) {
      const seedNotifications = [
        {
          customerId,
          title: 'Welcome to our Luxury Storefront!',
          message: 'Explore our latest collections and enjoy exclusive member privileges. Use code WELCOME10 for 10% off your first order.',
          type: 'promotion',
          link: '/user/coupons',
          read: false,
          createdAt: new Date()
        },
        {
          customerId,
          title: 'Account Security Active',
          message: 'Your account is protected with 256-bit encryption. You can update your password and saved delivery addresses anytime.',
          type: 'account',
          link: '/user/password',
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
        },
        {
          customerId,
          title: 'Express Doorstep Delivery',
          message: 'Saved delivery addresses enable seamless 1-click checkout. Check your saved places or add a new address.',
          type: 'system',
          link: '/user/addresses',
          read: true,
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        }
      ];

      await Notification.insertMany(seedNotifications);
      notifications = await Notification.find({ customerId })
        .sort({ createdAt: -1 })
        .lean();
    }

    const formatted = notifications.map(n => ({
      ...n,
      _id: n._id.toString(),
      customerId: n.customerId.toString()
    }));

    const unreadCount = formatted.filter(n => !n.read).length;

    return Response.json({ success: true, notifications: formatted, unreadCount });
  } catch (error) {
    console.error('[store-notifications GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const customerId = await getAuthCustomerId(request);
    if (!customerId) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body; // 'all' or notification _id

    const Notification = await getEcomNotification();
    const customerQuery = buildCustomerQuery(customerId);

    if (id === 'all') {
      await Notification.updateMany({ ...customerQuery, read: false }, { $set: { read: true } });
    } else if (id) {
      await Notification.updateOne({ _id: id, ...customerQuery }, { $set: { read: true } });
    }

    const unreadCount = await Notification.countDocuments({ ...customerQuery, read: false });

    return Response.json({ success: true, message: 'Notifications marked as read', unreadCount });
  } catch (error) {
    console.error('[store-notifications PATCH]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const customerId = await getAuthCustomerId(request);
    if (!customerId) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // 'all' or notification _id

    const Notification = await getEcomNotification();
    const customerQuery = buildCustomerQuery(customerId);

    if (id === 'all') {
      await Notification.deleteMany(customerQuery);
    } else if (id) {
      await Notification.deleteOne({ _id: id, ...customerQuery });
    }

    const unreadCount = await Notification.countDocuments({ ...customerQuery, read: false });

    return Response.json({ success: true, message: 'Notification deleted', unreadCount });
  } catch (error) {
    console.error('[store-notifications DELETE]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
