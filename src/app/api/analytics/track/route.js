import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import PageVisit from "@/app/models/PageVisit";
import { v4 as uuidv4 } from 'uuid';

function parseUserAgent(ua) {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'desktop' };
    
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'IE';

    let os = 'Unknown';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac OS X')) os = 'iOS';

    let device = 'desktop';
    if (ua.match(/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/)) {
        device = 'mobile';
    } else if (ua.match(/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i)) {
        device = 'tablet';
    }

    return { browser, os, device };
}

export async function POST(request) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { path, sessionId, duration } = body;

        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'Unknown';
        const userAgent = request.headers.get('user-agent') || '';
        
        // Very basic mock country derivation based on IP (since we don't have GeoIP DB)
        // In production, use MaxMind or request.headers.get('cf-ipcountry') in Cloudflare
        const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'IN'; // default IN for Jindal

        const { browser, os, device } = parseUserAgent(userAgent);
        
        const generatedSessionId = sessionId || uuidv4();

        // Check if updating duration or creating new view
        if (duration && sessionId) {
            // Usually, frontend would send ping updates
            const existing = await PageVisit.findOne({ sessionId, path }).sort({ createdAt: -1 });
            if (existing) {
                existing.duration = Math.max(existing.duration, duration);
                await existing.save();
                return Response.json({ success: true, sessionId: generatedSessionId });
            }
        }

        await PageVisit.create({
            path: path || '/',
            ipAddress,
            userAgent,
            browser,
            os,
            device,
            country,
            sessionId: generatedSessionId,
            duration: 0
        });

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ success: true, sessionId: generatedSessionId });
    } catch (error) {
        console.error("Analytics Track Error:", error);
        return Response.json({ success: false }, { status: 500 });
    }
}
