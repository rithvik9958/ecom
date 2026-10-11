export const dynamic = 'force-dynamic';
import Stripe from 'stripe';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import mongoose from 'mongoose';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /api/store-payments/create-checkout-session
export async function POST(request) {
  try {
    if (!stripe) {
      return Response.json(
        { success: false, message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in .env.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { customerName, email, phone, address, city, state, country, postalCode, items, total, paymentMethod, deliverySlot, deliveryDate } = body;

    if (!customerName || !email || !address || !items?.length) {
      return Response.json(
        { success: false, message: 'Missing required order details.' },
        { status: 400 }
      );
    }

    // Link to logged-in customer if available
    const customer = verifyCustomerToken(request);

    const Order = await getEcomOrder();
    const order = await Order.create({
      customerId:   customer ? new mongoose.Types.ObjectId(customer.id) : null,
      customerName,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      items,
      total,
      paymentMethod: paymentMethod || 'stripe',
      status:        'pending',
      paymentStatus: 'pending',
      deliverySlot,
      deliveryDate,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const lineItems = items.map((item) => ({
      price_data: {
        currency:     'inr',
        product_data: {
          name:   item.title || 'Product',
          images: item.thumbnail ? [item.thumbnail] : [],
        },
        unit_amount: Math.round((item.price ?? 0) * 100),
      },
      quantity: item.quantity ?? 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:           lineItems,
      mode:                 'payment',
      success_url:          `${baseUrl}/checkout/success?orderId=${order._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:           `${baseUrl}/cart`,
      customer_email:       email,
      metadata:             { orderId: order._id.toString() },
    });

    order.stripeSessionId = session.id;
    await order.save();

    return Response.json({ url: session.url }, { status: 201 });
  } catch (err) {
    console.error('[store-payments POST]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// GET /api/store-payments/confirm?session_id=... — confirm payment after redirect
export async function GET(request) {
  try {
    if (!stripe) {
      return Response.json({ success: false, message: 'Stripe not configured.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return Response.json({ success: false, message: 'session_id is required.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return Response.json({ success: false, message: 'No order linked to this session.' }, { status: 400 });
    }

    const Order = await getEcomOrder();
    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (session.payment_status === 'paid') {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'stripe';
      order.status = order.status === 'pending' ? 'processing' : order.status;
      order.stripeSessionId = sessionId;
      await order.save();
    }

    return Response.json(order);
  } catch (err) {
    console.error('[store-payments GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
