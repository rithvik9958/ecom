import { connectDB } from "../app/lib/config";
import ActivityLog from "../app/models/ActivityLog";

export async function logActivity(action, module, details = '', user = null, ipAddress = '') {
    try {
        await connectDB();
        await ActivityLog.create({
            action,
            module,
            userId: user?._id || null,
            userName: user?.name || 'System',
            details,
            ipAddress
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}
