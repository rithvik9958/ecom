"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * NavigationProgress — Global top progress bar.
 *
 * Two-phase detection strategy:
 *   Phase 1 (INSTANT): A `click` listener on `document` intercepts any
 *                      anchor pointing to an internal path and starts the
 *                      bar immediately — giving feedback during the server
 *                      round-trip, which is the actual slow moment.
 *
 *   Phase 2 (COMPLETE): `usePathname()` detects that the new route has
 *                       settled and calls `complete()` to finish the bar.
 *
 * No external dependencies — CSS transitions only.
 */

// ─── Singleton bar state (lives outside React to avoid re-render races) ──────
let barEl = null;
let timers = [];
let isRunning = false;

function getBar() {
  if (barEl) return barEl;
  barEl = document.createElement("div");
  barEl.setAttribute("aria-hidden", "true");
  barEl.setAttribute("role", "presentation");
  Object.assign(barEl.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "0%",
    height: "3px",
    background:
      "linear-gradient(90deg, var(--primary-color1, #c8a84b), var(--primary-color2, #e8c96a))",
    zIndex: "99999",
    pointerEvents: "none",
    borderRadius: "0 3px 3px 0",
    boxShadow:
      "0 0 8px var(--primary-color1, #c8a84b), 0 0 16px rgba(200,168,75,0.3)",
    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
    opacity: "0",
    willChange: "width, opacity",
  });
  document.body.appendChild(barEl);
  return barEl;
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function setWidth(w) {
  const bar = getBar();
  bar.style.width = w + "%";
}

/** Start the indeterminate loading bar. Idempotent — calling again resets. */
function start() {
  // Respect prefers-reduced-motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  clearTimers();
  isRunning = true;
  const bar = getBar();
  bar.style.transition = "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease";
  bar.style.opacity = "1";
  bar.style.width = "5%";

  // Staged progress that slows as it approaches 90%
  const stages = [
    { target: 25, delay: 200 },
    { target: 50, delay: 500 },
    { target: 70, delay: 900 },
    { target: 82, delay: 1400 },
    { target: 90, delay: 2000 },
  ];

  stages.forEach(({ target, delay }) => {
    timers.push(setTimeout(() => {
      if (isRunning) setWidth(target);
    }, delay));
  });
}

/** Snap to 100% and fade out. */
function complete() {
  if (!barEl && !isRunning) return;
  clearTimers();
  isRunning = false;
  const bar = getBar();
  bar.style.transition = "width 0.2s ease-out, opacity 0.35s ease 0.1s";
  bar.style.width = "100%";
  timers.push(setTimeout(() => {
    bar.style.opacity = "0";
    timers.push(setTimeout(() => {
      bar.style.width = "0%";
    }, 400));
  }, 180));
}

// ─── React component ──────────────────────────────────────────────────────────

export default function NavigationProgress() {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const clickedRef = useRef(false);

  // Phase 1: Click detection — start bar immediately on internal link clicks
  useEffect(() => {
    function handleClick(e) {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only intercept internal paths (not hash-only, not external, not tel/mailto)
      const isInternal =
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !anchor.hasAttribute("target") &&
        !anchor.hasAttribute("download");

      if (!isInternal) return;

      // Don't start if navigating to the same page
      const currentPath = window.location.pathname;
      const targetPath = href.split("?")[0].split("#")[0];
      if (targetPath === currentPath) return;

      clickedRef.current = true;
      start();
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  // Phase 2: Pathname change — complete the bar once the route settles
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    if (isRunning || clickedRef.current) {
      clickedRef.current = false;
      complete();
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return null; // DOM bar is managed imperatively outside React
}
