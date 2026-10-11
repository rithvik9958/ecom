import mongoose from "mongoose";

// subtitle
// title
// content
// buttonText1
// url1
// buttonText2
// url2

const otherctaSchema = new mongoose.Schema({
  subtitle: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: false,
  },
  content: {
    type: String,
    required: false,
  },
  buttonText1: {
    type: String,
    required: false,
  },
  url1: {
    type: String,
    required: false,
  },
  buttonText2: {
    type: String,
    required: false,
  },
  url2: {
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

export default mongoose.models.Othercta || mongoose.model("Othercta", otherctaSchema);
