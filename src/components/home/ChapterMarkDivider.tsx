"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  motion,
  motionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { projects } from "@/data/projects";

/**
 * Divider B — 章节标记
 *
 * Divider A earns a structural gesture; this one does not. Its only job is to
 * say "the chapter changed", so it draws one hairline, exchanges the section
 * number, and states the one fact worth stating — five projects, one method.
 * Then it gets out of the way.
 *
 * It is deliberately the shortest band on the page (190px against A's 300px):
 * the direction is to have less here, and the band should look like it.
 */
export function ChapterMarkDivider() {
  const host = useRef<HTMLElement>(null);
  const calm = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: host,
    offset: ["start end", "end 20%"],
  });

  const done = useMemo(() => motionValue(1), []);
  const p: MotionValue<number> = calm ? done : scrollYProgress;

  const rule = useTransform(p, [0, 0.4], [0, 1]);
  const ruleWidth = useTransform(rule, (v) => `${v * 100}%`);
  const markOut = useTransform(p, [0, 0.35], [0.9, 0.25]);
  const markIn = useTransform(p, [0.35, 0.75], [0.25, 1]);
  const delta = useTransform(
    p,
    [0, 0.38, 0.66, 0.9],
    [0, 1, 1, 0],
  );

  useEffect(() => {
    // Reduced motion still needs the final numbers legible, so resolve them.
    if (!calm) return;
    const id = requestAnimationFrame(() => {
      host.current?.setAttribute("data-resolved", "true");
    });
    return () => cancelAnimationFrame(id);
  }, [calm]);

  return (
    <section className="divider-b" ref={host} data-works-close aria-hidden="true">
      <div className="divider-b-inner">
        <div className="divider-b-rule">
          <motion.span style={{ width: ruleWidth }} />
        </div>
        <div className="divider-b-mark">
          <motion.b style={{ opacity: markOut }}>03</motion.b>
          <span className="divider-b-label">
            <SwapLabel progress={p} />
          </span>
          <motion.b style={{ opacity: markIn }}>04</motion.b>
        </div>
        <motion.div className="divider-b-delta" style={{ opacity: delta }}>
          <strong>{projects.length}</strong>
          <span>PROJECTS</span>
          <em>→</em>
          <strong>1</strong>
          <span>METHOD</span>
        </motion.div>
      </div>
      <span className="divider-mark">03 → 04</span>
    </section>
  );
}

/* The label swaps mid-scrub. Kept as text so it stays selectable and legible
   at every point of the transition rather than cross-fading two strings. */
function SwapLabel({ progress }: { progress: MotionValue<number> }) {
  const a = useTransform(progress, (v) => (v < 0.5 ? 1 : 0));
  const b = useTransform(progress, (v) => (v < 0.5 ? 0 : 1));
  return (
    <>
      <motion.span style={{ opacity: a }}>SELECTED WORKS</motion.span>
      <motion.span style={{ opacity: b, position: "absolute", inset: 0 }}>
        RULES
      </motion.span>
    </>
  );
}