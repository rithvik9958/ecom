export const dynamic = 'force-dynamic';
import { getEcomCoupon } from '@/app/models/EcomCoupon';
import { getEcomOrder } from '@/app/models/EcomOrder';
import { verifyCustomerToken } from '@/app/lib/customerAuth';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const Coupon = getEcomCoupon();
    const customer = verifyCustomerToken(request);
    const customerEmail = customer?.email ? customer.email.trim().toLowerCase() : null;

    let orderCount = 0;
    if (customer) {
      try {
        const Order = await getEcomOrder();
        const orConditions = [];
        if (customer.id) orConditions.push({ customerId: new mongoose.Types.ObjectId(customer.id) });
        if (customerEmail) orConditions.push({ email: customerEmail });
        if (orConditions.length > 0) {
          orderCount = await Order.countDocuments({ $or: orConditions, status: { $ne: 'cancelled' } });
        }
      } catch (oErr) {
        console.error('[store-coupons orderCount error]', oErr);
      }
    }

    // Auto-seed default coupons if none exist
    let coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();

    if (coupons.length === 0) {
      const defaultCoupons = [
        { code: 'WELCOME10', description: 'Get 10% off on your first order', discountType: 'percentage', discountValue: 10, minOrderValue: 500, targetAudience: 'first_time' },
        { code: 'FLAT50', description: 'Flat ₹50 off on orders above ₹1000', discountType: 'fixed', discountValue: 50, minOrderValue: 1000, targetAudience: 'all' },
        { code: 'SAVE20', description: 'Save 20% on premium gifts', discountType: 'percentage', discountValue: 20, minOrderValue: 1500, targetAudience: 'all' }
      ];
      await Coupon.insertMany(defaultCoupons);
      coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    }

    const now = new Date();

    // Filter coupons by targetAudience & validity
    const filtered = coupons.filter(c => {
      // Exclude expired
      if (c.expiresAt && new Date(c.expiresAt) <= now) return false;
      // Exclude global usage cap reached
      if (c.usageLimit > 0 && (c.usedCount || 0) >= c.usageLimit) return false;

      // Handle audience restrictions
      if (c.targetAudience === 'specific_customer') {
        // Only visible if user is logged in and email matches
        return customerEmail && c.targetEmail && c.targetEmail.toLowerCase() === customerEmail;
      }

      return true;
    });

    const formatted = filtered.map(c => {
      let isEligible = true;
      let ineligibilityReason = '';

      if (c.targetAudience === 'first_time' && customer && orderCount > 0) {
        isEligible = false;
        ineligibilityReason = 'Valid on first order only';
      } else if (c.targetAudience === 'returning' && customer && orderCount === 0) {
        isEligible = false;
        ineligibilityReason = 'Valid for returning customers';
      }

      return {
        ...c,
        _id: c._id?.toString(),
        isEligible,
        ineligibilityReason
      };
    });

    return Response.json({ success: true, coupons: formatted });
  } catch (error) {
    console.error('[store-coupons GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
