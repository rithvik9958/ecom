export const dynamic = 'force-dynamic';
import { getEcomCoupon } from '@/app/models/EcomCoupon';
import { requirePermission } from '@/app/lib/auth';

export async function GET(request) {
  const { error } = await requirePermission(request, 'products');
  if (error) return error;

  try {
    const Coupon = getEcomCoupon();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status') || 'all';

    let query = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const now = new Date();
    if (status === 'active') {
      query.isActive = true;
      query.$and = [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
      ];
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.expiresAt = { $lte: now };
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();

    const formatted = coupons.map(c => {
      const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;
      return {
        ...c,
        _id: c._id.toString(),
        isExpired
      };
    });

    return Response.json({ success: true, coupons: formatted });
  } catch (err) {
    console.error('[admin/coupons GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requirePermission(request, 'products', 'create');
  if (error) return error;

  try {
    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      expiresAt,
      isActive,
      targetAudience,
      targetEmail,
      maxUsesPerUser,
      usageLimit
    } = body;

    if (!code || !code.trim()) {
      return Response.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return Response.json({ success: false, message: 'Description is required' }, { status: 400 });
    }
    if (!discountType || !['percentage', 'fixed'].includes(discountType)) {
      return Response.json({ success: false, message: 'Discount type must be percentage or fixed' }, { status: 400 });
    }
    const numDiscount = Number(discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      return Response.json({ success: false, message: 'Discount value must be greater than 0' }, { status: 400 });
    }
    if (discountType === 'percentage' && numDiscount > 100) {
      return Response.json({ success: false, message: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    const audience = ['all', 'first_time', 'specific_customer', 'returning'].includes(targetAudience)
      ? targetAudience
      : 'all';

    if (audience === 'specific_customer' && (!targetEmail || !targetEmail.trim())) {
      return Response.json({ success: false, message: 'A valid customer email is required for customer-specific coupons' }, { status: 400 });
    }

    const Coupon = getEcomCoupon();
    const formattedCode = code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: formattedCode });
    if (existing) {
      return Response.json({ success: false, message: `Coupon code "${formattedCode}" already exists` }, { status: 409 });
    }

    const created = await Coupon.create({
      code: formattedCode,
      description: description.trim(),
      discountType,
      discountValue: numDiscount,
      minOrderValue: Number(minOrderValue) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== false,
      targetAudience: audience,
      targetEmail: audience === 'specific_customer' ? targetEmail.trim().toLowerCase() : '',
      maxUsesPerUser: maxUsesPerUser !== undefined ? Number(maxUsesPerUser) : 1,
      usageLimit: Number(usageLimit) || 0,
      usedCount: 0
    });

    return Response.json({ success: true, coupon: { ...created.toObject(), _id: created._id.toString() } }, { status: 201 });
  } catch (err) {
    console.error('[admin/coupons POST]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
