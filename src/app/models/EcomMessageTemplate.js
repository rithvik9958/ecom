import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxLength: 250
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

let _EcomMessageTemplate;

export function getEcomMessageTemplate() {
  if (_EcomMessageTemplate) return _EcomMessageTemplate;

  const conn = mongoose.connection;
  if (!conn) {
    throw new Error('Mongoose connection not established');
  }

  _EcomMessageTemplate = conn.models.MessageTemplate || conn.model('MessageTemplate', messageTemplateSchema);
  return _EcomMessageTemplate;
}
