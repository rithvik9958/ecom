import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';
import { DEFAULT_AUTH_CONFIG } from '@/lib/authConfigConstants';

export { DEFAULT_AUTH_CONFIG };

const authConfigSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, default: 'global', unique: true },
    bgImage: { type: String, default: DEFAULT_AUTH_CONFIG.bgImage },
    overlayOpacity: { type: Number, default: DEFAULT_AUTH_CONFIG.overlayOpacity },
    overlayColor: { type: String, default: DEFAULT_AUTH_CONFIG.overlayColor },
    logoUrl: { type: String, default: DEFAULT_AUTH_CONFIG.logoUrl },
    loginHeadline: { type: String, default: DEFAULT_AUTH_CONFIG.loginHeadline },
    loginSubtitle: { type: String, default: DEFAULT_AUTH_CONFIG.loginSubtitle },
    registerHeadline: { type: String, default: DEFAULT_AUTH_CONFIG.registerHeadline },
    registerSubtitle: { type: String, default: DEFAULT_AUTH_CONFIG.registerSubtitle },
    forgotHeadline: { type: String, default: DEFAULT_AUTH_CONFIG.forgotHeadline },
    forgotSubtitle: { type: String, default: DEFAULT_AUTH_CONFIG.forgotSubtitle },
    features: { type: [String], default: DEFAULT_AUTH_CONFIG.features },
    featuresHtml: { type: String, default: DEFAULT_AUTH_CONFIG.featuresHtml },
    showFeatures: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export async function getEcomAuthConfig() {
  await connectDB();
  return mongoose.models.EcomAuthConfig || mongoose.model('EcomAuthConfig', authConfigSchema);
}

export default mongoose.models.EcomAuthConfig || mongoose.model('EcomAuthConfig', authConfigSchema);
