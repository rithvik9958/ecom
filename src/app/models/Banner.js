import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },
  subtitle: {
    type: String,
    required: false,
  },
  url: {
    type: String,
    required: false,
  },
  buttonText: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  alt: {
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
  showCertifications: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

if (mongoose.models.Banner) {
  delete mongoose.models.Banner;
}

export default mongoose.model("Banner", bannerSchema);