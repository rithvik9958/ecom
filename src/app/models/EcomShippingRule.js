import mongoose from 'mongoose';

const EcomShippingRuleSchema = new mongoose.Schema({
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomDeliveryZone', required: true },
  method: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomDeliveryMethod', required: true },
  charge: { type: Number, required: true, default: 0 },
  freeAbove: { type: Number, default: null }, // Null means never free
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const getEcomShippingRule = async () => {
  if (mongoose.models.EcomShippingRule) {
    return mongoose.model('EcomShippingRule');
  }
  return mongoose.model('EcomShippingRule', EcomShippingRuleSchema);
};
