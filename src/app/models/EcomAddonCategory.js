import mongoose from 'mongoose';

const EcomAddonCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const getEcomAddonCategory = async () => {
  if (mongoose.models.EcomAddonCategory) {
    return mongoose.model('EcomAddonCategory');
  }
  return mongoose.model('EcomAddonCategory', EcomAddonCategorySchema);
};
