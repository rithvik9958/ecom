export const dynamic = 'force-dynamic';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { verifyCustomerToken } from '@/app/lib/customerAuth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const customer = verifyCustomerToken(request);
    
    const Order = await getEcomOrder();
    
    let order = null;
    if (customer) {
      order = await Order.findOne({ 
        _id: id,
        $or: [
          { customerId: customer.id },
          { email: customer.email }
        ]
      }).lean();
    }
    
    // Fallback if not found under customerId or guest
    if (!order) {
      order = await Order.findById(id).lean();
    }

    if (!order) {
      return Response.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const isActuallyPaid = order.paymentStatus === 'paid' || order.status === 'paid' || Boolean(order.stripeSessionId);
    let resolvedMethod = order.paymentMethod;

    if (order.stripeSessionId || resolvedMethod === 'stripe' || resolvedMethod === 'card') {
      resolvedMethod = 'stripe';
    } else if (resolvedMethod === 'upi') {
      resolvedMethod = 'upi';
    } else if (resolvedMethod === 'cod' && isActuallyPaid) {
      resolvedMethod = 'stripe';
    } else if (!resolvedMethod) {
      resolvedMethod = isActuallyPaid ? 'stripe' : 'cod';
    }

    // Format the order
    const formattedOrder = {
      ...order,
      _id: order._id?.toString(),
      customerId: order.customerId?.toString(),
      paymentMethod: resolvedMethod,
      paymentStatus: order.paymentStatus || (isActuallyPaid ? 'paid' : 'pending'),
      deliverySlot: order.deliverySlot || null,
      deliveryDate: order.deliveryDate || null,
      address: order.address || {},
      items: order.items || [],
      returnRequest: order.returnRequest || null,
      cancellationReason: order.cancellationReason || '',
      timeline: order.timeline || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return Response.json({ success: true, order: formattedOrder });
  } catch (error) {
    console.error('[store-auth-order-details]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
