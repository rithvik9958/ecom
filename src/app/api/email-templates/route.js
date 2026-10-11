import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import EmailTemplate from "@/app/models/EmailTemplate";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const templates = await EmailTemplate.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json(templates);
    } catch (error) {
        return Response.json({ message: "Failed to fetch email templates", error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const data = await request.json();

        // Validate
        if (!data.name || !data.subject || !data.htmlContent) {
            return Response.json({ message: "Name, subject, and HTML content are required." }, { status: 400 });
        }

        // Auto-extract variables like {{firstName}} from HTML
        const regex = /{{(.*?)}}/g;
        let match;
        const variables = new Set();
        while ((match = regex.exec(data.htmlContent)) !== null) {
            variables.add(match[1].trim());
        }
        data.variables = Array.from(variables);

        const template = await EmailTemplate.create(data);
        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Template created successfully", data: template }, { status: 201 });
    } catch (error) {
        if (error.code === 11000) {
            return Response.json({ message: "Template name must be unique." }, { status: 400 });
        }
        return Response.json({ message: "Failed to create template", error: error.message }, { status: 500 });
    }
}
