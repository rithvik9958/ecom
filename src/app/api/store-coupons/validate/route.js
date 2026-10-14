export const dynamic = 'force-dynamic';
import { getEcomCoupon } from '@/app/models/EcomCoupon';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, cartTotal, email } = body;

    if (!code || cartTotal === undefined) {
      return Response.json({ success: false, message: 'Coupon code and cartTotal are required' }, { status: 400 });
    }

    const Coupon = getEcomCoupon();
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

    if (!coupon) {
      return Response.json({ success: false, message: 'Invalid or inactive coupon code' }, { status: 404 });
    }

    if (coupon.minOrderValue > cartTotal) {
      return Response.json({ success: false, message: `This coupon requires a minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')}` }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return Response.json({ success: false, message: 'This coupon has expired' }, { status: 400 });
    }

    // Check global usage limit
    if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return Response.json({ success: false, message: 'This coupon has reached its maximum global redemption limit' }, { status: 400 });
    }

    // Identify customer
    const customer = verifyCustomerToken(request);
    const customerEmail = (customer?.email || email || '').trim().toLowerCase();
    const customerId = customer?.id || null;

    const Order = await getEcomOrder();
    const customerOrQueries = [];
    if (customerId) {
      customerOrQueries.push({ customerId: new mongoose.Types.ObjectId(customerId) });
    }
    if (customerEmail) {
      customerOrQueries.push({ email: customerEmail });
    }

    let customerOrderCount = 0;
    if (customerOrQueries.length > 0) {
      customerOrderCount = await Order.countDocuments({
        $or: customerOrQueries,
        status: { $ne: 'cancelled' }
      });
    }

    // 1. First-Time Customer Rule
    if (coupon.targetAudience === 'first_time') {
      if (customerOrderCount > 0) {
        return Response.json({
          success: false,
          message: 'This coupon is exclusively for first-time customers on their first order.'
        }, { status: 400 });
      }
    }

    // 2. Specific Customer Rule
    if (coupon.targetAudience === 'specific_customer') {
      if (!customerEmail) {
        return Response.json({
          success: false,
          message: 'Please log in with your registered customer email to apply this exclusive coupon.'
        }, { status: 400 });
      }
      if (customerEmail !== (coupon.targetEmail || '').toLowerCase()) {
        return Response.json({
          success: false,
          message: 'This exclusive coupon code is not valid for your account.'
        }, { status: 400 });
      }
    }

    // 3. Returning Customers Rule
    if (coupon.targetAudience === 'returning') {
      if (!customerEmail && !customerId) {
        return Response.json({
          success: false,
          message: 'Please log in to apply this returning customer coupon.'
        }, { status: 400 });
      }
      if (customerOrderCount === 0) {
        return Response.json({
          success: false,
          message: 'This coupon is exclusively for returning customers with past orders.'
        }, { status: 400 });
      }
    }

    // 4. Per-User Usage Limit Check
    if (coupon.maxUsesPerUser > 0 && customerOrQueries.length > 0) {
      const timesUsed = await Order.countDocuments({
        $or: customerOrQueries,
        couponCode: coupon.code,
        status: { $ne: 'cancelled' }
      });

      if (timesUsed >= coupon.maxUsesPerUser) {
        return Response.json({
          success: false,
          message: `You have already redeemed this coupon the maximum allowed times (${coupon.maxUsesPerUser}).`
        }, { status: 400 });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.floor((cartTotal * coupon.discountValue) / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    // Don't let discount exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    return Response.json({ 
      success: true, 
      coupon: {
        _id: coupon._id.toString(),
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        targetAudience: coupon.targetAudience
      },
      discountAmount 
    });

  } catch (error) {
    console.error('[store-coupons validate POST]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
