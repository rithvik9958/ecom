import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Product from "@/app/models/Product";
import { uploadFile, isUploadFile } from "@/lib/upload";

// GET a single Product by ID
export async function GET(request, context) {
    try {
        await connectDB();
        const params = await context.params;
        const id = params.id;
        const product = await Product.findById(id).populate('category', 'name slug').lean();
        if (!product) {
            return Response.json({ message: "Product not found" }, { status: 404 });
        }
        return Response.json(product);
    } catch (error) {
        return Response.json({ message: "Failed to fetch product", error: error.message }, { status: 500 });
    }
}

// PUT to update a Product
export async function PUT(request, context) {
    try {
        await connectDB();
        
        const params = await context.params;
        const id = params.id;
        
        if (!id) {
            return Response.json({ message: "Product ID is required" }, { status: 400 });
        }

        const formData = await request.formData();

        // Basic fields
        const name = formData.get("name");
        const slug = formData.get("slug");
        const category = formData.get("category"); // Category ObjectId
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

        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return Response.json({ message: "Product not found" }, { status: 404 });
        }

        // Check if slug exists on another document
        const duplicateSlug = await Product.findOne({ slug, _id: { $ne: id } });
        if (duplicateSlug) {
            return Response.json({ message: "Slug already exists" }, { status: 400 });
        }

        // Handle file uploads
        const imageFile = formData.get("image");
        const detailImageFile = formData.get("detailImage");
        const existingImageUrl = formData.get("existingImage") || "";
        const existingDetailImageUrl = formData.get("existingDetailImage") || "";

        // Start with whatever the client says is the current URL (they always send it)
        let imageUrl = existingImageUrl || existingProduct.image || "";
        let detailImageUrl = existingDetailImageUrl || existingProduct.detailImage || "";

        // Only overwrite if a real new file was uploaded
        if (isUploadFile(imageFile)) {
            imageUrl = await uploadFile(imageFile, "products", "prod");
        }

        if (isUploadFile(detailImageFile)) {
            detailImageUrl = await uploadFile(detailImageFile, "products", "detail");
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
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
            },
            { new: true }
        );

        await updatedProduct.populate('category', 'name slug');

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json(updatedProduct);

    } catch (error) {
        console.error("Product Update Error:", error);
        return Response.json(
            { message: "Failed to update product", error: error.message },
            { status: 500 }
        );
    }
}

// DELETE a Product
export async function DELETE(request, context) {
    try {
        await connectDB();
        const params = await context.params;
        const id = params.id;

        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return Response.json({ message: "Product not found" }, { status: 404 });
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json({ message: "Product deleted successfully" });
    } catch (error) {
        return Response.json(
            { message: "Failed to delete product", error: error.message },
            { status: 500 }
        );
    }
}
