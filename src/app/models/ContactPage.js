import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    isActive: { type: Boolean, default: true },
});

const ContactPageSchema = new mongoose.Schema({
    // Page Header
    headerTitle: { type: String, default: "We’re Here to Help You Celebrate" },
    headerSubtitle: { type: String, default: "Have a question about your order, customized corporate hampers, or scheduled delivery? Reach out to our dedicated gifting concierges anytime." },
    headerImage: { type: String, default: "" },

    // Contact Channels (4 Symmetrical Cards)
    phone: { type: String, default: "+91 11-26802680" },
    phoneSub: { type: String, default: "Mon–Sun, 24 Hours Active" },

    email: { type: String, default: "support@cityshop.com" },
    emailSub: { type: String, default: "Avg. response under 15 mins" },

    address: { type: String, default: "Plot No. 75P, Sector-44, Gurugram, Haryana - 122003" },
    addressSub: { type: String, default: "CIN: U52100HR2021PTC118882" },

    deliveryHours: { type: String, default: "Same-Day: 8 AM – 9 PM\nMidnight: 11 PM – 11:59 PM" },
    deliveryHoursSub: { type: String, default: "365 Days a Year Across India" },

    // Direct Fast-Action Channels
    whatsappNumber: { type: String, default: "911126802680" },
    corporateEmail: { type: String, default: "corporate@cityshop.com" },

    // Interactive Map
    mapIframeUrl: { type: String, default: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.962635905063!2d77.0655!3d28.4505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d18f175402685%3A0x6b1070621415df82!2sSector%2044%2C%20Gurugram%2C%20Haryana%20122003!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" },

    // Locations Array
    locations: { type: [LocationSchema], default: [] },

    // SEO fields
    metatag: { type: String, default: "Contact Us - City Shop Support & Concierge" },
    metaDescription: { type: String, default: "Get in touch with City Shop customer concierge for 24/7 order assistance, midnight delivery, and customized gifting." },
    metakeywords: { type: [String], default: ["contact", "customer support", "gifting concierge", "flower delivery help"] },
    canonicalUrl: { type: String, default: "" },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    twitterCard: { type: String, default: "summary_large_image" },
    robots: { type: String, default: "index, follow" },
    schemaMarkup: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Always ensure model hot-reloads properly
if (mongoose.models.ContactPage) {
    delete mongoose.models.ContactPage;
}

export default mongoose.models.ContactPage || mongoose.model("ContactPage", ContactPageSchema);
