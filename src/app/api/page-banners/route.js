import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/config";
import PageBanner from "@/app/models/PageBanner";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { uploadFile, isUploadFile } from "@/lib/upload";

const unlinkAsync = promisify(fs.unlink);

export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const pageKey = searchParams.get('pageKey');
        
        let query = {};
        if (pageKey) query.pageKey = pageKey;

        const banners = await PageBanner.find(query).lean();
        return NextResponse.json(banners);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching page banners" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const formData = await req.formData();
        
        const pageKey = formData.get("pageKey");
        const title = formData.get("title");
        const isActive = formData.get("isActive") === "true";
        const imageFile = formData.get("image");

        if (!pageKey) {
            return NextResponse.json({ message: "pageKey is required" }, { status: 400 });
        }

        let imageUrl = undefined;
        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "page-banners", `banner-${pageKey}`);
        }

        // Find existing to delete old image if replaced
        const existing = await PageBanner.findOne({ pageKey });
        if (existing && imageUrl && existing.image && existing.image.startsWith("/uploads/")) {
            const oldPath = path.join(process.cwd(), "public", existing.image);
            if (fs.existsSync(oldPath)) {
                await unlinkAsync(oldPath).catch(() => {});
            }
        }

        const updateData = {
            pageKey,
            title,
            isActive
        };
        if (imageUrl) updateData.image = imageUrl;

        const updatedBanner = await PageBanner.findOneAndUpdate(
            { pageKey },
            updateData,
            { new: true, upsert: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return NextResponse.json(updatedBanner, { status: 200 });
    } catch (error) {
        console.error("Error saving page banner:", error);
        return NextResponse.json({ message: "Error saving page banner", error: error.message }, { status: 500 });
    }
}
