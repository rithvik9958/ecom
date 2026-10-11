import mongoose from "mongoose";

const CompanyCertificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sub_title: { type: String, default: "" },
  third_title: { type: String, default: "" },
  file_url: { type: String, required: true }, // URL to image or PDF
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  sort: { type: Number, default: 0 },
}, { timestamps: true });

// Delete cached model so hot-reload always picks up schema changes (dev safety)
delete mongoose.models.CompanyCertification;
export default mongoose.model("CompanyCertification", CompanyCertificationSchema);
