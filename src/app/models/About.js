import mongoose from "mongoose";

const AboutSchema = new mongoose.Schema({
    // Basic fields
    b_heading:   { type: String, default: '' },
    title:       { type: String, required: true },
    slug:        { type: String, required: true },
    content:     { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    image:       { type: String, default: '' },
    alt:         { type: String, default: '' },
    sort:        { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },

    // SEO fields
    metatag:         { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metakeywords:    { type: [String], default: [] },
    canonicalUrl:    { type: String, default: '' },
    ogTitle:         { type: String, default: '' },
    ogDescription:   { type: String, default: '' },
    twitterCard:     { type: String, default: 'summary_large_image' },
    robots:          { type: String, default: 'index, follow' },
    schemaMarkup:    { type: mongoose.Schema.Types.Mixed, default: {} },
    section:         { 
        type: String, 
        required: true
    },
}, {
    timestamps: true,
});

AboutSchema.index({ section: 1, slug: 1 }, { unique: true });

export default mongoose.models.AboutPage || mongoose.model("AboutPage", AboutSchema, "abouts");
