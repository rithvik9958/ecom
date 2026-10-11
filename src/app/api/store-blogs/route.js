import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/config';
import Blog from '@/app/models/Blog';
import { getEcomBlogPage } from '@/app/models/EcomBlogPage';

export const dynamic = 'force-dynamic';

const DEFAULT_BLOGS = [
  {
    title: 'The Ultimate Guide to Selecting Flowers for Every Milestone Celebration',
    slug: 'flower-selection-guide-milestones',
    category: 'Floral Guides',
    author: 'Chief Floral Stylist',
    readTime: '5 min read',
    excerpt: 'Discover the symbolic meanings, longevity secrets, and ideal color palettes for red roses, orchids, lilies, and carnations.',
    content: `
      <p>Flowers have conveyed human emotions across cultures for thousands of years. Whether expressing romantic devotion, heartfelt gratitude, or festive cheer, choosing the right floral arrangement elevates your gift from thoughtful to unforgettable.</p>
      
      <h2>1. Red Roses: The Eternal Language of Passion</h2>
      <p>Classic crimson roses remain the premier choice for anniversaries, Valentine’s Day, and romantic milestones. A bouquet of 50 or 100 long-stemmed Ecuadorian or Dutch roses conveys deep admiration and lasting commitment.</p>
      
      <h2>2. Asiatic & Oriental Lilies: Elegance and Prosperity</h2>
      <p>With their intoxicating fragrance and magnificent star-shaped petals, lilies represent rebirth, purity, and regal sophistication. They make exquisite choices for housewarmings, formal celebrations, and wedding congratulations.</p>
      
      <h2>3. Orchids: Exotic Grace & Longevity</h2>
      <p>Orchids symbolize rare beauty, luxury, and resilience. As one of the longest-lasting cut flowers, purple and white dendrobium orchids maintain pristine beauty for up to two weeks with proper hydration.</p>
      
      <blockquote>
        “A single flower can express what a thousand spoken words cannot. Treat every arrangement with fresh water and care to preserve its beauty.”
      </blockquote>

      <h2>Pro Tips for Fresh Flower Longevity</h2>
      <ul>
        <li>Trim flower stems diagonally by 1 inch under cool running water before placing in a vase.</li>
        <li>Change vase water every 48 hours and add flower food if available.</li>
        <li>Keep blooms away from direct sunlight, heating vents, and air conditioning drafts.</li>
      </ul>
    `,
    isPublished: true,
    featured: true,
    publishedAt: '2026-08-20',
    coverImage: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=1200&auto=format&fit=crop'
  },
  {
    title: 'Top 7 Irresistible Cake Flavors Trending in 2026',
    slug: 'top-7-cake-flavors-2026',
    category: 'Gourmet Bakery',
    author: 'Master Pastry Chef',
    readTime: '4 min read',
    excerpt: 'From Belgian Dark Truffle to Lotus Biscoff Cheesecake and Fresh Berry Mascarpone, explore the flavors redefining celebratory dining.',
    content: `
      <p>Modern celebrations demand confections that are not merely sweet, but multi-layered culinary experiences. Our master pastry chefs have curated the top artisan flavor profiles stealing the spotlight this year.</p>
      
      <h2>1. Belgian Dark Chocolate Truffle with Sea Salt</h2>
      <p>Crafted with 70% single-origin Belgian cocoa, silky ganache, and micro-flaked Maldon sea salt for a balanced, decadent finish.</p>
      
      <h2>2. Lotus Biscoff Caramelized Crunch Cheesecake</h2>
      <p>Silky baked New York cheesecake topped with warm spiced speculoos spread and crunchy biscuit crumbles.</p>
      
      <h2>3. Fresh Himalayan Strawberry Mascarpone</h2>
      <p>Layers of light vanilla sponge, fresh strawberry compote, and whipped Italian mascarpone cream for refreshing summer celebrations.</p>

      <h2>4. Roasted Hazelnut Praline & Espresso Crunch</h2>
      <p>Nutty, aromatic, and layered with rich espresso cream and crunchy caramelized hazelnut clusters.</p>
    `,
    isPublished: true,
    featured: true,
    publishedAt: '2026-08-18',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop'
  },
  {
    title: 'Midnight Delivery Secrets: How We Guarantee 11:59 PM Surprises',
    slug: 'midnight-delivery-secrets-explained',
    category: 'Gifting Logistics',
    author: 'Operations Director',
    readTime: '4 min read',
    excerpt: 'Go behind the scenes of our specialized midnight fulfillment hubs and cold-chain delivery fleet.',
    content: `
      <p>There is nothing quite like hearing the doorbell ring at the stroke of midnight with a fresh floral bouquet and freshly baked cake. Discover how City Shop orchestrates thousands of simultaneous midnight deliveries across 19,000+ PIN codes with 99.4% on-time precision.</p>
      
      <h2>1. Pre-Route Temperature Mapping</h2>
      <p>All perishables are dispatched in custom insulated coolers maintaining a steady 16°C to preserve cake structure and petal crispness.</p>
      
      <h2>2. Live GPS & Proximity Tracking</h2>
      <p>Our dispatch system schedules rider departures with predictive traffic buffers, ensuring our executive reaches the doorstep between 11:45 PM and 11:59 PM.</p>
    `,
    isPublished: true,
    featured: false,
    publishedAt: '2026-08-15',
    coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop'
  },
  {
    title: 'Anniversary Gift Ideas: From Paper Milestones to Golden Jubilees',
    slug: 'anniversary-gift-ideas-milestones',
    category: 'Anniversary & Milestones',
    author: 'Gifting Concierge Lead',
    readTime: '6 min read',
    excerpt: 'Find heartfelt personalized hampers, bespoke flower boxes, and luxury keepsake gift recommendations.',
    content: `
      <p>Every milestone anniversary tells a unique chapter of enduring love. Celebrate year one through year fifty with handpicked luxury arrangements that capture timeless romance.</p>
      <h2>First Anniversary: Paper & Modern Florals</h2>
      <p>Complement traditional paper gifts with a custom photo cake and personalized message scroll nestled among delicate blush carnations.</p>
    `,
    isPublished: true,
    featured: false,
    publishedAt: '2026-08-10',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop'
  }
];

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    // Auto seed default articles if blog collection is empty
    const count = await Blog.countDocuments();
    if (count === 0) {
      await Blog.insertMany(DEFAULT_BLOGS);
    }

    const BlogPage = await getEcomBlogPage();
    let config = await BlogPage.findOne({ key: 'global_blog' }).lean();
    if (!config) {
      config = await BlogPage.create({ key: 'global_blog' });
    }

    if (slug) {
      // Increment view count on single article view
      let blog = await Blog.findOneAndUpdate(
        { slug, isPublished: true },
        { $inc: { views: 1 } },
        { new: true }
      ).lean();

      if (!blog) {
        const defaultBlog = DEFAULT_BLOGS.find((b) => b.slug === slug);
        if (defaultBlog) {
          blog = await Blog.findOneAndUpdate(
            { slug },
            { $setOnInsert: defaultBlog },
            { upsert: true, new: true }
          ).lean();
        }
      }

      if (!blog) {
        return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
      }

      // Fetch related posts (prioritize same category first)
      let related = await Blog.find({ category: blog.category, slug: { $ne: slug }, isPublished: true })
        .limit(4)
        .select('title slug coverImage category author publishedAt createdAt readTime')
        .lean();

      if (!related || related.length < 4) {
        const existingSlugs = [slug, ...(related || []).map((r) => r.slug)];
        const additional = await Blog.find({ slug: { $nin: existingSlugs }, isPublished: true })
          .limit(4 - (related?.length || 0))
          .select('title slug coverImage category author publishedAt createdAt readTime')
          .lean();
        related = [...(related || []), ...(additional || [])];
      }

      return NextResponse.json({ success: true, blog, related, config });
    }

    // Return all published blogs
    const blogs = await Blog.find({ isPublished: true }).sort({ sort: 1, createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      blogs: blogs || [],
      config
    });
  } catch (error) {
    console.error('Error in store-blogs API:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const { id, action } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Blog ID is required' }, { status: 400 });
    }

    const increment = action === 'unlike' ? -1 : 1;
    const updated = await Blog.findByIdAndUpdate(
      id,
      { $inc: { likes: increment } },
      { new: true }
    );

    return NextResponse.json({ success: true, blog: updated });
  } catch (error) {
    console.error('Error in store-blogs PUT:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
