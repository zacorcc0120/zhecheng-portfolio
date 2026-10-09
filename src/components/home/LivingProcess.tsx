"use client";

import { useCallback, useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { disciplines } from "@/data/site";
import { useAmbientTick } from "@/lib/ambient-clock";

/**
 * LIVING PROCESS — REGION A.
 *
 * The METHOD section argues that four different surfaces come out of one
 * pipeline. That argument was three paragraphs of type beside a list. This is
 * the same statement as a running diagram: four domains feed one generator, and
 * the generator produces four kinds of form.
 *
 * It is deliberately the quieter of the two new drawings. RULES INTO
 * POSSIBILITIES gets the signature; this is an instrument panel beside the
 * argument, sized to the grid column it sits in rather than to the page.
 *
 * Everything that moves is a function of the shared clock's `time`, so the cycle
 * is seamless by construction — every oscillator is periodic in θ, which makes
 * θ and θ+2π the same picture. Nothing resets and nothing snaps.
 *
 * Cost
 * ----
 * One draw() writes roughly thirty SVG attributes per frame and touches no
 * React state at all, so a twelve-second cycle causes zero re-renders. Only the
 * frame rules and the labels are static markup; everything that moves is a ref
 * the loop writes to. The four outputs are four readings of one generator —
 * hovering a domain in the list beside the panel brings that reading forward —
 * and the plate labels itself NOT A LIVE SOLVER, because it is a drawing of a
 * method, not a solver.
 */

const W = 400;
const H = 470;
const PERIOD = 12; // seconds — §05 asks for 8–14s

const INPUT_Y = [74, 108, 142, 176];
const PROCESS_Y = 241;
const OUTPUT_TOP = 302;
const OUTPUT_X = [58, 158, 258, 346];

const OUTPUTS = [
  { key: "STRUCTURE", label: "规则几何" },
  { key: "SEMANTIC MAP", label: "语义映射" },
  { key: "INTERFACE GRID", label: "信息网格" },
  { key: "CONSTRAINTS", label: "约束场" },
];

/* Output sub-geometries, in their own coordinate ranges. */
const RAILS = [318, 350, 382];
const SPAN = 80; // lattice width
const LAT_COLS = 8;
const latX = (i: number) => 18 + (i * SPAN) / (LAT_COLS - 1);

const SEM_Y = [326, 350, 374];
const IF_ROWS = [318, 340, 362, 384];
/* The last output column sits 54 units from the right edge, so the constraint
   field is sized to that, not to a radius that happens to look right: at 386 with
   a 52-unit ring plus its 6-unit swing the ellipses ran 44 units past the
   viewBox and the panel clipped them. The four output groups also have to share
   the width between them without touching — C's widest row ends at 302, so D's
   frame starts at 306. */
const CON_R = [12, 19, 26, 33];
const CON_CX = 346;
const CON_CY = 356;

export function LivingProcess({ focus = -1 }: { focus?: number }) {
  const calm = Boolean(useReducedMotion());
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host, { margin: "140px 0px" });

  const focusRef = useRef(focus);
  // Kept in an effect rather than assigned during render: `draw` reads it from
  // the clock callback, which is never part of a render pass.
  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);

  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const canvasRef = useRef<SVGSVGElement>(null);
  const inLinkRefs = useRef<(SVGPathElement | null)[]>([]);
  const outLinkRefs = useRef<(SVGPathElement | null)[]>([]);
  const spineRef = useRef<SVGLineElement>(null);
  const scanRef = useRef<SVGRectElement>(null);
  const diagRefs = useRef<(SVGLineElement | null)[]>([]);
  const latNodeRefs = useRef<(SVGRectElement | null)[]>([]);
  const semRefs = useRef<(SVGCircleElement | null)[]>([]);
  const semEdgeRefs = useRef<(SVGPathElement | null)[]>([]);
  const semTickRefs = useRef<(SVGLineElement | null)[]>([]);
  const ifBoxRefs = useRef<(SVGRectElement | null)[]>([]);
  const ifRuleRefs = useRef<(SVGLineElement | null)[]>([]);
  const conRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);

  // Pointer destination and its damped follower. Damping lives in the tick so
  // the event handler only ever records a target.
  const pointer = useRef({ tx: 0, ty: 0, x: 0, y: 0 });

  const draw = useCallback((theta: number) => {
    const p = pointer.current;
    const f = focusRef.current;

    // 01 — inputs drift, and the four links follow them.
    for (let i = 0; i < INPUT_Y.length; i++) {
      const y = INPUT_Y[i];
      // Weight falls off from the middle of the column so the response reads as
      // the diagram leaning towards the cursor rather than everything sliding
      // together. Bounded to a few pixels: this is a response, not a handle.
      const near = 1 - Math.abs(i - 1.5) / 2.6;
      const dy = 1.7 * Math.sin(theta * 2 + i * 1.7) + p.y * near * 5;
      const dx = p.x * near * 3.4;
      const node = nodeRefs.current[i];
      if (node) {
        node.setAttribute("transform", `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
        node.setAttribute(
          "r",
          (3.2 + 0.55 * (0.5 + 0.5 * Math.sin(theta * 2 + i))).toFixed(2),
        );
      }
      const link = inLinkRefs.current[i];
      if (link) {
        const c1 = 92 + 15 * Math.sin(theta + i * 0.9);
        const c2 = 118 + 13 * Math.cos(theta * 1.2 + i);
        link.setAttribute(
          "d",
          `M${(14 + dx).toFixed(1)} ${(y + dy).toFixed(1)}C${c1.toFixed(1)} ${(y + dy).toFixed(1)} ${c2.toFixed(1)} ${PROCESS_Y} 150 ${PROCESS_Y}`,
        );
        link.style.opacity = String(
          (0.2 + 0.32 * (0.5 + 0.5 * Math.sin(theta * 1.4 + i * 0.8))) *
            (f < 0 || f === i ? 1 : 0.24),
        );
      }
    }

    if (spineRef.current) {
      spineRef.current.style.opacity = String(0.2 + 0.14 * (0.5 + 0.5 * Math.sin(theta)));
    }

    // One slow pass of light along the process bar, wrapped so the wrap is
    // invisible rather than a jump.
    if (scanRef.current) {
      const cycle = ((theta / (Math.PI * 2)) % 1 + 1) % 1;
      const sweep = cycle * 1.12 - 0.06;
      scanRef.current.setAttribute("x", (150 + sweep * 96).toFixed(1));
      scanRef.current.style.opacity = sweep < -0.02 || sweep > 1.02 ? "0" : "0.45";
    }

    // 02 — outputs fan out of the generator.
    for (let i = 0; i < OUTPUT_X.length; i++) {
      const link = outLinkRefs.current[i];
      if (!link) continue;
      const ox = OUTPUT_X[i];
      const oy = OUTPUT_TOP + 6 + 3 * Math.sin(theta * 1.6 + i * 1.1);
      link.setAttribute(
        "d",
        `M250 ${PROCESS_Y}C${(284 + i * 5).toFixed(1)} ${PROCESS_Y} ${(ox - 42).toFixed(1)} ${oy.toFixed(1)} ${ox} ${oy.toFixed(1)}`,
      );
      link.style.opacity = String(
        (0.16 + 0.24 * (0.5 + 0.5 * Math.sin(theta * 1.2 + i * 1.3))) *
          (f < 0 || f === i ? 1 : 0.2),
      );
    }

    // 03 — output A: a lattice that re-ties. Same members, other structure.
    //
    // The re-tie is a continuous tilt, not a boolean swap. Flipping every member
    // at once on a sign change reads as a glitch rather than as a rule changing,
    // and it would put a hard edge in the middle of a loop that is otherwise
    // seamless: each diagonal rotates through flat, so the two states are joined
    // by geometry rather than by a cut.
    const swap = Math.sin(theta * 2);
    for (let i = 0; i < LAT_COLS - 1; i++) {
      const d = diagRefs.current[i];
      if (!d) continue;
      const t = 0.5 - 0.5 * swap;
      const s = i % 2 === 0 ? t : 1 - t;
      const reach = RAILS[2] - RAILS[0];
      d.setAttribute("x1", String(latX(i)));
      d.setAttribute("x2", String(latX(i + 1)));
      d.setAttribute("y1", (RAILS[0] + reach * s).toFixed(1));
      d.setAttribute("y2", (RAILS[2] - reach * s).toFixed(1));
      // Members fade as they approach flat, so the hinge does not read as a
      // pause in the drawing.
      d.style.opacity = (0.1 + 0.24 * (1 - Math.abs(2 * s - 1))).toFixed(3);
    }
    for (let i = 0; i < latNodeRefs.current.length; i++) {
      const n = latNodeRefs.current[i];
      if (!n) continue;
      const col = [1, 4, 6][i];
      const row = i % 2;
      n.setAttribute(
        "transform",
        `translate(${(p.x * 2.4).toFixed(2)} ${(p.y * 1.8).toFixed(2)})`,
      );
      n.setAttribute("x", (latX(col) - 2).toFixed(1));
      n.setAttribute("y", (RAILS[row + 1] - 2).toFixed(1));
    }

    // 04 — output B: semantic nodes mapped onto parameters.
    const drift = Math.sin(theta * 1.5) * 3;
    for (let i = 0; i < SEM_Y.length; i++) {
      const c = semRefs.current[i];
      const e = semEdgeRefs.current[i];
      const wobble = Math.sin(theta * 2 + i * 1.3) * 2;
      const cy = SEM_Y[i] + wobble;
      if (c) {
        c.setAttribute("cx", (122 + drift * 0.4).toFixed(1));
        c.setAttribute("cy", cy.toFixed(1));
      }
      if (e) {
        e.setAttribute(
          "d",
          `M${(126 + drift * 0.4).toFixed(1)} ${cy.toFixed(1)} L152 ${(i < 1.5 ? 340 : 368).toFixed(1)}`,
        );
        e.style.opacity = String(0.2 + 0.2 * (0.5 + 0.5 * Math.sin(theta + i)));
      }
    }
    for (let i = 0; i < semTickRefs.current.length; i++) {
      const t = semTickRefs.current[i];
      if (!t) continue;
      const y = (322 + i * 18 - drift * 0.3).toFixed(1);
      t.setAttribute("y1", y);
      t.setAttribute("y2", y);
    }

    // 05 — output C: an interface layout whose columns redistribute.
    const shift = 0.5 + 0.5 * Math.sin(theta * 1.2);
    const widths = [
      66,
      46 + shift * 22,
      56 - shift * 18,
      38 + shift * 16,
    ];
    for (let i = 0; i < IF_ROWS.length; i++) {
      const box = ifBoxRefs.current[i];
      const rule = ifRuleRefs.current[i];
      const w = widths[i];
      if (box) box.setAttribute("width", w.toFixed(1));
      if (rule) rule.setAttribute("x2", (234 + w * 0.62).toFixed(1));
    }

    // 06 — output D: constraint curves breathing around three control points.
    for (let i = 0; i < CON_R.length; i++) {
      const e = conRefs.current[i];
      if (!e) continue;
      e.setAttribute("rx", (CON_R[i] + 5 * Math.sin(theta * 1.4 + i)).toFixed(1));
      e.style.opacity = String(0.18 + 0.18 * (0.5 + 0.5 * Math.cos(theta * 1.1 + i)));
    }

    // 07 — emphasis. With nothing hovered the four outputs sit at one weight
    // and the plate reads as a single generator.
    for (let i = 0; i < groupRefs.current.length; i++) {
      const el = groupRefs.current[i];
      if (!el) continue;
      el.style.opacity = f < 0 ? "0.6" : f === i ? "1" : "0.15";
    }
  }, []);

  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  // A settled frame is drawn on mount so the plate is never blank while it waits
  // to become visible — or ever, under reduced motion.
  useEffect(() => {
    drawRef.current(0.55 * Math.PI * 2);
  }, []);

  useAmbientTick(
    (time) => {
      const p = pointer.current;
      // Same 0.075 follower the hero field uses, so the two drawings feel like
      // one instrument rather than two.
      p.x += (p.tx - p.x) * 0.075;
      p.y += (p.ty - p.y) * 0.075;
      drawRef.current((time / PERIOD) * Math.PI * 2);
    },
    inView && !calm,
  );

  const onMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const svg = canvasRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    // Through the SVG's own transform, not the host box: the panel is padded and
    // the drawing is scaled into the content area, so normalising against the
    // host would bias the lean by the padding on every side.
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
    pointer.current.tx = Math.max(-1, Math.min(1, (p.x / W) * 2 - 1));
    pointer.current.ty = Math.max(-1, Math.min(1, (p.y / H) * 2 - 1));
  }, []);

  const onLeave = useCallback(() => {
    pointer.current.tx = 0;
    pointer.current.ty = 0;
  }, []);

  return (
    <figure
      className="living-process"
      ref={host}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <figcaption className="living-process-head">
        <span className="meta-key">LIVING PROCESS</span>
        <span className="meta-key">GENERATIVE STUDY</span>
      </figcaption>

      <svg
        ref={canvasRef}
        className="living-process-canvas"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="生成式流程示意：参数化设计、AI 工作流、数字产品与计算设计四个领域汇入同一个生成器，输出规则几何、语义映射、信息网格与约束场四种形态。这是一张方法图示，不是真实运行的求解器。"
      >
        <text className="lp-label" x={0} y={52}>
          INPUT
        </text>
        <text className="lp-label" x={W} y={52} textAnchor="end">
          FOUR DOMAINS
        </text>

        {INPUT_Y.map((y, i) => (
          <g key={y}>
            <line className="lp-lead" x1={4} x2={8} y1={y} y2={y} strokeWidth={1.4} />
            <circle
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className="lp-node"
              cx={14}
              cy={y}
              r={3.2}
            />
            <text className="lp-input" x={26} y={y + 4}>
              {disciplines[i].name.toUpperCase()}
            </text>
          </g>
        ))}

        {INPUT_Y.map((y, i) => (
          <path
            key={`l${y}`}
            ref={(el) => {
              inLinkRefs.current[i] = el;
            }}
            className="lp-link"
            d={`M14 ${y}C92 ${y} 118 ${PROCESS_Y} 150 ${PROCESS_Y}`}
          />
        ))}

        <line
          ref={spineRef}
          className="lp-spine"
          x1={W / 2}
          x2={W / 2}
          y1={182}
          y2={228}
        />

        <rect className="lp-block" x={150} y={228} width={100} height={26} />
        <text className="lp-block-label" x={W / 2} y={245} textAnchor="middle">
          CENTRAL PROCESS
        </text>
        <rect ref={scanRef} className="lp-scan" x={150} y={228} width={9} height={26} />

        {OUTPUT_X.map((ox, i) => (
          <path
            key={`o${ox}`}
            ref={(el) => {
              outLinkRefs.current[i] = el;
            }}
            className="lp-link lp-link-out"
            d={`M250 ${PROCESS_Y}C284 ${PROCESS_Y} ${ox - 42} ${OUTPUT_TOP} ${ox} ${OUTPUT_TOP}`}
          />
        ))}

        <text className="lp-label" x={0} y={296}>
          OUTPUT
        </text>
        <text className="lp-label" x={W} y={296} textAnchor="end">
          FOUR FORMS
        </text>

        {/* A — structure: a triangulated lattice whose diagonals re-tie. */}
        <g
          className="lp-out"
          ref={(el) => {
            groupRefs.current[0] = el;
          }}
        >
          {RAILS.map((y) => (
            <line key={y} className="lp-thin" x1={18} x2={98} y1={y} y2={y} />
          ))}
          {Array.from({ length: LAT_COLS }, (_, i) => (
            <line
              key={`v${i}`}
              className="lp-thin"
              x1={latX(i)}
              x2={latX(i)}
              y1={RAILS[0]}
              y2={RAILS[RAILS.length - 1]}
            />
          ))}
          {Array.from({ length: LAT_COLS - 1 }, (_, i) => (
            <line
              key={`d${i}`}
              ref={(el) => {
                diagRefs.current[i] = el;
              }}
              className="lp-thin lp-diag"
              x1={latX(i)}
              x2={latX(i + 1)}
              y1={RAILS[0]}
              y2={RAILS[0]}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              ref={(el) => {
                latNodeRefs.current[i] = el;
              }}
              className="lp-solid"
              x={latX(1) - 2}
              y={RAILS[1] - 2}
              width={4}
              height={4}
            />
          ))}
        </g>

        {/* B — semantic map: language nodes mapped onto parameters. */}
        <g
          className="lp-out"
          ref={(el) => {
            groupRefs.current[1] = el;
          }}
        >
          <rect className="lp-box" x={152} y={330} width={22} height={20} />
          <rect className="lp-box lp-box-alt" x={152} y={358} width={22} height={20} />
          {SEM_Y.map((y, i) => (
            <g key={y}>
              <circle
                ref={(el) => {
                  semRefs.current[i] = el;
                }}
                className="lp-hollow"
                cx={122}
                cy={y}
                r={4}
              />
              <path
                ref={(el) => {
                  semEdgeRefs.current[i] = el;
                }}
                className="lp-thin"
                d={`M126 ${y} L152 ${340}`}
              />

            </g>
          ))}
          <path className="lp-thin" d={`M174 340 L192 336`} />
          <path className="lp-thin" d={`M174 368 L192 372`} />
          {[0, 1, 2, 3].map((i) => (
            <g key={`p${i}`}>
              <line
                ref={(el) => {
                  semTickRefs.current[i] = el;
                }}
                className="lp-tick"
                x1={192}
                x2={204}
                y1={322}
                y2={322}
              />

            </g>
          ))}
        </g>

        {/* C — interface grid: an abstract layout, not a screenshot. */}
        <g
          className="lp-out"
          ref={(el) => {
            groupRefs.current[2] = el;
          }}
        >
          <line className="lp-thin lp-rail" x1={222} x2={222} y1={312} y2={398} />
          {IF_ROWS.map((y, i) => (
            <g key={y}>
              <rect
                ref={(el) => {
                  ifBoxRefs.current[i] = el;
                }}
                className="lp-box"
                x={234}
                y={y}
                width={78}
                height={12}
              />
              <line
                ref={(el) => {
                  ifRuleRefs.current[i] = el;
                }}
                className="lp-thin"
                x1={234}
                x2={282}
                y1={y + 6}
                y2={y + 6}
              />
            </g>
          ))}

        </g>

        {/* D — constraints: curves breathing around three control points. */}
        <g
          className="lp-out"
          ref={(el) => {
            groupRefs.current[3] = el;
          }}
        >
          <rect className="lp-dash-box" x={306} y={312} width={86} height={88} />
          {CON_R.map((r, i) => (
            <ellipse
              key={r}
              ref={(el) => {
                conRefs.current[i] = el;
              }}
              className="lp-arc"
              cx={CON_CX}
              cy={CON_CY}
              rx={r}
              ry={r}
            />
          ))}
          {[
            [CON_CX - 30, CON_CY - 22],
            [CON_CX + 26, CON_CY + 6],
            [CON_CX - 6, CON_CY + 34],
          ].map(([x, y], i) => (
            <rect key={i} className="lp-solid" x={x - 2} y={y - 2} width={4} height={4} />
          ))}
        </g>

        {OUTPUTS.map((out, i) => (
          <text
            key={out.key}
            className="lp-out-label"
            x={OUTPUT_X[i]}
            y={430}
            textAnchor="middle"
          >
            {out.key}
          </text>
        ))}

        <line className="lp-rule" x1={0} x2={W} y1={444} y2={444} />
        <text className="lp-foot" x={0} y={460}>
          {OUTPUTS[0].label} / {OUTPUTS[1].label} / {OUTPUTS[2].label} / {OUTPUTS[3].label}
        </text>
        <text className="lp-foot lp-foot-r" x={W} y={460} textAnchor="end">
          NOT A LIVE SOLVER
        </text>
      </svg>
    </figure>
  );
}