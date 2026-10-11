import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/config";
import CustomPage from "@/app/models/CustomPage";
import { uploadFile } from "@/lib/upload";

export async function GET() {
    try {
        await connectDB();
        const pages = await CustomPage.find().sort({ createdAt: -1 });
        return NextResponse.json(pages, { status: 200 });
    } catch (error) {
        console.error("Error fetching custom pages:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const formData = await req.formData();
        
        const title = formData.get('title');
        const slug = formData.get('slug');
        
        if (!title || !slug) {
            return NextResponse.json({ error: 'Title and Slug are required' }, { status: 400 });
        }

        // Check for existing slug
        const existing = await CustomPage.findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
        }

        let bannerImage = '';
        const file = formData.get('bannerImage');
        if (file && file.size > 0) {
            bannerImage = await uploadFile(file, 'custom-pages');
        }

        const newPage = new CustomPage({
            title,
            slug,
            content: formData.get('content') || '',
            bannerImage,
            alt: formData.get('alt') || '',
            isActive: formData.get('isActive') === 'true',
            sort: Number(formData.get('sort')) || 0,
            metatag: formData.get('metatag') || '',
            metaDescription: formData.get('metaDescription') || '',
            metakeywords: formData.get('metakeywords') ? formData.get('metakeywords').split(',').map(k => k.trim()) : [],
            canonicalUrl: formData.get('canonicalUrl') || '',
            ogTitle: formData.get('ogTitle') || '',
            ogDescription: formData.get('ogDescription') || '',
            twitterCard: formData.get('twitterCard') || 'summary_large_image',
            robots: formData.get('robots') || 'index, follow',
            schemaMarkup: formData.get('schemaMarkup') ? JSON.parse(formData.get('schemaMarkup')) : {},
        });

        const savedPage = await newPage.save();
        return NextResponse.json({ success: true, page: savedPage }, { status: 201 });
    } catch (error) {
        console.error("Error creating custom page:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
