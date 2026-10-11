import { revalidatePath } from "next/cache";
import { sendTestEmail } from "@/lib/email";
import { connectDB } from "@/app/lib/config";
import EmailTemplate from "@/app/models/EmailTemplate";

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        const data = await request.json();
        
        const { templateId, toEmail } = data;

        if (!templateId || !toEmail) {
            return Response.json({ message: "Template ID and target Email are required." }, { status: 400 });
        }

        const template = await EmailTemplate.findById(templateId);
        
        if (!template) {
            return Response.json({ message: "Template not found" }, { status: 404 });
        }

        // Send Email Asynchronously and await it so it works on Vercel
        await sendTestEmail(toEmail, template.subject, template.htmlContent);

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: `Test email sent to ${toEmail}` }, { status: 200 });
    } catch (error) {
        console.error("Test Email error:", error);
        return Response.json({ message: "Failed to send test email", error: error.message }, { status: 500 });
    }
}
