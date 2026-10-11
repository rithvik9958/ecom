import { ViewTransition } from "react";
import Image from "next/image";
import PageHeader from "src/components/layout/PageHeader";
import SectionSidebar from "src/components/features/sections/SectionSidebar";

/**
 * SectionPageLayout — Server Component
 *
 * Shared layout for all section sub-pages.
 * Mirrors the ProductDetails layout: col-lg-8 content + col-lg-4 sidebar.
 *
 * Props:
 *   sectionKey    {string}   e.g. "quality"
 *   sectionLabel  {string}   e.g. "Quality"
 *   nav           {Array}    [{ title, slug }]
 *   page          {object}   { title, bannerImage, description, content }
 *   breadcrumb    {Array}    [{ name, href? }]
 */
export default function SectionPageLayout({
  sectionKey,
  sectionLabel,
  nav,
  page,
  breadcrumb,
}) {
  return (
    <ViewTransition>
      <>
        {/* Page Banner / Header */}
        <PageHeader
          title={page.title}
          bgImage={page.bannerImage}
          breadcrumb={breadcrumb}
        />

        {/* Main Content + Sidebar */}
        <section className="project-details-page my-5">
          <div className="container">
            <div className="row g-lg-4 gy-5 mb-80">
              {/* ── Main Content ─────────────────────────────── */}
              <div className="col-lg-8">
                <div className="blog-details-top-area mb-4 border-bottom">
                  {/* The H1 is now provided by the PageHeader to avoid duplication */}

                  {page.image && (
                    <div
                      className="position-relative mb-4 border-bottom"
                      style={{ height: "350px" }}
                    >
                      <Image
                        src={page.image}
                        alt={page.title}
                        fill
                        className="object-fit-cover rounded"
                        sizes="(max-width: 768px) 100vw, 66vw"
                        priority
                      />
                    </div>
                  )}
                </div>

                <div className="details-content-wrapper ">
                  {page.description && (
                    <p className="mb-4">{page.description}</p>
                  )}

                  {page.content && (
                    <div dangerouslySetInnerHTML={{ __html: page.content }} />
                  )}
                </div>
              </div>

              {/* ── Sidebar ──────────────────────────────────── */}
              <div className="col-lg-4">
                <SectionSidebar sectionKey={sectionKey} nav={nav} />
              </div>
            </div>
          </div>
        </section>
      </>
    </ViewTransition>
  );
}
