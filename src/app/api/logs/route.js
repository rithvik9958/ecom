export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import ActivityLog from "@/app/models/ActivityLog";

import { verifyToken } from "@/app/lib/auth";

export async function GET(request) {
    try {
        await verifyToken(request);
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 100;

        // Optionally add filtering here if needed (e.g., by module)
        
        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return Response.json(logs);
    } catch (error) {
        return Response.json({ message: "Failed to fetch logs", error: error.message }, { status: 500 });
    }
}
