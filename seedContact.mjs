import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectDB } from "./src/app/lib/config.js";
import ContactPage from "./src/app/models/ContactPage.js";

const seed = async () => {
  await connectDB();

  const defaultLocations = [
    {
      title: "INTERNATIONAL MARKETING & WORKS",
      address:
        "Dehkora Road, Vill. Rohad, Distt. Jhajjar, Bahadurgarh, Haryana - 124 501, INDIA",
      phone: "1276-225800, (For Sales Enquiry) +91 9323582341, +91 9711599243",
      email: "anjesh.karn@jindalmetal.com, deepak.valiyan@jindalmetal.com",
    },
    {
      title: "HARDENED & TEMPERED (H&T DIVISION)",
      address:
        "Dehkora Road, Vill. Rohad, Distt. Jhajjar, Bahadurgarh, Haryana - 124 501, INDIA",
      phone: "1276-225800, (For Sales Enquiry) +91 9711599243",
      email:
        "deepak.valiyan@jindalmetal.com, htsales@jindalmetal.com, info@jindalmetal.com",
    },
    {
      title: "REGISTERED OFFICE & NORTHERN REGION",
      address:
        "28, Nazafgarh Road, Shivaji Marg, Moti Nagar, New-Delhi 110 015, INDIA",
      phone: "+91-11-66463614, +91-9313959506, 11-66463982",
      email: "northzone@jindalmetal.com",
    },
    {
      title: "WESTERN REGION",
      address:
        "IInd Floor, Jindal Mansion, 5A, G.Deshmukh Marg, Mumbai 400 026, INDIA",
      phone: "+91-22-45426560, +91-7496962920, 22-23526400",
      email: "westzone@jindalmetal.com",
    },
    {
      title: "SOUTHERN REGION",
      address:
        "3G 3rd Floor, Centuri Plaza, 526/27, AnnaSalai, Teynampet, Chennai 600 018. INDIA",
      phone: "44-42012633, 9382330400, 9380004100",
      email: "dinesh.p@jindalmetal.com, marketingsouth@jindalmetal.com",
    },
  ];

  let page = await ContactPage.findOne();
  if (!page) {
    page = new ContactPage();
  }

  // Set defaults only if empty
  if (!page.locations || page.locations.length === 0) {
    page.locations = defaultLocations;
  }
  
  if (!page.mapIframeUrl) {
      page.mapIframeUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3498.9623728499155!2d77.17327517541439!3d28.720670480072922!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d01f23405c8c9%3A0xfa51f0bb0bce2b00!2z8J2QlvCdkJ7wnZCbIPCdkJPwnZCy8J2QnPCdkKjwnZCo8J2Qp_CdkKzCrg!5e0!3m2!1sen!2sin!4v1780396848209!5m2!1sen!2sin";
  }

  if (!page.contactTitle) page.contactTitle = "Contact Us";
  if (!page.contactSubTitle) page.contactSubTitle = "Get In Touch";
  if (!page.contactDescription) page.contactDescription = "Looking for reliable metal solutions? Our experts are ready to assist you with product information, technical guidance, and customized requirements.";
  
  await page.save();
  console.log("Seeded Contact Page successfully!");
  process.exit();
};

seed().catch(console.error);
