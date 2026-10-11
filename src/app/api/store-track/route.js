export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { getEcomOrder } from '@/app/models/EcomOrder';

export async function POST(request) {
  try {
    const { orderId, email, phone } = await request.json();

    const cleanId = String(orderId || '').trim();
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    if (!cleanId) {
      return Response.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 }
      );
    }

    if (!cleanEmail && !cleanPhone) {
      return Response.json(
        { success: false, message: 'Email address or Phone number is required to verify order ownership.' },
        { status: 400 }
      );
    }

    const Order = await getEcomOrder();

    const contactQueries = [];
    if (cleanEmail) {
      contactQueries.push({ email: cleanEmail });
      contactQueries.push({ 'address.email': cleanEmail });
    }
    if (cleanPhone) {
      contactQueries.push({ phone: { $regex: cleanPhone.slice(-10) } });
      contactQueries.push({ 'address.phone': { $regex: cleanPhone.slice(-10) } });
    }

    let order = null;

    if (mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24) {
      order = await Order.findOne({
        _id: new mongoose.Types.ObjectId(cleanId),
        $or: contactQueries
      }).lean();
    }

    // If not found by direct ObjectId, find candidate orders for this user and match by suffix / string
    if (!order) {
      const candidates = await Order.find({
        $or: contactQueries
      }).sort({ createdAt: -1 }).limit(20).lean();

      order = candidates.find(c => {
        const fullId = String(c._id).toLowerCase();
        const search = cleanId.toLowerCase();
        return fullId === search || fullId.endsWith(search) || fullId.includes(search);
      }) || null;
    }

    if (!order) {
      return Response.json(
        { success: false, message: 'No matching order found for this ID and contact details. Please verify your info.' },
        { status: 404 }
      );
    }

    // Construct synthesized timeline if order has no explicit timeline array
    let timeline = Array.isArray(order.timeline) && order.timeline.length > 0 ? order.timeline : [];
    if (timeline.length === 0) {
      const createdTime = new Date(order.createdAt || Date.now());
      timeline.push({
        status: 'pending',
        title: 'Order Placed & Confirmed',
        description: 'Your order was successfully placed and verified in our system.',
        time: createdTime,
        location: order.city || 'Central Hub'
      });

      const currentStatus = String(order.status || 'pending').toLowerCase();
      if (['processing', 'shipped', 'delivered'].includes(currentStatus)) {
        timeline.push({
          status: 'processing',
          title: 'Order Packed & Quality Checked',
          description: 'Products prepared and sanitized for dispatch.',
          time: new Date(createdTime.getTime() + 2 * 3600 * 1000),
          location: 'Fulfillment Center'
        });
      }

      if (['shipped', 'delivered'].includes(currentStatus)) {
        timeline.push({
          status: 'shipped',
          title: order.courier ? `Dispatched via ${order.courier}` : 'Out for Delivery',
          description: order.trackingNumber ? `Handed over to courier. AWB: ${order.trackingNumber}` : 'Courier is on the way to recipient address.',
          time: new Date(createdTime.getTime() + 6 * 3600 * 1000),
          location: order.city || 'Local Delivery Center'
        });
      }

      if (currentStatus === 'delivered') {
        timeline.push({
          status: 'delivered',
          title: 'Delivered to Recipient',
          description: 'Package handed over successfully. Thank you for shopping with us!',
          time: new Date(createdTime.getTime() + 12 * 3600 * 1000),
          location: order.city || 'Delivered'
        });
      }

      if (currentStatus === 'cancelled') {
        timeline.push({
          status: 'cancelled',
          title: 'Order Cancelled',
          description: order.deliveryNotes || 'This order was cancelled.',
          time: new Date(createdTime.getTime() + 1 * 3600 * 1000),
          location: ''
        });
      }
    }

    return Response.json({
      success: true,
      order: {
        id: String(order._id),
        orderNumber: String(order._id).substring(String(order._id).length - 8).toUpperCase(),
        createdAt: order.createdAt,
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentMethod || 'cod',
        stripeSessionId: order.stripeSessionId || null,
        courier: order.courier || '',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        deliveryNotes: order.deliveryNotes || '',
        deliveryDate: order.deliveryDate || '',
        deliverySlot: order.deliverySlot || '',
        address: order.address,
        city: order.city,
        state: order.state,
        postalCode: order.postalCode,
        customerName: order.customerName,
        email: order.email,
        total: order.total,
        items: order.items || [],
        timeline: timeline
      }
    });
  } catch (error) {
    console.error('[store-track] Error:', error);
    return Response.json(
      { success: false, message: 'Server error while tracking order.', error: error.message },
      { status: 500 }
    );
  }
}
