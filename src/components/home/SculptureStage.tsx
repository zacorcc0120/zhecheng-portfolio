"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import type { SculptParams } from "@/lib/sculpture";
import { useAmbientTick } from "@/lib/ambient-clock";
import { useWebGL } from "@/hooks/useWebGL";
import type { SculptureTuning } from "./SculptureScene";
import { VaultDrawing } from "./VaultDrawing";

/**
 * The host around the sculptural surface.
 *
 * Everything expensive sits behind three gates, and all three have to be open
 * before a frame is drawn: the section is in the viewport, the document is
 * visible, and motion is allowed. Below any of them the canvas drops to
 * `frameloop="demand"` and costs nothing — which is the only reason two of these
 * can share a page with the hero field without either of them charging anything
 * while the other is on screen.
 *
 * The parameter vector is a ref the driver fills and the scene reads. No React
 * state is involved in a frame, and nothing is allocated after mount.
 *
 * The whole scene module is reached through `next/dynamic({ ssr: false })`, so
 * three.js never enters the homepage's first paint.
 */

const SculptureScene = dynamic(() => import("./SculptureScene"), { ssr: false });

/** The instant the frozen state uses — chosen because it is a good-looking one. */
export const REST = 0.46 * Math.PI * 2;

export type SculptureStageProps = {
  tuning: SculptureTuning;
  /**
   * Produces the parameter vector for an instant of the local clock.
   *
   * `live` is false while the section is paused or under reduced motion — the
   * form is not advancing, but the driver is still called, so controls keep
   * answering. A paused scene that also stopped listening would leave EXPLORE
   * looking broken (§12).
   */
  driver: (time: number, live: boolean) => SculptParams;
  /**
   * Called once per frame with the stage's local time, before the driver runs.
   * This is where a scene may touch React state — for example to advance a phase
   * label. It fires from the clock and never during render, which is the whole
   * reason it exists as a separate prop.
   */
  onFrame?: (time: number) => void;
  /** Holds the form at its current state without stopping the clock. */
  frozen?: boolean;
  label: string;
  className?: string;
};

export function SculptureStage({
  tuning,
  driver,
  onFrame,
  frozen = false,
  label,
  className,
}: SculptureStageProps) {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, { margin: "220px 0px 220px 0px" });
  const calm = Boolean(useReducedMotion());
  const [onScreen, setOnScreen] = useState(true);
  const webgl = useWebGL(inView);

  useEffect(() => {
    const onVisibility = () => setOnScreen(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const driverRef = useRef(driver);
  useEffect(() => {
    driverRef.current = driver;
  });
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  /* The settled pose, computed exactly once.
     This was `useRef(driver(REST, false))`, which looks like an initialiser and
     is not one: a ref's argument is an ordinary expression, so the driver ran
     again on every render. The driver writes to refs and calls setState, so
     calling it while React is rendering reset the phase label back to whatever
     REST happens to be on every single render — the four-phase study sat on
     RULES for ever and the form never appeared to move. A lazy state
     initialiser is the only form that genuinely runs once. */
  const [settled] = useState<SculptParams>(() => driver(REST, false));
  const params = useRef<SculptParams>(settled);
  /* The loop runs while the section is on screen and motion is allowed. Frozen
     holds the *local* clock instead of stopping it, so resuming continues from
     where the form was rather than jumping forward by however long the pause
     lasted (§12: never jump back to the first frame). */
  const alive = inView && onScreen && !calm;
  const local = useRef(REST);
  const origin = useRef(0);
  const wasFrozen = useRef(false);
  const frozenRef = useRef(frozen);
  useEffect(() => {
    frozenRef.current = frozen;
  });

  /* Pointer, in the surface's own t/v space. The mapping from viewport to
     surface coordinates is approximate — the object occupies part of the canvas
     and the camera is fixed — but the influence is bounded and damped, so an
     approximate mapping is indistinguishable here and costs no raycast. */
  const pointer = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, amount: 0, inside: false });
  const onMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const el = host.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const p = pointer.current;
    p.tx = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
    p.ty = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
    p.inside = true;
  }, []);
  const onLeave = useCallback(() => {
    pointer.current.inside = false;
  }, []);

  /* Reduced motion only.
     This used to fire on `!alive`, which looks equivalent and is not: `alive`
     also covers "scrolled away" and "tab hidden", and when that in-view gate
     flaps the condition is true for single frames. Each of those frames handed
     the driver the settled REST pose, so the form was dragged back to its
     starting geometry dozens of times a second and appeared not to move at all
     — four phases that looked identical, and a mode change that only showed if
     you caught the blend mid-flight. Reduced motion is the one case where there
     is no clock to follow and a single settled frame is the whole answer. */
  useEffect(() => {
    if (!calm) return;
    params.current = driverRef.current(REST, false);
    pointer.current.amount = 0;
  }, [calm]);

  useAmbientTick(
    (time) => {
      const p = pointer.current;
      p.x += (p.tx - p.x) * 0.06;
      p.y += (p.ty - p.y) * 0.06;
      p.amount += ((p.inside ? 1 : 0) - p.amount) * 0.05;

      const hold = frozenRef.current;
      if (hold) {
        params.current = driverRef.current(local.current, false);
      } else {
        if (wasFrozen.current) {
          origin.current = time - local.current;
          wasFrozen.current = false;
        }
        local.current = time - origin.current;
        params.current = driverRef.current(local.current, true);
      }
      /* onFrame is the only path out of this module into React state, and it is
         deliberately here rather than inside the driver: a driver is a pure
         "time in, pose out" function, and the moment one is also allowed to
         call setState it becomes unsafe to call from anywhere but the clock —
         including from the settled first frame, which is computed during render
         and so cannot run a setState at all. */
      onFrameRef.current?.(local.current);
    },
    alive,
  );

  return (
    <div
      className={className ? `sculpture ${className}` : "sculpture"}
      ref={host}
      role="img"
      /* The three gates, readable from the outside. This is how the performance
         probe proves the canvas really does stop rather than merely look like it
         has, so it is part of the contract rather than leftover instrumentation. */
      data-alive={alive ? "1" : "0"}
      data-calm={calm ? "1" : "0"}
      data-inview={inView ? "1" : "0"}
      aria-label={label}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {webgl === false ? (
        <VaultDrawing params={settled} />
      ) : webgl === true ? (
        <SculptureScene
          tuning={tuning}
          params={params}
          live={alive}
          pointer={pointer}
        />
      ) : null}
    </div>
  );
}
