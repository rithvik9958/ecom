export const dynamic = 'force-dynamic';

import { connectDB } from "@/app/lib/config";
import mongoose from "mongoose";

export async function GET() {
    const startTime = Date.now();
    try {
        await connectDB();
        
        // MongoDB connection states: 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        const isDbConnected = mongoose.connection.readyState === 1;
        const dbLatency = Date.now() - startTime;
        
        const memoryUsage = process.memoryUsage();
        // Convert to MB
        const formatMem = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

        const healthData = {
            status: "OK",
            uptimeSeconds: process.uptime(),
            timestamp: new Date().toISOString(),
            database: {
                status: isDbConnected ? "Connected" : "Disconnected",
                latencyMs: dbLatency
            },
            memory: {
                rss: formatMem(memoryUsage.rss), // Resident Set Size (total memory allocated for process execution)
                heapTotal: formatMem(memoryUsage.heapTotal), // Total size of allocated heap
                heapUsed: formatMem(memoryUsage.heapUsed), // Actual memory used during execution
                external: formatMem(memoryUsage.external) // Memory bound to V8 objects
            },
            // Note: process.cpuUsage() returns microseconds since process start, not a percentage.
            // On serverless (Vercel), CPU stats are often less relevant than memory.
            environment: process.env.NODE_ENV || "development"
        };

        return Response.json(healthData, { status: 200 });
    } catch (error) {
        return Response.json({
            status: "ERROR",
            message: "System Health Check Failed",
            error: error.message
        }, { status: 500 });
    }
}
