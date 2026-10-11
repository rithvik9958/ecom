"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function FadeInUp({ children, className = "", delay = 0, duration = 1, stagger = 0 }) {
  const container = useRef();

  useGSAP(() => {
    const targets = stagger ? gsap.utils.toArray(container.current.children) : container.current;
    
    gsap.from(targets, {
      y: 50,
      opacity: 0,
      duration: duration,
      delay: delay,
      stagger: stagger,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container.current,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }, { scope: container });

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}

export function FadeInRight({ children, className = "", delay = 0, duration = 1.2 }) {
  const container = useRef();

  useGSAP(() => {
    gsap.from(container.current, {
      x: -50,
      opacity: 0,
      duration: duration,
      delay: delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container.current,
        start: "top 85%",
      }
    });
  }, { scope: container });

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}

export function FadeInLeft({ children, className = "", delay = 0, duration = 1.2 }) {
  const container = useRef();

  useGSAP(() => {
    gsap.from(container.current, {
      x: 50, // Starts from right, moves left
      opacity: 0,
      duration: duration,
      delay: delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container.current,
        start: "top 85%",
      }
    });
  }, { scope: container });

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}

export function ZoomIn({ children, className = "", delay = 0, duration = 1.2, scale = 0.9 }) {
  const container = useRef();

  useGSAP(() => {
    gsap.from(container.current, {
      scale: scale,
      opacity: 0,
      duration: duration,
      delay: delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container.current,
        start: "top 85%",
      }
    });
  }, { scope: container });

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}

export function ParallaxImage({ children, className = "", speed = 1 }) {
  const container = useRef();
  const imageWrapper = useRef();

  useGSAP(() => {
    gsap.to(imageWrapper.current, {
      yPercent: 15 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: container.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      }
    });
  }, { scope: container });

  return (
    <div ref={container} className={`overflow-hidden ${className}`} style={{ height: "100%", width: "100%" }}>
      <div ref={imageWrapper} style={{ height: "120%", width: "100%", top: "-10%", position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

export function TextRevealScrub({ children, className = "" }) {
  const container = useRef();

  useGSAP(() => {
    let text;
    // We dynamically import SplitType to avoid SSR issues with the window object
    import('split-type').then((SplitType) => {
      text = new SplitType.default(container.current, { types: 'words' });
      
      gsap.fromTo(text.words, 
        { opacity: 0.2 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: {
            trigger: container.current,
            start: "top 85%",
            end: "bottom 60%",
            scrub: 1,
          }
        }
      );
    });

    return () => {
      if (text) text.revert();
    };
  }, { scope: container });

  return (
    <div ref={container} className={className}>
      {children}
    </div>
  );
}
