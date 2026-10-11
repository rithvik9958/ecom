import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., 'Welcome Email', 'New Lead Notification'
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  variables: [{ type: String }], // Array of variable names, e.g., ['contactPerson', 'companyName']
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", emailTemplateSchema);
