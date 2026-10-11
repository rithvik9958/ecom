import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    category: { type: String, default: 'All' },
    item: { type: String, default: '' },
    text: { type: String, required: true },
    likes: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true },
    avatar: { type: String, default: '' }
  },
  { timestamps: true }
);

export async function getTestimonialModel() {
  await connectDB();
  return mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema, 'testimonials');
}

export default mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema, 'testimonials');
