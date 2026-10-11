import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Certification from "@/app/models/Certification";
import { uploadFile, isUploadFile } from "@/lib/upload";

// get, post, put, delete banner api
export async function GET() {
    await connectDB();

    const certifications = await Certification.find();
    return Response.json(certifications);
}

export async function POST(request) {
    try {
        await connectDB();

        const formData = await request.formData();
        const title = formData.get("title");
        const status = formData.get("status");
        const sort = Number(formData.get("sort"));
        const logo = formData.get("logo");

        if (!isUploadFile(logo)) {
            return Response.json(
                { message: "Valid logo file is required" },
                { status: 400 }
            );
        }

        const imageUrl = await uploadFile(logo, "certification", "cert");

        // save to DB
        const certification = await Certification.create({
            title,
            status,
            sort,
            logo: imageUrl, 
        });
        
        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Certification created successfully",
            data: certification,
        });

    } catch (error) {
        return Response.json(
            { message: "Upload failed", error: error.message },
            { status: 500 }
        );
    }
}
