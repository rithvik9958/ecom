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
      return Response.json({ success: false, message: 'Please log in to submit a return request.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      reason = 'Defective / Damaged item', 
      comment = '', 
      returnType = 'refund', // 'refund' | 'replacement'
      refundMethod = 'original_source', // 'original_source' | 'store_credit'
      items = []
    } = body;

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

    // Return can only be requested for delivered orders
    if (currentStatus !== 'delivered') {
      return Response.json({ 
        success: false, 
        message: 'Return requests can only be initiated for orders that have been successfully delivered.' 
      }, { status: 400 });
    }

    // Check if already requested return
    if (order.returnRequest && order.returnRequest.status) {
      return Response.json({ 
        success: false, 
        message: `A return request has already been submitted (Status: ${order.returnRequest.status.toUpperCase()}).` 
      }, { status: 400 });
    }

    const returnPayload = {
      status: 'pending_review', // pending_review -> approved -> pickup_scheduled -> picked_up -> refunded / replaced
      reason,
      comment,
      returnType,
      refundMethod,
      items: items.length > 0 ? items : order.items.map(i => ({ id: i.productId || i.id, title: i.title, quantity: i.quantity })),
      requestedAt: new Date()
    };
    order.returnRequest = returnPayload;

    // Add timeline event
    const returnEvent = {
      status: 'return_requested',
      title: `Return & ${returnType === 'replacement' ? 'Replacement' : 'Refund'} Requested`,
      description: `Reason: ${reason}${comment ? ` (${comment})` : ''}. Our team is reviewing the request.`,
      time: new Date()
    };

    if (!Array.isArray(order.timeline)) {
      order.timeline = [];
    }
    order.timeline.push(returnEvent);

    order.markModified('returnRequest');
    order.markModified('timeline');
    await order.save();

    // Send in-app notification to customer
    try {
      const orderShortId = order._id.toString().slice(-6).toUpperCase();
      await createStoreNotification({
        customerId: order.customerId,
        email: order.email,
        title: `Return Submitted: Order #${orderShortId}`,
        message: `Your return request (${returnType === 'replacement' ? 'Replacement' : 'Refund'}) for order #${orderShortId} has been submitted and is under review.`,
        type: 'return',
        link: '/user/returns',
        metadata: { orderId: order._id.toString() }
      });

      // Dispatch Real-Time Alert to Store Owner (Admin)
      const { notifyAdmin } = await import('@/lib/adminAlertDispatcher');
      notifyAdmin({
        type: 'return_requested',
        title: `🔄 Return Request for Order #${orderShortId}`,
        message: `Type: ${returnType.toUpperCase()} (${refundMethod.replace(/_/g, ' ')}) • Reason: ${reason}${comment ? ` - ${comment}` : ''}`,
        link: `/dashboard/ecommerce/orders`,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: orderShortId,
          customerName: customer.name || order.customerName,
          returnType,
          refundMethod,
          reason: `${reason}${comment ? ` - ${comment}` : ''}`,
          grandTotal: order.total
        }
      }).catch(e => console.error('[Admin Return Alert Error]', e));

    } catch (notifErr) {
      console.error('[Return Request Notification Trigger Error]', notifErr);
    }

    return Response.json({
      success: true,
      message: 'Your return request has been submitted successfully.',
      returnRequest: order.returnRequest,
      timeline: order.timeline
    });
  } catch (error) {
    console.error('[store-order-return]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
