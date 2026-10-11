import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import ContactPage from "@/app/models/ContactPage";
import { uploadFile, isUploadFile } from "@/lib/upload";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        await connectDB();
        let page = await ContactPage.findOne().lean();
        if (!page) {
            page = await ContactPage.create({});
        }
        return Response.json({ success: true, data: page });
    } catch (error) {
        return Response.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectDB();
        const formData = await request.formData();

        let page = await ContactPage.findOne();
        if (!page) {
            page = new ContactPage();
        }

        // Process File Uploads
        const headerImage = formData.get("headerImage");
        if (isUploadFile(headerImage)) {
            page.headerImage = await uploadFile(headerImage, "contact", "header");

            // Delete old image if it's a local file
            if (page.headerImage && page.headerImage.startsWith("/uploads/")) {
                try {
                    const oldPath = path.join(process.cwd(), "public", page.headerImage);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                } catch (fsErr) {
                    console.warn("Could not delete old contact header image:", fsErr.message);
                }
            }
        }

        // Hero Header Fields
        if (formData.has("headerTitle")) page.headerTitle = formData.get("headerTitle");
        if (formData.has("headerSubtitle")) page.headerSubtitle = formData.get("headerSubtitle");

        // Contact Channels (4 Symmetrical Cards)
        if (formData.has("phone")) page.phone = formData.get("phone");
        if (formData.has("phoneSub")) page.phoneSub = formData.get("phoneSub");

        if (formData.has("email")) page.email = formData.get("email");
        if (formData.has("emailSub")) page.emailSub = formData.get("emailSub");

        if (formData.has("address")) page.address = formData.get("address");
        if (formData.has("addressSub")) page.addressSub = formData.get("addressSub");

        if (formData.has("deliveryHours")) page.deliveryHours = formData.get("deliveryHours");
        if (formData.has("deliveryHoursSub")) page.deliveryHoursSub = formData.get("deliveryHoursSub");

        // Fast Action Channels
        if (formData.has("whatsappNumber")) page.whatsappNumber = formData.get("whatsappNumber");
        if (formData.has("corporateEmail")) page.corporateEmail = formData.get("corporateEmail");

        // Map & Legacy Content
        if (formData.has("contactSubTitle")) page.contactSubTitle = formData.get("contactSubTitle");
        if (formData.has("contactTitle")) page.contactTitle = formData.get("contactTitle");
        if (formData.has("contactDescription")) page.contactDescription = formData.get("contactDescription");
        if (formData.has("mapIframeUrl")) page.mapIframeUrl = formData.get("mapIframeUrl");

        // Locations Array
        if (formData.has("locations")) {
            try {
                const locations = JSON.parse(formData.get("locations"));
                if (Array.isArray(locations)) {
                    page.locations = locations;
                }
            } catch (e) {
                console.error("Invalid locations JSON format");
            }
        }

        // SEO Fields
        if (formData.has("metatag")) page.metatag = formData.get("metatag");
        if (formData.has("metaDescription")) page.metaDescription = formData.get("metaDescription");
        if (formData.has("canonicalUrl")) page.canonicalUrl = formData.get("canonicalUrl");
        if (formData.has("ogTitle")) page.ogTitle = formData.get("ogTitle");
        if (formData.has("ogDescription")) page.ogDescription = formData.get("ogDescription");
        if (formData.has("twitterCard")) page.twitterCard = formData.get("twitterCard");
        if (formData.has("robots")) page.robots = formData.get("robots");

        if (formData.has("metakeywords")) {
            try {
                page.metakeywords = JSON.parse(formData.get("metakeywords"));
            } catch (e) {}
        }
        
        if (formData.has("schemaMarkup")) {
            try {
                page.schemaMarkup = JSON.parse(formData.get("schemaMarkup"));
            } catch (e) {}
        }

        await page.save();

        // On-Demand Revalidation
        revalidatePath('/', 'layout');
        revalidatePath('/contact');
        return Response.json({ success: true, message: "Contact Page updated", data: page });
    } catch (error) {
        console.error(error);
        return Response.json({ success: false, message: error.message }, { status: 500 });
    }
}
