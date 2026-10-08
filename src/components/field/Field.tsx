"use client";
import { useEffect, useRef } from "react";

const W = 1200;
const H = 800;

type Mode = "weave" | "terrain";

const PRESET: Record<
  Mode,
  {
    rows: number;
    cols: number;
    amp: number;
    freq: number;
    nodeCols: number;
    nodeRows: number;
    drift: number;
  }
> = {
  // The hero: a tensioned woven surface, tallest and densest.
  weave: {
    rows: 22,
    cols: 22,
    amp: 14,
    freq: 2.4,
    nodeCols: 13,
    nodeRows: 9,
    drift: 96,
  },
  // Section transitions: flatter and wider, like a topographic slice. Reads
  // as a different register of the same system rather than a repeat.
  terrain: {
    rows: 14,
    cols: 26,
    amp: 22,
    freq: 1.5,
    nodeCols: 17,
    nodeRows: 5,
    drift: 140,
  },
};

// Falloff weight for a node at normalised (x, y): dense response at the centre
// of the field, nearly still at the edges. Computed once at build so the
// per-frame work is two CSS variable writes instead of React re-renders.
function falloff(x: number, y: number) {
  const dx = (x - 0.5) * 2;
  const dy = (y - 0.5) * 2;
  return Math.exp(-(dx * dx + dy * dy) * 1.9);
}

function build(p: (typeof PRESET)[Mode]) {
  const { rows, cols, amp, freq, drift, nodeCols, nodeRows } = p;

  const rowPath = (i: number) => {
    const f = (i + 0.5) / rows;
    const y0 = f * H;
    const a = amp + Math.abs(f - 0.5) * drift;
    const phase = f * Math.PI * 3.1;
    const steps = 26;
    let d = "";
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * W;
      const y =
        y0 +
        Math.sin((x / W) * Math.PI * freq + phase) * a +
        Math.sin((x / W) * Math.PI * freq * 2.4 + phase * 1.7) * a * 0.28;
      d += `${s ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  };

  const colPath = (j: number) => {
    const f = (j + 0.5) / cols;
    const x0 = f * W;
    const a = amp + Math.abs(f - 0.5) * drift;
    const phase = f * Math.PI * 3.1;
    const steps = 26;
    let d = "";
    for (let s = 0; s <= steps; s++) {
      const y = (s / steps) * H;
      const x =
        x0 +
        Math.sin((y / H) * Math.PI * freq + phase) * a +
        Math.sin((y / H) * Math.PI * freq * 2.4 + phase * 1.7) * a * 0.28;
      d += `${s ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  };

  const rowPaths = Array.from({ length: rows }, (_, i) => rowPath(i));
  const colPaths = Array.from({ length: cols }, (_, i) => colPath(i));

  const nodes: {
    x: number;
    y: number;
    w: string;
    scale: string;
  }[] = Array.from({ length: nodeCols * nodeRows }, (_, i) => {
    const cx = i % nodeCols;
    const cy = Math.floor(i / nodeCols);
    const nx = (cx + 0.5) / nodeCols;
    const ny = (cy + 0.5) / nodeRows;
    return {
      x: +(nx * W).toFixed(1),
      y: +(ny * H).toFixed(1),
      w: falloff(nx, ny).toFixed(3),
      scale: (0.7 + falloff(nx, ny) * 1.5).toFixed(2),
    };
  });

  return { rowPaths, colPaths, nodes };
}

const BUILT: Record<Mode, ReturnType<typeof build>> = {
  weave: build(PRESET.weave),
  terrain: build(PRESET.terrain),
};

/**
 * The procedural field. One system, two registers: `weave` is the hero's
 * tensioned surface, `terrain` is the flatter slice used between sections.
 *
 * Only `interactive` fields run a pointer loop. Section-transition fields are
 * driven purely by the scroll variable, so the whole page never has more than
 * one requestAnimationFrame writing styles at a time.
 */
export function Field({
  mode = "weave",
  interactive = false,
  readout = false,
  stretch = false,
  className = "",
  seed = 24.16,
}: {
  mode?: Mode;
  interactive?: boolean;
  readout?: boolean;
  /** Fill the host box exactly. The hero keeps the drawing's own aspect; a
      transition band is far wider than 3:2 and would otherwise letterbox. */
  stretch?: boolean;
  className?: string;
  seed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<SVGGElement>(null);
  const { rowPaths, colPaths, nodes } = BUILT[mode];

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const paint = () => {
      // Trails the pointer slightly rather than snapping to it.
      cx += (tx - cx) * 0.075;
      cy += (ty - cy) * 0.075;
      root.style.setProperty("--mx", cx.toFixed(4));
      root.style.setProperty("--my", cy.toFixed(4));
      if (cursorRef.current) {
        cursorRef.current.setAttribute(
          "transform",
          `translate(${(cx * 0.5 + 0.5) * W} ${(cy * 0.5 + 0.5) * H})`,
        );
      }
      raf = requestAnimationFrame(paint);
    };

    if (interactive && window.matchMedia("(pointer: fine)").matches) {
      const onMove = (event: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        tx = Math.max(
          -1,
          Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
        );
        ty = Math.max(
          -1,
          Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
        );
      };
      const onLeave = () => {
        tx = 0;
        ty = 0;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(paint);
      return () => {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
        cancelAnimationFrame(raf);
      };
    }

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [interactive]);

  // Scroll deconstruction: the mesh opens up and fades as it leaves.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const span = root.offsetHeight || 1;
        const p = Math.max(0, Math.min(1, window.scrollY / span));
        root.style.setProperty("--p", p.toFixed(4));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`field field-${mode} ${className}`.trim()} ref={ref} aria-hidden="true">
      <div className="field-mesh">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio={stretch ? "none" : undefined}
          role="presentation"
        >
          <g className="field-weave">
            {rowPaths.map((d: string, i: number) => (
              <path
                className="field-line"
                d={d}
                key={`r${i}`}
                style={{ animationDelay: `${-(i % 7) * 0.42}s` }}
              />
            ))}
            {colPaths.map((d: string, i: number) => (
              <path
                className="field-line"
                d={d}
                key={`c${i}`}
                style={{ animationDelay: `${-(i % 7) * 0.42 + 0.21}s` }}
              />
            ))}
          </g>
          <g className="field-nodes">
            {nodes.map((n, i) => (
              <rect
                className="field-node"
                key={i}
                x={n.x}
                y={n.y}
                width={2.6}
                height={2.6}
                style={
                  {
                    "--w": n.w,
                    "--s": n.scale,
                    animationDelay: `${-(i % 11) * 0.34}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </g>
          {interactive && (
            <g className="field-cursor" ref={cursorRef}>
              <circle r="34" />
              <path d="M-46 0H-14M14 0H46M0 -46V-14M0 14V46" />
            </g>
          )}
        </svg>
        {readout && (
          <div className="field-readout">
            <span>GRID 24×18</span>
            <span>
              T <span>{seed.toFixed(2)}</span>
            </span>
            <span>RES 1.0</span>
          </div>
        )}
      </div>
    </div>
  );
}
