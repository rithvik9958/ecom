import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import CompanyCertification from "@/app/models/CompanyCertification";
import { connectDB } from "@/app/lib/config";
import fs from "fs";
import path from "path";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function PUT(request, context) {
    try {
        await connectDB();
        const { id } = await context.params;
        const formData = await request.formData();
        
        const cert = await CompanyCertification.findById(id);
        if (!cert) return Response.json({ message: "Not found" }, { status: 404 });

        const name = formData.get("name");
        const sub_title = formData.get("sub_title");
        const third_title = formData.get("third_title");
        const status = formData.get("status");
        const sort = formData.get("sort");

        if (name) cert.name = name;
        if (sub_title !== null) cert.sub_title = sub_title;
        if (third_title !== null) cert.third_title = third_title;
        if (status) cert.status = status;
        if (sort !== null) cert.sort = sort;

        const file = formData.get("file");

        if (isUploadFile(file)) {
            cert.file_url = await uploadFile(file, "certifications", "cert");
        }

        await cert.save();

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Certificate updated", data: cert });
    } catch (error) {
        return Response.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    await connectDB();
    const { id } = await context.params;
    try {
        const cert = await CompanyCertification.findById(id);
        if (!cert) return Response.json({ message: "Not found" }, { status: 404 });

        if (cert.file_url) {
            try {
                const filePath = path.join(process.cwd(), "public", cert.file_url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fsErr) {
                console.warn("Could not delete company-certification file:", fsErr.message);
            }
        }

        await CompanyCertification.findByIdAndDelete(id);

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Deleted successfully" });
    } catch (error) {
        return Response.json({ message: "Delete failed", error: error.message }, { status: 500 });
    }
}
