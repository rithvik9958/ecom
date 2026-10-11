import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Cta from "@/app/models/Cta";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function PUT(request, context) {
    try {
        await connectDB();

        const formData = await request.formData();
        const { id } = await context.params;
        const existingCta = await Cta.findById(id);

        if (!existingCta) {
            return Response.json(
                { message: "CTA not found" },
                { status: 404 }
            );
        }

        const image = formData.get("image");

        let imageUrl = existingCta.image;

        if (isUploadFile(image)) {
            imageUrl = await uploadFile(image, "cta", "cta");

            // Delete old image (local dev only — skip on Vercel/cloud)
            if (existingCta.image && existingCta.image.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(
                        process.cwd(),
                        "public",
                        existingCta.image
                    );
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                } catch (fsErr) {
                    console.warn("Could not delete old CTA image:", fsErr.message);
                }
            }
        }

        const updateData = {
            title: formData.get("title"),
            content: formData.get("content"),
            image: imageUrl,
        };

        const cta = await Cta.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Updated successfully",
            data: cta,
        });

    } catch (error) {
        console.error("CTA PUT Error:", error);
        return Response.json(
            {
                message: "Update failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}