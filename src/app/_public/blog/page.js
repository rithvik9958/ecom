import PageHeader from "src/components/layout/PageHeader";
import BlogCard from "src/components/features/blog/BlogCard";

import { connectDB } from "@/app/lib/config";
import Blog from "@/app/models/Blog";
import PageBanner from "@/app/models/PageBanner";

export const metadata = {
  title: "Blog & Updates | Jindal Metals & Alloys Ltd",
  description:
    "Read the latest industry news, manufacturing updates, and articles from Jindal Metals & Alloys Ltd on stainless steel, production technology, and sustainability.",
  alternates: {
    canonical: "https://jindalmetal.com/blog",
  },
};

export const revalidate = 3600; // 1 hour ISR

async function getBlogs() {

    await connectDB();
    const blogs = await Blog.find({ isPublished: true }).sort({ sort: 1, createdAt: -1 }).lean();
    return blogs.map(b => ({
        id: b._id.toString(),
        image: b.coverImage || "/images/slide1.jpg",
        date: b.publishedAt || new Date(b.createdAt).toLocaleDateString(),
        category: b.category || "Industry",
        title: b.title,
        link: `/blog/${b.slug}`,
    }));
}

export default async function BlogPage() {
    await connectDB();
    const blogData = await getBlogs();

    const banner = await PageBanner.findOne({ pageKey: 'blog', isActive: true }).lean();


    const breadcrumb = [
        { name: "Home", href: "/" },
        { name: "Blog" }
    ];

    return (
        <>
            <PageHeader
                title={banner?.title || "Our Blog & Articles"}
                bgImage={banner?.image || "/images/slide2.jpg"}
                breadcrumb={breadcrumb}
            />

            {/* Main content grid: 3 per row on large screens (col-lg-4), 2 per row on medium (col-md-6) */}
            <section className="blog-page-section my-5">
                <div className="container">
                    <div className="row g-4 mb-80">
                        {blogData.length === 0 ? (
                            <div className="col-12 text-center py-5">
                                <p className="text-muted">No blog posts available at the moment.</p>
                            </div>
                        ) : (
                            blogData.map((blog) => (
                                <div key={blog.id} className="col-lg-4 col-md-6">
                                    <BlogCard blog={blog} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
