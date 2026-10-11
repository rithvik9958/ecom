export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import { connectDB } from "@/app/lib/config";
import Section from "@/app/models/Section";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const section = await Section.findById(id);
        if (!section) return Response.json({ message: "Section not found" }, { status: 404 });
        return Response.json(section);
    } catch (error) {
        return Response.json({ message: "Failed to fetch section", error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        await connectDB();

        const formData = await request.formData();

        const name = formData.get("name");
        const slug = formData.get("slug");
        const sort = formData.get("sort") ? Number(formData.get("sort")) : 0;
        const isActive = formData.get("isActive") !== "false";

        // SEO fields
        const metatag = formData.get("metatag") || "";
        const metaDescription = formData.get("metaDescription") || "";
        const canonicalUrl = formData.get("canonicalUrl") || "";
        const ogTitle = formData.get("ogTitle") || "";
        const ogDescription = formData.get("ogDescription") || "";
        const twitterCard = formData.get("twitterCard") || "summary_large_image";
        const robots = formData.get("robots") || "index, follow";

        let schemaObj = {};
        const schemaRaw = formData.get("schema");
        if (schemaRaw) {
            try { schemaObj = JSON.parse(schemaRaw); } catch (e) {}
        }

        let metakeywords = [];
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

        if (!name || !slug) {
            return Response.json({ message: "Name and slug are required" }, { status: 400 });
        }

        const section = await Section.findById(id);
        if (!section) {
            return Response.json({ message: "Section not found" }, { status: 404 });
        }

        // Check duplicate slug
        if (slug !== section.slug) {
            const existing = await Section.findOne({ slug });
            if (existing) {
                return Response.json({ message: "Slug already exists" }, { status: 400 });
            }
        }

        let imageUrl = formData.get("existingBannerImage") || section.bannerImage;
        const imageFile = formData.get("bannerImage");

        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "sections", "section");
        }

        const updatedSection = await Section.findByIdAndUpdate(
            id,
            {
                name,
                slug,
                bannerImage: imageUrl,
                sort,
                isActive,
                metatag,
                metaDescription,
                metakeywords,
                canonicalUrl,
                ogTitle,
                ogDescription,
                twitterCard,
                robots,
                schemaMarkup: schemaObj,
            },
            { new: true }
        );

        revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');

        return Response.json(updatedSection);

    } catch (error) {
        console.error("Section Update Error:", error);
        return Response.json(
            { message: "Failed to update section", error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const section = await Section.findByIdAndDelete(id);
        if (!section) return Response.json({ message: "Section not found" }, { status: 404 });
        
        revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
        
        return Response.json({ message: "Section deleted successfully" });
    } catch (error) {
        return Response.json({ message: "Failed to delete section", error: error.message }, { status: 500 });
    }
}
