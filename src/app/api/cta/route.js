import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Cta from "@/app/models/Cta";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

// get, post, put, delete banner api
export async function GET() {
    await connectDB();

    const cta = await Cta.find();
    return Response.json(cta);
}

export async function POST(request) {
    try {
        await connectDB();

        const formData = await request.formData();
        const title = formData.get("title") || "";
        const content = formData.get("content") || "";
        const image = formData.get("image");

        let imageUrl = undefined;

        if (isUploadFile(image)) {
            imageUrl = await uploadFile(image, "cta", "cta");
        }

        const updateData = { title, content };
        if (imageUrl) updateData.image = imageUrl;

        // Upsert
        let cta = await Cta.findOne();
        if (cta) {
            if (imageUrl && cta.image && cta.image.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(process.cwd(), "public", cta.image);
                    if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
                } catch (fsErr) {
                    console.warn("Could not delete old CTA image:", fsErr.message);
                }
            }
            cta = await Cta.findByIdAndUpdate(cta._id, updateData, { new: true });
        } else {
            cta = await Cta.create(updateData);
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "CTA saved successfully",
            data: cta,
        });

    } catch (error) {
        return Response.json(
            { message: "Upload failed", error: error.message },
            { status: 500 }
        );
    }
}



