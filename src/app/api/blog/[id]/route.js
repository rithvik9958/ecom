import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';

import Blog from "@/app/models/Blog";
import { connectDB } from "@/app/lib/config";
import { requirePermission } from "@/app/lib/auth";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function PUT(request, context) {
    const { error } = await requirePermission(request, 'blogs', 'update');
    if (error) return error;
    try {
        await connectDB();

        const { id } = await context.params;

        const formData = await request.formData();

        const existingBlog = await Blog.findById(id);

        if (!existingBlog) {
            return Response.json(
                { message: "Blog not found" },
                { status: 404 }
            );
        }

        // ==========================
        // COVER IMAGE
        // ==========================

        let coverImageUrl = existingBlog.coverImage;

        const coverImage = formData.get("coverImage");

        if (isUploadFile(coverImage)) {
            coverImageUrl = await uploadFile(coverImage, "blog", "cover");

            // Delete old image
            if (existingBlog.coverImage && existingBlog.coverImage.startsWith("/uploads/")) {
                try {
                    const oldPath = path.join(process.cwd(), "public", existingBlog.coverImage);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                } catch (fsErr) {
                    console.warn("Could not delete old blog cover:", fsErr.message);
                }
            }
        }

        // ==========================
        // BREAD IMAGE
        // ==========================

        let breadImageUrl = existingBlog.breadImage;

        const breadimage = formData.get("breadImage");

        if (isUploadFile(breadimage)) {
            breadImageUrl = await uploadFile(breadimage, "blog", "bread");

            // Delete old bread image
            if (existingBlog.breadImage && existingBlog.breadImage.startsWith("/uploads/")) {
                try {
                    const oldPath = path.join(process.cwd(), "public", existingBlog.breadImage);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                } catch (fsErr) {
                    console.warn("Could not delete old blog bread:", fsErr.message);
                }
            }
        }

        // ==========================
        // UPDATE DATA
        // ==========================

        let metakeywords = [];
        try {
            const kw = formData.get("metakeywords");
            if (kw) metakeywords = JSON.parse(kw);
        } catch(e) {}
        
        let schemaMarkup = {};
        try {
            const sc = formData.get("schemaMarkup");
            if (sc) schemaMarkup = JSON.parse(sc);
        } catch(e) {}

        const updateData = {
            title: formData.get("title"),
            slug: formData.get("slug"),
            coverImage: coverImageUrl,
            alt: formData.get("alt"),
            breadImage: breadImageUrl,
            bread_heading: formData.get("bread_heading"),
            excerpt: formData.get("excerpt"),
            content: formData.get("content"),
            author: formData.get("author"),
            category: formData.get("category"),
            isPublished:
                formData.get("isPublished") === "true",

            sort: Number(formData.get("sort") || 0),

            publishedAt: formData.get("publishedAt"),

            metatag: formData.get("metatag"),
            metaDescription: formData.get("metaDescription"),
            metakeywords,
            canonicalUrl: formData.get("canonicalUrl"),
            ogTitle: formData.get("ogTitle"),
            ogDescription: formData.get("ogDescription"),
            twitterCard: formData.get("twitterCard"),
            robots: formData.get("robots"),
            schemaMarkup,
        };

        const blog = await Blog.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json({
            success: true,
            message: "Blog updated successfully",
            data: blog,
        });
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                success: false,
                message: "Update failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request, context) {
    const { error } = await requirePermission(request, 'blogs', 'delete');
    if (error) return error;
    try {
        await connectDB();

        const { id } = await context.params;

        const blog = await Blog.findById(id);

        if (!blog) {
            return Response.json(
                { message: "Blog not found" },
                { status: 404 }
            );
        }

        // ==========================
        // DELETE COVER IMAGE
        // ==========================

        if (blog.coverImage) {
            try {
                const coverImagePath = path.join(process.cwd(), "public", blog.coverImage);
                if (fs.existsSync(coverImagePath)) fs.unlinkSync(coverImagePath);
            } catch (fsErr) {
                console.warn("Could not delete blog cover on delete:", fsErr.message);
            }
        }

        // ==========================
        // DELETE BREAD IMAGE
        // ==========================

        if (blog.breadimage) {
            try {
                const breadImagePath = path.join(process.cwd(), "public", blog.breadimage);
                if (fs.existsSync(breadImagePath)) fs.unlinkSync(breadImagePath);
            } catch (fsErr) {
                console.warn("Could not delete blog bread on delete:", fsErr.message);
            }
        }

        // ==========================
        // DELETE BLOG
        // ==========================

        await Blog.findByIdAndDelete(id);

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return Response.json({
            success: true,
            message: "Blog deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                success: false,
                message: "Delete failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}