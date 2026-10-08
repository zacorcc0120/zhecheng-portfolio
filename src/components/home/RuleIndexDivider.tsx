"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  motionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { disciplines } from "@/data/site";

/**
 * Divider A — 规则场坍缩为项目索引
 *
 * The METHOD section's own rule chains are the geometry. As the band scrolls
 * through, the twelve chain nodes drop onto one ranked axis, the axis raises
 * five index ticks, and those same five marks then travel left and compact into
 * the page's fixed index rail. Nothing fades in that did not already exist:
 * the rail is the divider's end state.
 *
 * The SVG is measured rather than given a fixed viewBox, so its coordinate
 * system is real pixels and `preserveAspectRatio` never has to stretch type.
 * Geometry is static and only `transform` and `opacity` animate, which keeps
 * the whole band on the compositor.
 */

const SPINE = 200;
const ROW_TOP = 26;
const ROW_STEP = 42;
const NODE_X = [0.1, 0.45, 0.8];
const TICK_X = [0.12, 0.32, 0.52, 0.72, 0.9];
const TICK_H = 18;
const TICK_RAIL_H = 12;

const CHAINS = disciplines.map((d) => d.detail.split(" → "));

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function RuleIndexDivider() {
  const host = useRef<HTMLElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const calm = useReducedMotion();
  const [w, setW] = useState(1160);
  const [g, setG] = useState(60);

  // Full-bleed, so the marks can travel out to the page margin — but the rules
  // still start on the content grid, so the gutter is measured, not guessed.
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (host.current) setW(host.current.clientWidth);
      if (probe.current) setG(probe.current.clientWidth);
    });
    if (host.current) ro.observe(host.current);
    if (probe.current) ro.observe(probe.current);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: host,
    offset: ["start end", "end 30%"],
  });

  // Under reduced motion the transformation resolves to its end state and never
  // scrubs.
  const done = useMemo(() => motionValue(1), []);
  const p: MotionValue<number> = calm ? done : scrollYProgress;

  const collapse = useTransform(p, [0.08, 0.52], [0, 1]);
  const ticks = useTransform(p, [0.6, 0.85], [0, 1]);
  const hand = useTransform(p, [0.86, 1], [0, 1]);

  const spineOpacity = useTransform(hand, (v) => 0.85 - v * 0.62);
  // The margin preview only exists to introduce the rail. Once the marks have
  // landed the real rail owns that edge, so the preview leaves before the band
  // carries it up into the sticky header and gets sliced in half.
  const railRuleOpacity = useTransform(hand, [0, 0.55, 1], [0, 0.3, 0]);
  const railLabelOpacity = useTransform(hand, [0, 0.55, 1], [0, 1, 0]);

  // Publish the handover. The fixed index rail reads this instead of deciding
  // on its own, so it can never appear before the divider has made it.
  useMotionValueEvent(hand, "change", (v) => {
    document.documentElement.dataset.dividerHandoff = v > 0.5 ? "done" : "idle";
  });
  useEffect(() => {
    if (calm) document.documentElement.dataset.dividerHandoff = "done";
    return () => {
      delete document.documentElement.dataset.dividerHandoff;
    };
  }, [calm]);

  const span = Math.max(1, w - g * 2);
  const nodes = CHAINS.flatMap((chain, ci) =>
    chain.map((label, ni) => ({
      x: g + NODE_X[ni] * span,
      y: ROW_TOP + ci * ROW_STEP,
      label,
    })),
  );
  const marks = TICK_X.map((f, i) => ({ x: g + f * span, hx: 10 + i * 30 }));

  return (
    <section className="divider-a" ref={host} aria-hidden="true">
      <span className="gutter-probe" ref={probe} />
      <motion.svg className="divider-svg" viewBox={`0 0 ${w} 300`}>
        <motion.line
          x1={g}
          x2={w - g}
          y1={SPINE}
          y2={SPINE}
          stroke="#111"
          strokeWidth={1.5}
          style={{ opacity: spineOpacity }}
        />

        {nodes.map((n) => (
          <ChainNode
            key={n.label}
            x={n.x}
            y={n.y}
            label={n.label}
            collapse={collapse}
            ticks={ticks}
          />
        ))}

        {marks.map((m, i) => (
          <IndexMark key={i} x={m.x} hx={m.hx} i={i} ticks={ticks} hand={hand} />
        ))}

        <motion.line
          x1={8}
          x2={8}
          y1={SPINE - 30}
          y2={SPINE + 34}
          stroke="#111"
          strokeWidth={1}
          style={{ opacity: railRuleOpacity }}
        />
        <motion.text
          x={8}
          y={SPINE + 52}
          fontFamily="ui-monospace, Consolas, monospace"
          fontSize={11}
          fill="#777773"
          style={{ opacity: railLabelOpacity }}
        >
          INDEX
        </motion.text>
      </motion.svg>
      <span className="divider-mark">02 → 03</span>
    </section>
  );
}

/** One rule-chain node: a hairline that drops from the label onto the axis. */
function ChainNode({
  x,
  y,
  label,
  collapse,
  ticks,
}: {
  x: number;
  y: number;
  label: string;
  collapse: MotionValue<number>;
  ticks: MotionValue<number>;
}) {
  const scaleY = useTransform(collapse, (v) => v);
  const labelDrop = useTransform(collapse, (v) => (SPINE - y) * v);
  const ruleOpacity = useTransform(ticks, (v) => 0.38 * (1 - v * 0.88));
  // The four chains share three columns, so once they land on the axis their
  // labels would sit on top of each other. They have already been read in the
  // METHOD list directly above, so they leave before they collide — the lines
  // are what carry the collapse.
  const textOpacity = useTransform(collapse, [0.12, 0.5], [0.95, 0]);

  return (
    <>
      <motion.line
        x1={x}
        x2={x}
        y1={y}
        y2={SPINE}
        stroke="#111"
        strokeWidth={1}
        strokeDasharray="2 3"
        style={{
          scaleY,
          transformOrigin: `${x}px ${y}px`,
          opacity: ruleOpacity,
        }}
      />
      <motion.text
        x={x}
        y={y - 9}
        textAnchor="middle"
        fontFamily="ui-monospace, Consolas, monospace"
        fontSize={11}
        fill="#777773"
        style={{ y: labelDrop, opacity: textOpacity }}
      >
        {label}
      </motion.text>
    </>
  );
}

/** One index mark: rises off the axis, then travels left to rail scale. */
function IndexMark({
  x,
  hx,
  i,
  ticks,
  hand,
}: {
  x: number;
  hx: number;
  i: number;
  ticks: MotionValue<number>;
  hand: MotionValue<number>;
}) {
  const dx = hx - x;
  // Grows upward off the axis, then shortens to rail height as it travels.
  const scaleY = useTransform(
    [ticks, hand],
    ([tv, hv]: number[]) => tv * lerp(1, TICK_RAIL_H / TICK_H, hv),
  );
  const dy = useTransform(hand, (v) => -(8 + i * 9) * v);
  const labelDx = useTransform(hand, (v) => dx * v);
  const labelDy = useTransform(hand, (v) => -(40 + i * 9) * v);

  return (
    <>
      <motion.line
        x1={x}
        x2={x}
        y1={SPINE}
        y2={SPINE - TICK_H}
        stroke="#111"
        strokeWidth={1.5}
        style={{
          scaleY,
          x: dx,
          y: dy,
          transformOrigin: `${x}px ${SPINE}px`,
          opacity: ticks,
        }}
      />
      <motion.text
        x={x}
        y={SPINE + 26}
        textAnchor="middle"
        fontFamily="ui-monospace, Consolas, monospace"
        fontSize={12}
        fill="#111"
        style={{ x: labelDx, y: labelDy, opacity: ticks }}
      >
        {`0${i + 1}`}
      </motion.text>
    </>
  );
}