import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Banner from "@/app/models/Banner";
import { z } from "zod";
import { uploadFile, isUploadFile } from "@/lib/upload";

// get, post, put, delete banner api

export async function GET() {
    try {
        await connectDB();
        const banners = await Banner.find().lean();
        return Response.json(banners);
    } catch (error) {
        return Response.json(
            { message: "Failed to fetch banners", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const formData = await request.formData();
        const title = formData.get("title");
        const subtitle = formData.get("subtitle");
        const url = formData.get("url");
        const buttonText = formData.get("buttonText");
        const alt = formData.get("alt");
        const status = formData.get("status");
        const sort = Number(formData.get("sort"));
        const showCertifications = formData.get("showCertifications") === "true";
        const image = formData.get("image");

        if (!isUploadFile(image)) {
            return Response.json(
                { message: "Valid image is required" },
                { status: 400 }
            );
        }

        const imageUrl = await uploadFile(image, "banner", "banner");

        // save to DB
        const banner = await Banner.create({
            title,
            subtitle,
            url,
            buttonText,
            alt,
            status,
            sort,
            showCertifications,
            image: imageUrl,
        });

        // Trigger on-demand ISR revalidation so Vercel updates the frontend instantly
        const { revalidatePath } = require("next/cache");
        revalidatePath('/', 'layout');

        return Response.json({
            message: "Banner created successfully",
            data: banner,
        });

    } catch (error) {
        return Response.json(
            { message: "Upload failed", error: error.message },
            { status: 500 }
        );
    }
}

