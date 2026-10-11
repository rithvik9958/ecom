export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import { connectDB } from "@/app/lib/config";
import About from "@/app/models/About";
import { uploadFile, isUploadFile } from "@/lib/upload";

// GET all About pages
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const section = searchParams.get('section');
        
        let query = {};
        if (section) {
            query.section = section;
        }

        // Sort by 'sort' field ascending
        const aboutPages = await About.find(query).sort({ sort: 1 }).lean();
        return Response.json(aboutPages);
    } catch (error) {
        return Response.json(
            { message: "Failed to fetch pages", error: error.message },
            { status: 500 }
        );
    }
}

// POST a new About page
export async function POST(request) {
    try {
        await connectDB();

        const formData = await request.formData();

        // Basic fields
        const b_heading = formData.get("b_heading") || "";
        const title = formData.get("title");
        const slug = formData.get("slug");
        const section = formData.get("section") || "aboutus";
        const content = formData.get("content") || "";
        const alt = formData.get("alt") || "";
        const sort = formData.get("sort") ? Number(formData.get("sort")) : 0;
        const isActive = formData.get("isActive") !== "false"; // default true

        // SEO fields
        const metatag = formData.get("metatag") || "";
        const metaDescription = formData.get("metaDescription") || "";
        const canonicalUrl = formData.get("canonicalUrl") || "";
        const ogTitle = formData.get("ogTitle") || "";
        const ogDescription = formData.get("ogDescription") || "";
        const twitterCard = formData.get("twitterCard") || "summary_large_image";
        const robots = formData.get("robots") || "index, follow";

        // schema mapping (if provided as JSON string)
        let schemaObj = {};
        const schemaRaw = formData.get("schema");
        if (schemaRaw) {
            try {
                schemaObj = JSON.parse(schemaRaw);
            } catch (e) {
                // ignore invalid json
            }
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

        if (!title || !slug) {
            return Response.json(
                { message: "Title and slug are required" },
                { status: 400 }
            );
        }

        // Handle file uploads
        let bannerImageUrl = "";
        let imageUrl = "";
        let ogImageUrl = "";

        const bannerImageFile = formData.get("bannerImage");
        if (isUploadFile(bannerImageFile)) {
            bannerImageUrl = await uploadFile(bannerImageFile, "about", "banner");
        }

        const imageFile = formData.get("image");
        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "about", "img");
        }

        const ogImageFile = formData.get("ogImage");
        if (isUploadFile(ogImageFile)) {
            ogImageUrl = await uploadFile(ogImageFile, "about", "og");
        }

        const newAbout = await About.create({
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
            ogDescription: ogDescription,
            ogImage: ogImageUrl,
            twitterCard,
            robots,
            schemaMarkup: schemaObj,
        });

        revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');

        return Response.json({
            message: "About page created successfully",
            data: newAbout,
        });

    } catch (error) {
        return Response.json(
            { message: "Failed to create about page", error: error.message },
            { status: 500 }
        );
    }
}
