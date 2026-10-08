"use client";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

// The handoff between a project's generated output and the case study that
// analyses it. It used to be a full-width contour field: 360px of illustration
// that carried no information and gave the page a second, competing subject.
//
// What is here instead is a structural marker. The ticks are the workbench's
// column grid continuing a short way down the page, then retracting into the
// rule they stand on; once they are gone only two hairlines and one line of
// metadata remain. The section's whole job is the sentence between the two
// parts — SYSTEM → METHOD — so it stays at metadata weight and lets the
// overview question below it be the next thing you actually read.
//
// Everything is driven from one scroll value, so the browser interpolates
// transform and opacity on the compositor with no per-frame script work.

const TICK_COUNT = 28;

export function CaseHandoff({
  index,
  title,
}: {
  index: string;
  title: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const calm = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.3"],
  });

  // Top rule draws first; the bottom one closes after the label has landed.
  const headRule = useTransform(scrollYProgress, [0, 0.45], [0, 1]);
  const footRule = useTransform(scrollYProgress, [0.7, 1], [0, 1]);

  // Origin is the top edge, so the grid flattens upward into the rule instead
  // of sinking through it.
  const tickFlat = useTransform(scrollYProgress, [0.1, 0.6], [1, 0]);
  const tickFade = useTransform(scrollYProgress, [0.18, 0.6], [1, 0]);

  const labelIn = useTransform(scrollYProgress, [0.5, 0.85], [0, 1]);
  const labelRise = useTransform(scrollYProgress, [0.5, 0.85], [8, 0]);

  return (
    <section className="handoff" ref={ref}>
      <div className="handoff-rule">
        <motion.span style={calm ? { scaleX: 1 } : { scaleX: headRule }} />
      </div>

      <div className="handoff-body">
        <div className="handoff-ticks" aria-hidden="true">
          {Array.from({ length: TICK_COUNT }, (_, i) => (
            <motion.i
              key={i}
              style={
                calm
                  ? { scaleY: 0, opacity: 0 }
                  : { scaleY: tickFlat, opacity: tickFade }
              }
            />
          ))}
        </div>

        <motion.div
          className="handoff-row"
          style={calm ? { opacity: 1, y: 0 } : { opacity: labelIn, y: labelRise }}
        >
          <span className="meta-key">CASE STUDY / {index}</span>
          <span className="handoff-title meta-key">{title}</span>
          <span className="meta-key handoff-statement">SYSTEM → METHOD</span>
        </motion.div>
      </div>

      <div className="handoff-rule">
        <motion.span style={calm ? { scaleX: 1 } : { scaleX: footRule }} />
      </div>
    </section>
  );
}