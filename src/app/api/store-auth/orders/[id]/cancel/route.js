export const dynamic = 'force-dynamic';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { createStoreNotification } from '@/lib/sendNotification';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Please log in to cancel an order.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason = 'Cancelled by customer', comment = '' } = body;

    const Order = await getEcomOrder();
    
    // Find order belonging to customer
    const order = await Order.findOne({
      _id: id,
      $or: [
        { customerId: customer.id },
        { customerId: new mongoose.Types.ObjectId(customer.id) },
        { email: customer.email }
      ]
    });

    if (!order) {
      return Response.json({ success: false, message: 'Order not found or access denied.' }, { status: 404 });
    }

    const currentStatus = String(order.status || '').toLowerCase();

    // Prevent cancellation if already shipped, delivered, or cancelled
    if (currentStatus === 'cancelled') {
      return Response.json({ success: false, message: 'This order is already cancelled.' }, { status: 400 });
    }
    if (['shipped', 'out_for_delivery', 'delivered'].includes(currentStatus)) {
      return Response.json({ 
        success: false, 
        message: 'Order has already been dispatched and cannot be cancelled directly. Please contact support or request a return upon delivery.' 
      }, { status: 400 });
    }

    // Update status
    order.status = 'cancelled';
    order.cancellationReason = reason + (comment ? ` - ${comment}` : '');
    order.cancelledAt = new Date();

    if (order.paymentStatus === 'paid') {
      order.refundStatus = 'refund_initiated';
    }

    // Add timeline event
    const cancelEvent = {
      status: 'cancelled',
      title: 'Order Cancelled',
      description: `Cancelled: ${reason}${comment ? ` (${comment})` : ''}. ${order.paymentStatus === 'paid' ? 'Refund has been initiated.' : ''}`,
      time: new Date()
    };

    if (!Array.isArray(order.timeline)) {
      order.timeline = [];
    }
    order.timeline.push(cancelEvent);

    await order.save();

    // Send in-app notification to customer
    try {
      const orderShortId = order._id.toString().slice(-6).toUpperCase();
      await createStoreNotification({
        customerId: order.customerId,
        email: order.email,
        title: `Order #${orderShortId} Cancelled`,
        message: `Your cancellation request for order #${orderShortId} has been processed.${order.paymentStatus === 'paid' ? ' Your refund is being processed.' : ''}`,
        type: 'order',
        link: `/orders/${order._id.toString()}`,
        metadata: { orderId: order._id.toString() }
      });

      // Dispatch Real-Time Alert to Store Owner (Admin)
      const { notifyAdmin } = await import('@/lib/adminAlertDispatcher');
      notifyAdmin({
        type: 'order_cancelled',
        title: `🛑 Order #${orderShortId} Cancelled by Customer`,
        message: `Reason: ${reason}${comment ? ` (${comment})` : ''} • Total: ₹${Number(order.total || 0).toLocaleString('en-IN')}`,
        link: `/dashboard/ecommerce/orders`,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: orderShortId,
          customerName: customer.name || order.customerName,
          grandTotal: order.total,
          reason: `${reason}${comment ? ` - ${comment}` : ''}`,
          paymentStatus: order.paymentStatus
        }
      }).catch(e => console.error('[Admin Cancel Alert Error]', e));

    } catch (notifErr) {
      console.error('[Cancel Notification Trigger Error]', notifErr);
    }

    return Response.json({
      success: true,
      message: 'Order has been cancelled successfully.',
      order: {
        _id: order._id.toString(),
        status: order.status,
        cancellationReason: order.cancellationReason,
        timeline: order.timeline
      }
    });
  } catch (error) {
    console.error('[store-order-cancel]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
