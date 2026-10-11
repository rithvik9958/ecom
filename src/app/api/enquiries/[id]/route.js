import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Enquiry from "@/app/models/Enquiry";
import { sendUpdatedEnquiryEmail } from "@/lib/email";

export async function PUT(request, context) {
    try {
        await connectDB();
        const { id } = await context.params;
        const data = await request.json();

        // Only allow updating status for now
        // Or if updating from step 2, we update the whole object
        const updateData = {};
        if (data.status) updateData.status = data.status;
        
        // Merge any other fields passed
        Object.assign(updateData, data);

        const enquiry = await Enquiry.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!enquiry) {
            return Response.json({ message: "Enquiry not found" }, { status: 404 });
        }

        // Send Email Asynchronously for Technical Details if applicable
        // MUST await on Vercel otherwise serverless function freezes the background task
        if (data.standard || data.qty || data.grade || data.thicknessMin || data.specialRequirements) {
            try {
                await sendUpdatedEnquiryEmail(enquiry);
            } catch (err) {
                console.error("Email sending failed:", err);
            }
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Enquiry updated", data: enquiry });
    } catch (error) {
        return Response.json({ message: "Update failed", error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    try {
        await connectDB();
        const { id } = await context.params;

        const enquiry = await Enquiry.findByIdAndDelete(id);

        if (!enquiry) {
            return Response.json({ message: "Enquiry not found" }, { status: 404 });
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Enquiry deleted successfully" });
    } catch (error) {
        return Response.json({ message: "Delete failed", error: error.message }, { status: 500 });
    }
}
