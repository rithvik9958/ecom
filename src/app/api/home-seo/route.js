import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import HomeSeo from "@/app/models/HomeSeo";

export async function GET() {
    await connectDB();
    const homeSeo = await HomeSeo.find();
    return Response.json(homeSeo);
}

export async function POST(request) {
    try {
        await connectDB();
 
        const contentType = request.headers.get('content-type') || ''
 
        let body = {}
 
        if (contentType.includes('application/json')) {
            body = await request.json()
        } else {
            // form-data or x-www-form-urlencoded
            const formData = await request.formData()
            body = Object.fromEntries(formData.entries())
            // metaKeywords comes as comma string from form-data — convert to array
            if (body.metaKeywords && typeof body.metaKeywords === 'string') {
                body.metaKeywords = body.metaKeywords.split(',').map(k => k.trim()).filter(Boolean)
            }
            // schema comes as JSON string from form-data — parse it
            if (body.schema && typeof body.schema === 'string') {
                try { body.schema = JSON.parse(body.schema) } catch { body.schema = {} }
            }
        }
 
        const updateData = {
            pageSlug:        body.pageSlug        || 'home',
            title:           body.title           || '',
            metaDescription: body.metaDescription || '',
            metaKeywords:    body.metaKeywords    || [],
            canonicalUrl:    body.canonicalUrl    || '',
            ogTitle:         body.ogTitle         || '',
            ogDescription:   body.ogDescription   || '',
            ogImage:         body.ogImage         || '',
            twitterCard:     body.twitterCard     || 'summary_large_image',
            robots:          body.robots          || 'index, follow',
            schema:          body.schema          || {},
            h1:              body.h1              || '',
            updatedAt:       new Date().toISOString().split('T')[0],
        };

        const homeSeo = await HomeSeo.findOneAndUpdate(
            { pageSlug: updateData.pageSlug },
            updateData,
            { new: true, upsert: true }
        );
 
        return Response.json({ message: "HomeSeo saved successfully", data: homeSeo })
    } catch (error) {
        return Response.json({ message: "Save failed", error: error.message }, { status: 500 })
    }
}




