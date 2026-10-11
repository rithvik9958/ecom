import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Category from "@/app/models/Category";
import { requirePermission } from "@/app/lib/auth";
import { uploadFile, isUploadFile } from "@/lib/upload";

// GET all Categories
export async function GET() {
    try {
        await connectDB();
        // Sort by 'sort' field ascending
        const categories = await Category.find().sort({ sort: 1 }).lean();
        return Response.json(categories);
    } catch (error) {
        return Response.json(
            { message: "Failed to fetch categories", error: error.message },
            { status: 500 }
        );
    }
}

// POST a new Category
export async function POST(request) {
    const { error } = await requirePermission(request, 'categories', 'create');
    if (error) return error;
    try {
        await connectDB();

        const formData = await request.formData();

        // Basic fields
        const name = formData.get("name");
        const slug = formData.get("slug");
        const description = formData.get("description") || "";
        const breadcrumb = formData.get("breadcrumb") || "";
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

        // schema mapping
        let schemaObj = {};
        const schemaRaw = formData.get("schema");
        if (schemaRaw) {
            try {
                schemaObj = JSON.parse(schemaRaw);
            } catch (e) { }
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
        const imageFile = formData.get("image");
        let imageUrl = "";
        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "categories", "category");
        }

        // Check if slug exists
        const existing = await Category.findOne({ slug });
        if (existing) {
            return Response.json({ message: "Slug already exists" }, { status: 400 });
        }

        const newCategory = await Category.create({
            name,
            slug,
            description,
            breadcrumb,
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
            twitterCard,
            robots,
            schemaMarkup: schemaObj,
        });

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json(newCategory, { status: 201 });

    } catch (error) {
        console.error("Category Creation Error:", error);
        return Response.json(
            { message: "Failed to create category", error: error.message },
            { status: 500 }
        );
    }
}
