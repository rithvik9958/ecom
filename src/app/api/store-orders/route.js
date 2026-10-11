import { requireCustomer } from '@/app/lib/customerAuth';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { getEcomWallet } from '@/app/models/EcomWallet';
import { createStoreNotification } from '@/lib/sendNotification';
import mongoose from 'mongoose';

// GET /api/store-orders — list orders for current customer (or all if admin)
export async function GET(request) {
  const { customer, error } = requireCustomer(request);
  if (error) return error;

  try {
    const Order = await getEcomOrder();
    const orders = await Order.find({ customerId: new mongoose.Types.ObjectId(customer.id) })
      .sort({ createdAt: -1 });
    return Response.json(orders);
  } catch (err) {
    console.error('[store-orders GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/store-orders — create a COD order (non-Stripe)
export async function POST(request) {
  try {
    const body = await request.json();
    const { customerName, email, phone, address, city, state, country, postalCode, items, total, paymentMethod, deliverySlot, deliveryDate, walletDeduction } = body;

    if (!customerName || !email || !address || !items?.length || total === undefined) {
      return Response.json(
        { success: false, message: 'Missing required order fields.' },
        { status: 400 }
      );
    }

    // Optional: link to a logged-in customer
    const customer = requireCustomer(request).customer;

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
      paymentMethod: paymentMethod || 'cod',
      status:        'pending',
      paymentStatus: body.paymentStatus || (paymentMethod === 'cod' ? 'pending' : 'paid'),
      deliverySlot,
      deliveryDate
    });

    // Deduct wallet balance if wallet credit was applied
    const deduction = Number(walletDeduction || 0);
    if (deduction > 0 && customer?.id) {
      try {
        const Wallet = await getEcomWallet();
        const wallet = await Wallet.findOne({ customerId: new mongoose.Types.ObjectId(customer.id) });
        if (wallet && wallet.balance >= deduction) {
          wallet.balance -= deduction;
          wallet.lifetimeSpent = (wallet.lifetimeSpent || 0) + deduction;
          wallet.transactions.push({
            type: 'debit',
            amount: deduction,
            coinsDelta: 0,
            description: `🛍️ Applied ₹${deduction} Wallet Credit to Order #${order._id.toString().slice(-6).toUpperCase()}`,
            referenceId: order._id.toString(),
            status: 'completed',
            createdAt: new Date()
          });
          await wallet.save();
        }
      } catch (walletErr) {
        console.error('[Wallet deduction error]', walletErr);
      }
    }

    // Send in-app notification & web push to customer
    try {
      const orderShortId = order._id.toString().slice(-6).toUpperCase();
      await createStoreNotification({
        customerId: order.customerId,
        email: order.email,
        title: `Order Confirmed: #${orderShortId}`,
        message: `Thank you for your order of ₹${Number(total).toLocaleString('en-IN')}. We are preparing your items for prompt dispatch.`,
        type: 'order',
        link: `/orders/${order._id.toString()}`,
        metadata: { orderId: order._id.toString() }
      });

      // Dispatch Web Push to Customer
      const { sendPushToCustomer } = await import('@/lib/webPush');
      sendPushToCustomer({
        customerId: order.customerId,
        email: order.email,
        payload: {
          title: `🎉 Order Confirmed #${orderShortId}`,
          body: `We've received your order of ₹${Number(total).toLocaleString('en-IN')}. Tap to track delivery status.`,
          url: `/orders/${order._id.toString()}`
        }
      }).catch(e => console.error('[Customer Push Error]', e));

      // Dispatch Real-Time Alert to Store Owner (Admin)
      const { notifyAdmin } = await import('@/lib/adminAlertDispatcher');
      notifyAdmin({
        type: 'new_order',
        title: `🛍️ New Order #${orderShortId} (₹${Number(total).toLocaleString('en-IN')})`,
        message: `Received from ${customerName} • ${items.length} item(s) • ${paymentMethod?.toUpperCase() || 'COD'}`,
        link: `/dashboard/ecommerce/orders`,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: orderShortId,
          customerName,
          grandTotal: total,
          paymentMethod: paymentMethod || 'cod',
          deliverySlot: deliverySlot || '',
          deliveryDate: deliveryDate || ''
        }
      }).catch(e => console.error('[Admin Notify Error]', e));

    } catch (notifErr) {
      console.error('[Order Notification Trigger Error]', notifErr);
    }

    return Response.json({ success: true, order }, { status: 201 });
  } catch (err) {
    console.error('[store-orders POST]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
