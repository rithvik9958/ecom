import mongoose from "mongoose";

const ErrorLogSchema = new mongoose.Schema({
  path: { type: String, required: true },
  referrer: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  ip: { type: String, default: "" },
  statusCode: { type: Number, default: 404 },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

if (mongoose.models['ErrorLog']) {
  delete mongoose.models['ErrorLog'];
}

export default mongoose.model("ErrorLog", ErrorLogSchema);
