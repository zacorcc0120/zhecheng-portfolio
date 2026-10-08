"use client";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

// Clip-path / mask reveal with per-line stagger. Lines are passed explicitly
// rather than measured in the DOM, which keeps the server HTML stable and
// avoids a layout read after paint.
//
// The hidden offset is applied on the client only, and only after hydration,
// so the server-rendered copy is always readable. Two independent paths reveal
// it again: the in-view observer, and a bounded fallback timer. If the observer
// never fires — a throttled tab, a restored scroll position, an environment
// that does not deliver intersection callbacks — the copy still becomes
// visible instead of staying parked below its mask.
const FALLBACK_MS = 2400;

export function MaskReveal({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.09,
  as = "span",
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) {
  const calm = useReducedMotion();
  const MotionTag = motion[as];
  const host = useRef<HTMLElement>(null);
  const controls = useAnimationControls();
  const inView = useInView(host, { once: true, amount: 0.2 });

  useEffect(() => {
    if (calm) {
      controls.set("shown");
      return;
    }
    controls.set("hidden");
    const timer = setTimeout(() => controls.start("shown"), FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [calm, controls]);

  useEffect(() => {
    if (calm || !inView) return;
    controls.start("shown");
  }, [calm, inView, controls]);

  return (
    <MotionTag
      ref={host as never}
      className={className}
      initial="shown"
      animate={controls}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {lines.map((line, i) => (
        <span className={`mask-line ${lineClassName}`.trim()} key={i}>
          <motion.span
            className="mask-line-inner"
            variants={{ hidden: { y: "112%" }, shown: { y: "0%" } }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

// Single element that rises through a mask. Used where a block is one unit
// (a paragraph, a metadata row) and line splitting would be noise.
export function MaskBlock({
  children,
  className = "",
  delay = 0,
  y = "105%",
  duration = 0.95,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: string;
  duration?: number;
}) {
  const calm = useReducedMotion();
  const host = useRef<HTMLSpanElement>(null);
  const controls = useAnimationControls();
  const inView = useInView(host, { once: true, amount: 0.25 });

  useEffect(() => {
    if (calm) {
      controls.set({ y: "0%" });
      return;
    }
    controls.set({ y });
    const timer = setTimeout(() => controls.start({ y: "0%" }), FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [calm, controls, y]);

  useEffect(() => {
    if (calm || !inView) return;
    controls.start({ y: "0%" });
  }, [calm, inView, controls]);

  return (
    <span className={`mask-block ${className}`.trim()} ref={host}>
      <motion.span
        className="mask-block-inner"
        initial={{ y: "0%" }}
        animate={controls}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}
