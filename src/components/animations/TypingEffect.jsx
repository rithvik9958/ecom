"use client";

import { useEffect, useRef } from "react";

/**
 * SlideTypingEffect — Hero slider typing animation.
 *
 * Uses a single visible element that fills with characters one by one.
 * An opacity-0 / absolute-positioned SEO span keeps the full text readable
 * by search bots without affecting visual layout.
 *
 * Resets and re-types every time `slideKey` changes (slide transition).
 */
export default function SlideTypingEffect({
  text = "",
  className = "",
  speed = 38,
  delay = 300,
  cursor = true,
  slideKey,
}) {
  const displayRef = useRef(null);
  const cursorRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!text || !displayRef.current) return;

    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);

    const displayEl = displayRef.current;
    const cursorEl = cursorRef.current;

    // Reset
    displayEl.innerHTML = "";
    if (cursorEl) {
      cursorEl.style.opacity = "1";
      cursorEl.style.transition = "none";
    }

    // Tokenize text to handle <br> tags as single units
    const tokens = [];
    const parts = text.split(/(<br\s*\/?>)/i);
    parts.forEach((part) => {
      if (/(<br\s*\/?>)/i.test(part)) {
        tokens.push(part);
      } else {
        tokens.push(...part);
      }
    });

    let charIndex = 0;

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (charIndex < tokens.length) {
          displayEl.innerHTML += tokens[charIndex];
          charIndex++;
        } else {
          clearInterval(intervalRef.current);
          if (cursorEl) {
            timeoutRef.current = setTimeout(() => {
              cursorEl.style.transition = "opacity 0.5s ease";
              cursorEl.style.opacity = "0";
            }, 2000);
          }
        }
      }, 1000 / speed);
    }, delay);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [text, speed, delay, slideKey]);

  return (
    <span
      className={`slide-typing-root ${className}`}
      style={{ display: "inline" }}
    >
      {/* SEO text: invisible to users, fully readable by search bots */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {text}
      </span>

      {/* Visible element — fills character by character */}
      <span
        ref={displayRef}
        aria-label={text}
        role="text"
      />

      {/* Blinking cursor */}
      {cursor && (
        <span
          ref={cursorRef}
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "3px",
            height: "0.75em",
            background: "currentColor",
            marginLeft: "4px",
            verticalAlign: "middle",
            borderRadius: "1px",
            animation: "typingCursorBlink 0.8s step-end infinite",
          }}
        />
      )}
    </span>
  );
}
