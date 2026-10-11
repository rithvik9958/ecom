import mongoose from 'mongoose';

const DeliverySlotSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true, // e.g., 'Standard Delivery', 'Midnight Delivery'
  },
  baseCharge: {
    type: Number,
    default: 0,
  },
  description: {
    type: String, // e.g., 'Want it free? Pick a slot with the FREE tag.'
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  slots: [
    {
      label: { type: String, required: true }, // e.g., '09:00 AM - 12:00 PM'
      startTime: { type: String, required: true }, // '09:00' (24-hour HH:mm)
      endTime: { type: String, required: true }, // '12:00' (24-hour HH:mm)
      cutoffTime: { type: String, required: true }, // '07:00' (24-hour HH:mm) - slot unavailable for today if current time > cutoffTime
      maxCapacity: { type: Number, default: 0 }, // 0 means unlimited
      isActive: { type: Boolean, default: true },
    }
  ]
}, { timestamps: true });

export default mongoose.models.DeliverySlot || mongoose.model('DeliverySlot', DeliverySlotSchema);
