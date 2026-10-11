import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import WhyChoose from "@/app/models/whyChoose";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function PUT(request, context) {
    try {
        await connectDB();

        const formData = await request.formData();
        console.log(formData);
        const { id } = await context.params;

        const existingWhyChoose = await WhyChoose.findById(id);

        if (!existingWhyChoose) {
            return Response.json(
                { message: "Why choose item not found" },
                { status: 404 }
            );
        }

        const icon = formData.get("icon");

        let iconUrl = existingWhyChoose.icon;

        if (isUploadFile(icon)) {
            iconUrl = await uploadFile(icon, "why-choose", "why");

            // Delete old image
            if (existingWhyChoose.icon && existingWhyChoose.icon.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(
                        process.cwd(),
                        "public",
                        existingWhyChoose.icon
                    );
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                } catch (fsErr) {
                    console.warn("Could not delete old why-choose icon:", fsErr.message);
                }
            }
        }

        const updateData = {
            title: formData.get("title"),
            content: formData.get("content"),
            status: formData.get("status"),
            sort: Number(formData.get("sort")),
            icon: iconUrl,
        };

        const whyChoose = await WhyChoose.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Updated successfully",
            data: whyChoose,
        });

    } catch (error) {
        return Response.json(
            {
                message: "Update failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request, context) {
    await connectDB();
    const { id } = await context.params;

    console.log(id);
    const whyChoose = await WhyChoose.findById(id);

    if (!whyChoose) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    // delete icon from /public
    if (whyChoose.icon) {
        const filePath = path.join(
            process.cwd(),
            "public",
            whyChoose.icon
        );

        fs.unlink(filePath, () => {});
    }

    await WhyChoose.findByIdAndDelete(id);

    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
        message: "Deleted successfully",
    });
}