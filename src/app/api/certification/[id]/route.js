import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';

import Certification from "@/app/models/Certification";
import { connectDB } from "@/app/lib/config";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function PUT(request, context) {
    try {
        await connectDB();
        const formData = await request.formData();
        const { id } = await context.params;
        const existingCertification = await Certification.findById(id);

        if (!existingCertification) {
            return Response.json(
                { message: "Certification not found" },
                { status: 404 }
            );
        }

        const logo = formData.get("logo");
        let logoUrl = existingCertification.logo;

        if (isUploadFile(logo)) {
            logoUrl = await uploadFile(logo, "certification", "cert");

            // Delete old image
            if (existingCertification.logo && existingCertification.logo.startsWith("/uploads/")) {
                try {
                    const oldImagePath = path.join(
                        process.cwd(),
                        "public",
                        existingCertification.logo
                    );
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                } catch (fsErr) {
                    console.warn("Could not delete old certification logo:", fsErr.message);
                }
            }
        }

        const updateData = {
            title: formData.get("title"),
            status: formData.get("status"),
            sort: Number(formData.get("sort")),
            logo: logoUrl
        };

        const certification = await Certification.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Updated successfully",
            data: certification,
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
    try {
    const certification = await Certification.findById(id);
    if (!certification) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }

    // delete image from /public
    if (certification.logo) {
        const filePath = path.join(
            process.cwd(),
            "public",
            certification.logo
        );

        fs.unlink(filePath, () => { });
    }

    await Certification.findByIdAndDelete(id);

    
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
        message: "Deleted successfully",
    });
} catch (error) {
    return Response.json(
        {
            message: "Delete failed",
            error: error.message,
        },
        { status: 500 }
    );
}

}