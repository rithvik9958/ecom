export const dynamic = 'force-dynamic';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { getEcomWallet } from '@/app/models/EcomWallet';
import { requirePermission } from '@/app/lib/auth';
import { createStoreNotification } from '@/lib/sendNotification';

export async function GET(request, { params }) {
  const { error } = await requirePermission(request, 'orders');
  if (error) return error;

  try {
    const { id } = await params;
    const Order = await getEcomOrder();
    const order = await Order.findOne({ _id: id }).lean();
    if (!order) return Response.json({ message: "Order not found" }, { status: 404 });
    return Response.json(order);
  } catch (error) {
    return Response.json({ message: "Failed to fetch order", error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error } = await requirePermission(request, 'orders', 'update');
  if (error) return error;

  try {
    const { id } = await params;
    const Order = await getEcomOrder();
    const order = await Order.findOne({ _id: id });
    
    if (!order) {
      return Response.json({ message: "Order not found" }, { status: 404 });
    }

    const data = await request.json();

    const previousStatus = order.status;

    if (data.status) {
      order.status = data.status;
    }
    
    if (data.paymentStatus) {
      order.paymentStatus = data.paymentStatus;
    }

    if (data.courier !== undefined) {
      order.courier = data.courier;
    }

    if (data.trackingNumber !== undefined) {
      order.trackingNumber = data.trackingNumber;
    }

    if (data.trackingUrl !== undefined) {
      order.trackingUrl = data.trackingUrl;
    }

    if (data.deliveryNotes !== undefined) {
      order.deliveryNotes = data.deliveryNotes;
    }

    // Auto-append to timeline if status changed or explicit timeline entry provided
    if (!Array.isArray(order.timeline)) {
      order.timeline = [];
    }

    if (data.status && data.status !== previousStatus) {
      const titleMap = {
        pending: 'Order Placed & Received',
        processing: 'Order Packed & Prepared',
        shipped: 'Dispatched & Out for Delivery',
        delivered: 'Order Delivered Successfully',
        cancelled: 'Order Cancelled'
      };
      const descMap = {
        pending: 'Your order has been received and is being verified.',
        processing: 'Items are being carefully packed and quality checked.',
        shipped: (data.courier || order.courier) ? `Handed over to ${data.courier || order.courier}${ (data.trackingNumber || order.trackingNumber) ? ` (AWB: ${data.trackingNumber || order.trackingNumber})` : '' }` : 'Package is on its way to the delivery address.',
        delivered: 'Package has been delivered to the recipient. Thank you for shopping with us!',
        cancelled: data.deliveryNotes || 'This order was cancelled.'
      };

      order.timeline.push({
        status: data.status,
        title: titleMap[data.status] || data.status,
        description: data.timelineNote || descMap[data.status] || '',
        time: new Date(),
        location: data.location || (order.city ? `${order.city}` : '')
      });

      // Send in-app notification to customer
      try {
        await createStoreNotification({
          customerId: order.customerId,
          email: order.email,
          title: `Order #${order._id.toString().slice(-6).toUpperCase()}: ${titleMap[data.status] || data.status.toUpperCase()}`,
          message: data.timelineNote || descMap[data.status] || `Your order status has been updated to ${data.status}.`,
          type: 'order',
          link: `/orders/${order._id.toString()}`,
          metadata: { orderId: order._id.toString(), status: data.status }
        });
      } catch (notifErr) {
        console.error('[Notification Trigger Error]', notifErr);
      }

      // Auto-Credit Loyalty Coins Cashback on Delivery (Disabled while wallet feature is hidden)
      /*
      if (data.status === 'delivered' && (order.customerId || order.email)) {
        try {
          const Wallet = await getEcomWallet();
          const wallet = await Wallet.findOne({ customerId: order.customerId });
          if (wallet) {
            const orderTotal = Number(order.total || 0);
            const earnedCoins = Math.max(10, Math.floor(orderTotal * 0.2));
            wallet.coins = (wallet.coins || 0) + earnedCoins;
            wallet.transactions.push({
              type: 'cashback',
              amount: 0,
              coinsDelta: earnedCoins,
              description: `🌟 Earned ${earnedCoins} Loyalty Coins (Order #${order._id.toString().slice(-6).toUpperCase()} Delivered)`,
              referenceId: order._id.toString(),
              status: 'completed',
              createdAt: new Date()
            });
            await wallet.save();
          }
        } catch (cbErr) {
          console.error('[Cashback credit error]', cbErr);
        }
      }
      */
    } else if (data.addTimelineNote) {
      order.timeline.push({
        status: order.status || 'processing',
        title: 'Status Update',
        description: data.addTimelineNote,
        time: new Date(),
        location: data.location || ''
      });
    }

    // Handle Return & Replacement Request Updates
    if (data.returnRequestStatus) {
      if (!order.returnRequest) {
        order.returnRequest = {};
      }
      order.returnRequest.status = data.returnRequestStatus;
      if (data.returnAdminNote !== undefined) {
        order.returnRequest.adminNote = data.returnAdminNote;
      }
      if (data.returnTrackingNumber !== undefined) {
        order.returnRequest.trackingNumber = data.returnTrackingNumber;
      }
      if (data.refundRefNumber !== undefined) {
        order.returnRequest.refundRefNumber = data.refundRefNumber;
      }

      if (data.returnRequestStatus === 'refunded' || data.returnRequestStatus === 'refund_completed') {
        order.paymentStatus = 'refunded';
      }

      const returnStatusTitles = {
        approved: 'Return Request Approved',
        pickup_scheduled: 'Reverse Pickup Scheduled',
        picked_up: 'Item Picked Up & Inspected',
        refunded: 'Refund Processed & Completed Successfully',
        refund_completed: 'Refund Processed & Completed Successfully',
        replaced: 'Replacement Dispatched & Completed',
        completed: 'Return & Inspection Completed Successfully',
        return_completed: 'Return & Inspection Completed Successfully',
        rejected: 'Return Request Declined'
      };

      const refText = data.refundRefNumber ? ` (Ref / UTR: ${data.refundRefNumber})` : '';
      const returnStatusDescs = {
        approved: data.returnAdminNote || 'Your return request has been approved and is being processed by our fulfillment team.',
        pickup_scheduled: data.returnAdminNote || `Reverse courier partner assigned${data.returnTrackingNumber ? ` (AWB: ${data.returnTrackingNumber})` : ''}.`,
        picked_up: data.returnAdminNote || 'Item has been picked up by our courier partner and verified at our fulfillment center.',
        refunded: data.returnAdminNote || `Full refund of ₹${(order.total || 0).toLocaleString('en-IN')} has been successfully credited to your original payment mode${refText}. Please allow 2–4 business days for bank settlement.`,
        refund_completed: data.returnAdminNote || `Full refund of ₹${(order.total || 0).toLocaleString('en-IN')} has been successfully credited to your original payment mode${refText}. Please allow 2–4 business days for bank settlement.`,
        replaced: data.returnAdminNote || 'A replacement package has been dispatched and delivered to your address.',
        completed: data.returnAdminNote || 'Item return and warehouse inspection have been successfully completed.',
        return_completed: data.returnAdminNote || 'Item return and warehouse inspection have been successfully completed.',
        rejected: data.returnAdminNote || 'Your return request could not be approved as per return policy guidelines.'
      };

      order.timeline.push({
        status: `return_${data.returnRequestStatus}`,
        title: returnStatusTitles[data.returnRequestStatus] || `Return: ${data.returnRequestStatus.replace(/_/g, ' ').toUpperCase()}`,
        description: returnStatusDescs[data.returnRequestStatus] || '',
        time: new Date(),
        location: data.location || ''
      });

      order.markModified('returnRequest');

      // Send in-app notification to customer
      try {
        await createStoreNotification({
          customerId: order.customerId,
          email: order.email,
          title: `Return #${order._id.toString().slice(-6).toUpperCase()}: ${returnStatusTitles[data.returnRequestStatus] || 'Return Update'}`,
          message: returnStatusDescs[data.returnRequestStatus] || `Your return request status has been updated to ${data.returnRequestStatus}.`,
          type: 'return',
          link: '/user/returns',
          metadata: { orderId: order._id.toString(), returnStatus: data.returnRequestStatus }
        });
      } catch (notifErr) {
        console.error('[Return Notification Trigger Error]', notifErr);
      }
    }

    order.markModified('timeline');
    await order.save();
    return Response.json(order);
  } catch (error) {
    console.error("Order Update Error:", error);
    return Response.json({ message: "Failed to update order", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requirePermission(request, 'orders', 'delete');
  if (error) return error;

  try {
    const { id } = await params;
    const Order = await getEcomOrder();
    await Order.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ message: "Failed to delete order", error: error.message }, { status: 500 });
  }
}
