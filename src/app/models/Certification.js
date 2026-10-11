import mongoose from "mongoose";

const certificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },
  logo: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  sort: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Certification || mongoose.model("Certification", certificationSchema);