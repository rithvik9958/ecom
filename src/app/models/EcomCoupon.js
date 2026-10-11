import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  }
}, { timestamps: true });

let _EcomCoupon;

export function getEcomCoupon() {
  if (_EcomCoupon) return _EcomCoupon;

  const conn = mongoose.connection;
  if (!conn) {
    throw new Error('Mongoose connection not established');
  }

  _EcomCoupon = conn.models.Coupon || conn.model('Coupon', couponSchema);
  return _EcomCoupon;
}
