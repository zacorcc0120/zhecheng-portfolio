"use client";

import { useEffect, useRef } from "react";

/**
 * One ambient clock for the whole page.
 *
 * The homepage now carries two long-running drawings. Each one started with its
 * own requestAnimationFrame, which meant two loops ticking even when neither was
 * on screen — the exact failure mode §16 of the brief forbids, and the one that
 * makes a portfolio feel heavy on a laptop battery.
 *
 * This is a single loop with subscribers. It runs while at least one subscriber
 * is awake and stops the moment the last one goes to sleep, so an off-screen
 * drawing costs nothing and two on-screen drawings still share one callback.
 * The document being hidden stops it too, and restarts it on return.
 *
 * `time` is a page-wide clock, not a per-drawing one: it advances while any
 * subscriber is awake and freezes when the last one sleeps. Two consequences,
 * both intended. Phase is a function of time rather than of frame count, which
 * is what makes the seamless-cycle requirement hold across a tab switch. And the
 * two drawings share a phase, so they read as one system rather than as two
 * animations that happen to be running. The trade-off is that PAUSE holds a
 * drawing still only for as long as nothing else on the page is awake; resume
 * rejoins the page clock. That is the right way round for ambient work — a
 * paused plate is for inspecting one moment, not for taking the page out of
 * time.
 *
 * Nothing here touches React state. Subscribers write to SVG attributes and CSS
 * variables directly, which is why a 14-second cycle does not cause 840
 * re-renders.
 */

type Tick = (time: number, delta: number) => void;

const subscribers = new Map<number, Tick>();
const awake = new Set<number>();

let handle = 0;
let previous = 0;
let elapsed = 0;
let sequence = 1;

function pump(now: number) {
  // Clamped so a background tab, a slow frame or a resumed session can never
  // deliver a delta large enough to throw the geometry across the plate.
  const delta = Math.min(0.05, Math.max(0, (now - previous) / 1000));
  previous = now;
  elapsed += delta;
  for (const [id, tick] of subscribers) {
    if (awake.has(id)) tick(elapsed, delta);
  }
  if (awake.size === 0 || document.hidden) {
    handle = 0;
    return;
  }
  handle = requestAnimationFrame(pump);
}

function start() {
  if (handle || document.hidden || awake.size === 0) return;
  // Seeded one frame short so the first delta is an ordinary frame length
  // instead of the gap since the page loaded.
  previous = performance.now() - 16;
  handle = requestAnimationFrame(pump);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) start();
  });
}

/**
 * Drive `tick` from the shared clock while `active` is true.
 *
 * `tick` is read through a ref, so a caller can pass an inline closure without
 * re-registering every render — which would otherwise restart the drawing on
 * each parent update.
 */
export function useAmbientTick(tick: Tick, active: boolean) {
  const latest = useRef(tick);
  const id = useRef(0);

  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    id.current = sequence++;
    const key = id.current;
    subscribers.set(key, (time, delta) => latest.current(time, delta));
    return () => {
      subscribers.delete(key);
      awake.delete(key);
    };
  }, []);

  useEffect(() => {
    const key = id.current;
    if (!key) return;
    if (active) {
      awake.add(key);
      start();
    } else {
      awake.delete(key);
    }
  }, [active]);
}

/** How many subscribers are currently being ticked. Used by the perf probe. */
export function ambientTickCount() {
  return awake.size;
}