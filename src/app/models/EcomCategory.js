import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const categorySchema = new mongoose.Schema(
  {
    id:       { type: String },
    title:    { type: String, required: true },
    slug:     { type: String, required: true, unique: true },
    description: String,
    image:    String,
    isActive: { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
    megaMenu: {
      columns: [{
        title: String,
        links: [{
          label: String,
          url: String,
          badge: String
        }]
      }],
      promo: {
        image: String,
        url: String,
        buttonText: String
      }
    },
    plpCarouselSettings: {
      type: { type: String, enum: ['categories', 'custom'], default: 'custom' },
      excludeCategories: [{ type: String }],
      customSlides: [{
        title: String,
        image: String,
        link: String
      }]
    },
    plpCarousel: [{ // keeping for backwards compatibility / fallback
      title: String,
      image: String,
      link: String
    }],
    filterType: { type: String, enum: ['automatic', 'manual'], default: 'automatic' },
    filters: [{
      title: String,
      options: [{
        label: String,
        value: String
      }]
    }],
    filterConfig: {
      mode: { type: String, enum: ['inherit', 'custom'], default: 'inherit' },
      showPriceFilter: { type: Boolean, default: true },
      showRatingFilter: { type: Boolean, default: true },
      showInStockFilter: { type: Boolean, default: true },
      showDiscountFilter: { type: Boolean, default: true },
      enabledGlobalFilters: [{ type: String }]
    }
  },
  { timestamps: true }
);

let _EcomCategory = null;

export async function getEcomCategory() {
  if (_EcomCategory) return _EcomCategory;
  const conn = await connectDB();
  
  if (process.env.NODE_ENV !== 'production' && conn.models.EcomCategory) {
    delete conn.models.EcomCategory;
  }
  
  _EcomCategory = conn.models.EcomCategory || conn.model('EcomCategory', categorySchema);
  return _EcomCategory;
}

export default mongoose.models.EcomCategory || mongoose.model('EcomCategory', categorySchema);

