import mongoose from "mongoose";

const RedirectSchema = new mongoose.Schema({
  from: { type: String, required: true, unique: true },
  to: { type: String, required: true },
  type: { type: Number, enum: [301, 302], default: 301 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

if (mongoose.models['Redirect']) {
  delete mongoose.models['Redirect'];
}

export default mongoose.model("Redirect", RedirectSchema);
