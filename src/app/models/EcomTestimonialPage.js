import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const EcomTestimonialPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global_testimonials' },
    hero: {
      title: { type: String, default: 'Over 8 Million+ Celebrations Delivered' },
      subtitle: {
        type: String,
        default:
          'Read authentic, heartfelt experiences from delighted customers across 19,000+ PIN codes who trust City Shop for their most cherished moments.'
      },
      bannerImage: { type: String, default: '' }
    },
    metrics: {
      overallScore: { type: String, default: '4.9' },
      scoreSubtext: { type: String, default: 'Based on 12,450+ Verified Orders' },
      metric1Value: { type: String, default: '99.4%' },
      metric1Label: { type: String, default: 'On-Time Delivery Rate' },
      metric2Value: { type: String, default: '100%' },
      metric2Label: { type: String, default: 'Freshness & Quality Guarantee' },
      allowSubmissions: { type: Boolean, default: true }
    },
    seo: {
      metaTitle: { type: String, default: 'Customer Reviews & Real Gifting Stories | City Shop' },
      metaDescription: {
        type: String,
        default: 'Read 100% verified reviews and experiences from thousands of happy customers across India.'
      },
      metaKeywords: { type: String, default: 'customer reviews, flower delivery reviews, cake delivery reviews' }
    }
  },
  { timestamps: true }
);

export async function getEcomTestimonialPage() {
  await connectDB();
  return (
    mongoose.models.EcomTestimonialPage ||
    mongoose.model('EcomTestimonialPage', EcomTestimonialPageSchema, 'ecomtestimonialpages')
  );
}

export default mongoose.models.EcomTestimonialPage ||
  mongoose.model('EcomTestimonialPage', EcomTestimonialPageSchema, 'ecomtestimonialpages');
