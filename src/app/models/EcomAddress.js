import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const addressSchema = new mongoose.Schema(
  {
    // Identifiers
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestId:    { type: String, default: null },
    
    // Form fields
    name:       { type: String, required: true },
    phone:      { type: String, required: true },
    email:      { type: String, default: '' },
    flat:       { type: String, required: true },
    locality:   { type: String, required: true },
    pincode:    { type: String, required: true },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    
    // Meta
    type:       { type: String, enum: ['home', 'office', 'other'], default: 'home' },
    isDefault:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for fast lookup
addressSchema.index({ customerId: 1 });
addressSchema.index({ guestId: 1 });

let _EcomAddress = null;

export async function getEcomAddress() {
  const conn = await connectDB();
  if (conn.models.Address) {
    delete conn.models.Address;
  }
  _EcomAddress = conn.model('Address', addressSchema);
  return _EcomAddress;
}
