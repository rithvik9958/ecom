"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";

function MobileMenuItem({ item, openMenus, toggleMenu, closeMenu }) {
  const hasChildren = item.children?.length > 0;
  const isOpen = !!openMenus[item.id || item.slug];

  return (
    <li>
      {hasChildren ? (
        <>
          {/* Row: link on left, toggle button on right */}
          <div className="mm-row">
            <Link 
              className="mm-link" 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                toggleMenu(item.id || item.slug);
              }}
            >
              {item.title}
            </Link>
            <button
              className="mm-toggle"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu(item.id || item.slug);
              }}
              aria-label={isOpen ? "Collapse" : "Expand"}
              aria-expanded={isOpen}
            >
              {isOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {isOpen && (
            <ul className="mm-sub">
              {item.children.map((child) => (
                <MobileMenuItem
                  key={child.id || child.slug}
                  item={child}
                  openMenus={openMenus}
                  toggleMenu={toggleMenu}
                  closeMenu={closeMenu}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <Link className="mm-link mm-link--leaf" href={item.slug} onClick={closeMenu}>
          {item.title}
        </Link>
      )}
    </li>
  );
}

export default function MobileMenu({ mobileMenu, setMobileMenu, menuData }) {
  const [openMenus, setOpenMenus] = useState({});

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

  const toggleMenu = (id) =>
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));

  const closeMenu = () => {
    setMobileMenu(false);
    setOpenMenus({});
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mm-overlay${mobileMenu ? " mm-overlay--active" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Slide-in drawer — NO 'main-menu' class to avoid template CSS bleed */}
      <div
        className={`mm-drawer${mobileMenu ? " mm-drawer--open" : ""}`}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenu}
        inert={!mobileMenu ? true : undefined}
      >
        {/* Header: logo + close */}
        <div className="mm-header">
          <Link href="/" onClick={closeMenu} className="mm-logo-link">
            <Image
              src="/images/logo.png"
              alt="Jindal Metals & Alloys"
              width={140}
              height={48}
              priority
            />
          </Link>
          <button className="mm-close" onClick={closeMenu} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Nav list */}
        <ul className="mm-list">
          {menuData.map((item) => (
            <MobileMenuItem
              key={item.id || item.slug}
              item={item}
              openMenus={openMenus}
              toggleMenu={toggleMenu}
              closeMenu={closeMenu}
            />
          ))}
        </ul>

        {/* Contact strip */}
        <div className="mm-contact">
          <span className="mm-contact__label">Any Question?</span>
          <a className="mm-contact__phone" href="tel:+919323582341">
            +91 9323582341
          </a>
        </div>
      </div>
    </>
  );
}