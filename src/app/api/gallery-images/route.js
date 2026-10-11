import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import { NextResponse } from "next/server";

import GalleryImage from "@/app/models/GalleryImage";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function GET(request) {
    try {
        await connectDB();
        const images = await GalleryImage.find().sort({ sort: 1, createdAt: -1 }).lean();
        return NextResponse.json(images);
    } catch (error) {
        return NextResponse.json({ message: "Failed to fetch images" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const formData = await request.formData();
        
        // Upload multiple images
        // Frontend will send them as files[0], files[1]... and captions[0]...
        const files = [];
        const captions = [];
        
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('files[')) {
                files.push(value);
            } else if (key.startsWith('captions[')) {
                captions.push(value);
            }
        }

        if (files.length === 0) {
            return Response.json({ message: "No files uploaded" }, { status: 400 });
        }

        const createdImages = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const caption = captions[i] || "";
            
            if (isUploadFile(file)) {
                const fileUrl = await uploadFile(file, "gallery", "gal");

                const img = await GalleryImage.create({
                    caption,
                    url: fileUrl,
                    date: new Date().toISOString().split('T')[0] // current date YYYY-MM-DD
                });
                createdImages.push(img);
            }
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: `${createdImages.length} images uploaded successfully`,
            data: createdImages,
        });

    } catch (error) {
        return Response.json({ message: "Upload failed", error: error.message }, { status: 500 });
    }
}
