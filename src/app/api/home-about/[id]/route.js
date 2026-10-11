import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import HomeAbout from "@/app/models/HomeAbout";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";


export async function PUT(request, context) {
    try {
        await connectDB();

        const formData = await request.formData();

        const { id } = await context.params;

        const existingHomeAbout = await HomeAbout.findById(id);

        if (!existingHomeAbout) {
            return Response.json(
                { message: "Home about not found" },
                { status: 404 }
            );
        }

        const image = formData.get("image");

        let imageUrl = existingHomeAbout.image;

        if (isUploadFile(image)) {
            imageUrl = await uploadFile(image, "home-about", "homeabout");

            // Delete old image (local dev only — skip on Vercel/cloud)
            if (existingHomeAbout.image && existingHomeAbout.image.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(
                        process.cwd(),
                        'public',
                        existingHomeAbout.image
                    );
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                } catch (fsErr) {
                    console.warn("Could not delete old home-about image:", fsErr.message);
                }
            }
        }

        const updateData = {
            title: formData.get("title"),
            description: formData.get("description"),
            image: imageUrl,
            alt: formData.get("alt"),
        };

        const homeAbout = await HomeAbout.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Updated successfully",
            data: homeAbout,
        });

    } catch (error) {
        console.error("HomeAbout PUT Error:", error);
        return Response.json(
            {
                message: "Update failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
