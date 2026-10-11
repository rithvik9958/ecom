import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const NewsletterSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active'
  },
  discountCode: {
    type: String,
    default: 'WELCOME150'
  },
  source: {
    type: String,
    default: 'storefront_footer'
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export async function getNewsletterSubscriberModel() {
  await connectDB();
  return mongoose.models.NewsletterSubscriber || mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema, 'newslettersubscribers');
}

export default mongoose.models.NewsletterSubscriber || mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema, 'newslettersubscribers');
