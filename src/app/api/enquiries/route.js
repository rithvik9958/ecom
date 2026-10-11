import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Enquiry from "@/app/models/Enquiry";
import { sendNewEnquiryEmail } from "@/lib/email";

// Simple in-memory rate limiting map (resets on server restart)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;


export async function GET() {
    try {
        await connectDB();
        const enquiries = await Enquiry.find().sort({ createdAt: -1 }).lean();
        return Response.json(enquiries);
    } catch (error) {
        return Response.json({ message: "Failed to fetch enquiries", error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        // Basic IP-based rate limiting
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        const now = Date.now();
        const clientData = rateLimitMap.get(ip) || { count: 0, firstRequest: now };
        
        if (now - clientData.firstRequest > RATE_LIMIT_WINDOW_MS) {
            clientData.count = 1;
            clientData.firstRequest = now;
        } else {
            clientData.count++;
            if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
                return Response.json({ message: "Too many requests. Please try again later." }, { status: 429 });
            }
        }
        rateLimitMap.set(ip, clientData);

        await connectDB();
        const data = await request.json();

        // Validate required fields
        if (!data.companyName || !data.contactPerson || !data.email || !data.contactNo) {
            return Response.json({ message: "Company Name, Contact Person, Email, and Contact No are required." }, { status: 400 });
        }

        // Basic Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return Response.json({ message: "Please provide a valid email address." }, { status: 400 });
        }

        const enquiry = await Enquiry.create(data);

        // Send Email Asynchronously
        // MUST await on Vercel otherwise serverless function freezes the background task
        try {
            await sendNewEnquiryEmail(data);
        } catch (err) {
            console.error("Email sending failed:", err);
            // We swallow the error so the user still gets a success message for their submission
        }

        
    // On-Demand Revalidation
    revalidatePath('/', 'layout');
    return Response.json({ message: "Enquiry submitted successfully", data: enquiry }, { status: 201 });
    } catch (error) {
        return Response.json({ message: "Failed to submit enquiry", error: error.message }, { status: 500 });
    }
}
