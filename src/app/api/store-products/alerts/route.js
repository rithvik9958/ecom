export const dynamic = 'force-dynamic';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import { getEcomProductAlert } from '@/app/models/EcomProductAlert';
import mongoose from 'mongoose';

// POST /api/store-products/alerts — create or update product alert
export async function POST(request) {
  try {
    const customer = verifyCustomerToken(request);
    const body = await request.json();

    const {
      productId,
      productTitle,
      productThumbnail,
      type,
      targetPrice,
      currentPrice,
      email: inputEmail,
      phone
    } = body;

    const email = (customer?.email || inputEmail || '').trim().toLowerCase();

    if (!productId) {
      return Response.json({ success: false, message: 'Product ID is required.' }, { status: 400 });
    }

    if (!type || !['back_in_stock', 'price_drop'].includes(type)) {
      return Response.json({ success: false, message: 'Valid alert type (back_in_stock or price_drop) is required.' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    }

    const AlertModel = await getEcomProductAlert();

    const customerId = customer?.id ? new mongoose.Types.ObjectId(customer.id) : null;

    // Check if an active pending alert already exists
    const existing = await AlertModel.findOne({
      productId: String(productId),
      email,
      type,
      status: 'pending'
    });

    if (existing) {
      existing.targetPrice = targetPrice != null ? Number(targetPrice) : existing.targetPrice;
      existing.currentPrice = currentPrice != null ? Number(currentPrice) : existing.currentPrice;
      if (phone) existing.phone = phone;
      if (productTitle) existing.productTitle = productTitle;
      if (productThumbnail) existing.productThumbnail = productThumbnail;
      if (customerId) existing.customerId = customerId;
      await existing.save();

      return Response.json({
        success: true,
        message: type === 'back_in_stock' 
          ? '🔔 Back-in-stock alert updated! We will notify you the moment this item is back.'
          : `📉 Price drop alert updated! We'll notify you when price reaches ₹${existing.targetPrice.toLocaleString('en-IN')}.`,
        alert: existing
      });
    }

    const newAlert = await AlertModel.create({
      productId: String(productId),
      productTitle: productTitle || '',
      productThumbnail: productThumbnail || '',
      customerId,
      email,
      phone: phone || '',
      type,
      targetPrice: targetPrice != null ? Number(targetPrice) : 0,
      currentPrice: currentPrice != null ? Number(currentPrice) : 0,
      status: 'pending'
    });

    return Response.json({
      success: true,
      message: type === 'back_in_stock'
        ? '🔔 Back-in-stock alert set! We will email you the moment this item returns to stock.'
        : `📉 Price drop alert set! We will notify you once price drops to ₹${Number(targetPrice || 0).toLocaleString('en-IN')}.`,
      alert: newAlert
    });
  } catch (err) {
    console.error('[store-products/alerts POST]', err);
    return Response.json({ success: false, message: err.message || 'Failed to set product alert.' }, { status: 500 });
  }
}

// GET /api/store-products/alerts — get user's alerts or check alert status for a product
export async function GET(request) {
  try {
    const customer = verifyCustomerToken(request);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const emailParam = searchParams.get('email');

    const email = (customer?.email || emailParam || '').trim().toLowerCase();

    const AlertModel = await getEcomProductAlert();

    const query = { status: 'pending' };
    if (productId) query.productId = String(productId);
    if (email) query.email = email;
    if (customer?.id) {
      query.$or = [{ customerId: new mongoose.Types.ObjectId(customer.id) }, { email }];
    }

    const alerts = await AlertModel.find(query).sort({ createdAt: -1 }).lean();

    return Response.json({ success: true, alerts });
  } catch (err) {
    console.error('[store-products/alerts GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
