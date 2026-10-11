import mongoose from "mongoose";

const ctaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },
  content: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  }
}, {
  timestamps: true,
});

export default mongoose.models.Cta || mongoose.model("Cta", ctaSchema);