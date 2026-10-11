import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    slug:        { type: String, required: true, unique: true },
    bannerImage: { type: String, default: '' },
    sort:        { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
    
    // SEO Fields
    metatag:         { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metakeywords:    { type: [String], default: [] },
    canonicalUrl:    { type: String, default: '' },
    ogTitle:         { type: String, default: '' },
    ogDescription:   { type: String, default: '' },
    ogImage:         { type: String, default: '' },
    twitterCard:     { type: String, default: 'summary_large_image' },
    robots:          { type: String, default: 'index, follow' },
    schemaMarkup:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
});

export default mongoose.models.Section || mongoose.model("Section", SectionSchema, "sections");
