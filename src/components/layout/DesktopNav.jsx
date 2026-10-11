"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

// ─── Legacy Plain Link (Home, Contact) ────────────────────────────────────────
function LegacyPlainItem({ item }) {
  return (
    <li>
      <Link href={item.slug}>
        {item.title}
      </Link>
    </li>
  );
}

// ─── Dark Dropdown (Our Products — 3-levels) ────────────────────────────────
function DarkDropdownItem({ item }) {
  return (
    <li className={item.children?.length ? "jm-nav-item jm-has-3level" : ""}>
      <Link
        href={item.children?.length ? "#" : item.slug}
        onClick={(e) => {
          if (item.children?.length) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        className="jm-nav-link"
      >
        <span>{item.title}</span>
        {item.children?.length > 0 && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginLeft: "6px" }}
          >
            <path fill="currentColor" d="M10 0.0495054L10 10.0001L8.13725 10.0001L-8.22301e-08 1.8812L1.86275 -3.55691e-07L7.35294 5.5446L7.30392 0.0495053L10 0.0495054Z" />
            <path fill="currentColor" d="M-9.6438e-05 10.0002L6.27441 10.0002L3.62736 7.32687L-9.63211e-05 7.32687L-9.6438e-05 10.0002Z" />
          </svg>
        )}
      </Link>

      {item.children?.length > 0 && (
        <ul className="jm-dark-dropdown">
          {item.children.map((child) => (
            <li
              key={child.id}
              className={child.children?.length ? "jm-has-3level-nested" : ""}
            >
              <Link
                href={child.slug || "#"}
                className="jm-dark-dropdown-link"
              >
                <span>{child.title}</span>
                {child.children?.length > 0 && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill="currentColor" d="M0.0495054 0H10.0001V1.86275L1.88121 10L0 8.13726L5.54461 2.64706L0.0495054 2.69608V0Z" />
                    <path fill="currentColor" d="M9.99971 9.99993V3.72542L7.32642 6.37248V9.99993H9.99971Z" />
                  </svg>
                )}
              </Link>

              {child.children?.length > 0 && (
                <ul className="jm-dark-dropdown jm-dark-dropdown-nested">
                  {child.children.map((subChild) => (
                    <li key={subChild.id}>
                      <Link href={subChild.slug} className="jm-dark-dropdown-link">
                        <span>{subChild.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── Mega Menu (Inner Sections only) ──────────────────────────────────────────
function MegaMenuItem({ item }) {
  // Chunk the items into columns (e.g. 5 items per column)
  const ITEMS_PER_COL = 5;
  const chunks = [];
  for (let i = 0; i < item.children.length; i += ITEMS_PER_COL) {
    chunks.push(item.children.slice(i, i + ITEMS_PER_COL));
  }

  return (
    <li className="jm-nav-item jm-has-mega">
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault();
          e.currentTarget.blur();
        }}
        className="jm-nav-link jm-drop-trigger"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span>{item.title}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginLeft: "6px" }}
        >
          <path fill="currentColor" d="M10 0.0495054L10 10.0001L8.13725 10.0001L-8.22301e-08 1.8812L1.86275 -3.55691e-07L7.35294 5.5446L7.30392 0.0495053L10 0.0495054Z" />
          <path fill="currentColor" d="M-9.6438e-05 10.0002L6.27441 10.0002L3.62736 7.32687L-9.63211e-05 7.32687L-9.6438e-05 10.0002Z" />
        </svg>
      </Link>

      <div
        className="jm-mega-panel"
        role="navigation"
        aria-label={`${item.title} mega menu`}
      >
        <div className="jm-mega-inner">
          {chunks.map((chunk, index) => (
            <ul key={index} className="jm-mega-list" role="list">
              {chunk.map((leaf) => (
                <li key={leaf.id}>
                  <Link href={leaf.slug} className="jm-mega-leaf">
                    <span className="jm-leaf-arrow" aria-hidden="true">›</span>
                    {leaf.title}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </li>
  );
}

export default function DesktopNav({ navData = [] }) {
  const [forceClose, setForceClose] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Remove focus from the clicked link so :focus-within CSS doesn't keep the menu open
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Force close dropdowns immediately when route changes
    setForceClose(true);

    // 3. Re-enable dropdowns when the user moves their mouse.
    // We ignore mouse movements for the first 300ms to absorb micro-jitters
    // that naturally occur while physically clicking the mouse.
    let isClickJitterPeriod = true;
    const jitterTimer = setTimeout(() => {
      isClickJitterPeriod = false;
    }, 300);

    const handleMouseMove = () => {
      if (isClickJitterPeriod) return;
      setForceClose(false);
      window.removeEventListener("mousemove", handleMouseMove);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Fallback: If mouse doesn't move for 2 seconds, re-enable it anyway
    const fallbackTimer = setTimeout(() => {
      setForceClose(false);
      window.removeEventListener("mousemove", handleMouseMove);
    }, 2000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(jitterTimer);
      clearTimeout(fallbackTimer);
    };
  }, [pathname]);

  return (
    <nav className={`main-menu d-none d-lg-block ${forceClose ? 'jm-force-close' : ''}`} aria-label="Main navigation">
      {forceClose && (
        <style dangerouslySetInnerHTML={{
          __html: `
          .jm-force-close .jm-mega-panel,
          .jm-force-close .jm-dark-dropdown {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            transition: none !important;
          }
        `}} />
      )}
      <ul className="menu-list d-flex gap-3" role="list">
        <li style={{ display: 'flex', alignItems: 'center' }}>
          <Link href="/" aria-label="Home" style={{ display: 'flex', alignItems: 'center' }}>
            <i className="bx bx-home" style={{ fontSize: '20px', position: 'relative', top: '-3px' }}></i>
          </Link>
        </li>
        {navData.map((item) => {
          // "Our Products" uses the legacy 3-level dropdown structure
          if (item.title === "Our Products") {
            return <DarkDropdownItem key={item.id} item={item} />;
          }
          // Items with no children use the legacy plain structure
          if (!item.children?.length) {
            return <LegacyPlainItem key={item.id} item={item} />;
          }
          // Dynamic inner pages (Sections) use the mega menu
          return <MegaMenuItem key={item.id} item={item} />;
        })}
      </ul>
    </nav>
  );
}

