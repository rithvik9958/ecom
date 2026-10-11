import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const PushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true
    },
    userEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export async function getPushSubscription() {
  await connectDB();
  return mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema);
}
