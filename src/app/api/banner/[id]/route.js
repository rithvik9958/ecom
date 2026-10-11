import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Banner from "@/app/models/Banner";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function PUT(request, context) {
    try {
        await connectDB();

        const formData = await request.formData();
        // id will from params
        const { id } = await context.params;

        const existingBanner = await Banner.findById(id);

        if (!existingBanner) {
            return Response.json(
                { message: "Banner not found" },
                { status: 404 }
            );
        }

        const image = formData.get("image");

        let imageUrl = existingBanner.image;

        if (isUploadFile(image)) {
            imageUrl = await uploadFile(image, "banner", "banner");

            // Delete old image if it's a local file (local dev only — skip on Vercel/cloud)
            if (existingBanner.image && existingBanner.image.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(
                        process.cwd(),
                        "public",
                        existingBanner.image
                    );
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                } catch (fsErr) {
                    // Non-fatal: file may not exist on serverless environments
                    console.warn("Could not delete old banner image:", fsErr.message);
                }
            }
        }

        const updateData = {
            title: formData.get("title"),
            subtitle: formData.get("subtitle"),
            url: formData.get("url"),
            buttonText: formData.get("buttonText"),
            alt: formData.get("alt"),
            status: formData.get("status"),
            sort: Number(formData.get("sort")),
            showCertifications: formData.get("showCertifications") === "true",
            image: imageUrl,
        };

        const banner = await Banner.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        // Trigger on-demand ISR revalidation so Vercel updates the frontend instantly
        const { revalidatePath } = require("next/cache");
        revalidatePath('/', 'layout');

        return Response.json({
            message: "Updated successfully",
            data: banner,
        });

    } catch (error) {
        console.error("Banner PUT Error:", error);
        return Response.json(
            {
                message: "Update failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request, context) {
    await connectDB();
    const { id } = await context.params;

    console.log(id);
    const banner = await Banner.findById(id);

    if (!banner) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    // delete image from /public (local dev only — skip on Vercel/cloud)
    if (banner.image && banner.image.startsWith("/uploads/")) {
        try {
            const filePath = path.join(process.cwd(), "public", banner.image);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, () => {});
            }
        } catch (fsErr) {
            console.warn("Could not delete banner image file:", fsErr.message);
        }
    }

    await Banner.findByIdAndDelete(id);

    // Trigger on-demand ISR revalidation so Vercel updates the frontend instantly
    const { revalidatePath } = require("next/cache");
    revalidatePath('/', 'layout');

    return Response.json({
        message: "Deleted successfully",
    });
}