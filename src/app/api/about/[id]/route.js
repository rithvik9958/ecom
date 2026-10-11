export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import { connectDB } from "@/app/lib/config";
import About from "@/app/models/About";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const about = await About.findById(id);

        if (!about) {
            return Response.json({ message: "About page not found" }, { status: 404 });
        }

        return Response.json(about);
    } catch (error) {
        return Response.json(
            { message: "Error fetching about page", error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const existing = await About.findById(id);

        if (!existing) {
            return Response.json({ message: "About page not found" }, { status: 404 });
        }

        const formData = await request.formData();

        // Basic fields
        const b_heading = formData.get("b_heading") ?? existing.b_heading;
        const title     = formData.get("title")     ?? existing.title;
        const slug      = formData.get("slug")      ?? existing.slug;
        const section   = formData.get("section")   ?? existing.section;
        const content   = formData.get("content")   ?? existing.content;
        const alt       = formData.get("alt")       ?? existing.alt;
        const sort      = formData.get("sort") ? Number(formData.get("sort")) : existing.sort;
        const isActive  = formData.get("isActive") ? formData.get("isActive") !== "false" : existing.isActive;

        // SEO fields
        const metatag         = formData.get("metatag")         ?? existing.metatag;
        const metaDescription = formData.get("metaDescription") ?? existing.metaDescription;
        const canonicalUrl    = formData.get("canonicalUrl")    ?? existing.canonicalUrl;
        const ogTitle         = formData.get("ogTitle")         ?? existing.ogTitle;
        const ogDescription   = formData.get("ogDescription")   ?? existing.ogDescription;
        const twitterCard     = formData.get("twitterCard")     ?? existing.twitterCard;
        const robots          = formData.get("robots")          ?? existing.robots;

        // Schema parsing
        let schemaObj = existing.schemaMarkup ?? {};
        const schemaRaw = formData.get("schema");
        if (schemaRaw) {
            try {
                schemaObj = JSON.parse(schemaRaw);
            } catch (e) {
                // Ignore parse errors
            }
        }

        // Keywords mapping
        let metakeywords = existing.metakeywords;
        const kwRaw = formData.get("metakeywords");
        if (kwRaw) {
            try {
                const parsed = JSON.parse(kwRaw);
                if (Array.isArray(parsed)) {
                    metakeywords = parsed.map(k => k.value || k);
                } else if (typeof parsed === 'string') {
                    metakeywords = parsed.split(',').map(s => s.trim());
                }
            } catch (e) {
                metakeywords = kwRaw.split(',').map(s => s.trim());
            }
        }

        // Handle file uploads
        const bannerImageFile = formData.get("bannerImage");
        let bannerImageUrl = existing.bannerImage;
        if (isUploadFile(bannerImageFile)) {
            bannerImageUrl = await uploadFile(bannerImageFile, "about", "banner");
        }

        const imageFile = formData.get("image");
        let imageUrl = existing.image;
        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "about", "img");
        }

        const ogImageFile = formData.get("ogImage");
        let ogImageUrl = existing.ogImage;
        if (isUploadFile(ogImageFile)) {
            ogImageUrl = await uploadFile(ogImageFile, "about", "og");
        }

        const updated = await About.findByIdAndUpdate(
            id,
            {
                b_heading,
                title,
                slug,
                section,
                content,
                bannerImage: bannerImageUrl,
                image: imageUrl,
                alt,
                sort,
                isActive,
                metatag,
                metaDescription,
                metakeywords,
                canonicalUrl,
                ogTitle,
                ogDescription,
                ogImage: ogImageUrl,
                twitterCard,
                robots,
                schemaMarkup: schemaObj,
            },
            { new: true }
        );

        revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');

        return Response.json({
            message: "About page updated successfully",
            data: updated,
        });

    } catch (error) {
        return Response.json(
            { message: "Error updating about page", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;

        const deleted = await About.findByIdAndDelete(id);

        if (!deleted) {
            return Response.json({ message: "About page not found" }, { status: 404 });
        }

        // Optionally delete the image files from disk
        const filesToDelete = [deleted.bannerImage, deleted.image, deleted.ogImage];
        for (const fileUrl of filesToDelete) {
            if (fileUrl && fileUrl.startsWith("/uploads/")) {
                try {
                    const filePath = path.join(process.cwd(), "public", fileUrl);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (fsErr) {
                    console.warn("Could not delete about image:", fsErr.message);
                }
            }
        }

        revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');

        return Response.json({ message: "About page deleted successfully" });
    } catch (error) {
        return Response.json(
            { message: "Error deleting about page", error: error.message },
            { status: 500 }
        );
    }
}
