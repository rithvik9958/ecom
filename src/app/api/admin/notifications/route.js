export const dynamic = 'force-dynamic';
import { getAdminNotification } from '@/app/models/AdminNotification';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

    const AdminNotifModel = await getAdminNotification();

    const [notifications, unreadCount] = await Promise.all([
      AdminNotifModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      AdminNotifModel.countDocuments({ read: false })
    ]);

    const formatted = notifications.map(n => ({
      ...n,
      _id: n._id.toString()
    }));

    return Response.json({
      success: true,
      notifications: formatted,
      unreadCount
    });
  } catch (error) {
    console.error('[Admin Notifications GET Error]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, title, message, link, metadata } = body;

    const { notifyAdmin } = await import('@/lib/adminAlertDispatcher');
    const created = await notifyAdmin({ type, title, message, link, metadata });

    return Response.json({
      success: true,
      notification: created
    });
  } catch (error) {
    console.error('[Admin Notifications POST Error]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id } = body;

    const AdminNotifModel = await getAdminNotification();

    if (id === 'all') {
      await AdminNotifModel.updateMany({ read: false }, { $set: { read: true } });
    } else if (id) {
      await AdminNotifModel.findByIdAndUpdate(id, { $set: { read: true } });
    }

    const unreadCount = await AdminNotifModel.countDocuments({ read: false });

    return Response.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('[Admin Notifications PATCH Error]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const AdminNotifModel = await getAdminNotification();

    if (id === 'all') {
      await AdminNotifModel.deleteMany({});
    } else if (id) {
      await AdminNotifModel.findByIdAndDelete(id);
    }

    const unreadCount = await AdminNotifModel.countDocuments({ read: false });

    return Response.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('[Admin Notifications DELETE Error]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
