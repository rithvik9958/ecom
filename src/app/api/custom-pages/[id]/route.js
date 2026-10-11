import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/config";
import CustomPage from "@/app/models/CustomPage";
import { uploadFile, deleteFile } from "@/lib/upload";

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const page = await CustomPage.findById(id);
        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }
        return NextResponse.json(page, { status: 200 });
    } catch (error) {
        console.error("PUT Error: ", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const formData = await req.formData();
        
        const existingPage = await CustomPage.findById(id);
        if (!existingPage) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        const slug = formData.get('slug');
        if (slug && slug !== existingPage.slug) {
            const slugExists = await CustomPage.findOne({ slug });
            if (slugExists) {
                return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
            }
        }

        const updates = {
            title: formData.get('title') || existingPage.title,
            slug: slug || existingPage.slug,
            content: formData.get('content') !== null ? formData.get('content') : existingPage.content,
            alt: formData.get('alt') !== null ? formData.get('alt') : existingPage.alt,
            isActive: formData.has('isActive') ? formData.get('isActive') === 'true' : existingPage.isActive,
            sort: formData.has('sort') ? Number(formData.get('sort')) : existingPage.sort,
            metatag: formData.get('metatag') !== null ? formData.get('metatag') : existingPage.metatag,
            metaDescription: formData.get('metaDescription') !== null ? formData.get('metaDescription') : existingPage.metaDescription,
            metakeywords: formData.has('metakeywords') ? formData.get('metakeywords').split(',').map(k => k.trim()) : existingPage.metakeywords,
            canonicalUrl: formData.get('canonicalUrl') !== null ? formData.get('canonicalUrl') : existingPage.canonicalUrl,
            ogTitle: formData.get('ogTitle') !== null ? formData.get('ogTitle') : existingPage.ogTitle,
            ogDescription: formData.get('ogDescription') !== null ? formData.get('ogDescription') : existingPage.ogDescription,
            twitterCard: formData.get('twitterCard') !== null ? formData.get('twitterCard') : existingPage.twitterCard,
            robots: formData.get('robots') !== null ? formData.get('robots') : existingPage.robots,
        };

        if (formData.has('schemaMarkup')) {
            try {
                updates.schemaMarkup = JSON.parse(formData.get('schemaMarkup'));
            } catch (e) {
                updates.schemaMarkup = {};
            }
        }

        const file = formData.get('bannerImage');
        if (file && file.size > 0) {
            if (existingPage.bannerImage) {
                await deleteFile(existingPage.bannerImage);
            }
            updates.bannerImage = await uploadFile(file, 'custom-pages');
        } else if (formData.get('removeBannerImage') === 'true') {
            if (existingPage.bannerImage) {
                await deleteFile(existingPage.bannerImage);
            }
            updates.bannerImage = '';
        }

        const updatedPage = await CustomPage.findByIdAndUpdate(id, updates, { new: true });
        return NextResponse.json({ success: true, page: updatedPage }, { status: 200 });
    } catch (error) {
        console.error("Error updating page:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        await connectDB();
        const page = await CustomPage.findByIdAndDelete(id);
        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("PUT Error: ", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
