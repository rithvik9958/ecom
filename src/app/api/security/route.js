import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import SecuritySettings from "@/app/models/SecuritySettings";
import { logActivity } from "@/lib/logger";
import { requireSuperAdmin, verifyToken } from '@/app/lib/auth';

export async function GET(request) {
    try {
        await verifyToken(request);
        await connectDB();
        let settings = await SecuritySettings.findOne();
        if (!settings) {
            settings = await SecuritySettings.create({});
        }
        return Response.json({ data: settings });
    } catch (error) {
        return Response.json({ message: "Failed to fetch security settings", error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectDB();
        const data = await request.json();
        
        let settings = await SecuritySettings.findOne();
        if (!settings) {
            settings = await SecuritySettings.create(data);
        } else {
            settings = await SecuritySettings.findByIdAndUpdate(settings._id, data, { new: true });
        }

        // Ideally, we'd get the user from the token in request headers for logging
        // For simplicity, we just log it as a System level change or grab it if passed
        await logActivity('Updated Security Settings', 'Security', `Updated rate limits or blocked IPs.`);

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Settings updated successfully", data: settings });
    } catch (error) {
        return Response.json({ message: "Failed to update security settings", error: error.message }, { status: 500 });
    }
}
