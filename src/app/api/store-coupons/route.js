export const dynamic = 'force-dynamic';
import { getEcomCoupon } from '@/app/models/EcomCoupon';

export async function GET() {
  try {
    const Coupon = getEcomCoupon();
    
    // Auto-seed default coupons if none exist
    let coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    
    if (coupons.length === 0) {
      const defaultCoupons = [
        { code: 'WELCOME10', description: 'Get 10% off on your first order', discountType: 'percentage', discountValue: 10, minOrderValue: 500 },
        { code: 'FLAT50', description: 'Flat ₹50 off on orders above ₹1000', discountType: 'fixed', discountValue: 50, minOrderValue: 1000 },
        { code: 'SAVE20', description: 'Save 20% on premium gifts', discountType: 'percentage', discountValue: 20, minOrderValue: 1500 }
      ];
      await Coupon.insertMany(defaultCoupons);
      coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    }

    const formatted = coupons.map(c => ({
      ...c,
      _id: c._id?.toString()
    }));

    return Response.json({ success: true, coupons: formatted });
  } catch (error) {
    console.error('[store-coupons GET]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, description, discountType, discountValue, minOrderValue } = body;

    if (!code || !discountType || !discountValue) {
      return Response.json({ success: false, message: 'Code, discountType, and discountValue are required' }, { status: 400 });
    }

    const Coupon = getEcomCoupon();
    const created = await Coupon.create({ code: code.toUpperCase(), description, discountType, discountValue, minOrderValue });

    return Response.json({ success: true, coupon: created }, { status: 201 });
  } catch (error) {
    console.error('[store-coupons POST]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
