export const dynamic = 'force-dynamic';
import { connectDB } from "@/app/lib/config";
import Section from "@/app/models/Section";

const INITIAL_SECTIONS = [
  { name: "About Us", slug: "aboutus", bannerImage: "/images/slide1.jpg", sort: 1 },
  { name: "Corporate Information", slug: "corporate-information", bannerImage: "/images/slide1.jpg", sort: 2 },
  { name: "Quality", slug: "quality", bannerImage: "/images/slide2.jpg", sort: 3 },
  { name: "Human Resource", slug: "human-resource", bannerImage: "/images/slide2.jpg", sort: 4 },
  { name: "Infrastructure", slug: "infrastructure", bannerImage: "/images/slide1.jpg", sort: 5 },
];

export async function GET() {
    try {
        await connectDB();
        let count = 0;

        for (const sec of INITIAL_SECTIONS) {
            const existing = await Section.findOne({ slug: sec.slug });
            if (!existing) {
                await Section.create({
                    name: sec.name,
                    slug: sec.slug,
                    bannerImage: sec.bannerImage,
                    sort: sec.sort,
                    isActive: true,
                });
                count++;
            }
        }
        
        return Response.json({ message: `Successfully seeded ${count} sections.` });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
