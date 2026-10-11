import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';
import { DEFAULT_ECOM_ABOUT } from '@/lib/defaultAbout';

export { DEFAULT_ECOM_ABOUT };

const EcomAboutSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_about' },
  hero: {
    title: { type: String, default: 'Crafting Emotional Connections, One Heartfelt Gift at a Time' },
    subtitle: { type: String, default: 'India’s premier luxury gifting boutique delivering bespoke floral arrangements, handcrafted gourmet cakes, curated hampers, and personalized keepsakes.' },
    bannerImage: { type: String, default: '' }
  },
  story: {
    tag: { type: String, default: 'OUR JOURNEY' },
    heading: { type: String, default: 'From a Boutique Florist to India’s Most Trusted Gifting Destination' },
    paragraphs: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    image: { type: String, default: '' },
    alt: { type: String, default: 'City Shop Brand Story' },
    experienceYears: { type: String, default: '30+' },
    experienceLabel: { type: String, default: 'Years of Crafting Smiles' },
    quote: {
      text: { type: String, default: '' },
      badge: { type: String, default: 'FOUNDER’S PHILOSOPHY' },
      authorName: { type: String, default: 'Executive Leadership Team' },
      authorRole: { type: String, default: 'City Shop E-Retail Private Limited' }
    }
  },
  customContent: {
    isVisible: { type: Boolean, default: true },
    content: { type: String, default: '' }
  },
  pillars: {
    tag: { type: String, default: 'THE CITY SHOP PROMISE' },
    heading: { type: String, default: 'Our 4 Pillars of Excellence' },
    subtitle: { type: String, default: 'Uncompromising dedication to quality, artistry, and punctual fulfillment.' },
    items: [{
      icon: { type: String, default: 'Leaf' },
      image: { type: String, default: '' },
      title: { type: String, default: '' },
      desc: { type: String, default: '' }
    }]
  },
  missionVision: {
    isVisible: { type: Boolean, default: true },
    missionTitle: { type: String, default: 'Our Purpose & Mission' },
    missionText: { type: String, default: '' },
    visionTitle: { type: String, default: 'Our Future Vision' },
    visionText: { type: String, default: '' },
    promiseTitle: { type: String, default: 'Our Absolute Promise' },
    promiseText: { type: String, default: '' }
  },
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' }
  }
}, { timestamps: true });

export async function getEcomAbout() {
  await connectDB();
  return mongoose.models.EcomAbout || mongoose.model('EcomAbout', EcomAboutSchema, 'ecomabouts');
}

export default mongoose.models.EcomAbout || mongoose.model('EcomAbout', EcomAboutSchema, 'ecomabouts');
