import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import EmailTemplate from "@/app/models/EmailTemplate";

export async function PUT(request, context) {
    try {
        await connectDB();
        const { id } = await context.params;
        const data = await request.json();

        if (data.htmlContent) {
            const regex = /{{(.*?)}}/g;
            let match;
            const variables = new Set();
            while ((match = regex.exec(data.htmlContent)) !== null) {
                variables.add(match[1].trim());
            }
            data.variables = Array.from(variables);
        }

        const template = await EmailTemplate.findByIdAndUpdate(id, data, { new: true });
        
        if (!template) {
            return Response.json({ message: "Template not found" }, { status: 404 });
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Template updated successfully", data: template });
    } catch (error) {
        if (error.code === 11000) {
            return Response.json({ message: "Template name must be unique." }, { status: 400 });
        }
        return Response.json({ message: "Failed to update template", error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    try {
        await connectDB();
        const { id } = await context.params;
        const template = await EmailTemplate.findByIdAndDelete(id);

        if (!template) {
            return Response.json({ message: "Template not found" }, { status: 404 });
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Template deleted successfully" });
    } catch (error) {
        return Response.json({ message: "Failed to delete template", error: error.message }, { status: 500 });
    }
}
