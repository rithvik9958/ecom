import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import HomeExtra from "@/app/models/HomeExtra";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function PUT(request, context) {

    await connectDB();

const body = await request.json()
    const { id } = await context.params;

    try {
        const existingHomeExtra = await HomeExtra.findById(id);
        if (!existingHomeExtra) {
            return Response.json({ message: "HomeExtra not found" }, { status: 404 });
        }

        const homeExtra = await HomeExtra.findByIdAndUpdate(
            id,
            {
                choose_title: body.choose_title,
                choose_subtitle: body.choose_subtitle,
                product_title: body.product_title,
                product_subtitle: body.product_subtitle,
                certified_title: body.certified_title,
                work_title: body.work_title,
                work_subtitle: body.work_subtitle,
                blog_title: body.blog_title,
                blog_subtitle: body.blog_subtitle,
                contact_title: body.contact_title,
                contact_subtitle: body.contact_subtitle,
            },
            { new: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Updated successfully", data: homeExtra });

    } catch (error) {
        return Response.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

