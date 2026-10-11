"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import MobileMenu from "./MobileMenu";
import TopHeader from "./TopHeader";

export default function HeaderClient({ globalSettings, navData, desktopNav }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Use passive listener for scroll performance
    const handleScroll = () => {
      // Small threshold so the shadow appears just after leaving the top
      setIsScrolled(window.scrollY > 10);
    };

    // Run once on mount in case page loads mid-scroll
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    // position: sticky keeps the header in document flow at ALL times —
    // no placeholder div needed, no jump when unsticking.
    // JS only toggles is-scrolled for visual changes (shadow, compact padding).
    <div
      className={`main-header-wrapper${isScrolled ? " is-sticky" : ""}`}
      style={{ viewTransitionName: "site-header" }}
    >
      <TopHeader settings={globalSettings} />

      <header className="header-area style-1">
        <div className="container-fluid d-flex flex-nowrap align-items-center justify-content-between justify-content-lg-center">
          {/* Mobile logo */}
          <div className="company-logo d-lg-none">
            <Link href="/">
              <Image
                src={globalSettings?.logoImage || "/images/logo.png"}
                alt="Jindal Metals & Alloys Ltd — Precision Stainless Steel Manufacturer"
                width={180}
                height={60}
              />
            </Link>
          </div>

          {/* Desktop nav (server-rendered) */}
          {desktopNav}

          {/* Right side — hamburger on mobile */}
          <div className="nav-right">
            <button
              className="mobile-menu-btn d-lg-none"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation menu"
            >
              <Bars3Icon width={30} />
            </button>
          </div>
        </div>

        <MobileMenu
          mobileMenu={mobileMenu}
          setMobileMenu={setMobileMenu}
          menuData={navData}
        />
      </header>
    </div>
  );
}
