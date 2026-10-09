"use client";
import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAmbientTick } from "@/lib/ambient-clock";

/**
 * The contact field: seven hairlines that lean a few pixels toward the pointer.
 *
 * PART 15 asks for a quiet, precisely interactive ending, and explicitly rules
 * out another large computational model. So this is the smallest thing that can
 * still answer the pointer — a set of vertical hairlines whose lean is a damped
 * function of pointer position, with no geometry, no shader and no layout work.
 *
 * Why it leans rather than follows: a control point that tracks the cursor
 * exactly reads as a widget. The 0.045 lerp below puts the line roughly 1.5s
 * behind the hand, which is what makes it read as structure being influenced
 * instead of an element being dragged.
 *
 * The travel is also deliberately tiny — 18px at the extreme, on a section about
 * 900px tall. PART 15 says the pointer may move "very few thin lines", and this
 * is how few that can be while staying visible.
 *
 * Plain absolutely-positioned divs rather than an SVG viewBox. The obvious SVG
 * version writes the lean in viewBox units, and the two axes scale differently —
 * one unit is the section's width over 100 on x and its height over 100 on y —
 * so a single travel constant silently becomes 18% of the width instead of 18px.
 * CSS pixels on transform have no such ambiguity.
 *
 * The layer is `pointer-events: none` so it can never intercept a click on the
 * address below it, which means the pointer has to be read from the window and
 * projected onto the section's own rect. The clock is the shared page clock and
 * only runs while the section is on screen and motion is allowed, for the same
 * reason the two sculptures are gated: an ambient drawing that ticks below the
 * fold is the thing §16 of the brief forbids.
 */

const LEANS = [0.34, 0.62, 1, 0.78, 0.46, 0.9, 0.28];
const MAX_TRAVEL = 18;
const DAMP = 0.045;

export function ContactField() {
  const host = useRef<HTMLDivElement>(null);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const inView = useInView(host, { margin: "120px 0px 120px 0px" });
  const calm = Boolean(useReducedMotion());
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const onVisibility = () => setOnScreen(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const pointer = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, amount: 0, inside: false });

  useEffect(() => {
    if (calm) return;
    const onMove = (event: PointerEvent) => {
      const el = host.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const p = pointer.current;
      p.tx = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
      p.ty = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
      p.inside =
        event.clientX >= r.left && event.clientX <= r.right &&
        event.clientY >= r.top && event.clientY <= r.bottom;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [calm]);

  /* Reduced motion, and only reduced motion: return every line to plumb. Same
     reasoning as SculptureStage — "scrolled away" flaps for single frames, and
     snapping the lines on each of those frames is visible. */
  useEffect(() => {
    if (!calm) return;
    pointer.current.amount = 0;
    for (const line of lines.current) {
      if (line) line.style.transform = "translate3d(0px,0px,0)";
    }
  }, [calm]);

  useAmbientTick(
    (_time, delta) => {
      const p = pointer.current;
      /* Frame-rate independent damping. A fixed lerp makes the field twice as
         fast on a 120Hz display, which is exactly the kind of difference that
         makes a "slow" response read as twitchy on some machines and dead on
         others. */
      const k = 1 - Math.pow(1 - DAMP, Math.min(3, delta * 60));
      p.x += (p.tx - p.x) * k;
      p.y += (p.ty - p.y) * k;
      p.amount += ((p.inside ? 1 : 0) - p.amount) * Math.min(1, k * 1.4);

      /* Lean away from the pointer and toward the vertical middle: the field
         parts slightly rather than collapsing. The vertical term is halved so a
         hairline never travels more than half the section's height. */
      const dx = (0.5 - p.x) * 2;
      const dy = (0.5 - p.y) * 2;
      for (let i = 0; i < lines.current.length; i++) {
        const line = lines.current[i];
        if (!line) continue;
        const lean = LEANS[i] * p.amount;
        line.style.transform =
          `translate3d(${(dx * MAX_TRAVEL * lean).toFixed(2)}px,` +
          `${(dy * MAX_TRAVEL * 0.5 * lean).toFixed(2)}px,0)`;
      }
    },
    inView && onScreen && !calm,
  );

  return (
    <div className="contact-field" ref={host} aria-hidden="true">
      {LEANS.map((lean, i) => (
        <div
          key={i}
          className="contact-field-line"
          ref={(node) => {
            lines.current[i] = node;
          }}
          style={{ left: `${4 + i * 15.3}%`, opacity: 0.1 + lean * 0.16 }}
        />
      ))}
    </div>
  );
}