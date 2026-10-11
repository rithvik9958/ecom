import mongoose from 'mongoose';

const DEFAULT_FILTER_SETTINGS = {
  showCategoryFilter: true,
  showPriceFilter: true,
  showRatingFilter: true,
  showInStockFilter: true,
  showDiscountFilter: true,
  showTagsFilter: true,
  priceRanges: [
    { label: 'Under ₹499', min: 0, max: 499 },
    { label: '₹500 - ₹999', min: 500, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: '₹2,000 & Above', min: 2000, max: 999999 }
  ],
  customFilters: []
};

const PaymentSettingSchema = new mongoose.Schema({
  upiId: {
    type: String,
    required: true,
    default: 'dummyupi@ybl'
  },
  merchantName: {
    type: String,
    required: true,
    default: 'City Shop Demo'
  },
  merchantCode: {
    type: String,
    required: true,
    default: '0000'
  },
  showDeliveryTagline: {
    type: Boolean,
    default: true
  },
  deliveryTaglineText: {
    type: String,
    default: 'Free Standard Delivery above ₹{freeAbove}'
  },
  deliveryTaglineIcon: {
    type: String,
    default: 'Truck'
  },
  deliveryTaglineColor: {
    type: String,
    default: '#16a34a'
  },
  infoSectionHeading: {
    type: String,
    default: 'Product Information & Care'
  },
  infoSectionIcon: {
    type: String,
    default: 'ShieldCheck'
  },
  infoSectionColor: {
    type: String,
    default: '#111111'
  },
  showTrustBadges: {
    type: Boolean,
    default: true
  },
  trustBadges: {
    type: mongoose.Schema.Types.Mixed,
    default: [
      { iconType: 'icon', icon: 'ShieldCheck', image: '', title: '100% Quality', subtitle: 'Guaranteed Fresh', color: '#16a34a', isActive: true },
      { iconType: 'icon', icon: 'Zap', image: '', title: 'Fast Shipping', subtitle: 'Express Slots', color: '#f59e0b', isActive: true },
      { iconType: 'icon', icon: 'RotateCcw', image: '', title: 'Easy Support', subtitle: 'Dedicated Help', color: '#3b82f6', isActive: true }
    ]
  },
  catalogFilterSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: DEFAULT_FILTER_SETTINGS
  },
  recentlyViewedSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      badgeText: 'Pick Up Where You Left Off',
      title: 'Recently Viewed by You',
      subtitle: 'Products you browsed during your recent visits'
    }
  },
  relatedProductsSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      badgeText: 'Handpicked Recommendations',
      title: 'You Might Also Like',
      subtitle: 'Curated choices and similar gifts loved by customers'
    }
  }
}, { timestamps: true, strict: false });

import { connectDB } from '@/app/lib/config';

export async function getPaymentSetting() {
  await connectDB();
  return mongoose.models.PaymentSetting || mongoose.model('PaymentSetting', PaymentSettingSchema);
}

export default mongoose.models.PaymentSetting || mongoose.model('PaymentSetting', PaymentSettingSchema);
