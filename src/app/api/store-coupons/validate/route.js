export const dynamic = 'force-dynamic';
import { getEcomCoupon } from '@/app/models/EcomCoupon';

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body;

    if (!code || cartTotal === undefined) {
      return Response.json({ success: false, message: 'Coupon code and cartTotal are required' }, { status: 400 });
    }

    const Coupon = getEcomCoupon();
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return Response.json({ success: false, message: 'Invalid or expired coupon code' }, { status: 404 });
    }

    if (coupon.minOrderValue > cartTotal) {
      return Response.json({ success: false, message: `This coupon requires a minimum order of ₹${coupon.minOrderValue}` }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return Response.json({ success: false, message: 'This coupon has expired' }, { status: 400 });
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
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount 
    });

  } catch (error) {
    console.error('[store-coupons validate POST]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
