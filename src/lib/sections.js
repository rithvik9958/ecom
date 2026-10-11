import { connectDB } from "../app/lib/config";
import AboutPage from "../app/models/About";

// Hardcoded sections metadata (just the labels and default banners, since pages hold their own data)
const SECTION_METADATA = {
  "aboutus": { label: "About Us", bannerImage: "/images/slide1.jpg" },
  "corporate-information": { label: "Corporate Information", bannerImage: "/images/slide1.jpg" },
  "quality": { label: "Quality", bannerImage: "/images/slide2.jpg" },
  "infrastructure": { label: "Infrastructure", bannerImage: "/images/slide1.jpg" },
  "human-resource": { label: "Human Resource", bannerImage: "/images/slide2.jpg" }
};

/**
 * Get section config by section key.
 * @param {string} sectionKey
 */
export async function getSection(sectionKey) {
  await connectDB();
  const pages = await AboutPage.find({ section: sectionKey, isActive: true }).sort({ sort: 1 }).lean();
  
  if (!pages || pages.length === 0) return null;

  const meta = SECTION_METADATA[sectionKey] || { label: sectionKey, bannerImage: "" };

  return {
    label: meta.label,
    bannerImage: meta.bannerImage,
    nav: pages.map(p => ({ title: p.title, slug: p.slug }))
  };
}

/**
 * Get a single page's data within a section.
 * @param {string} sectionKey
 * @param {string} slug
 */
export async function getSectionPage(sectionKey, slug) {
  await connectDB();
  const page = await AboutPage.findOne({ section: sectionKey, slug, isActive: true }).lean();
  
  if (!page) return null;

  return {
    title: page.title,
    bannerImage: page.bannerImage,
    description: page.metaDescription || "",
    content: page.content,
    seo: {
      title: page.metatag || page.title,
      description: page.metaDescription || "",
      ogImage: page.ogImage || page.bannerImage,
      keywords: page.metakeywords,
      canonical: page.canonicalUrl,
      ogTitle: page.ogTitle,
      ogDescription: page.ogDescription,
      twitterCard: page.twitterCard,
      robots: page.robots
    },
    schemaMarkup: page.schemaMarkup
  };
}

/**
 * Get all section keys (for generateStaticParams).
 */
export function getAllSectionKeys() {
  return Object.keys(SECTION_METADATA);
}
