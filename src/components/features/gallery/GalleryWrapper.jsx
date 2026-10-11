"use client";

import React, { useEffect, useRef } from "react";
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

export default function GalleryWrapper({ children, delegate = "[data-fancybox]", className = "row g-4" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    // Initialize Fancybox
    Fancybox.bind(container, delegate, {
      Carousel: {
        infinite: true,
      },
      Images: {
        zoom: true,
      },
      Toolbar: {
        display: {
          left: ["infobar"],
          middle: [
            "zoomIn",
            "zoomOut",
            "toggle1to1",
            "rotateCCW",
            "rotateCW",
            "flipX",
            "flipY",
          ],
          right: ["slideshow", "thumbs", "close"],
        },
      },
    });

    return () => {
      Fancybox.unbind(container);
      Fancybox.close();
    };
  }, [delegate]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
