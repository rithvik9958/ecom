import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Othercta from "@/app/models/Othercta";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function PUT(request, context) {
    await connectDB();
    
    const { id } = await context.params;
    
    try {
        const existingOthercta = await Othercta.findById(id);
        if (!existingOthercta) {
            return Response.json({ message: "Othercta not found" }, { status: 404 });
        }

        // ✅ Read JSON instead of formData
        const body = await request.json();

        const othercta = await Othercta.findByIdAndUpdate(
            id,
            {
                title:       body.title,
                subtitle:    body.subtitle,
                content:     body.content,
                buttonText1: body.buttonText1,
                url1:        body.url1,
                buttonText2: body.buttonText2,
                url2:        body.url2,
            },
            { new: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Updated successfully", data: othercta });

    } catch (error) {
        return Response.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

