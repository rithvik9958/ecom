import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

// ── Schema ────────────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    id:                   { type: String, required: true, unique: true },
    title:                { type: String, required: true },
    description:          String,
    category:             String,
    unit:                 { type: String, default: 'pcs' },
    price:                { type: Number, required: true },
    mrp:                  { type: Number, default: 0 },
    discountedPrice:      { type: Number, default: 0 },
    discountPercentage:   { type: Number, default: 0 },
    rating:               Number,
    reviewsCount:         { type: Number, default: 0 },
    // ── Manual / Display Ratings (can override genuine reviews in the storefront) ──
    manualRating:         { type: Number, min: 0, max: 5 },   // e.g. 4.3
    manualReviewsCount:   { type: Number, default: 0 },        // e.g. 2847
    useManualRating:      { type: Boolean, default: false },   // toggle in admin
    stock:                Number,
    maxQuantityPerOrder:  { type: Number, default: 0 }, // 0 = unlimited
    tags:                 [mongoose.Schema.Types.Mixed],
    attributes:           [{
      key: String,
      value: String
    }],
    tagline:              String,
    brand:                String,
    sku:                  String,
    weight:               Number,
    dimensions:           Object,
    warrantyInformation:  String,
    shippingInformation:  String,
    availabilityStatus:   String,
    images:               [String],
    thumbnail:            String,
    homepageSection: {
      type: String,
      enum: ['none', 'flashSale', 'recommendations'],
      default: 'none',
    },
    homepageTabs: { type: [String], default: [] },
    isActive:     { type: Boolean, default: true },
    order:        { type: Number, default: 0 },
    slug:         { type: String },
    addOns:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'EcomAddon' }],
    productDetails: [{
      icon: String,
      title: String,
      content: String
    }],
    requiresPincode: { type: Boolean, default: true },
    deliveryMode: {
      type: String,
      enum: ['slot', 'date_only', 'courier'],
      default: 'courier'
    },
    courierDays: {
      type: String,
      default: '2-3'
    },
    allowExpressUpgrade: {
      type: Boolean,
      default: false
    },
    expressDeliveryMode: {
      type: String,
      enum: ['slot', 'date_only'],
      default: 'slot'
    },

    // ── Dynamic Attribute System ───────────────────────────────────────────────
    // Slug of the AttributeTemplate that governs this product's dynamic fields
    attributeTemplateSlug: { type: String, default: null },

    // Dynamic product-level attributes (non-variant, e.g. material, ingredients)
    attrs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Variants — each unique combination of variantDimensions = one entry
    // e.g. { size: 'M', color: 'Red', price: 499, stock: 10 }
    variants: [{
      sku:      { type: String, default: '' },
      attrs:    { type: mongoose.Schema.Types.Mixed, default: {} },
      price:    { type: Number, default: 0 },
      mrp:      { type: Number, default: 0 },
      stock:    { type: Number, default: 0 },
      images:   [String],
      isActive: { type: Boolean, default: true },
    }],
  },
  { timestamps: true }
);

// Auto-generate slug from id if not set
productSchema.pre('save', function () {
  if (!this.slug && this.id) {
    this.slug = this.id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

// Model factory — bound to the ecom connection
let _EcomProduct = null;

export async function getEcomProduct() {
  if (_EcomProduct) return _EcomProduct;
  const conn = await connectDB();
  
  // Force recompile during hot reloads in dev
  if (process.env.NODE_ENV !== 'production' && conn.models.EcomProduct) {
    delete conn.models.EcomProduct;
  }
  
  _EcomProduct = conn.models.EcomProduct || conn.model('EcomProduct', productSchema);
  return _EcomProduct;
}

export default mongoose.models.EcomProduct || mongoose.model('EcomProduct', productSchema);

