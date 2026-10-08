"use client";
import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";

const STEPS = [
  { index: "01", title: "Input parameters", chinese: "输入参数" },
  { index: "02", title: "Base polygon", chinese: "平面基准" },
  { index: "03", title: "Column grid", chinese: "柱网生成" },
  { index: "04", title: "Vertical levels", chinese: "层级标高" },
  { index: "05", title: "Layer scaling", chinese: "逐层收分" },
  { index: "06", title: "Structural lines", chinese: "结构骨架" },
  { index: "07", title: "Member geometry", chinese: "构件实体化" },
  { index: "08", title: "Drum tower", chinese: "鼓楼形态" },
];

const SIDES = 8;
const LEVELS = 5;
const CX = 300;
const BASE_Y = 392;
const LEVEL_H = 52;
const R0 = 108;

type P = readonly [number, number];

const pair = (a: P, b: P) => [a, b] as const;

// Radius tapers with height, which is the proportional rule the tower study
// is actually about.
function radius(l: number) {
  const f = l / (LEVELS - 1);
  return R0 * (1 - f * 0.46);
}

function node(l: number, s: number): P {
  const a = (s / SIDES) * Math.PI * 2 + Math.PI / SIDES;
  const r = radius(l);
  return [CX + Math.cos(a) * r, BASE_Y - l * LEVEL_H + Math.sin(a) * r * 0.4];
}

const fmt = (n: number) => n.toFixed(1);

function pathOf(points: P[]) {
  return points.map((p, i) => `${i ? "L" : "M"}${fmt(p[0])},${fmt(p[1])}`).join("");
}

function linkPath(pairs: readonly (readonly [P, P])[]) {
  let d = "";
  for (const [a, b] of pairs) {
    d += `M${fmt(a[0])},${fmt(a[1])}L${fmt(b[0])},${fmt(b[1])}`;
  }
  return d;
}

const RINGS = Array.from({ length: LEVELS }, (_, l) =>
  pathOf(Array.from({ length: SIDES + 1 }, (_, s) => node(l, s % SIDES))),
);

const SPOKES = Array.from({ length: SIDES }, (_, s) =>
  pair([CX, BASE_Y] as P, node(0, s)),
);

const COLUMNS = Array.from({ length: SIDES }, (_, s) => pair(node(0, s), node(LEVELS - 1, s)));

const BRACES = Array.from({ length: (LEVELS - 1) * SIDES }, (_, i) =>
  pair(node(Math.floor(i / SIDES), i % SIDES), node(Math.floor(i / SIDES) + 1, (i + 1) % SIDES)),
);

// A hipped roof over the top polygon, plus the eave overhang that gives the
// tower its silhouette.
const TOP_RING = Array.from({ length: SIDES }, (_, s) => node(LEVELS - 1, s));
const PEAK: P = [CX, BASE_Y - (LEVELS - 1) * LEVEL_H - 66];
const RAFTERS = TOP_RING.map((p) => pair(p, PEAK));
const EAVE = Array.from({ length: SIDES }, (_, s) => {
  const a = (s / SIDES) * Math.PI * 2 + Math.PI / SIDES;
  const r = radius(LEVELS - 1) * 1.22;
  return pair(node(LEVELS - 1, s), [
    CX + Math.cos(a) * r,
    BASE_Y - (LEVELS - 1) * LEVEL_H + Math.sin(a) * r * 0.4,
  ]) as readonly [P, P];
});
const EAVE_RING = pathOf(
  Array.from({ length: SIDES + 1 }, (_, s) => {
    const a = (s % SIDES / SIDES) * Math.PI * 2 + Math.PI / SIDES;
    const r = radius(LEVELS - 1) * 1.22;
    return [CX + Math.cos(a) * r, BASE_Y - (LEVELS - 1) * LEVEL_H + Math.sin(a) * r * 0.4] as P;
  }),
);

const STAGE_READOUT = [
  { key: "SIDES", value: "8" },
  { key: "BASE R", value: "3.60 m" },
  { key: "EAVES", value: "5" },
  { key: "HEIGHT", value: "13.80 m" },
  { key: "TAPER", value: "0.54" },
];

export function TowerSteps() {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // The chain walks itself as the reader scrolls through it. The track is much
  // taller than the sticky panel, so scroll position is what drives the build
  // sequence; clicking still jumps directly to a stage.
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (held) return;
    const next = Math.min(STEPS.length - 1, Math.floor(value * STEPS.length));
    setActive(next);
  });

  const onMove = (event: React.PointerEvent) => {
    const node = frame.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    node.style.setProperty("--px", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
    node.style.setProperty("--py", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
  };

  // Each stage shows the model as it exists at that point in the chain, so
  // walking the sequence is walking the build rather than reading a list.
  const at = (n: number) => active >= n;

  return (
    <div className="tower-track" ref={track}>
      <div className="tower-steps" ref={frame} onPointerMove={onMove}>
      <div className="tower-stage">
        <svg
          viewBox="0 0 600 460"
          role="img"
          aria-label="侗族鼓楼参数化模型的八个生成阶段，当前显示第 {active + 1} 阶段"
        >
          <g className="tower-ground">
            <path d="M120 420H480" />
            <path d="M300 400v-30" />
          </g>

          {at(0) && <path className="tower-edge tower-faint" d={RINGS[0]} />}

          {at(2) && (
            <>
              <path className="tower-edge" d={RINGS[0]} />
              <path className="tower-edge tower-faint" d={linkPath(SPOKES)} />
            </>
          )}

          {at(3) && (
            <>
              {RINGS.map((d, i) => (
                <path className="tower-edge tower-faint" key={i} d={d} />
              ))}
              <path className="tower-edge tower-faint" d={linkPath(SPOKES)} />
            </>
          )}

          {at(4) && (
            <>
              {RINGS.map((d, i) => (
                <path className="tower-edge" key={i} d={d} />
              ))}
              <path className="tower-edge tower-faint" d={linkPath(SPOKES)} />
            </>
          )}

          {at(5) && (
            <>
              {RINGS.map((d, i) => (
                <path className="tower-edge" key={i} d={d} />
              ))}
              <path className="tower-edge" d={linkPath(COLUMNS)} />
              <path className="tower-edge tower-faint" d={linkPath(BRACES)} />
            </>
          )}

          {at(6) && (
            <>
              {RINGS.map((d, i) => (
                <path className="tower-edge" key={i} d={d} />
              ))}
              <path className="tower-member" d={linkPath(COLUMNS)} />
              <path className="tower-edge" d={linkPath(BRACES)} />
              {TOP_RING.map((p, i) => (
                <circle className="tower-node" key={i} cx={p[0]} cy={p[1]} r="3" />
              ))}
            </>
          )}

          {at(7) && (
            <>
              <path className="tower-edge" d={EAVE_RING} />
              <path className="tower-edge" d={linkPath(EAVE)} />
              <path className="tower-member" d={linkPath(RAFTERS)} />
              <path className="tower-axis-line" d={`M${PEAK[0]},${PEAK[1] - 26}V${PEAK[1] + 10}`} />
              <circle className="tower-node tower-node-peak" cx={PEAK[0]} cy={PEAK[1]} r="4" />
            </>
          )}

          <g className="tower-dim" aria-hidden="true">
            <path d="M192 470H408" />
            <path d="M192 464v12M408 464v12" />
            <text x="272" y="456">PLAN 7200</text>
          </g>
        </svg>
      </div>

      <div className="tower-readout">
        {STAGE_READOUT.map((row) => (
          <div key={row.key}>
            <span>{row.key}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>

      <ol className="tower-rail">
        {STEPS.map((step, i) => (
          <li key={step.index} className={i === active ? "is-active" : undefined}>
            <button
              type="button"
              onClick={() => {
                setHeld(false);
                setActive(i);
              }}
              onPointerEnter={() => setHeld(true)}
              onPointerLeave={() => setHeld(false)}
              aria-current={i === active ? "step" : undefined}
            >
              <span className="tower-rail-num">{step.index}</span>
              <span className="tower-rail-mark" />
              <span className="tower-rail-text">
                <strong>{step.title}</strong>
                <small>{step.chinese}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
        <p className="tower-rail-hint meta-key">向下滚动以推进生成链 / SCROLL TO ADVANCE</p>
      </div>
    </div>
  );
}
