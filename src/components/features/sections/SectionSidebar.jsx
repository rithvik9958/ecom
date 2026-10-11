"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import PopupCtaForm from "src/components/core/PopupCtaForm";

/**
 * SectionSidebar — Client Component
 *
 * Renders the sidebar navigation for a section.
 * Automatically highlights the active page using usePathname().
 *
 * Props:
 *   sectionKey  {string}  e.g. "quality"
 *   nav         {Array}   [{ title, slug }]
 */
export default function SectionSidebar({ sectionKey, nav }) {
  const pathname = usePathname();

  return (
    <div className="project-details-sidebar blog-sidebar-area">
      {/* Navigation Widget */}
      <div className="single-widget mb-30">
        <h5 className="widget-title">{nav.length > 0 && "Quick Links"}</h5>

        <ul className="category-list">
          {nav.map((item) => {
            const href = `/${sectionKey}/${item.slug}`;
            const isActive = pathname === href;

            return (
              <li key={item.slug} className={isActive ? "active" : ""}>
                <Link href={href}>
                  <span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0.0594069 0H12.0002V2.23531L2.25746 12.0001L0 9.76478L6.65357 3.17649L0.0594069 3.23532V0Z" />
                      <path d="M12.0009 12.0002V4.4707L8.79297 7.6472V12.0002H12.0009Z" />
                    </svg>
                    {item.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* CTA Banner */}
      <div className="sidebar-banner" style={{ position: 'relative', minHeight: '420px', borderRadius: '10px', overflow: 'hidden' }}>
        <Image
          src="/images/cta.jpg"
          alt="Contact Us"
          fill
          className="object-fit-cover"
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
