/**
 * SectionPageSkeleton — Server Component
 *
 * Skeleton loading screen that exactly mirrors the SectionPageLayout structure.
 * Used as the fallback in each section's loading.js.
 * Shimmer animation is defined in style.css (.skeleton-shimmer).
 */
export default function SectionPageSkeleton() {
  return (
    <>
      {/* Banner skeleton */}
      <div className="skeleton-banner skeleton-shimmer" />

      {/* Content skeleton */}
      <section className="project-details-page my-5">
        <div className="container">
          <div className="row g-lg-4 gy-5 mb-80">

            {/* Main content column */}
            <div className="col-lg-8">
              {/* Title */}
              <div className="skeleton-shimmer skeleton-title mb-4" />

              {/* Image */}
              <div className="skeleton-shimmer skeleton-image mb-4" />

              {/* Text lines */}
              <div className="skeleton-shimmer skeleton-line mb-3" />
              <div className="skeleton-shimmer skeleton-line mb-3" style={{ width: "85%" }} />
              <div className="skeleton-shimmer skeleton-line mb-3" style={{ width: "92%" }} />

              <div className="skeleton-shimmer skeleton-subheading mt-4 mb-3" />
              <div className="skeleton-shimmer skeleton-line mb-3" />
              <div className="skeleton-shimmer skeleton-line mb-3" style={{ width: "78%" }} />
              <div className="skeleton-shimmer skeleton-line mb-3" style={{ width: "90%" }} />

              <div className="skeleton-shimmer skeleton-subheading mt-4 mb-3" />
              <div className="skeleton-shimmer skeleton-line mb-3" />
              <div className="skeleton-shimmer skeleton-line mb-3" style={{ width: "70%" }} />
            </div>

            {/* Sidebar column */}
            <div className="col-lg-4">
              <div className="project-details-sidebar blog-sidebar-area">
                <div className="single-widget mb-30">
                  {/* Widget title */}
                  <div className="skeleton-shimmer skeleton-widget-title mb-4" />

                  {/* Nav links */}
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="skeleton-shimmer skeleton-nav-item mb-3"
                    />
                  ))}
                </div>

                {/* CTA banner */}
                <div className="skeleton-shimmer skeleton-cta" />
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
