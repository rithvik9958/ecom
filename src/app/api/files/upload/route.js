import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { uploadFile } from "@/lib/upload";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return Response.json({ message: "No file provided" }, { status: 400 });
        }

        const url = await uploadFile(file, 'manager', 'file');

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "File uploaded successfully", url });
    } catch (error) {
        console.error("Upload failed:", error);
        return Response.json({ message: "Upload failed", error: error.message }, { status: 500 });
    }
}
