"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { useAmbientTick } from "@/lib/ambient-clock";

/**
 * GENERATIVE FORM FIELD — REGION B, the second signature motion.
 *
 * RULES → STRUCTURE → FORM → VARIATION, one continuous cycle, no cut.
 *
 * Seamless by construction rather than by cross-fade. Every oscillator here is
 * periodic in θ, so the picture at θ and at θ+2π is identical and the loop has
 * no seam to hide. The four phases are not four animations played in sequence —
 * they are four readings of one function, and the envelope that separates them
 * is a raised cosine, so the handover between any two of them is already smooth
 * before anything else is done.
 *
 * Cost control (brief §16)
 *   · the loop stops entirely when the plate leaves the viewport and when the
 *     document is hidden — see lib/ambient-clock
 *   · geometry is fixed at 17 × 7 rules and 18 nodes; nothing is allocated per
 *     frame beyond the path strings that are being replaced anyway
 *   · the three layers are three paths, so a frame costs three attribute writes
 *     and eighteen node updates — not a re-render
 *   · scroll exit progress arrives as a ref written by an already-registered
 *     scroll listener. Reading it back through getComputedStyle() would force a
 *     style recalculation sixty times a second.
 *
 * This is a drawing of a method, not a simulation of a building.
 */

const W = 960;
/* A wide band rather than a panel: the field is a drawing, and at 1:1 on a
   laptop it should read as one section of a larger plate, not as a tile. */
const H_BAND = 284;
/* …but a 960×284 band at a phone's width is 328×97, which is a stripe, not a
   study. The drawing below is written in normalised u,v rather than in fixed
   coordinates, so a narrower plate gets a taller one instead of a smaller one —
   the same surface, read vertically. Height follows measured width for exactly
   that reason. */
const H_PORTRAIT = 595;
const PAD = 26;
const PERIOD = 14; // seconds — §08 asks for 10–16s
const NU = 17;
const NV = 7;
/* Maximum cursor lean, in viewBox units, on each axis. Held constant so the
   relief budget in draw() can reserve exactly this much headroom. */
const PUSH_X = 20;
const PUSH_Y = 11;
const uAt = (i: number) => i / (NU - 1);
const vAt = (j: number) => j / (NV - 1);

/** Node subsample: six across, three down. */
const NODE_COLS = [2, 5, 8, 11, 14, 16];
const NODE_ROWS = [1, 3, 5];
const NODE_COUNT = NODE_COLS.length * NODE_ROWS.length;

const MODES = ["SURFACE", "STRUCTURE", "FORM"] as const;
type Mode = (typeof MODES)[number];

/** What each mode does to the same surface. */
const MODE_Z = [1, 0.2, 1];
const MODE_TOPO = [0.16, 1, 0.3];
const MODE_MASS = [0, 0, 1];

/** Phase names, read from the cycle position rather than from a separate timer. */
const PHASES = ["RULES", "STRUCTURE", "FORM", "VARIATION"];

/** Piecewise blend across the three mode settings, clamped at both ends. */
function blendMode(values: number[], b: number) {
  const t = Math.max(0, Math.min(values.length - 1, b));
  const i = Math.min(values.length - 2, Math.floor(t));
  return values[i] + (values[i + 1] - values[i]) * (t - i);
}

/** Landscape band on anything with room for it, portrait plate below that. */
function plateHeight(width: number) {
  return width >= 640 ? H_BAND : H_PORTRAIT;
}

export function FormField() {
  const calm = Boolean(useReducedMotion());
  const host = useRef<HTMLDivElement>(null);
  const plate = useRef<SVGSVGElement>(null);
  const inView = useInView(host, { margin: "160px 0px" });

  /* Plate height is the one piece of geometry that has to be measured, because
     it is what keeps the drawing readable on a phone. Width is read from the
     element rather than from the window, so it is the drawn width — the value
     the plate is actually being scaled into — that picks the orientation. */
  const [H, setH] = useState(H_BAND);
  const measured = useRef(-1);

  useEffect(() => {
    const el = plate.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      // Guarded on width alone: the height this branch sets feeds back into the
      // element's box, so an unguarded observer would loop on its own output.
      if (!w || Math.abs(w - measured.current) < 1) return;
      measured.current = w;
      setH(plateHeight(w));
      // Stroke widths are in viewBox units, so on a phone a 0.9-unit rule
      // rasterises to a third of a pixel and the whole drawing greys out. The
      // stylesheet multiplies its widths by this reciprocal scale instead of
      // each breakpoint restating them.
      el.style.setProperty("--ff-widen", String(Math.min(3.2, W / w).toFixed(3)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isoRef = useRef<SVGPathElement>(null);
  const transRef = useRef<SVGPathElement>(null);
  const topoRef = useRef<SVGPathElement>(null);
  const massRef = useRef<SVGPathElement>(null);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const scaffoldRef = useRef<SVGGElement>(null);
  const rootRef = useRef<SVGGElement>(null);

  const pointer = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  const mode = useRef<Mode>("SURFACE");
  const blend = useRef(0); // 0 SURFACE · 1 STRUCTURE · 2 FORM
  const exitQ = useRef(0); // 0 in view → 1 scrolled past
  const lastAngle = useRef(0.46 * Math.PI * 2);
  const lastPhase = useRef(-1);

  const [modeLabel, setModeLabel] = useState<Mode>("SURFACE");
  const [isPaused, setIsPaused] = useState(false);

  const draw = useCallback((theta: number, instant = false) => {
    const p = pointer.current;
    const iso = isoRef.current;
    const trans = transRef.current;
    const topo = topoRef.current;
    const mass = massRef.current;

    const target = MODES.indexOf(mode.current);
    if (instant) blend.current = target;
    else blend.current += (target - blend.current) * 0.12;

    const zScale = blendMode(MODE_Z, blend.current);
    const topoOn = blendMode(MODE_TOPO, blend.current) * (1 - exitQ.current);
    const massOn = blendMode(MODE_MASS, blend.current) * (1 - exitQ.current);

    const cycle = (((theta / (Math.PI * 2)) % 1) + 1) % 1;

    // The envelope: flat enough to read as rules, deep enough to read as a
    // form, and back — from one raised cosine, so nothing is keyed.
    const env = 0.2 + 0.8 * (0.5 - 0.5 * Math.cos(theta - 1.75));
    // Frequencies drift on the same clock, which is what makes VARIATION a
    // different geometry rather than a replay of the first one.
    const k1 = 1.9 + 0.7 * Math.sin(theta);
    const k2 = 2.4 + 0.5 * Math.cos(theta);

    const cx = W / 2;
    const cy = H / 2;
    /* Relief budget. The frame's inner half-extent is split once, here, into a
       flat base plus an amplitude plus a pointer allowance, and the three sum
       back to exactly that half-extent. So the surface can lift as far as z
       runs — z is bounded by construction, |z| ≤ env·zScale ≤ 1 — and still not
       one rule crosses the border. Scaling the relief as a fraction of the base
       span instead is what let it escape the frame. */
    const innerX = (W - PAD * 2) / 2;
    const innerY = (H - PAD * 2) / 2;
    const ampX = innerX * 0.21;
    const ampY = innerY * 0.27;
    const baseX = innerX - ampX - PUSH_X;
    const baseY = innerY - ampY - PUSH_Y;

    const field = (u: number, v: number) => {
      const z =
        env * zScale *
        (0.62 * Math.sin(u * Math.PI * k1 * 2 + v * 2.1 + theta * 2) *
          Math.cos(v * Math.PI * k2 - theta) +
          0.38 * Math.sin((u + v) * Math.PI * 1.6 - theta * 1.4));
      // Pointer influence, bounded and centre-weighted, so the field leans
      // towards the cursor instead of being dragged around by it.
      const du = u - (p.x * 0.5 + 0.5);
      const dv = v - (p.y * 0.5 + 0.5);
      const fall = Math.exp(-(du * du + dv * dv) * 3.4);
      return {
        x: cx + (u - 0.5) * baseX * 2 + z * ampX + p.x * PUSH_X * fall,
        y: cy + (v - 0.5) * baseY * 2 - z * ampY + p.y * PUSH_Y * fall,
        z,
      };
    };

    if (iso) {
      let d = "";
      for (let j = 0; j < NV; j++) {
        const v = vAt(j);
        for (let i = 0; i < NU; i++) {
          const q = field(uAt(i), v);
          d += `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        }
      }
      iso.setAttribute("d", d);
    }

    if (trans) {
      let d = "";
      for (let i = 0; i < NU; i++) {
        const u = uAt(i);
        for (let j = 0; j < NV; j++) {
          const q = field(u, vAt(j));
          d += `${j ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        }
      }
      trans.setAttribute("d", d);
    }

    if (topo) {
      // Every other cell, so the diagonals read as structure rather than as
      // hatching. One path, so the whole layer costs a single attribute write.
      let d = "";
      for (let j = 0; j < NV - 1; j++) {
        for (let i = 0; i < NU - 1; i += 2) {
          const a = field(uAt(i), vAt(j));
          const b = field(uAt(i + 1), vAt(j + 1));
          d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        }
      }
      topo.setAttribute("d", d);
      topo.style.opacity = topoOn.toFixed(3);
    }

    if (mass) {
      // Stepped massing: each row's silhouette closed down to the base line. It
      // is derived from the same surface rather than drawn separately, so FORM
      // cannot disagree with SURFACE.
      let d = "";
      for (let j = 0; j < NV; j++) {
        const v = vAt(j);
        let top = "";
        for (let i = 0; i < NU; i++) {
          const q = field(uAt(i), v);
          top += `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
        }
        d += `${top}L${(W - PAD).toFixed(1)} ${(H - PAD).toFixed(1)}L${PAD} ${(H - PAD).toFixed(1)}Z`;
      }
      mass.setAttribute("d", d);
      mass.style.opacity = (massOn * 0.2).toFixed(3);
    }

    let n = 0;
    for (const r of NODE_ROWS) {
      for (const c of NODE_COLS) {
        const el = nodeRefs.current[n++];
        if (!el) continue;
        const q = field(uAt(c), vAt(r));
        el.setAttribute("transform", `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`);
        // Depth read: the parts of the field that are lifted are drawn darker.
        const lift = Math.max(0, Math.min(1, q.z * 0.9 + 0.5));
        el.style.opacity = (0.18 + 0.5 * lift * (1 - exitQ.current * 0.6)).toFixed(3);
        el.setAttribute("r", (1.5 + 1.4 * lift).toFixed(2));
      }
    }

    // The cycle opens on its scaffold: two axes, four corner points and one
    // named control. They are full strength at cycle 0 and gone by the time
    // STRUCTURE arrives, which is how the loop starts without a cut.
    if (scaffoldRef.current) {
      scaffoldRef.current.style.opacity = Math.max(0, Math.min(1, (0.28 - cycle) / 0.18)).toFixed(3);
    }

    if (phaseRef.current) {
      const idx = Math.min(3, Math.floor(cycle * 4));
      if (idx !== lastPhase.current) {
        lastPhase.current = idx;
        phaseRef.current.textContent = PHASES[idx];
      }
    }

    // §11 — the field simplifies on its way out: it recedes and lifts rather
    // than switching off, so the focus moves to ABOUT without a cut.
    if (rootRef.current) {
      const q = exitQ.current;
      rootRef.current.style.opacity = (1 - q * 0.7).toFixed(3);
      rootRef.current.style.translate = `0 ${(-q * 26).toFixed(1)}px`;
    }
  }, [H]);

  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  // One settled frame on mount, so the plate is never blank while it waits to
  // become visible — or ever, under reduced motion. Repainted whenever the plate
  // changes shape, which on a phone is the difference between a study and a
  // stripe.
  useEffect(() => {
    drawRef.current(0.46 * Math.PI * 2, true);
  }, [H]);

  useAmbientTick(
    (time) => {
      const p = pointer.current;
      p.x += (p.tx - p.x) * 0.075;
      p.y += (p.ty - p.y) * 0.075;
      const theta = (time / PERIOD) * Math.PI * 2;
      lastAngle.current = theta;
      drawRef.current(theta);
    },
    inView && !calm && !isPaused,
  );

  // Scroll exit progress. Written into a ref rather than a CSS variable read
  // back per frame — a getComputedStyle() inside the loop would force a style
  // recalculation on every single frame.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const travelled = window.innerHeight * 0.82 - r.top;
      const span = r.height + window.innerHeight * 0.5;
      const q = Math.max(0, Math.min(1, travelled / Math.max(1, span)));
      exitQ.current = q;
      el.style.setProperty("--q", q.toFixed(3));
      // While the field is paused or motion is off, the loop is not running, so
      // the exit has to be applied here instead — otherwise a paused field would
      // keep its geometry after the section scrolled away.
      if (!isPaused && !calm) drawRef.current(lastAngle.current);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [calm, isPaused]);

  const onMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const svg = plate.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    // Through the SVG's own transform rather than the host's box: the plate is
    // scaled and letterboxed by the viewBox, and on a phone it is also a
    // different shape than it is on a laptop. Normalising against the host rect
    // would quietly bias the lean by the container padding.
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
    pointer.current.tx = Math.max(-1, Math.min(1, (p.x / W) * 2 - 1));
    pointer.current.ty = Math.max(-1, Math.min(1, (p.y / H) * 2 - 1));
  }, [H]);

  const onLeave = useCallback(() => {
    pointer.current.tx = 0;
    pointer.current.ty = 0;
  }, []);

  const cycleMode = useCallback(() => {
    const next = MODES[(MODES.indexOf(mode.current) + 1) % MODES.length];
    mode.current = next;
    setModeLabel(next);
    // Redraw immediately so the click is answered on the click, not on the next
    // frame — which is the only thing that happens when the field is paused or
    // when motion is off.
    drawRef.current(lastAngle.current);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((v) => !v);
  }, []);

  return (
    <figure className="form-field" ref={host} onPointerMove={onMove} onPointerLeave={onLeave}>
      <figcaption className="form-field-head">
        <span className="meta-key">RULES → COMPUTATION → GEOMETRY → FORM</span>
        <span className="form-field-phase meta-key" aria-live="polite">
          <span ref={phaseRef}>FORM</span>
        </span>
      </figcaption>

      <svg
        ref={plate}
        className="form-field-canvas"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="参数化形态场示意：一张规则网格在四个阶段之间连续变化——先是规则、控制点与初始网格，然后连接成结构，再抬升为空间形态，最后参数漂移产生新的几何变体，随后回到新的生成周期。"
      >
        <g ref={rootRef}>
          <rect className="ff-frame" x={10} y={10} width={W - 20} height={H - 20} />
          <line className="ff-axis" x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} />
          <line className="ff-axis" x1={W / 2} x2={W / 2} y1={PAD} y2={H - PAD} />
          <path ref={massRef} className="ff-mass" d="" />
          <path ref={isoRef} className="ff-row" d="" />
          <path ref={transRef} className="ff-rule" d="" />
          <path ref={topoRef} className="ff-topo" d="" />
          {Array.from({ length: NODE_COUNT }, (_, i) => (
            <circle
              key={i}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className="ff-node"
              cx={0}
              cy={0}
              r={2}
            />
          ))}
          <g ref={scaffoldRef} className="ff-scaffold">
            <text className="ff-micro" x={PAD} y={PAD - 9}>
              u
            </text>
            <text className="ff-micro" x={W - PAD - 16} y={PAD - 9}>
              v
            </text>
            <circle className="ff-control" cx={W / 2} cy={H / 2} r={5} />
            <text className="ff-micro" x={W / 2 + 12} y={H / 2 + 4}>
              CONTROL
            </text>
            <circle className="ff-control" cx={PAD} cy={H / 2} r={3} />
            <circle className="ff-control" cx={W - PAD} cy={H / 2} r={3} />
            <circle className="ff-control" cx={W / 2} cy={PAD} r={3} />
            <circle className="ff-control" cx={W / 2} cy={H - PAD} r={3} />
          </g>
        </g>
      </svg>

      <div className="form-field-foot">
        <p className="form-field-caption">
          规则不是静止的。参数连续变化时，同一张网格不断产生新的可能形态。
        </p>
        <div className="form-field-controls">
          <span className="form-field-mode meta-key">{modeLabel}</span>
          <button
            type="button"
            className="form-field-btn"
            onClick={cycleMode}
            aria-label={`切换生成模式，当前 ${modeLabel}`}
          >
            EXPLORE RULES
          </button>
          <button
            type="button"
            className="form-field-btn"
            onClick={togglePause}
            aria-pressed={isPaused}
          >
            {isPaused ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </div>
    </figure>
  );
}