"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  sculptCycle,
  type Phase,
  type SculptParams,
} from "@/lib/sculpture";
import { SculptureStage } from "./SculptureStage";
import { STUDY_TUNING } from "./SculptureScene";

/**
 * 03 / RULES INTO POSSIBILITIES — the generative structural sculpture.
 *
 * The same surface as the practice scene, but given the room to become an
 * object rather than an instrument. Four phases over one cycle (§11):
 * RULES → STRUCTURE → FORM → VARIATION, where the last is another member of the
 * same family rather than a replay of the first.
 *
 * Three presentation modes (§12), each a real change to what is drawn and how
 * the surface is treated — not three labels on one image. They interpolate, so
 * switching is a morph and not a cut.
 *
 * On the way out to ABOUT (§13) the form does not switch off. Motion amplitude
 * falls, the membrane thins, the lattice drains away, and what is left is a few
 * ribs standing on their footprint. The section gains no height for the exit.
 */

const PERIOD = 17;
const MODES = ["SURFACE", "STRUCTURE", "LATTICE"] as const;
type Mode = (typeof MODES)[number];

/* How much of each layer each mode shows. These are the only three knobs the
   modes move, and they move enough that the change is obvious in a still frame —
   which is the test that matters, because a mode difference you can only see by
   watching it animate is not a difference. */
const MODE_MIX: Record<Mode, { lattice: number; surface: number; rib: number; density: number }> = {
  SURFACE: { lattice: 0.2, surface: 1, rib: 0.78, density: 0.92 },
  STRUCTURE: { lattice: 0.62, surface: 0.4, rib: 1, density: 0.7 },
  LATTICE: { lattice: 1, surface: 0.12, rib: 0.4, density: 1 },
};

export function RulesStudy() {
  const host = useRef<HTMLDivElement>(null);
  const exit = useRef(0);
  const mode = useRef<Mode>("SURFACE");
  const blend = useRef(0);
  const paused = useRef(false);
  const phaseRef = useRef<Phase>("FORM");
  const [modeLabel, setModeLabel] = useState<Mode>("SURFACE");
  const [phase, setPhase] = useState<Phase>("FORM");
  const [isPaused, setIsPaused] = useState(false);

  /* Scroll exit. Written into a ref by an already-registered listener rather
     than into state — a scroll handler that calls setState is the single most
     common way a page like this starts dropping frames. */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const travelled = window.innerHeight * 0.86 - r.top;
      const span = r.height + window.innerHeight * 0.55;
      exit.current = Math.max(0, Math.min(1, travelled / Math.max(1, span)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const driver = useCallback((time: number): SculptParams => {
    const s = sculptCycle(PERIOD, time);
    const q = exit.current;

    // Mode interpolation. The same smoothstep the domain readings use, so the
    // two controls in the page feel like one instrument.
    const t = Math.max(0, Math.min(MODES.length - 1, blend.current));
    const i = Math.min(MODES.length - 2, Math.floor(t));
    const f = t - i;
    const w = f * f * (3 - 2 * f);
    const a = MODE_MIX[MODES[i]];
    const b = MODE_MIX[MODES[i + 1]];
    const mix = (k: keyof typeof a) => a[k] + (b[k] - a[k]) * w;

    // The mode blend is advanced here rather than on its own timer: the stage
    // calls the driver once per frame while the section is on screen, including
    // while paused, so EXPLORE still morphs when the form is held.
    const want = MODES.indexOf(mode.current);
    blend.current += (want - blend.current) * 0.1;

    /* §13 — the exit is subtraction, not a switch. Amplitude first, then the
       membrane, then the lattice, and the ribs settle onto their footprint and
       stay. Nothing is ever hidden outright, so there is no edge to notice. */
    const calm = 1 - q * 0.55;
    return {
      /* Rise is the arch, not the ribbing. It used to carry the rib multiplier
         as well, which meant LATTICE — the mode with the shallowest ribs — also
         halved the height of the whole vault, and the object sat in the bottom
         of the band with the top half empty. Modes change what is built, not
         how tall the building is. */
      rise: s.params.rise * calm + 0.14 * q,
      span: s.params.span * (1 - q * 0.18),
      twist: s.params.twist * calm,
      ribDepth: s.params.ribDepth * mix("rib") * (1 - q * 0.5),
      // Ribs thin out as well, so what remains at the end is a few rule lines
      // rather than a whole lattice in a smaller box.
      density: s.params.density * mix("density") * (1 - q * 0.42) + 0.22 * q,
      fold: s.params.fold * calm,
      close: s.params.close * (1 + q * 0.5),
      lattice: s.params.lattice * mix("lattice") * (1 - q * 0.92),
      surface: s.params.surface * mix("surface") * (1 - q * 0.88),
    };
  }, []);

  /* The phase label is the one piece of React state this scene owns, and it is
     driven from the stage's frame callback rather than from inside `driver`.
     `driver` stays a pure time-in/pose-out function; when it also called
     setState it could only ever be called from the clock, which the settled
     first frame (computed during render) made impossible. Four setState calls
     per seventeen-second cycle is nothing. */
  const onFrame = useCallback((time: number) => {
    const p = sculptCycle(PERIOD, time).phase;
    if (p === phaseRef.current) return;
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const cycleMode = useCallback(() => {
    const next = MODES[(MODES.indexOf(mode.current) + 1) % MODES.length];
    mode.current = next;
    setModeLabel(next);
  }, []);

  const togglePause = useCallback(() => {
    paused.current = !paused.current;
    setIsPaused(paused.current);
  }, []);

  return (
    <div className="rules" ref={host}>
      <SculptureStage
        className="sculpture-study"
        tuning={STUDY_TUNING}
        driver={driver}
        onFrame={onFrame}
        frozen={isPaused}
        label="生成式结构雕塑：一张参数化壳体在规则、结构、形态与变体四个阶段之间连续变化。当前阶段与当前显示模式见旁边标注。这是设计研究，不是求解结果。"
      />

      <div className="rules-meta">
        <span className="rules-phase" aria-live="polite">
          {phase}
        </span>
        <span className="rules-mode">{modeLabel}</span>
      </div>

      <div className="rules-controls">
        <button
          type="button"
          className="rules-btn"
          onClick={cycleMode}
          aria-label={`切换显示模式，当前 ${modeLabel}`}
        >
          EXPLORE
        </button>
        <button
          type="button"
          className="rules-btn"
          onClick={togglePause}
          aria-pressed={isPaused}
        >
          {isPaused ? "PLAY" : "PAUSE"}
        </button>
      </div>

      <p className="rules-caption">
        规则不是静止的信息。参数连续变化时，同一张曲面不断产生新的可能形态——
        这里画的是这个过程，不是一栋建筑。
      </p>

      <span className="rules-annot meta-key" aria-hidden="true">
        RULES → STRUCTURE → FORM → VARIATION
      </span>

    </div>
  );
}

