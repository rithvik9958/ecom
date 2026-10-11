import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

/**
 * Address sub-schema used by the storefront cart/checkout.
 * Field names match the EcomAddress model and cart page expectations:
 *   name, phone, email, flat, locality, pincode, city, state, type, isDefault
 *
 * Legacy fields (fullName, address, postalCode) are kept as optional aliases
 * so old stored data is not broken.
 */
const addressSchema = new mongoose.Schema(
  {
    // ── New canonical fields (used by cart & storefront) ─────────────────────
    name:      { type: String },
    phone:     { type: String },
    email:     { type: String },
    flat:      { type: String },           // Flat / house / building
    locality:  { type: String },           // Street / area / colony
    pincode:   { type: String },
    city:      { type: String },
    state:     { type: String },
    type:      { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    isDefault: { type: Boolean, default: false },

    // ── Legacy aliases (kept for backwards compatibility) ────────────────────
    fullName:   { type: String },
    address:    { type: String },
    country:    { type: String },
    postalCode: { type: String },
  },
  { _id: true }
);

/**
 * EcomCustomer — storefront users.
 *
 * Stored in the ecom-store database, NOT the jindal_admin DB.
 * Admin/super_admin roles live separately in the User model.
 */
const customerSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:    { type: String, trim: true },
    dob:      { type: String },
    gender:   { type: String, enum: ['male', 'female', 'other'] },
    password: { type: String }, // Optional for Google OAuth accounts
    profileImage: { type: String },
    googleId: { type: String },
    role:     { type: String, enum: ['customer'], default: 'customer' },
    isActive: { type: Boolean, default: true },

    // ── Password Reset (JWT-based, no DB storage needed for token — kept for
    //    backwards compat if the old code-based flow was used) ─────────────────
    resetPasswordCode:    { type: String },  // legacy OTP / code field
    resetPasswordExpires: { type: Date },    // legacy expiry field

    // ── Saved Addresses ───────────────────────────────────────────────────────
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true }
);

// Singleton pattern — prevent connection-reuse issues in Next.js dev mode
let _EcomCustomer = null;

export async function getEcomCustomer() {
  if (_EcomCustomer) return _EcomCustomer;
  const conn = await connectDB();
  // Uses the 'users' collection (matches cart-project convention)
  _EcomCustomer =
    conn.models.EcomCustomer ||
    conn.model('EcomCustomer', customerSchema, 'users');
  return _EcomCustomer;
}
