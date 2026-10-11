import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import GalleryImage from "@/app/models/GalleryImage";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function PUT(request, context) {
    try {
        await connectDB();
        const { id } = await context.params;
        
        const image = await GalleryImage.findById(id);
        if (!image) return Response.json({ message: "Not found" }, { status: 404 });

        const formData = await request.formData();
        const caption = formData.get('caption');
        const file = formData.get('file');
        const isActiveStr = formData.get('isActive');

        if (caption !== null && caption !== undefined) {
            image.caption = caption;
        }
        
        if (isActiveStr !== null && isActiveStr !== undefined) {
            image.isActive = isActiveStr === 'true';
        }

        if (isUploadFile(file)) {
            const fileUrl = await uploadFile(file, "gallery", "gal");

            // Try to delete old file
            if (image.url && image.url.startsWith("/uploads/")) {
                try {
                    const oldFilePath = path.join(process.cwd(), "public", image.url);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (fsErr) {
                    console.warn("Could not delete old gallery image:", fsErr.message);
                }
            }

            image.url = fileUrl;
        }

        await image.save();
        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Updated successfully", data: image });
    } catch (error) {
        return Response.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    await connectDB();
    const { id } = await context.params;
    try {
        const image = await GalleryImage.findById(id);
        if (!image) return Response.json({ message: "Not found" }, { status: 404 });

        // Try to delete file from disk
        if (image.url) {
            try {
                const filePath = path.join(process.cwd(), "public", image.url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fsErr) {
                console.warn("Could not delete gallery file:", fsErr.message);
            }
        }

        await GalleryImage.findByIdAndDelete(id);

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Deleted successfully" });
    } catch (error) {
        return Response.json({ message: "Delete failed", error: error.message }, { status: 500 });
    }
}
