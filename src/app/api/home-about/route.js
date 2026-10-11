import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import HomeAbout from "@/app/models/HomeAbout";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

// get, post, put, delete banner api
export async function GET() {
    await connectDB();

    const homeAbout = await HomeAbout.find();
    return Response.json(homeAbout);
}

export async function POST(request) {
    try {
        await connectDB();

        const formData = await request.formData();

        const title = formData.get("title") || "";
        const description = formData.get("description") || "";
        const image = formData.get("image"); // FILE
        const alt = formData.get("alt") || "";

        let imageUrl = undefined;

        if (isUploadFile(image)) {
            imageUrl = await uploadFile(image, "home-about", "homeabout");
        }

        const updateData = { title, description, alt };
        if (imageUrl) updateData.image = imageUrl;

        // Upsert
        let homeAbout = await HomeAbout.findOne();
        if (homeAbout) {
            // if we uploaded a new image, try to delete the old one
            if (imageUrl && homeAbout.image && homeAbout.image.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(process.cwd(), 'public', homeAbout.image);
                    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
                } catch (fsErr) {
                    console.warn("Could not delete old home-about image:", fsErr.message);
                }
            }
            homeAbout = await HomeAbout.findByIdAndUpdate(homeAbout._id, updateData, { new: true });
        } else {
            homeAbout = await HomeAbout.create(updateData);
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Home about saved successfully",
            data: homeAbout,
        });

    } catch (error) {
        return Response.json(
            { message: "Upload failed", error: error.message },
            { status: 500 }
        );
    }
}
