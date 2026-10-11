import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const notificationSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomCustomer', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['order', 'promotion', 'return', 'account', 'system', 'alert'], 
      default: 'system',
      index: true 
    },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

notificationSchema.index({ customerId: 1, createdAt: -1 });

export async function getEcomNotification() {
  const conn = await connectDB();
  if (conn.models.EcomNotification) {
    delete conn.models.EcomNotification;
  }
  if (mongoose.models.EcomNotification) {
    delete mongoose.models.EcomNotification;
  }
  return conn.model('EcomNotification', notificationSchema, 'notifications');
}
