import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Work from "@/app/models/Work";
import { uploadFile, isUploadFile } from "@/lib/upload";

// get, post, put, delete banner api
export async function GET() {
    await connectDB();

    const works = await Work.find();
    return Response.json(works);
}

export async function POST(request) {
    try {
        await connectDB();

        const formData = await request.formData();
        const title = formData.get("title");
        const status = formData.get("status");
        const sort = Number(formData.get("sort"));
        const category = formData.get("category") || "Industry";
        const logo = formData.get("logo");

        if (!isUploadFile(logo)) {
            return Response.json(
                { message: "Valid logo file is required" },
                { status: 400 }
            );
        }

        const imageUrl = await uploadFile(logo, "work", "work");

        // save to DB
        const work = await Work.create({
            title,
            status,
            sort,
            category,
            logo: imageUrl, 
        });
        
        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({
            message: "Work created successfully",
            data: work,
        });

    } catch (error) {
        return Response.json(
            { message: "Upload failed", error: error.message },
            { status: 500 }
        );
    }
}
