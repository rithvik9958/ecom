import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Othercta from "@/app/models/Othercta";
import { z } from "zod";
import fs from "fs";
import path from "path";

// get, post, put, delete banner api
export async function GET() {
    await connectDB();

    const othercta = await Othercta.find();
    return Response.json(othercta);
}

export async function POST(request) {
    try {
        await connectDB();
        const { uploadFile, isUploadFile } = await import("@/lib/upload");

        const formData = await request.formData();
        const updateData = {
            title: formData.get("title") || "",
            subtitle: formData.get("subtitle") || "",
            content: formData.get("content") || "",
            buttonText1: formData.get("buttonText1") || "",
            url1: formData.get("url1") || "",
            buttonText2: formData.get("buttonText2") || "",
            url2: formData.get("url2") || "",
        };

        const image = formData.get("image");
        let imageUrl = undefined;
        if (isUploadFile(image)) {
            imageUrl = await uploadFile(image, "cta", "cta");
        }
        if (imageUrl) updateData.image = imageUrl;

        // Upsert
        let othercta = await Othercta.findOne();
        if (othercta) {
            if (imageUrl && othercta.image && othercta.image.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(process.cwd(), "public", othercta.image);
                    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
                } catch (e) {
                    console.log("Error deleting old image:", e);
                }
            }
            othercta = await Othercta.findByIdAndUpdate(othercta._id, updateData, { new: true });
        } else {
            othercta = await Othercta.create(updateData);
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Othercta saved successfully",
            data: othercta,
        });

    } catch (error) {
        return Response.json(
            { message: "Save failed", error: error.message },
            { status: 500 }
        );
    }
}



