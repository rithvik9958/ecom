import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const AdminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['new_order', 'order_cancelled', 'return_requested', 'new_review', 'stock_alert', 'enquiry', 'system'],
      default: 'system',
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    link: {
      type: String,
      default: '/dashboard/ecommerce/orders'
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export async function getAdminNotification() {
  await connectDB();
  return mongoose.models.AdminNotification || mongoose.model('AdminNotification', AdminNotificationSchema);
}
