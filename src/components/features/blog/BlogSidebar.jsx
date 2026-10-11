import Link from "next/link";
import Image from "next/image";
import PopupCtaForm from "src/components/core/PopupCtaForm";

export default function BlogSidebar({ relatedPosts = [] }) {
  return (
    <div className="project-details-sidebar blog-sidebar-area">
      {/* Related Blogs Widget - Dynamically Rendered */}
      {relatedPosts.length > 0 && (
          <div className="single-widget mb-30">
            <h5 className="widget-title">Related Blogs</h5>

            {relatedPosts.map((post) => (
              <div key={post.id} className="recent-post-widget mb-25">
                <div className="recent-post-img">
                  <Link href={`/blog/${post.slug}`}>
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={80}
                      height={80}
                      className="object-fit-cover"
                    />
                  </Link>
                </div>
                <div className="recent-post-content">
                  <Link href={`/blog/${post.slug}`}>{post.date}</Link>
                  <h6>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h6>
                </div>
              </div>
            ))}
          </div>
      )}

      {/* CTA Banner */}
      <div className="sidebar-banner position-relative">
        <Image
          src="/images/cta.jpg"
          alt="Contact Us"
          width={400}
          height={400}
          style={{ width: "100%", height: "auto", objectFit: "cover" }}
        />

        <div className="banner-content-wrap">
          <div className="banner-content">
            <h2>
              Ready to <span>work with us?</span>
            </h2>

            <PopupCtaForm
              buttonText="Know More"
              buttonClass="primary-btn1 white-bg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
