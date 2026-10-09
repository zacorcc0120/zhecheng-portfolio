"use client";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

/**
 * A hairline that draws itself from the left when it enters the viewport.
 *
 * PART 14 asks for "a small amount of line reveal" in About, and this is what
 * that means literally: a rule, not a masked text block. A masked paragraph is
 * the wrong instrument here — MaskReveal needs one box per line, so wrapping a
 * Chinese paragraph in it forces every visual line into its own block and stops
 * the text from wrapping at all. A rule can sit anywhere and costs one element.
 *
 * Under reduced motion the rule is simply drawn. It is the only thing separating
 * the intro from the register below it, so hiding it would remove structure, not
 * decoration.
 */
export function RuleReveal({
  className = "",
  delay = 0,
  duration = 0.9,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const calm = useReducedMotion();
  const host = useRef<HTMLSpanElement>(null);
  const inView = useInView(host, { once: true, amount: 0.6 });

  return (
    <span className={`rule-reveal ${className}`.trim()} ref={host} aria-hidden="true">
      <motion.span
        className="rule-reveal-line"
        initial={false}
        animate={{ scaleX: calm || inView ? 1 : 0 }}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
}