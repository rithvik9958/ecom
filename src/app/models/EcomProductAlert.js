import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const productAlertSchema = new mongoose.Schema(
  {
    productId:        { type: String, required: true }, // product id or _id string
    productTitle:     { type: String, default: '' },
    productThumbnail: { type: String, default: '' },
    customerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'EcomCustomer', default: null },
    email:            { type: String, required: true, lowercase: true, trim: true },
    phone:            { type: String, default: '' },
    type:             { type: String, enum: ['back_in_stock', 'price_drop'], required: true },
    targetPrice:      { type: Number, default: 0 },
    currentPrice:     { type: Number, default: 0 },
    status:           { type: String, enum: ['pending', 'notified', 'cancelled'], default: 'pending' },
    notifiedAt:       { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for query efficiency & deduplication lookups
productAlertSchema.index({ productId: 1, email: 1, type: 1, status: 1 });

let _EcomProductAlert = null;

export async function getEcomProductAlert() {
  if (_EcomProductAlert) return _EcomProductAlert;
  const conn = await connectDB();
  _EcomProductAlert =
    conn.models.EcomProductAlert ||
    conn.model('EcomProductAlert', productAlertSchema, 'product_alerts');
  return _EcomProductAlert;
}
