import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  // Basic Info
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  address: { type: String, default: "" },

  // Technical Info (Optional)
  standard: { type: String, default: "" },
  grade: { type: String, default: "" },
  thicknessMin: { type: String, default: "" },
  thicknessMax: { type: String, default: "" },
  widthMin: { type: String, default: "" },
  widthMax: { type: String, default: "" },
  qty: { type: String, default: "" },
  surfaceFinish: { type: String, default: "" },
  hardness: { type: String, default: "" },
  selectOne: { type: String, default: "" },
  uts: { type: String, default: "" },
  ys: { type: String, default: "" },
  elongation: { type: String, default: "" },
  endUse: { type: String, default: "" },
  specialRequirements: { type: String, default: "" },

  // Management fields
  status: { type: String, enum: ['new', 'replied', 'closed'], default: 'new' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure hot-reloading works in dev
export default mongoose.models.Enquiry || mongoose.model("Enquiry", enquirySchema);
