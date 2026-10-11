import mongoose from 'mongoose';

const EcomAddonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomAddonCategory' }
}, { timestamps: true });

export const getEcomAddon = async () => {
  if (mongoose.models.EcomAddon) {
    delete mongoose.models.EcomAddon;
  }
  return mongoose.model('EcomAddon', EcomAddonSchema);
};
