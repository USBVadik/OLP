"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-reveal with a single, consistent motion language (rise + fade, one easing).
 * Respects reduced motion (renders shown immediately). `delay` enables staggering.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  // `armed` gates the hidden start state. It only turns on after mount decides this element is
  // below the fold, so SSR / no-JS / crawlers render the content visible by default — a skipped
  // or failed reveal can never ship a blank section.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    // Already in view at mount → just show it (no hide, no flash, no entrance needed).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      setShown(true);
      return;
    }
    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Comp = Tag as any;
  const hidden = armed && !shown;
  return (
    <Comp
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.21,0.6,0.35,1)] will-change-[opacity,transform] motion-reduce:transition-none ${
        hidden ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
      } ${className}`}
    >
      {children}
    </Comp>
  );
}
