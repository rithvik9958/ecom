import mongoose from 'mongoose';

const InvoiceSettingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'CityShop'
  },
  companyAddress: {
    type: String,
    default: '123 Tech Park, Sector 45, Gurugram, India 122003'
  },
  supportEmail: {
    type: String,
    default: 'support@cityshop.com'
  },
  supportPhone: {
    type: String,
    default: '+91 98765 43210'
  },
  websiteUrl: {
    type: String,
    default: 'www.cityshop.com'
  },
  taxId: {
    type: String,
    default: '' // e.g. GSTIN
  },
  terms: {
    type: String,
    default: '1. Returns accepted within 7 days.\n2. Warranty valid only with original invoice.'
  }
}, { timestamps: true });

if (mongoose.models['InvoiceSetting']) {
  delete mongoose.models['InvoiceSetting'];
}

export default mongoose.models.InvoiceSetting || mongoose.model('InvoiceSetting', InvoiceSettingSchema);
