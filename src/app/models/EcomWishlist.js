import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const wishlistSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomCustomer', required: true, unique: true },
    productIds: [{ type: String }], // product.id strings (not _id)
  },
  { timestamps: true }
);

let _EcomWishlist = null;

export async function getEcomWishlist() {
  if (_EcomWishlist) return _EcomWishlist;
  const conn = await connectDB();
  _EcomWishlist =
    conn.models.EcomWishlist ||
    conn.model('EcomWishlist', wishlistSchema, 'wishlists');
  return _EcomWishlist;
}
