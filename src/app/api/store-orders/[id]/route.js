export const dynamic = 'force-dynamic';
import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomOrder } from '@/app/models/EcomOrder';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;

  try {
    const { id } = await params;
    const Order = await getEcomOrder();
    const order = await Order.findById(id);

    if (!order) {
      return Response.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    // Customers can only view their own orders
    const isOwner = order.customerId?.toString() === customer.id ||
                    order.email === customer.email;

    if (!isOwner) {
      return Response.json({ success: false, message: 'Not authorized.' }, { status: 403 });
    }

    return Response.json(order);
  } catch (err) {
    console.error('[store-orders/[id] GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
