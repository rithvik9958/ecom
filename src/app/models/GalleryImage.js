import mongoose from "mongoose";
import { deleteFile } from "@/lib/upload";

const GalleryImageSchema = new mongoose.Schema({
  caption: { type: String, default: "" },
  url: { type: String, required: true },
  date: { type: String, default: "" },
  sort: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

GalleryImageSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        if (doc.url) await deleteFile(doc.url);
    }
});

export default mongoose.models.GalleryImage || mongoose.model("GalleryImage", GalleryImageSchema);
 