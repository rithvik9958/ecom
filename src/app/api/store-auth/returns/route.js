export const dynamic = 'force-dynamic';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomOrder } from '@/app/models/EcomOrder';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const customer = verifyCustomerToken(request);
    if (!customer) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const validObjectId = mongoose.Types.ObjectId.isValid(customer.id) ? new mongoose.Types.ObjectId(customer.id) : null;
    const Order = await getEcomOrder();

    // Fetch all orders with a returnRequest
    const returnOrders = await Order.find({
      $and: [
        {
          $or: [
            { customerId: customer.id },
            ...(validObjectId ? [{ customerId: validObjectId }] : []),
            { email: customer.email }
          ]
        },
        { 'returnRequest.status': { $exists: true, $ne: null } }
      ]
    }).sort({ 'returnRequest.requestedAt': -1, updatedAt: -1 }).lean();

    const formatted = returnOrders.map(o => ({
      orderId: o._id.toString(),
      orderNumber: o._id.toString().substring(o._id.toString().length - 8).toUpperCase(),
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      items: o.items || [],
      returnRequest: o.returnRequest,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    }));

    return Response.json({
      success: true,
      returns: formatted,
      stats: {
        totalReturns: formatted.length,
        pendingReview: formatted.filter(r => r.returnRequest?.status === 'pending_review').length,
        completed: formatted.filter(r => ['refunded', 'replaced', 'completed'].includes(r.returnRequest?.status)).length
      }
    });
  } catch (error) {
    console.error('[store-auth-returns GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
