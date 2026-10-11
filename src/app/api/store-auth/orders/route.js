export const dynamic = 'force-dynamic';
import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomOrder } from '@/app/models/EcomOrder';
import mongoose from 'mongoose';

export async function GET(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;

  try {
    const Order = await getEcomOrder();
    
    let queryConditions = [
      { email: customer.email }
    ];

    if (customer.id) {
      queryConditions.push({ customerId: customer.id });
      try {
        queryConditions.push({ customerId: new mongoose.Types.ObjectId(customer.id) });
      } catch (err) {}
    }

    const rawOrders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 }).lean();

    const orders = rawOrders.map(order => {
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

      return {
        ...order,
        _id: order._id?.toString(),
        customerId: order.customerId?.toString(),
        paymentMethod: resolvedMethod,
        paymentStatus: order.paymentStatus || (isActuallyPaid ? 'paid' : 'pending')
      };
    });

    return Response.json({ success: true, orders });
  } catch (e) {
    console.error('[store-auth/orders] Error fetching orders:', e);
    return Response.json({ success: false, message: 'Failed to fetch orders.' }, { status: 500 });
  }
}
