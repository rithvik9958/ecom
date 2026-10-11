import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const DEFAULT_FAQ_CATEGORIES = [
  { id: 'ordering', label: 'Orders & Tracking', icon: 'Package', order: 1 },
  { id: 'delivery', label: 'Delivery & Slots', icon: 'Truck', order: 2 },
  { id: 'refunds', label: 'Returns & Refunds', icon: 'RotateCcw', order: 3 },
  { id: 'payments', label: 'Payments & Offers', icon: 'CreditCard', order: 4 },
  { id: 'corporate', label: 'Corporate & Bulk', icon: 'Building2', order: 5 }
];

const EcomFaqPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global_faqs' },
    hero: {
      title: { type: String, default: 'How Can We Assist You Today?' },
      subtitle: {
        type: String,
        default: 'Search questions below or choose a topic to find fast answers regarding orders, delivery, slots, and refunds.'
      },
      bannerImage: { type: String, default: '' }
    },
    supportDesk: {
      isVisible: { type: Boolean, default: true },
      title: { type: String, default: 'Still Need Assistance?' },
      subtitle: { type: String, default: 'Our customer care specialists are available 24/7 to resolve your inquiries right away.' },
      phone: { type: String, default: '+91 11-26802680' },
      email: { type: String, default: 'support@cityshop.com' },
      hours: { type: String, default: 'Mon–Sun, 24 Hours Available' }
    },
    categories: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          icon: { type: String, default: 'HelpCircle' },
          order: { type: Number, default: 0 }
        }
      ],
      default: DEFAULT_FAQ_CATEGORIES
    },
    seo: {
      metaTitle: { type: String, default: 'Help Center & Frequently Asked Questions | City Shop' },
      metaDescription: {
        type: String,
        default: 'Find instant answers about delivery slots, tracking orders, refunds, and corporate gifting.'
      },
      metaKeywords: { type: String, default: 'faqs, helpdesk, customer support, delivery questions, refunds' }
    }
  },
  { timestamps: true }
);

export async function getEcomFaqPage() {
  await connectDB();
  return mongoose.models.EcomFaqPage || mongoose.model('EcomFaqPage', EcomFaqPageSchema, 'ecomfaqpages');
}

export default mongoose.models.EcomFaqPage || mongoose.model('EcomFaqPage', EcomFaqPageSchema, 'ecomfaqpages');
