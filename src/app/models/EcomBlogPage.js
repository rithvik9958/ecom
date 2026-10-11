import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const DEFAULT_BLOG_CATEGORIES = [
  { id: 'floral-guides', label: 'Floral Guides', order: 1 },
  { id: 'gourmet-bakery', label: 'Gourmet Bakery', order: 2 },
  { id: 'gifting-logistics', label: 'Gifting Logistics', order: 3 },
  { id: 'milestones', label: 'Anniversary & Milestones', order: 4 },
  { id: 'festive-trends', label: 'Festive Trends', order: 5 }
];

const EcomBlogPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global_blog' },
    hero: {
      title: { type: String, default: 'Celebration Ideas, Floral Guides & Gifting Trends' },
      subtitle: {
        type: String,
        default: 'Expert advice on selecting the perfect blooms, gourmet confection trends, and celebration inspiration from master florists and pastry chefs.'
      },
      bannerImage: { type: String, default: '' }
    },
    categories: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          order: { type: Number, default: 0 }
        }
      ],
      default: DEFAULT_BLOG_CATEGORIES
    },
    seo: {
      metaTitle: { type: String, default: 'The Gifting Journal & Celebration Blog | City Shop' },
      metaDescription: {
        type: String,
        default: 'Discover expert flower care advice, cake trends, and thoughtful gifting tips from City Shop.'
      },
      metaKeywords: { type: String, default: 'gifting blog, flower care tips, cake trends, celebration guides' }
    }
  },
  { timestamps: true }
);

export async function getEcomBlogPage() {
  await connectDB();
  return mongoose.models.EcomBlogPage || mongoose.model('EcomBlogPage', EcomBlogPageSchema, 'ecomblogpages');
}

export default mongoose.models.EcomBlogPage || mongoose.model('EcomBlogPage', EcomBlogPageSchema, 'ecomblogpages');
