import mongoose from "mongoose";

const homeAboutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false,
  },
  description: {
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
  }
}, {
  timestamps: true,
});

export default mongoose.models.HomeAbout || mongoose.model("HomeAbout", homeAboutSchema);
