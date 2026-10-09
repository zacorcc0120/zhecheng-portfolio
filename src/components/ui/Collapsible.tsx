"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";
import { ease, motion as m } from "@/lib/motion-tokens";

/**
 * A block that stays closed until asked.
 *
 * Four consecutive headings, each followed by a paragraph of the same length,
 * is the shape this portfolio's case studies kept drifting into — and it reads
 * as a wall rather than as a set of decisions. Collapsing each one puts the
 * titles on a single scannable column and keeps the argument visible, with the
 * reasoning available to anyone who wants it.
 *
 * The summary line is always in the document: this is a disclosure, not a
 * lazy mount, so the text is reachable by find-in-page and by a screen reader
 * before anything is expanded.
 */
export function Collapsible({
  label,
  meta,
  children,
  defaultOpen = false,
}: {
  label: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const calm = useReducedMotion();
  const id = useId();

  return (
    <div className={`collapsible${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="collapsible-trigger"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {/* Order matters: the trigger is a 40px / 1fr / 18px grid, so the
            number takes the narrow column, the label takes the measure, and the
            marker takes the far edge. Rendering the label first put it in the
            40px column and wrapped every heading one word per line. */}
        <span className="collapsible-meta meta-key">{meta}</span>
        <span className="collapsible-label">{label}</span>
        <span className="collapsible-marker" aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            className="collapsible-body"
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              // Height animates on a decelerating curve so the text arrives
              // rather than being scraped away; opacity is quick so the label
              // never feels like it is waiting on the animation.
              height: {
                duration: calm ? 0 : m.content,
                ease: ease.out,
              },
              opacity: { duration: calm ? 0 : m.ui, ease: ease.out },
            }}
          >
            <div className="collapsible-body-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}