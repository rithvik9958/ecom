import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

/**
 * Flexible section schema — one entry per homepage block.
 * `config` is Mixed (any shape) so each section type stores its own fields.
 */
const sectionSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true },
    type:      { type: String, required: true },
    order:     { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    config:    { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const homepageContentSchema = new mongoose.Schema(
  {
    key:      { type: String, required: true, unique: true, default: 'homepage' },
    sections: { type: [sectionSchema], default: [] },
  },
  { timestamps: true }
);

let _EcomHomepage = null;

export async function getEcomHomepage() {
  if (_EcomHomepage) return _EcomHomepage;
  const conn = await connectDB();
  // Force recompile on hot reload
  if (process.env.NODE_ENV !== 'production' && conn.models.HomepageContent) {
    delete conn.models.HomepageContent;
  }
  _EcomHomepage = conn.models.HomepageContent || conn.model('HomepageContent', homepageContentSchema);
  return _EcomHomepage;
}
