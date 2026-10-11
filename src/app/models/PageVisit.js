import mongoose from "mongoose";

const pageVisitSchema = new mongoose.Schema({
  path: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  browser: { type: String },
  os: { type: String },
  device: { type: String, enum: ['desktop', 'mobile', 'tablet'], default: 'desktop' },
  country: { type: String, default: 'Unknown' },
  sessionId: { type: String }, // To track unique visitors vs page views
  duration: { type: Number, default: 0 }, // Time spent on page in seconds (if tracked via ping)
}, { timestamps: true });

export default mongoose.models.PageVisit || mongoose.model("PageVisit", pageVisitSchema);
