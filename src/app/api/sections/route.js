export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Section from "@/app/models/Section";
import { uploadFile, isUploadFile } from "@/lib/upload";
import { revalidatePath } from 'next/cache';

// GET all Sections
export async function GET() {
    try {
        await connectDB();
        const sections = await Section.find().sort({ sort: 1 }).lean();
        return Response.json(sections);
    } catch (error) {
        return Response.json(
            { message: "Failed to fetch sections", error: error.message },
            { status: 500 }
        );
    }
}

// POST a new Section
export async function POST(request) {
    try {
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

        // schema mapping
        let schemaObj = {};
        const schemaRaw = formData.get("schema");
        if (schemaRaw) {
            try { schemaObj = JSON.parse(schemaRaw); } catch (e) {}
        }

        // Keywords mapping
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

        // Handle file uploads
        const imageFile = formData.get("bannerImage");
        let imageUrl = "";

        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "sections", "section");
        }

        const existing = await Section.findOne({ slug });
        if (existing) {
            return Response.json({ message: "Slug already exists" }, { status: 400 });
        }

        const newSection = await Section.create({
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
        });

        revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');

        return Response.json(newSection, { status: 201 });

    } catch (error) {
        console.error("Section Creation Error:", error);
        return Response.json(
            { message: "Failed to create section", error: error.message },
            { status: 500 }
        );
    }
}
