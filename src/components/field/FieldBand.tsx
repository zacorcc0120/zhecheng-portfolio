"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import { Field } from "./Field";

// A transition band between two sections. The field reassembles as the band
// enters and disperses as it leaves, so scrolling always has something alive
// under it — the same system as the hero, in a flatter register.
//
// Scroll position drives the transforms directly through motion values, so
// there is no pointer loop and no extra script work: the browser just
// interpolates transform and opacity on the compositor.
export function FieldBand({
  label,
  note,
  seed = 12.4,
}: {
  label: string;
  note: string;
  seed?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Reassemble from a compressed, rotated state, then disperse past it.
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.5, 1, 1.46]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [46, 0, -46]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2.2, 0, 2.2]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.22, 0.72, 1],
    [0, 0.9, 0.9, 0],
  );
  const ruleScale = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);

  const transform = useMotionTemplate`translate3d(0, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`;
  const rule = useMotionTemplate`scaleX(${ruleScale})`;

  return (
    <section className="band" ref={ref} aria-hidden="true">
      <motion.div className="band-field" style={{ transform, opacity }}>
        <Field mode="terrain" stretch seed={seed} />
      </motion.div>
      <div className="band-rule">
        <motion.span className="band-rule-line" style={{ transform: rule }} />
      </div>
      <div className="band-caption">
        <span className="meta-key">{label}</span>
        <span className="meta-key">{note}</span>
      </div>
    </section>
  );
}
