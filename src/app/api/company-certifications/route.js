import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import CompanyCertification from "@/app/models/CompanyCertification";
import { uploadFile, isUploadFile } from "@/lib/upload";

export async function GET(request) {
    await connectDB();
    const certs = await CompanyCertification.find().sort({ sort: 1, createdAt: -1 });
    return Response.json(certs);
}

export async function POST(request) {
    try {
        await connectDB();
        const formData = await request.formData();
        
        const name = formData.get("name");
        const sub_title = formData.get("sub_title") || "";
        const third_title = formData.get("third_title") || "";
        const status = formData.get("status") || "active";
        const sort = formData.get("sort") || 0;
        
        const file = formData.get("file");

        if (!isUploadFile(file)) {
            return Response.json({ message: "Valid file is required" }, { status: 400 });
        }

        const file_url = await uploadFile(file, "certifications", "cert");

        const newCert = await CompanyCertification.create({
            name,
            sub_title,
            third_title,
            status,
            sort,
            file_url
        });

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Certificate created", data: newCert });
    } catch (error) {
        return Response.json({ message: "Creation failed", error: error.message }, { status: 500 });
    }
}
