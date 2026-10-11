import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import HomeSeo from "@/app/models/HomeSeo";

export async function PUT(request, context) {
    await connectDB();
    const body = await request.json()
    const { id } = await context.params;

    try {
        const existingHomeSeo = await HomeSeo.findById(id);
        if (!existingHomeSeo) {
            return Response.json({ message: "HomeSeo not found" }, { status: 404 });
        }

        const homeSeo = await HomeSeo.findByIdAndUpdate(
            id,
            {
                pageSlug:        body.pageSlug,
                title:           body.title,
                metaDescription: body.metaDescription,
                metaKeywords:    body.metaKeywords,
                canonicalUrl:    body.canonicalUrl,
                ogTitle:         body.ogTitle,
                ogDescription:   body.ogDescription,
                ogImage:         body.ogImage,
                twitterCard:     body.twitterCard,
                robots:          body.robots,
                schema:          body.schema,
                h1:              body.h1,
                updatedAt:       new Date().toISOString().split('T')[0],
            },
            { new: true }
        )

        return Response.json({ message: "Updated successfully", data: homeSeo })
    } catch (error) {
        return Response.json({ message: "Update failed", error: error.message }, { status: 500 })
    }
}