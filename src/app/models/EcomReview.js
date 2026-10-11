import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const reviewSchema = new mongoose.Schema(
  {
    productId:     { type: String, required: true, index: true }, // product.id string
    customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'EcomCustomer', required: true },
    customerName:  { type: String, required: true },
    rating:        { type: Number, required: true, min: 1, max: 5 },
    title:         { type: String, default: '' },
    body:          { type: String, default: '' },
    images:        { type: [String], default: [] },
    isVerifiedBuyer: { type: Boolean, default: false },
    isEdited:      { type: Boolean, default: false },
    isApproved:    { type: Boolean, default: true }, // auto-approve; set false to moderate
  },
  { timestamps: true }
);

// One review per customer per product
reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });

export async function getEcomReview() {
  const conn = await connectDB();
  if (conn.models.EcomReview) {
    delete conn.models.EcomReview;
  }
  if (mongoose.models.EcomReview) {
    delete mongoose.models.EcomReview;
  }
  return conn.model('EcomReview', reviewSchema, 'reviews');
}
