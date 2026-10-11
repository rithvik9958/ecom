import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const ecomBannerSchema = new mongoose.Schema(
  {
    id:         { type: String, required: true, unique: true },
    title:      { type: String, required: true },
    subtitle:   String,
    description: String,
    bgColor:    String,
    bgImage:    String,
    textColor:  String,
    image:      String,
    link:       String,
    buttonText: String,
    isActive:   { type: Boolean, default: true },
    order:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

let _EcomBanner = null;

export async function getEcomBanner() {
  if (_EcomBanner) return _EcomBanner;
  const conn = await connectDB();
  _EcomBanner = conn.models.Banner || conn.model('Banner', ecomBannerSchema);
  return _EcomBanner;
}
