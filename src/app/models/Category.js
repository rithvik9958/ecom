import mongoose from "mongoose";
import { deleteFile } from "@/lib/upload";

const CategorySchema = new mongoose.Schema({
    // Basic fields
    name:            { type: String, required: true },
    slug:            { type: String, required: true, unique: true },
    description:     { type: String, default: '' },
    breadcrumb:      { type: String, default: '' }, // Page breadcrumb label
    image:           { type: String, default: '' },
    alt:             { type: String, default: '' },
    sort:            { type: Number, default: 0 },
    isActive:        { type: Boolean, default: true },

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

CategorySchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        if (doc.image) await deleteFile(doc.image);
    }
});

// Delete cached model so hot-reload always picks up schema changes (dev safety)
// In production this is a no-op because the server process is fresh on each start
export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
