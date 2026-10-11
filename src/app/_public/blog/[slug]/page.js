import { notFound } from "next/navigation";
import Image from "next/image";
import PageHeader from "src/components/layout/PageHeader";
import BlogSidebar from "src/components/features/blog/BlogSidebar";
import { cache } from "react";
import { connectDB } from "@/app/lib/config";
import Blog from "@/app/models/Blog";

export const revalidate = 3600; // 1 hour ISR

export async function generateStaticParams() {
  await connectDB();
  const blogs = await Blog.find({ isPublished: true }).select('slug').lean();
  return blogs.map((post) => ({
    slug: post.slug,
  }));
}

const getBlogPost = cache(async (slug) => {
  await connectDB();
  const post = await Blog.findOne({ slug }).lean();
  return post;
});

// Dynamic SEO metadata generation
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.metatag || post.title || "Jindal Metals Blog",
    description: post.metaDescription || post.excerpt || "",
    keywords: post.metakeywords?.length ? post.metakeywords : undefined,
    alternates: {
        canonical: post.canonicalUrl 
            ? (post.canonicalUrl.startsWith('http') ? post.canonicalUrl : `https://jindalmetal.com${post.canonicalUrl}`)
            : `https://jindalmetal.com/blog/${post.slug}`,
    },
    openGraph: {

        title: post.ogTitle || post.metatag || post.title,
        description: post.ogDescription || post.metaDescription || post.excerpt,
        images: post.coverImage ? [post.coverImage] : undefined,
    },
    twitter: {
        card: post.twitterCard || 'summary_large_image',
    },
    robots: post.robots || "index, follow",
  };
}

export default async function BlogDetailsPage({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const breadcrumb = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.bread_heading || "Details" },
  ];

  return (
    <>
      {/* Schema Injection */}
      {post.schemaMarkup && Object.keys(post.schemaMarkup).length > 0 && (
          <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(post.schemaMarkup) }}
          />
      )}

      {/* Page Header Component */}
      <PageHeader
        title={post.bread_heading || post.title}
        bgImage={post.breadImage || post.coverImage || "/images/slide2.jpg"}
        breadcrumb={breadcrumb}
      />

      {/* Main Layout matches the Inner Pages Layout (col-8 + col-4) */}
      <section className="project-details-page my-5">
        <div className="container">
          <div className="row g-lg-4 gy-5 mb-80">
            
            {/* ── Main Content Area ─────────────────────────────── */}
            <div className="col-lg-8">
              <div className="blog-details-top-area mb-4 border-bottom">
                <h1 className="h-tags position-relative px-3 mb-4">
                  {post.title}
                </h1>

                {post.coverImage && (
                  <div
                    className="position-relative mb-4"
                    style={{ height: "450px" }}
                  >
                    <Image
                      src={post.coverImage}
                      alt={post.alt || post.title}
                      fill
                      className="object-fit-cover rounded"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                  </div>
                )}
                
                {/* Blog Meta Data */}
                <div className="blog-meta mb-4 pb-4 border-bottom">
                    <ul className="list-unstyled d-flex gap-4 text-muted mb-0">
                        <li>
                           <i className="bi bi-calendar3 me-2"></i>
                           <strong>{post.publishedAt || new Date(post.createdAt).toLocaleDateString()}</strong>
                        </li>
                        {post.author && (
                          <li>
                             <i className="bi bi-person-circle me-2"></i>
                             <strong>By {post.author}</strong>
                          </li>
                        )}
                        {post.category && (
                          <li>
                             <i className="bi bi-tag-fill me-2"></i>
                             <strong>{post.category}</strong>
                          </li>
                        )}
                    </ul>
                </div>
              </div>

              {/* HTML Content Rendered */}
              <div className="details-content-wrapper">
                {post.excerpt && (
                  <p className="lead mb-4 fw-medium text-secondary">{post.excerpt}</p>
                )}

                {post.content && (
                  <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                )}
              </div>
            </div>

            {/* ── Sidebar Area ──────────────────────────────────── */}
            <div className="col-lg-4">
              <BlogSidebar relatedPosts={await getRelatedBlogs(post._id, post.category)} />
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

async function getRelatedBlogs(currentId, category) {
  await connectDB();
  // Try to find blogs in same category first
  let related = await Blog.find({ 
      _id: { $ne: currentId }, 
      isPublished: true,
      category: category 
  }).sort({ createdAt: -1 }).limit(3).lean();
  
  // If not enough, fetch latest
  if (related.length < 3) {
      const more = await Blog.find({
          _id: { $ne: currentId, $nin: related.map(r => r._id) },
          isPublished: true,
      }).sort({ createdAt: -1 }).limit(3 - related.length).lean();
      related = [...related, ...more];
  }


  return related.map(b => ({
      id: b._id.toString(),
      title: b.title,
      date: b.publishedAt || new Date(b.createdAt).toLocaleDateString(),
      image: b.coverImage || "/images/slide1.jpg",
      slug: b.slug,
  }));
}
