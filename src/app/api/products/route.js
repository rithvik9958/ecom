import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Product from "@/app/models/Product";
import Category from "@/app/models/Category"; // Required for Mongoose populate() on serverless cold starts
import { requirePermission } from "@/app/lib/auth";
import { uploadFile, isUploadFile } from "@/lib/upload";

// GET all Products
export async function GET() {
    try {
        await connectDB();
        // Populate category to get the category name and slug
        const products = await Product.find().populate('category', 'name slug').sort({ sort: 1 }).lean();
        return Response.json(products);
    } catch (error) {
        return Response.json(
            { message: "Failed to fetch products", error: error.message },
            { status: 500 }
        );
    }
}

// POST a new Product
export async function POST(request) {
    const { error } = await requirePermission(request, 'products', 'create');
    if (error) return error;
    try {
        await connectDB();

        const formData = await request.formData();

        // Basic fields
        const name = formData.get("name");
        const slug = formData.get("slug");
        const category = formData.get("category"); // Expecting Category ObjectId
        const grade = formData.get("grade") || "";
        const description = formData.get("description") || "";
        const breadcrumb = formData.get("breadcrumb") || "";
        const alt = formData.get("alt") || "";
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
            try {
                schemaObj = JSON.parse(schemaRaw);
            } catch (e) {}
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

        if (!name || !slug || !category) {
            return Response.json({ message: "Name, slug, and category are required" }, { status: 400 });
        }

        // Handle file uploads
        const imageFile = formData.get("image");
        const detailImageFile = formData.get("detailImage");
        let imageUrl = "";
        let detailImageUrl = "";

        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "products", "prod");
        }

        if (isUploadFile(detailImageFile)) {
            detailImageUrl = await uploadFile(detailImageFile, "products", "detail");
        }

        // Check if slug exists
        const existing = await Product.findOne({ slug });
        if (existing) {
            return Response.json({ message: "Slug already exists" }, { status: 400 });
        }

        const newProduct = await Product.create({
            name,
            slug,
            category,
            grade,
            description,
            breadcrumb,
            image: imageUrl,
            detailImage: detailImageUrl,
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

        // Populate category before returning so frontend gets the full object
        await newProduct.populate('category', 'name slug');

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json(newProduct, { status: 201 });

    } catch (error) {
        console.error("Product Creation Error:", error);
        return Response.json(
            { message: "Failed to create product", error: error.message },
            { status: 500 }
        );
    }
}
