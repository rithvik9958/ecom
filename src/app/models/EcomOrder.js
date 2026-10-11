import mongoose from 'mongoose';
import { connectDB } from '@/app/lib/config';

const orderItemSchema = new mongoose.Schema(
  {
    id:                   String,
    productId:            String,
    title:                String,
    price:                Number,
    mrp:                  Number,
    quantity:             Number,
    thumbnail:            String,
    sku:                  { type: String, default: '' },
    variant:              { type: mongoose.Schema.Types.Mixed, default: null },
    selectedVariantAttrs: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    customerName:   { type: String, required: true },
    email:          { type: String, required: true },
    phone:          String,
    address:        { type: String, required: true },
    city:           String,
    state:          String,
    country:        String,
    postalCode:     String,
    items:          [orderItemSchema],
    total:          { type: Number, required: true },
    status:         { type: String, default: 'pending' },
    paymentStatus:  { type: String, default: 'pending' },
    paymentMethod:  { type: String, default: 'cod' },
    deliveryDate:   String,
    deliverySlot:   String,
    stripeSessionId: String,
    trackingNumber: String,
    courier:        String,
    trackingUrl:    String,
    deliveryNotes:  String,
    timeline: [
      {
        status:      String,
        title:       String,
        description: String,
        time:        { type: Date, default: Date.now },
        location:    String,
      }
    ],
    returnRequest: {
      status:       { type: String, default: null },
      reason:       { type: String, default: '' },
      comment:      { type: String, default: '' },
      returnType:   { type: String, default: 'refund' },
      refundMethod: { type: String, default: 'original_source' },
      items:        { type: Array, default: [] },
      requestedAt:  { type: Date, default: Date.now },
    },
    cancellationReason: { type: String, default: '' },
    cancelledAt:        { type: Date, default: null },
    senderDetails:  {
      name:  String,
      phone: String,
      email: String,
      city:  String,
      sameAsRecipientCity: Boolean,
    },
  },
  { timestamps: true, strict: false }
);

export async function getEcomOrder() {
  const conn = await connectDB();
  if (conn.models.EcomOrder) {
    delete conn.models.EcomOrder;
  }
  if (mongoose.models.EcomOrder) {
    delete mongoose.models.EcomOrder;
  }
  return conn.model('EcomOrder', orderSchema);
}
