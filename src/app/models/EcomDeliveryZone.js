import mongoose from 'mongoose';

const EcomDeliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pincodes: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const getEcomDeliveryZone = async () => {
  if (mongoose.models.EcomDeliveryZone) {
    return mongoose.model('EcomDeliveryZone');
  }
  return mongoose.model('EcomDeliveryZone', EcomDeliveryZoneSchema);
};
