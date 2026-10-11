import mongoose from "mongoose";

    // choose_title
    // choose_subtitle
    // product_title
    // product_subtitle
    // certified_title
    // work_title
    // work_subtitle
    // blog_title
    // blog_subtitle
    // contact_title
    // contact_subtitle

const HomeExtraSchema = new mongoose.Schema({
  choose_title: {
    type: String,
    required: false,
  },
  choose_subtitle: {
    type: String,
    required: false,
  },
    product_title: {
    type: String,
    required: false,
  },
    product_subtitle: {
    type: String,
    required: false,
  },
    certified_title: {
    type: String,
    required: false,
    },
    certified_subtitle: {
    type: String,
    required: false,
    },
    work_title: {
    type: String,
    required: false,
    },
    work_subtitle: {
    type: String,
    required: false,
    },
    blog_title: {
    type: String,
    required: false,
    },
    blog_subtitle: {
    type: String,
    required: false,
    },
    contact_title: {
    type: String,
    required: false,
    },
    contact_subtitle: {
    type: String,
    required: false,
    },
});

export default mongoose.models.HomeExtra || mongoose.model("HomeExtra", HomeExtraSchema);