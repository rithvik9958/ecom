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
  },
  targetAudience: {
    type: String,
    enum: ['all', 'first_time', 'specific_customer', 'returning'],
    default: 'all'
  },
  targetEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  maxUsesPerUser: {
    type: Number,
    default: 1
  },
  usageLimit: {
    type: Number,
    default: 0
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isSecret: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

import { connectDB } from '@/app/lib/config';

let _EcomCoupon;

export function getEcomCoupon() {
  connectDB();
  const conn = mongoose.connection;
  if (!conn) {
    throw new Error('Mongoose connection not established');
  }

  if (conn.models.Coupon) {
    delete conn.models.Coupon;
  }
  if (mongoose.models.Coupon) {
    delete mongoose.models.Coupon;
  }

  _EcomCoupon = conn.model('Coupon', couponSchema);
  return _EcomCoupon;
}
