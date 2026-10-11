import { connectDB } from "./src/lib/config.js";
import About from "./src/app/models/About.js";
import { sections } from "./src/lib/sections.js";
import mongoose from "mongoose";

async function seed() {
  try {
    await connectDB();
    const aboutData = sections.aboutus.pages;
    
    // Clear existing
    // await About.deleteMany({}); // Don't clear in case they added some

    let sortIndex = 1;
    for (const slug of Object.keys(aboutData)) {
      const page = aboutData[slug];
      
      const exists = await About.findOne({ slug });
      if (!exists) {
        await About.create({
          slug: slug,
          title: page.title,
          bannerImage: page.bannerImage,
          description: page.description,
          content: page.content,
          sort: sortIndex++,
          isActive: true,
          metatag: page.seo?.title || "",
          metaDescription: page.seo?.description || "",
        });
        console.log(`Created: ${slug}`);
      } else {
        console.log(`Skipped (already exists): ${slug}`);
      }
    }
    
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    process.exit(0);
  }
}

seed();
