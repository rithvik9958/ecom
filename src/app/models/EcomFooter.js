import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';
import { DEFAULT_ECOM_FOOTER } from '@/lib/defaultFooter';

export { DEFAULT_ECOM_FOOTER };


const EcomFooterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global_footer' },
  aboutSection: {
    isVisible: { type: Boolean, default: true },
    badge: { type: String, default: "India's No. 1 Luxury Gifting Destination" },
    title: { type: String, default: "City Shop: India's Premier Online Gift, Flower & Luxury Hamper Boutique" },
    content: { type: String, default: '' },
    stats: {
      type: [{
        num: { type: String, default: '' },
        label: { type: String, default: '' }
      }],
      default: []
    }
  },
  columns: {
    type: [{
      id: { type: String, required: true },
      title: { type: String, required: true },
      order: { type: Number, default: 0 },
      isVisible: { type: Boolean, default: true },
      links: [{
        label: { type: String, required: true },
        url: { type: String, required: true },
        badge: { type: String, default: '' },
        isExternal: { type: Boolean, default: false }
      }]
    }],
    default: []
  },
  newsletter: {
    isVisible: { type: Boolean, default: true },
    title: { type: String, default: 'Subscribe & Save' },
    subtitle: { type: String, default: 'Get instant ₹150 OFF on your first order...' },
    discountCode: { type: String, default: 'WELCOME150' },
    supportPhone: { type: String, default: '+91 11-26802680' }
  },
  corporate: {
    isVisible: { type: Boolean, default: true },
    companyName: { type: String, default: 'City Shop E-Retail Private Limited' },
    cin: { type: String, default: 'U52100HR2021PTC118882' },
    regOffice: { type: String, default: 'Plot No. 75P, Sector-44, Gurugram, Haryana, India - 122003' },
    grievanceOfficer: { type: String, default: 'Mr. S. Karmakar (grievance@cityshop.com)' },
    helpline: { type: String, default: '+91 11-26802680' },
    hours: { type: String, default: '24 Hours / 7 Days a Week' },
    complianceLinks: [{
      label: { type: String, default: '' },
      url: { type: String, default: '' }
    }]
  },
  bottomBar: {
    copyright: { type: String, default: '' },
    socialLinks: [{
      platform: { type: String, default: '' },
      icon: { type: String, default: '' },
      url: { type: String, default: '' },
      isActive: { type: Boolean, default: true }
    }],
    paymentBadges: [{
      name: { type: String, default: '' },
      isActive: { type: Boolean, default: true }
    }]
  }
}, { timestamps: true });

export async function getEcomFooter() {
  await connectDB();
  return mongoose.models.EcomFooter || mongoose.model('EcomFooter', EcomFooterSchema, 'ecomfooters');
}

export default mongoose.models.EcomFooter || mongoose.model('EcomFooter', EcomFooterSchema, 'ecomfooters');

