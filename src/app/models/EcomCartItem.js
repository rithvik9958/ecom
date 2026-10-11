import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

/**
 * Server-side cart items.
 * Guest users are identified by guestId (UUID stored in localStorage).
 * Logged-in users are identified by customerId.
 * On login, guest cart is merged into the user's server cart.
 */
const cartItemSchema = new mongoose.Schema(
  {
    // One of these will be set
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestId:    { type: String, default: null },
    // Product reference
    productId:  { type: String, required: true }, // matches Product.id (string)
    title:      String,
    price:      Number,
    mrp:        Number,
    quantity:   { type: Number, default: 1, min: 1 },
    thumbnail:  String,
    category:   String,
    groupId: { type: String, default: null }, // Maps addons to a main gift product
    isAddon: { type: Boolean, default: false },
    deliveryMode: { type: String, enum: ['slot', 'date_only', 'courier'], default: 'courier' },
    originalDeliveryMode: { type: String, enum: ['slot', 'date_only', 'courier'], default: 'courier' },
    allowExpressUpgrade: { type: Boolean, default: false },
    expressDeliveryMode: { type: String, enum: ['slot', 'date_only'], default: 'slot' },
    courierDays: { type: String, default: '2-3' }, // Identify if it's an addon
    // Delivery Details
    deliveryDate: { type: String, default: null }, // e.g., '2026-08-18'
    deliverySlot: { 
      type: { type: String }, // e.g., 'Standard Delivery'
      label: { type: String }, // e.g., '09:00 AM - 12:00 PM'
      charge: { type: Number, default: 0 },
      id: { type: String } // id of the slot doc
    },
    // Variant Details
    sku: { type: String, default: '' },
    variant: { type: mongoose.Schema.Types.Mixed, default: null },
    selectedVariantAttrs: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

// Index for fast cart lookup
cartItemSchema.index({ customerId: 1 });
cartItemSchema.index({ guestId: 1 });

let _EcomCartItem = null;

export async function getEcomCartItem() {
  // Bypass local cache for hot schema reloads
  // if (_EcomCartItem) return _EcomCartItem;
  const conn = await connectDB();
  if (conn.models.CartItem) {
    delete conn.models.CartItem;
  }
  _EcomCartItem = conn.model('CartItem', cartItemSchema);
  return _EcomCartItem;
}
