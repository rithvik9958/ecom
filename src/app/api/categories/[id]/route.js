import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Category from "@/app/models/Category";
import { uploadFile, isUploadFile } from "@/lib/upload";

// PUT to update a Category
export async function PUT(request, context) {
    try {
        await connectDB();
        
        // Ensure params are awaited before use (Next.js 15+ App Router behavior)
        const params = await context.params;
        const id = params.id;
        
        if (!id) {
            return Response.json({ message: "Category ID is required" }, { status: 400 });
        }

        const formData = await request.formData();

        // Basic fields
        const name = formData.get("name");
        const slug = formData.get("slug");
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

        if (!name || !slug) {
            return Response.json({ message: "Name and slug are required" }, { status: 400 });
        }

        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return Response.json({ message: "Category not found" }, { status: 404 });
        }

        // Check if slug exists on another document
        const duplicateSlug = await Category.findOne({ slug, _id: { $ne: id } });
        if (duplicateSlug) {
            return Response.json({ message: "Slug already exists" }, { status: 400 });
        }

        // Handle file uploads
        const imageFile = formData.get("image");
        let imageUrl = existingCategory.image;

        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "categories", "category");
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            {
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
            },
            { new: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json(updatedCategory);

    } catch (error) {
        console.error("Category Update Error:", error);
        return Response.json(
            { message: "Failed to update category", error: error.message },
            { status: 500 }
        );
    }
}

// DELETE a Category
export async function DELETE(request, context) {
    try {
        await connectDB();
        const params = await context.params;
        const id = params.id;

        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return Response.json({ message: "Category not found" }, { status: 404 });
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json({ message: "Category deleted successfully" });
    } catch (error) {
        return Response.json(
            { message: "Failed to delete category", error: error.message },
            { status: 500 }
        );
    }
}
