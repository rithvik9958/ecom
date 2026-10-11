import mongoose from "mongoose";

const homeAboutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },
  icon: {
    type: String,
    required: false,
  },
  content: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
    required: false,
  },
  sort: {
    type: Number,
    required: false,
  }
}, {
  timestamps: true,
});

export default mongoose.models.WhyChoose || mongoose.model("WhyChoose", homeAboutSchema);
