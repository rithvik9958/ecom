import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const EcomFaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export async function getEcomFaq() {
  await connectDB();
  return mongoose.models.EcomFaq || mongoose.model('EcomFaq', EcomFaqSchema, 'ecomfaqs');
}

export default mongoose.models.EcomFaq || mongoose.model('EcomFaq', EcomFaqSchema, 'ecomfaqs');
