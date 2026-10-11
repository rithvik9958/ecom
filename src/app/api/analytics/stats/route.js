export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import PageVisit from "@/app/models/PageVisit";
import { verifyToken } from '@/app/lib/auth';

export async function GET(request) {
    try {
        await verifyToken(request);
        await connectDB();
        
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // 1. Visitors Today (Unique Sessions today)
        const visitorsToday = await PageVisit.distinct('sessionId', {
            createdAt: { $gte: startOfDay }
        });

        // 2. Total Active Users (Users who had activity in last 5 minutes)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
        const activeUsers = await PageVisit.distinct('sessionId', {
            updatedAt: { $gte: fiveMinutesAgo }
        });

        // 3. Page Views (Total records today)
        const pageViews = await PageVisit.countDocuments({
            createdAt: { $gte: startOfDay }
        });

        // 4. Top Pages (Aggregation)
        const topPages = await PageVisit.aggregate([
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: "$path", views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: 5 }
        ]);

        // 5. Bounce Rate (Sessions with only 1 page view / Total Sessions)
        const sessionCounts = await PageVisit.aggregate([
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: "$sessionId", count: { $sum: 1 } } }
        ]);
        const totalSessions = sessionCounts.length;
        const bouncedSessions = sessionCounts.filter(s => s.count === 1).length;
        const bounceRate = totalSessions > 0 ? ((bouncedSessions / totalSessions) * 100).toFixed(1) : 0;

        // 6. Device Breakdown
        const devices = await PageVisit.aggregate([
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: "$device", count: { $sum: 1 } } }
        ]);

        // 7. Browser Statistics
        const browsers = await PageVisit.aggregate([
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: "$browser", count: { $sum: 1 } } }
        ]);

        // 8. Country Statistics
        const countries = await PageVisit.aggregate([
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: "$country", count: { $sum: 1 } } }
        ]);

        return Response.json({
            visitorsToday: visitorsToday.length,
            activeUsers: activeUsers.length,
            pageViews,
            bounceRate,
            topPages: topPages.map(p => ({ path: p._id, views: p.views })),
            devices: devices.map(d => ({ name: d._id, value: d.count })),
            browsers: browsers.map(b => ({ name: b._id, value: b.count })),
            countries: countries.map(c => ({ name: c._id, value: c.count }))
        });

    } catch (error) {
        console.error("Analytics Stats Error:", error);
        return Response.json({ message: "Failed to fetch stats" }, { status: 500 });
    }
}
