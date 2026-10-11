export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Enquiry from "@/app/models/Enquiry";

export async function GET(request) {
    try {
        await connectDB();
        
        // Fetch all enquiries, sorted by newest
        const enquiries = await Enquiry.find().sort({ createdAt: -1 }).lean();

        if (enquiries.length === 0) {
            return Response.json({ message: "No enquiries found to export." }, { status: 404 });
        }

        // CSV Header
        const headers = [
            "Date", "Company Name", "Contact Person", "Email", "Phone", 
            "Status", "Address", "Standard", "Grade", "Thickness Min", 
            "Thickness Max", "Width Min", "Width Max", "Qty", "Surface Finish",
            "Hardness", "Select Option", "UTS", "YS", "Elongation", 
            "End Use", "Special Requirements"
        ];

        // Map data to rows
        const rows = enquiries.map(eq => {
            return [
                new Date(eq.createdAt).toLocaleString().replace(/,/g, ''), // Avoid commas in date
                `"${(eq.companyName || '').replace(/"/g, '""')}"`,
                `"${(eq.contactPerson || '').replace(/"/g, '""')}"`,
                `"${(eq.email || '').replace(/"/g, '""')}"`,
                `"${(eq.contactNo || '').replace(/"/g, '""')}"`,
                eq.status || 'new',
                `"${(eq.address || '').replace(/"/g, '""')}"`,
                `"${(eq.standard || '').replace(/"/g, '""')}"`,
                `"${(eq.grade || '').replace(/"/g, '""')}"`,
                `"${(eq.thicknessMin || '').replace(/"/g, '""')}"`,
                `"${(eq.thicknessMax || '').replace(/"/g, '""')}"`,
                `"${(eq.widthMin || '').replace(/"/g, '""')}"`,
                `"${(eq.widthMax || '').replace(/"/g, '""')}"`,
                `"${(eq.qty || '').replace(/"/g, '""')}"`,
                `"${(eq.surfaceFinish || '').replace(/"/g, '""')}"`,
                `"${(eq.hardness || '').replace(/"/g, '""')}"`,
                `"${(eq.selectOne || '').replace(/"/g, '""')}"`,
                `"${(eq.uts || '').replace(/"/g, '""')}"`,
                `"${(eq.ys || '').replace(/"/g, '""')}"`,
                `"${(eq.elongation || '').replace(/"/g, '""')}"`,
                `"${(eq.endUse || '').replace(/"/g, '""')}"`,
                `"${(eq.specialRequirements || '').replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="enquiries_export.csv"',
            }
        });
    } catch (error) {
        return Response.json({ message: "Failed to export data", error: error.message }, { status: 500 });
    }
}
