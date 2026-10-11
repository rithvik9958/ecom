import mongoose from "mongoose";

const PageBannerSchema = new mongoose.Schema({
    pageKey: { 
        type: String, 
        required: true, 
        unique: true, 
        enum: ['blog', 'contact', 'certifications', 'gallery'] 
    },
    title: { type: String, default: "" },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Dev hot-reload safety
export default mongoose.models.PageBanner || mongoose.model("PageBanner", PageBannerSchema);
