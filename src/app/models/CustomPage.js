import mongoose from "mongoose";
import { deleteFile } from "@/lib/upload";

const CustomPageSchema = new mongoose.Schema({
    // Basic fields
    title:           { type: String, required: true },
    slug:            { type: String, required: true, unique: true },
    content:         { type: String, default: '' },
    bannerImage:     { type: String, default: '' },
    alt:             { type: String, default: '' },
    isActive:        { type: Boolean, default: true },
    sort:            { type: Number, default: 0 },

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
}, {
    timestamps: true,
});

CustomPageSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        if (doc.bannerImage) await deleteFile(doc.bannerImage);
    }
});

export default mongoose.models.CustomPage || mongoose.model("CustomPage", CustomPageSchema, "custompages");
