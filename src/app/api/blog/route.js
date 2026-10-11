import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Blog from "@/app/models/Blog";
import { requirePermission } from "@/app/lib/auth";
import { uploadFile, isUploadFile } from "@/lib/upload";

// get, post, put, delete banner api
export async function GET(request) {
    const { error } = await requirePermission(request, 'blogs', 'read');
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const blogs = await Blog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Blog.countDocuments();

    return Response.json({
        data: blogs,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
}


export async function POST(request) {
    const { error } = await requirePermission(request, 'blogs', 'create');
    if (error) return error;
    try {
        await connectDB();

        const formData = await request.formData();

        // Blog Fields
        const title = formData.get("title");
        const slug = formData.get("slug");
        const alt = formData.get("alt");
        const bread_heading = formData.get("bread_heading");
        const excerpt = formData.get("excerpt");
        const content = formData.get("content");
        const author = formData.get("author");
        const category = formData.get("category");
        const isPublished =
            formData.get("isPublished") === "true";
        const sort = Number(formData.get("sort") || 0);
        const publishedAt = formData.get("publishedAt");

        // SEO Fields matching About.js
        const metatag = formData.get("metatag");
        const metaDescription = formData.get("metaDescription");
        let metakeywords = [];
        try {
            const kw = formData.get("metakeywords");
            if (kw) metakeywords = JSON.parse(kw);
        } catch(e) {}
        const canonicalUrl = formData.get("canonicalUrl");
        const ogTitle = formData.get("ogTitle");
        const ogDescription = formData.get("ogDescription");
        const twitterCard = formData.get("twitterCard");
        const robots = formData.get("robots");
        
        let schemaMarkup = {};
        try {
            const sc = formData.get("schemaMarkup");
            if (sc) schemaMarkup = JSON.parse(sc);
        } catch(e) {}

        // Images
        const coverImage = formData.get("coverImage");
        const breadImage = formData.get("breadImage");

        // Upload Cover Image
        let coverImageUrl = "";
        if (isUploadFile(coverImage)) {
            coverImageUrl = await uploadFile(coverImage, "blog", "cover");
        }

        let breadImageUrl = "";
        if (isUploadFile(breadImage)) {
            breadImageUrl = await uploadFile(breadImage, "blog", "bread");
        }

        const blog = await Blog.create({
            title,
            slug,
            coverImage: coverImageUrl,
            alt,
            breadImage: breadImageUrl,
            bread_heading,
            excerpt,
            content,
            author,
            category,
            isPublished,
            sort,
            publishedAt,

            metatag,
            metaDescription,
            metakeywords,
            canonicalUrl,
            ogTitle,
            ogDescription,
            twitterCard,
            robots,
            schemaMarkup,
        });

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json(
            {
                success: true,
                message: "Blog created successfully",
                data: blog,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                success: false,
                message: "Upload failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
