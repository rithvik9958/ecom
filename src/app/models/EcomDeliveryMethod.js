import mongoose from 'mongoose';

const EcomDeliveryMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['STANDARD', 'MIDNIGHT', 'FIXED_TIME', 'SAME_DAY'],
    required: true 
  },
  baseCharge: { type: Number, default: 0 },
  cutoffTime: { type: String }, // e.g., '17:00' for Same Day
  startTime: { type: String }, // e.g., '23:30' for Midnight
  endTime: { type: String }, // e.g., '23:59' for Midnight
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const getEcomDeliveryMethod = async () => {
  if (mongoose.models.EcomDeliveryMethod) {
    return mongoose.model('EcomDeliveryMethod');
  }
  return mongoose.model('EcomDeliveryMethod', EcomDeliveryMethodSchema);
};
