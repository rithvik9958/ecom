export const dynamic = 'force-dynamic';
import { getEcomCoupon } from '@/app/models/EcomCoupon';
import { requirePermission } from '@/app/lib/auth';
import mongoose from 'mongoose';

export async function GET(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'products');
  if (error) return error;

  try {
    const Coupon = getEcomCoupon();
    const coupon = await Coupon.findById(params.id).lean();
    if (!coupon) {
      return Response.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }
    const now = new Date();
    return Response.json({
      success: true,
      coupon: {
        ...coupon,
        _id: coupon._id.toString(),
        isExpired: coupon.expiresAt ? new Date(coupon.expiresAt) < now : false
      }
    });
  } catch (err) {
    console.error('[admin/coupons/[id] GET]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'products', 'update');
  if (error) return error;

  try {
    const Coupon = getEcomCoupon();
    const coupon = await Coupon.findById(params.id);
    if (!coupon) {
      return Response.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }

    const body = await request.json();

    // Check for quick status toggle
    if (Object.keys(body).length === 1 && typeof body.isActive === 'boolean') {
      coupon.isActive = body.isActive;
      await coupon.save();
      return Response.json({ success: true, coupon: { ...coupon.toObject(), _id: coupon._id.toString() } });
    }

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
      usageLimit,
      isSecret
    } = body;

    if (code) {
      const formattedCode = code.trim().toUpperCase();
      if (formattedCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: formattedCode, _id: { $ne: coupon._id } });
        if (existing) {
          return Response.json({ success: false, message: `Coupon code "${formattedCode}" is already in use` }, { status: 409 });
        }
        coupon.code = formattedCode;
      }
    }

    if (description !== undefined) coupon.description = description.trim();
    if (discountType && ['percentage', 'fixed'].includes(discountType)) {
      coupon.discountType = discountType;
    }
    if (discountValue !== undefined) {
      const numDiscount = Number(discountValue);
      if (isNaN(numDiscount) || numDiscount <= 0) {
        return Response.json({ success: false, message: 'Discount value must be greater than 0' }, { status: 400 });
      }
      if (coupon.discountType === 'percentage' && numDiscount > 100) {
        return Response.json({ success: false, message: 'Percentage discount cannot exceed 100%' }, { status: 400 });
      }
      coupon.discountValue = numDiscount;
    }
    if (minOrderValue !== undefined) {
      coupon.minOrderValue = Number(minOrderValue) || 0;
    }
    if (expiresAt !== undefined) {
      coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (typeof isActive === 'boolean') {
      coupon.isActive = isActive;
    }
    if (targetAudience && ['all', 'first_time', 'specific_customer', 'returning'].includes(targetAudience)) {
      coupon.targetAudience = targetAudience;
    }
    if (coupon.targetAudience === 'specific_customer') {
      const emailToUse = targetEmail !== undefined ? targetEmail.trim().toLowerCase() : coupon.targetEmail;
      if (!emailToUse) {
        return Response.json({ success: false, message: 'A valid customer email is required for customer-specific coupons' }, { status: 400 });
      }
      coupon.targetEmail = emailToUse;
    } else if (targetAudience && targetAudience !== 'specific_customer') {
      coupon.targetEmail = '';
    }
    if (maxUsesPerUser !== undefined) {
      coupon.maxUsesPerUser = Math.max(1, Number(maxUsesPerUser) || 1);
    }
    if (usageLimit !== undefined) {
      coupon.usageLimit = Math.max(0, Number(usageLimit) || 0);
    }
    if (typeof isSecret === 'boolean') {
      coupon.isSecret = isSecret;
    }

    await coupon.save();

    const now = new Date();
    return Response.json({
      success: true,
      coupon: {
        ...coupon.toObject(),
        _id: coupon._id.toString(),
        isExpired: coupon.expiresAt ? new Date(coupon.expiresAt) < now : false
      }
    });
  } catch (err) {
    console.error('[admin/coupons/[id] PUT]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, props) {
  const params = await props.params;
  const { error } = await requirePermission(request, 'products', 'delete');
  if (error) return error;

  try {
    const Coupon = getEcomCoupon();
    const deleted = await Coupon.findByIdAndDelete(params.id);
    if (!deleted) {
      return Response.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }
    return Response.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('[admin/coupons/[id] DELETE]', err);
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
