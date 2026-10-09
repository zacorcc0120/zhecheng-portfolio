"use client";

import { useMemo } from "react";
import type { SculptParams } from "@/lib/sculpture";

/**
 * The no-WebGL path: an architectural elevation of the same form.
 *
 * This is not a placeholder grey box and it is not a different drawing. It is
 * the same parameter vector read as a section rather than as a render — crown
 * line, rib stations, twist shear, footprint — so a device without WebGL still
 * gets the object and still gets its rules, and the parameters that drive it
 * are visibly the parameters that drive the solid.
 */

const W = 900;
const H = 420;
const BASE_Y = 344;
const LEFT = 70;
const RIGHT = 830;
const SPAN_W = RIGHT - LEFT;

const ribRank = (i: number) => {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

export function VaultDrawing({ params }: { params: SculptParams }) {
  const { rise, span, twist, fold, close, density, lattice, surface, ribDepth } = params;

  const { springs, ribs, members, plan, planEdge, ridge } = useMemo(() => {
    const at = (t: number) => {
      const env = Math.pow(Math.max(Math.sin(Math.PI * t), 0), 0.62);
      return {
        env,
        x: LEFT + t * SPAN_W,
        // Crown height and half-width, straight from the same two terms the
        // surface function uses.
        y: BASE_Y - rise * env * 168,
        half: span * 0.78 * (0.15 + 0.85 * env) * (1 - close * 0.5 * (1 - env)) * 172,
        z: fold * Math.sin(2 * Math.PI * t) * 46,
      };
    };

    const crown = Array.from({ length: 61 }, (_, i) => at(i / 60));
    // The springing line: where the shell meets the ground, both ends pulled in.
    const springs = Array.from({ length: 61 }, (_, i) => {
      const p = at(i / 60);
      return `${p.x.toFixed(1)} ${(BASE_Y - p.env * 2).toFixed(1)}`;
    }).join(" L");

    const RIB_N = 13;
    const ribs = Array.from({ length: RIB_N }, (_, r) => {
      const t = (r + 0.5) / RIB_N;
      const p = at(t);
      const rank = ribRank(Math.floor(t * RIB_N + 0.5));
      const prom = Math.min(1, Math.max(0, (rank - (1 - density)) * 2.4));
      // The shear is the twist: where you look from the side, a rotated section
      // shows as the crown line sliding across the section.
      const ang = twist * (t - 0.5) * Math.PI;
      const dx = Math.sin(ang) * p.half * 0.5;
      // The rib stands proud of the membrane, so it is drawn above the crown
      // line by the same amount the shader pushes it along the normal.
      const top = p.y - prom * ribDepth * 9;
      return {
        d: `M${(p.x + dx).toFixed(1)} ${(BASE_Y - 1).toFixed(1)} L${(p.x + dx).toFixed(1)} ${top.toFixed(1)} L${(p.x - dx).toFixed(1)} ${top.toFixed(1)} L${(p.x - dx).toFixed(1)} ${(BASE_Y - 1).toFixed(1)}`,
        depth: (0.14 + 0.62 * prom * surface).toFixed(3),
        w: (0.8 + 1.5 * prom).toFixed(2),
      };
    });

    const members = Array.from({ length: 8 }, (_, m) => {
      const t = (m + 0.5) / 8;
      const p = at(t);
      return {
        x: (p.x + Math.sin(twist * (t - 0.5) * Math.PI) * p.half * 0.5).toFixed(1),
        top: (p.y - 6).toFixed(1),
        w: 0.8,
      };
    });

    const plan = crown
      .map((p, i) => `${i ? "L" : "M"}${(p.x).toFixed(1)} ${(132 + p.z).toFixed(1)}`)
      .join(" ");
    const planEdge = Array.from({ length: 31 }, (_, i) => {
      const p = at(i / 30);
      return `${(p.x).toFixed(1)} ${(132 + p.z - p.half * 0.22).toFixed(1)}`;
    }).join(" L");

    const ridge = crown
      .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    return { crown, springs, ribs, members, plan, planEdge, ridge };
  }, [close, density, fold, rise, ribDepth, span, surface, twist]);

  return (
    <svg
      className="vault-drawing"
      viewBox={`0 0 ${W} ${H}`}
      role="presentation"
      aria-hidden="true"
    >
      <g className="vd-ground">
        <line x1={LEFT - 26} y1={BASE_Y} x2={RIGHT + 26} y2={BASE_Y} />
      </g>

      <g className="vd-plan">
        <path d={plan} />
        <path d={planEdge} />
        <text x={LEFT} y={104}>
          PLAN · SPINE
        </text>
      </g>

      <g className="vd-members" opacity={Math.min(1, lattice * 1.3).toFixed(3)}>
        {members.map((m, i) => (
          <line key={`m${i}`} x1={m.x} y1={BASE_Y} x2={m.x} y2={m.top} strokeWidth={m.w} />
        ))}
      </g>

      <path className="vd-spring" d={`M${springs}`} />

      <g className="vd-shell" opacity={Math.min(1, 0.22 + surface * 0.5).toFixed(3)}>
        <path d={`${ridge} L${RIGHT} ${BASE_Y} L${LEFT} ${BASE_Y} Z`} />
      </g>

      <g className="vd-ribs">
        {ribs.map((r, i) => (
          <path key={`r${i}`} d={r.d} opacity={r.depth} strokeWidth={r.w} />
        ))}
      </g>

      <text className="vd-caption" x={LEFT} y={BASE_Y + 34}>
        ELEVATION · PARAMETRIC SECTION
      </text>
      <text className="vd-caption vd-caption-r" x={RIGHT} y={BASE_Y + 34}>
        RISE {rise.toFixed(2)} · TWIST {twist.toFixed(2)} · RIB {density.toFixed(2)}
      </text>
    </svg>
  );
}
