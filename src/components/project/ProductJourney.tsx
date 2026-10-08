"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JourneyStep } from "@/data/recovery";

// The five delivered screens are the same product seen at five points in one
// loop, so they are read as a journey rather than as a grid: the step on the
// left is the sentence, the frame on the right is the proof.
//
// Two layout modes, one DOM:
//   desktop — the left column is tall, the right frame is sticky, and the
//             active step follows which step is nearest the reading line.
//   mobile  — CSS drops the sticky frame and each step carries its own image,
//             so every screen is reachable by ordinary scrolling and nothing
//             depends on an animation having run.
export function ProductJourney({ steps }: { steps: JourneyStep[] }) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const reduce = useReducedMotion();

  // Which step is current is decided against one reading line rather than by
  // IntersectionObserver: with five tall steps a band observer flips back and
  // forth between neighbours. This runs on a rAF-throttled scroll listener but
  // only calls setState when the index actually changes, so the page never
  // re-renders on scroll — at most four state changes across the whole section.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const nodes = stepRefs.current.filter(Boolean) as HTMLElement[];
      if (!nodes.length) return;
      const line = window.innerHeight * 0.45;
      let best = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      nodes.forEach((node, i) => {
        const box = node.getBoundingClientRect();
        // A step that has not entered the viewport yet cannot be the current
        // one, even if it happens to sit closer to the line.
        if (box.bottom <= 0 || box.top >= window.innerHeight) return;
        const distance = Math.abs(box.top + box.height / 2 - line);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      if (best >= 0) setActive((prev) => (prev === best ? prev : best));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Clicking a step is the keyboard and reduced-motion path to the same state
  // the scroll listener reaches on its own.
  const goTo = useCallback(
    (i: number) => {
      const node = stepRefs.current[i];
      if (!node) return;
      setActive(i);
      node.scrollIntoView({
        block: "center",
        behavior: reduce ? "auto" : "smooth",
      });
    },
    [reduce],
  );

  const current = steps[active];

  return (
    <div className="pj">
      <ol className="pj-steps">
        {steps.map((step, i) => (
          <li
            key={step.code}
            className={`pj-step${i === active ? " is-active" : ""}`}
            ref={(node) => {
              stepRefs.current[i] = node;
            }}
          >
            <button
              type="button"
              className="pj-step-button"
              onClick={() => goTo(i)}
              aria-current={i === active ? "true" : undefined}
            >
              <span className="pj-step-rule" aria-hidden="true" />

              <span className="pj-step-body">
                <span className="pj-step-code">{step.code}</span>
                <span className="pj-step-chinese">{step.chinese}</span>
                <span className="pj-step-text">{step.body}</span>
              </span>
            </button>

            {/* Mobile copy of the same frame. Hidden on desktop, where the
                sticky stage owns it; without this the narrow layout would show
                five sentences and one photograph. */}
            <figure className="pj-step-shot">
              <div className="pj-shot-image">
                <Image
                  src={step.src}
                  alt={step.alt}
                  fill
                  sizes="(max-width: 900px) 92vw, 50vw"
                />
              </div>
              <figcaption>
                <span>{step.code}</span>
                {step.label}
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>

      <div className="pj-stage">
        <div className="pj-frame">
          {/* sync mode keeps the outgoing frame mounted for the length of its
              exit, so the two overlap and read as a crossfade instead of a
              swap. initial={false} keeps the first frame from animating in on
              load, when there is nothing to crossfade from. */}
          <AnimatePresence mode="sync" initial={false}>
            <AnimatePresenceSwap
              step={current}
              reduce={Boolean(reduce)}
              priority={active === 0}
            />
          </AnimatePresence>
        </div>

        <div className="pj-progress" aria-hidden="true">
          {steps.map((step, i) => (
            <span
              key={step.code}
              className={i === active ? "is-active" : undefined}
            >
              {step.index}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Split out only so the exit and enter variants sit next to each other: the
// previous frame fades up and out while the next fades in from eight pixels
// below, which is a crossfade that reads as one screen changing rather than
// two screens swapping.
function AnimatePresenceSwap({
  step,
  reduce,
  priority,
}: {
  step: JourneyStep;
  reduce: boolean;
  priority: boolean;
}) {
  return (
    <motion.figure
      key={step.src}
      className="pj-shot"
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : -10 }}
      transition={{ duration: reduce ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pj-shot-image">
        <Image
          src={step.src}
          alt={step.alt}
          fill
          sizes="(max-width: 900px) 92vw, 46vw"
          priority={priority}
        />
      </div>
      <figcaption>
        <span>{step.code}</span>
        {step.label}
      </figcaption>
    </motion.figure>
  );
}