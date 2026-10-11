import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import HomeExtra from "@/app/models/HomeExtra";
import { z } from "zod";
import fs from "fs";
import path from "path";

// get, post, put, delete banner api
export async function GET() {
    await connectDB();

    const homeExtra = await HomeExtra.find();
    return Response.json(homeExtra);
}

export async function POST(request) {
    try {
        await connectDB();

        const contentType = request.headers.get('content-type') || '';
        let body = {};

        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
        }

        const updateData = {
            choose_title: body.choose_title || "",
            choose_subtitle: body.choose_subtitle || "",
            product_title: body.product_title || "",
            product_subtitle: body.product_subtitle || "",
            certified_title: body.certified_title || "",
            work_title: body.work_title || "",
            work_subtitle: body.work_subtitle || "",
            blog_title: body.blog_title || "",
            blog_subtitle: body.blog_subtitle || "",
            contact_title: body.contact_title || "",
            contact_subtitle: body.contact_subtitle || "",
        };

        // Upsert: Find the first one and update it, or create if none exists.
        let homeExtra = await HomeExtra.findOne();
        if (homeExtra) {
            homeExtra = await HomeExtra.findByIdAndUpdate(homeExtra._id, updateData, { new: true });
        } else {
            homeExtra = await HomeExtra.create(updateData);
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "HomeExtra saved successfully",
            data: homeExtra,
        });

    } catch (error) {
        return Response.json(
            { message: "Save failed", error: error.message },
            { status: 500 }
        );
    }
}
