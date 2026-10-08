"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MaskReveal } from "@/components/motion/MaskReveal";

const STATEMENT = [
  "Designing systems",
  "between AI,",
  "computation and",
  "physical form.",
];

// The headline is the positioning, not the name. On scroll it drifts and
// fades so the field behind it takes over as the section leaves.
export function HeroHeadline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -96]);
  const opacity = useTransform(scrollYProgress, [0, 0.78], [1, 0]);

  return (
    <motion.div className="hero-headline" ref={ref} style={{ y, opacity }}>
      <MaskReveal
        as="h1"
        className="hero-statement"
        lineClassName="hero-statement-line"
        lines={STATEMENT}
        delay={0.12}
        stagger={0.085}
      />
    </motion.div>
  );
}
