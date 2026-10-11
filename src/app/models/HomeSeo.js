import mongoose from "mongoose";

const HomeSeoSchema = new mongoose.Schema({
    pageSlug:        { type: String, default: 'home' },
    title:           { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords:    { type: [String], default: [] },
    canonicalUrl:    { type: String, default: '' },
    ogTitle:         { type: String, default: '' },
    ogDescription:   { type: String, default: '' },
    ogImage:         { type: String, default: '' },
    twitterCard:     { type: String, default: 'summary_large_image' },
    robots:          { type: String, default: 'index, follow' },
    schema:          { type: mongoose.Schema.Types.Mixed, default: {} },
    h1:              { type: String, default: '' },
    updatedAt:       { type: String, default: '' },
})

export default mongoose.models.HomeSeo || mongoose.model("HomeSeo", HomeSeoSchema)