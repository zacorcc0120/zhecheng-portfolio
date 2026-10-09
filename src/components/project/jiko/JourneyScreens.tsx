"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";

/**
 * The four screens of TIME INTO MEMORY.
 *
 * These are reconstructions, not screenshots. A screenshot cannot be driven by
 * a scroll position — it can only be swapped. Everything here is SVG on a
 * fixed viewBox, so the arc of the timer, the length of the timeline, the
 * position of the selected day and the frontier of the future are all values
 * rather than images. That is what lets one record become a trail which then
 * reaches past today.
 *
 * The palette is the product's own, read off the delivered renders: near-black
 * ground, oat accent, and the four activity colours the demo already used.
 */

const INK = "#E8E2D6";
const MUTE = "#8E8C86";
const FAINT = "#3A3B3F";
const TRACK = "#2B2C30";

const ACTIVITY = {
  work: "#d9d1c2",
  study: "#cab9e8",
  exercise: "#d9ef74",
  life: "#a8cfcb",
} as const;

const W = 300;
const H = 620;
const SPINE_TOP = 84;
const SPINE_BOTTOM = 554;

/** Both rings are drawn with pathLength=1, so their offset is a plain ratio. */
const RECORD_R = 88;
const REVIEW_R = 74;

type Props = {
  /** 0 → stage 01, 1 → 02, 2 → 03, 3 → 04. Fractional during a crossfade. */
  stageFloat: MotionValue<number>;
  active: number;
  calm: boolean;
  /**
   * Render exactly one screen, fully settled, with no spine.
   *
   * The narrow layout and reduced-motion mode have no scroll position to drive,
   * so they get the same component with a frozen input instead of a second,
   * hand-built version that could drift away from the desktop one.
   */
  only?: number;
};

/**
 * One settled input per screen — the value its stage actually rests at when
 * the reader stops scrolling inside it. A screen takes its source from this or
 * from the scroll, chosen by a plain ternary so no hook becomes conditional.
 */
const SETTLED = [0.4, 1.2, 2.0, 2.95];

/**
 * Opacity window for one screen.
 *
 * Each screen holds full opacity across a plateau and falls to zero across a
 * narrow band, so exactly one screen is ever legible and the handover is a
 * true crossfade rather than a hard cut. The plateau is deliberately wider
 * than the ramp: most of the scroll distance is spent reading a stable
 * screen, and only a short stretch is spent changing it.
 */
function useLayerWeight(stageFloat: MotionValue<number>, index: number) {
  return useTransform(stageFloat, (value) => {
    const distance = Math.abs(value - index);
    const plateau = 0.42;
    const band = 0.08;
    if (distance <= plateau) return 1;
    return Math.max(0, 1 - (distance - plateau) / band);
  });
}

/**
 * How present the track is.
 *
 * The spine belongs to the two stages where a timeline exists: ORGANIZE, where
 * records become nodes on it, and REMIND, where it extends past today. In
 * RECORD there is no trail yet, and in REVIEW the individual track has been
 * aggregated into a week — so it fades out for those two and returns. That is
 * the argument the section is making, not a flicker: the track materialises
 * when records acquire order and comes back when they reach the future.
 */
function useSpineWeight(stageFloat: MotionValue<number>) {
  return useTransform(
    stageFloat,
    [0.35, 0.8, 1.6, 1.95, 2.5, 2.9],
    [0, 1, 1, 0, 0, 1],
    { clamp: true },
  );
}

export function JourneyScreens({ stageFloat, active, calm, only }: Props) {
  // Two different questions are being asked by one flag, and conflating them
  // left the narrow layout showing half-built screens.
  //
  // "Should this screen follow the scroll?" — answered by `only`: a single
  // screen has nothing to scroll through, so it reads its own parked value.
  // "Should motion run at all?" — answered by `calm`.
  //
  // The screens themselves only ever used the flag to decide whether to write
  // their values into style. In single-screen mode those values are constants,
  // so writing them produces no animation — but skipping the write left the
  // week highlight parked on Monday and the review ring completely unfilled,
  // which read as a broken screen rather than a still one. Reduced motion on
  // the wide layout is the case that genuinely must not write anything, and
  // CSS hides that canvas there anyway.
  const still = calm && only === undefined;

  return (
    <svg
      className="jiko-screen-canvas"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="迹刻四个产品阶段的界面示意：记录、组织、回顾与提醒"
    >
      {/* The spine belongs to no single stage. It persists across all four, so
          the screens read as four states of one system instead of four pages.
          It is omitted in single-screen mode, where it has nothing to connect. */}
      {only === undefined && <TimelineSpine stageFloat={stageFloat} calm={calm} />}
      {only === undefined && <FutureSpine stageFloat={stageFloat} calm={calm} />}

      {(only === undefined || only === 0) && (
        <ScreenLayer stageFloat={stageFloat} index={0} active={active} calm={calm} only={only}>
          <RecordScreen stageFloat={stageFloat} settled={only === 0} calm={still} />
        </ScreenLayer>
      )}
      {(only === undefined || only === 1) && (
        <ScreenLayer stageFloat={stageFloat} index={1} active={active} calm={calm} only={only}>
          <OrganizeScreen stageFloat={stageFloat} settled={only === 1} calm={still} />
        </ScreenLayer>
      )}
      {(only === undefined || only === 2) && (
        <ScreenLayer stageFloat={stageFloat} index={2} active={active} calm={calm} only={only}>
          <ReviewScreen stageFloat={stageFloat} settled={only === 2} calm={still} />
        </ScreenLayer>
      )}
      {(only === undefined || only === 3) && (
        <ScreenLayer stageFloat={stageFloat} index={3} active={active} calm={calm} only={only}>
          <RemindScreen stageFloat={stageFloat} settled={only === 3} calm={still} />
        </ScreenLayer>
      )}
    </svg>
  );
}

function ScreenLayer({
  stageFloat,
  index,
  active,
  calm,
  only,
  children,
}: {
  stageFloat: MotionValue<number>;
  index: number;
  active: number;
  calm: boolean;
  only: number | undefined;
  children: React.ReactNode;
}) {
  const weight = useLayerWeight(stageFloat, index);
  // A layer that is not the active one must stay unreachable by pointer and
  // silent to a screen reader, even while it is mid-fade.
  const live = only !== undefined || index === active;
  return (
    <motion.g
      // With motion reduced the crossfade is replaced by the active index, so
      // the other three layers are hidden outright rather than all four being
      // painted on top of each other with no opacity applied.
      style={{ opacity: calm ? (live ? 1 : 0) : weight }}
      aria-hidden={live ? undefined : true}
      {...(live ? {} : { inert: true })}
    >
      {children}
    </motion.g>
  );
}

/** The persistent track. Its length follows scroll, never a clock. */
function TimelineSpine({
  stageFloat,
  calm,
}: {
  stageFloat: MotionValue<number>;
  calm: boolean;
}) {
  const drawn = useTransform(stageFloat, [0, 1.15, 4], [0, 1, 1]);
  const offset = useTransform(drawn, (v) => 1 - v);
  const weight = useSpineWeight(stageFloat);
  return (
    <motion.g style={calm ? undefined : { opacity: weight }}>
      <line
        x1="30"
        y1={SPINE_TOP}
        x2="30"
        y2={SPINE_BOTTOM}
        stroke={FAINT}
        strokeWidth="1"
      />
      <motion.line
        x1="30"
        y1={SPINE_TOP}
        x2="30"
        y2={SPINE_BOTTOM}
        stroke={MUTE}
        strokeWidth="1.5"
        pathLength={1}
        strokeDasharray="1 1"
        style={calm ? undefined : { strokeDashoffset: offset }}
      />
    </motion.g>
  );
}

/**
 * The same line, continuing past "now". It is not a new object: it grows from
 * the end of the recorded trail, which is the whole claim of the fourth
 * stage — a record tool that ends in a finished list is a logbook, one that
 * ends in a horizon is a plan.
 */
function FutureSpine({
  stageFloat,
  calm,
}: {
  stageFloat: MotionValue<number>;
  calm: boolean;
}) {
  const end = useTransform(stageFloat, [2.5, 2.95], [SPINE_TOP, SPINE_BOTTOM]);
  const weight = useSpineWeight(stageFloat);
  return (
    <motion.g style={calm ? undefined : { opacity: weight }}>
      <motion.line
        x1="30"
        y1={SPINE_TOP}
        x2="30"
        y2={calm ? SPINE_BOTTOM : end}
        stroke={ACTIVITY.work}
        strokeWidth="1.5"
        strokeDasharray="3 6"
        opacity={0.9}
      />
    </motion.g>
  );
}

/* ------------------------------------------------------------------ */
/* STAGE 01 — RECORD                                                   */
/* ------------------------------------------------------------------ */

function RecordScreen({
  stageFloat,
  settled,
  calm,
}: {
  stageFloat: MotionValue<number>;
  settled: boolean;
  calm: boolean;
}) {
  // The arc fills as the reader scrolls through the first stage, so even here
  // the screen is a function of position: stop scrolling and the timer stops.
  const parked = useMotionValue(SETTLED[0]);
  const src = settled ? parked : stageFloat;
  const fill = useTransform(src, [0, 0.45], [0.06, 0.46]);
  const dashOffset = useTransform(fill, (v) => 1 - v);
  const angle = useTransform(fill, (v) => -90 + v * 360);
  const dotX = useTransform(
    angle,
    (a) => 150 + RECORD_R * Math.cos((a * Math.PI) / 180),
  );
  const dotY = useTransform(
    angle,
    (a) => 256 + RECORD_R * Math.sin((a * Math.PI) / 180),
  );

  const chips = [
    { label: "工作", color: ACTIVITY.work, on: true },
    { label: "学习", color: ACTIVITY.study, on: false },
    { label: "运动", color: ACTIVITY.exercise, on: false },
    { label: "生活", color: ACTIVITY.life, on: false },
  ];

  return (
    <g>
      <StatusBar />
      <SvgText x={24} y={62} size={9} fill={MUTE} mono>
        9月19日 · 周六
      </SvgText>
      <SvgText x={24} y={90} size={17} fill={INK}>
        Hello，上午好
      </SvgText>

      <g>
        <circle cx={150} cy={256} r={RECORD_R} fill="none" stroke={TRACK} strokeWidth="7" />
        <motion.circle
          cx={150}
          cy={256}
          r={RECORD_R}
          fill="none"
          stroke={ACTIVITY.work}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          transform="rotate(-90 150 256)"
          style={calm ? undefined : { strokeDashoffset: dashOffset }}
        />
        <motion.circle cx={dotX} cy={dotY} r={5} fill={ACTIVITY.work} />
        <SvgText x={150} y={252} size={34} fill={INK} mono anchor="middle">
          03:23
        </SvgText>
        <SvgText x={150} y={276} size={10} fill={MUTE} anchor="middle">
          工作记录
        </SvgText>
      </g>

      {/* Staged state, marked as such. The reader should never have to guess
          which parts of the page are live and which are reconstruction. */}
      <g>
        <rect x={230} y={190} width={46} height={17} rx={8.5} fill={TRACK} />
        <SvgText x={253} y={202} size={8} fill={MUTE} mono anchor="middle">
          DEMO
        </SvgText>
      </g>

      <g>
        {chips.map((chip, i) => (
          <g key={chip.label}>
            <rect
              x={22 + i * 66}
              y={376}
              width={60}
              height={27}
              rx={13.5}
              fill={chip.on ? "#2E2F33" : "#232427"}
              stroke={chip.on ? ACTIVITY.work : "none"}
              strokeWidth={chip.on ? 1.2 : 0}
            />
            <circle cx={38 + i * 66} cy={389.5} r={3.5} fill={chip.color} />
            <SvgText x={49 + i * 66} y={393} size={9.5} fill={chip.on ? INK : MUTE}>
              {chip.label}
            </SvgText>
          </g>
        ))}
      </g>

      <rect x={22} y={424} width={256} height={38} rx={19} fill={ACTIVITY.work} />
      <SvgText x={150} y={448} size={12} fill="#16171A" anchor="middle">
        开始记录
      </SvgText>

      {/* Two records already on the trail. This screen is about a single
          running timer, but an empty lower half would read as an unfinished
          mockup — and the pair also foreshadows what the next stage assembles
          into a timeline. */}
      <g>
        <SvgText x={24} y={492} size={9} fill={MUTE} mono>
          今日记录 · 02
        </SvgText>
        <circle cx={28} cy={514} r={3.5} fill={ACTIVITY.life} />
        <SvgText x={40} y={518} size={10} fill={MUTE}>
          生活记录
        </SvgText>
        <SvgText x={276} y={518} size={9} fill={MUTE} mono anchor="end">
          01:25
        </SvgText>
        <circle cx={28} cy={542} r={3.5} fill={ACTIVITY.work} />
        <SvgText x={40} y={546} size={10} fill={MUTE}>
          工作记录
        </SvgText>
        <SvgText x={276} y={546} size={9} fill={MUTE} mono anchor="end">
          02:18
        </SvgText>
      </g>

      <NavBar active={0} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* STAGE 02 — ORGANIZE                                                 */
/* ------------------------------------------------------------------ */

const TRAIL = [
  { label: "阅读与整理资料", from: "08:30", to: "09:55", color: ACTIVITY.life, w: 0.82 },
  { label: "产品细节修改", from: "10:12", to: "12:30", color: ACTIVITY.work, w: 1 },
  { label: "英语学习", from: "14:05", to: "15:10", color: ACTIVITY.study, w: 0.64 },
  { label: "力量训练", from: "16:30", to: "17:22", color: ACTIVITY.exercise, w: 0.55 },
];

// Split out so the four progress transforms are declared one per row rather
// than inside a map — a hook inside a loop reads as conditional to the linter
// and to anyone reviewing it later.
function TrailRows({
  stageFloat,
  settled,
  calm,
}: {
  stageFloat: MotionValue<number>;
  settled: boolean;
  calm: boolean;
}) {
  // Rows are laid down one at a time across the first half of the stage, so the
  // trail visibly accumulates instead of arriving finished.
  const parked = useMotionValue(SETTLED[1]);
  const src = settled ? parked : stageFloat;
  const laid = useTransform(src, [0.6, 1.2], [0, TRAIL.length]);
  const row0 = useTransform(laid, (v) => Math.max(0, Math.min(1, v)));
  const row1 = useTransform(laid, (v) => Math.max(0, Math.min(1, v - 1)));
  const row2 = useTransform(laid, (v) => Math.max(0, Math.min(1, v - 2)));
  const row3 = useTransform(laid, (v) => Math.max(0, Math.min(1, v - 3)));
  const progress = [row0, row1, row2, row3];

  return (
    <g>
      {TRAIL.map((row, i) => (
        <TrailRow
          key={row.label}
          row={row}
          y={126 + i * 88}
          progress={progress[i]}
          calm={calm}
        />
      ))}
    </g>
  );
}

function OrganizeScreen({
  stageFloat,
  settled,
  calm,
}: {
  stageFloat: MotionValue<number>;
  settled: boolean;
  calm: boolean;
}) {
  return (
    <g>
      <StatusBar />
      <SvgText x={24} y={62} size={9} fill={MUTE} mono>
        记录
      </SvgText>
      <SvgText x={24} y={90} size={17} fill={INK}>
        今日时间轴
      </SvgText>
      <SvgText x={278} y={88} size={10} fill={MUTE} mono anchor="end">
        03 段 · 04:03
      </SvgText>

      <TrailRows stageFloat={stageFloat} settled={settled} calm={calm} />

      {/* The record that is still running. A trail that only contains finished
          things is a log; the open end is what makes it read as a day. */}
      <g>
        <circle cx={30} cy={486} r={9} fill={ACTIVITY.work} opacity="0.16" />
        <circle cx={30} cy={486} r={4} fill={ACTIVITY.work} />
        <SvgText x={48} y={484} size={11} fill={INK}>
          记录中 · 产品原型
        </SvgText>
        <SvgText x={48} y={502} size={9} fill={MUTE} mono>
          13:05 → 正在计时
        </SvgText>
      </g>

      <NavBar active={1} />
    </g>
  );
}

function TrailRow({
  row,
  y,
  progress,
  calm,
}: {
  row: (typeof TRAIL)[number];
  y: number;
  progress: MotionValue<number>;
  calm: boolean;
}) {
  const opacity = useTransform(progress, (v) => v);
  const rise = useTransform(progress, (v) => (1 - v) * 10);
  return (
    <motion.g style={calm ? undefined : { opacity, y: rise }}>
      <line x1={30} y1={y + 6} x2={30} y2={y + 88} stroke={FAINT} strokeWidth="1" />
      <circle cx={30} cy={y} r={4} fill={row.color} />
      <SvgText x={48} y={y - 4} size={11} fill={INK}>
        {row.label}
      </SvgText>
      <SvgText x={48} y={y + 12} size={9} fill={MUTE} mono>
        {row.from} — {row.to}
      </SvgText>
      {/* The same record expressed as a length rather than a pair of times. */}
      <rect
        x={48}
        y={y + 22}
        width={228 * row.w}
        height={3}
        rx={1.5}
        fill={row.color}
        opacity="0.55"
      />
    </motion.g>
  );
}

/* ------------------------------------------------------------------ */
/* STAGE 03 — REVIEW                                                   */
/* ------------------------------------------------------------------ */

const WEEK = [
  { day: "一", date: "14", h: 0.42 },
  { day: "二", date: "15", h: 0.3 },
  { day: "三", date: "16", h: 0.66 },
  { day: "四", date: "17", h: 0.52 },
  { day: "五", date: "18", h: 0.94 },
  { day: "六", date: "19", h: 0.38 },
  { day: "日", date: "20", h: 0.2 },
];

const BREAKDOWN = [
  { label: "工作", value: "5小时27分", color: ACTIVITY.work, w: 0.52 },
  { label: "运动", value: "3小时8分", color: ACTIVITY.exercise, w: 0.3 },
  { label: "生活", value: "2小时13分", color: ACTIVITY.life, w: 0.21 },
];

function ReviewScreen({
  stageFloat,
  settled,
  calm,
}: {
  stageFloat: MotionValue<number>;
  settled: boolean;
  calm: boolean;
}) {
  // The week is scrubbed, not switched. Two separate rest positions are needed
  // because the two sweeps want different endpoints: the cursor comes to rest
  // on Friday — the day the delivered weekly screen actually highlights —
  // while the ring needs to finish filling slightly later.
  const parked = useMotionValue(SETTLED[2]);
  const src = settled ? parked : stageFloat;
  const cursor = useTransform(src, [1.7, 2.15], [0, WEEK.length - 1]);
  // The pill carries x=16 as an attribute, so the translate that centres it
  // over day i is (31 + i·36) − 16 − 15 = i·36. Using the day centre directly
  // left the highlight sitting 16px to the right of the day it was selecting.
  const cursorX = useTransform(cursor, (v) => v * 36);
  const ringFill = useTransform(src, [1.7, 2.05], [0, 0.74]);
  const ringOffset = useTransform(ringFill, (v) => 1 - v);

  return (
    <g>
      <StatusBar />
      <SvgText x={24} y={60} size={9} fill={MUTE} mono>
        每日记录
      </SvgText>
      <SvgText x={24} y={90} size={20} fill={INK}>
        这一周
      </SvgText>
      <SvgText x={278} y={88} size={9} fill={MUTE} mono anchor="end">
        09/14 — 09/20
      </SvgText>

      <WeekStrip cursor={cursor} cursorX={cursorX} calm={calm} />

      <g>
        <circle cx={150} cy={330} r={REVIEW_R} fill="none" stroke={TRACK} strokeWidth="9" />
        <motion.circle
          cx={150}
          cy={330}
          r={REVIEW_R}
          fill="none"
          stroke={ACTIVITY.work}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          transform="rotate(-90 150 330)"
          style={calm ? undefined : { strokeDashoffset: ringOffset }}
        />
        <SvgText x={150} y={326} size={23} fill={INK} anchor="middle" mono>
          10小时48分
        </SvgText>
        <SvgText x={150} y={348} size={10} fill={MUTE} anchor="middle">
          11 段记录
        </SvgText>
      </g>

      <g>
        {BREAKDOWN.map((b, i) => (
          <g key={b.label}>
            <SvgText x={24} y={444 + i * 38} size={11} fill={INK}>
              {b.label}
            </SvgText>
            <SvgText x={278} y={444 + i * 38} size={11} fill={MUTE} mono anchor="end">
              {b.value}
            </SvgText>
            <line
              x1={24}
              y1={454 + i * 38}
              x2={278}
              y2={454 + i * 38}
              stroke={FAINT}
              strokeWidth="1"
            />
            <rect
              x={24}
              y={453.5}
              width={254 * b.w}
              height="1.5"
              fill={b.color}
            />
          </g>
        ))}
      </g>

      <NavBar active={1} />
    </g>
  );
}

/**
 * One column's response to the selection cursor.
 *
 * The highlight pill moves across seven static columns, so each column has to
 * know whether it is currently under the pill — otherwise the date it covers
 * stays light ink on a cream ground and disappears. The ramp is smooth rather
 * than a switch because a hard flip would be the one hard cut in a sequence
 * where everything else is continuous.
 */
function useColumnState(cursor: MotionValue<number>, index: number) {
  const proximity = useTransform(cursor, (v) => {
    const distance = Math.abs(v - index);
    return Math.max(0, Math.min(1, 1 - (distance - 0.24) / 0.26));
  });
  const text = useTransform(proximity, (v) => mix(INK, "#16171A", v));
  const label = useTransform(proximity, (v) => mix(MUTE, "#3B362C", v));
  const bar = useTransform(proximity, (v) => mix(FAINT, "#16171A", v));
  return { text, label, bar };
}

/** Linear hex mix, so the two colours can be interpolated as one value. */
function mix(from: string, to: string, amount: number) {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const channel = (shift: number) => {
    const left = (a >> shift) & 255;
    const right = (b >> shift) & 255;
    return Math.round(left + (right - left) * amount);
  };
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function WeekStrip({
  cursor,
  cursorX,
  calm,
}: {
  cursor: MotionValue<number>;
  cursorX: MotionValue<number>;
  calm: boolean;
}) {
  // Seven calls, written out rather than mapped: a hook inside a map reads as
  // conditional to the linter and to whoever reviews it next.
  const c0 = useColumnState(cursor, 0);
  const c1 = useColumnState(cursor, 1);
  const c2 = useColumnState(cursor, 2);
  const c3 = useColumnState(cursor, 3);
  const c4 = useColumnState(cursor, 4);
  const c5 = useColumnState(cursor, 5);
  const c6 = useColumnState(cursor, 6);
  const states = [c0, c1, c2, c3, c4, c5, c6];

  return (
    <g>
      <rect x={16} y={106} width={268} height={80} rx={10} fill="#1F2023" />
      {/* Painted before the days: the real screen puts a cream pill behind the
          selected date with dark type on it, and drawing it last buried the
          numbers underneath. */}
      <motion.rect
        x={16}
        y={114}
        width={30}
        height={64}
        rx={7}
        fill={ACTIVITY.work}
        style={calm ? undefined : { x: cursorX }}
      />
      {WEEK.map((d, i) => {
        const x = 31 + i * 36;
        return (
          <g key={d.date}>
            <motion.text
              x={x}
              y={128}
              fontSize={9}
              textAnchor="middle"
              fontFamily="var(--font-body)"
              style={{ fontWeight: 400, fill: states[i].label }}
            >
              {d.day}
            </motion.text>
            <motion.text
              x={x}
              y={150}
              fontSize={12}
              textAnchor="middle"
              fontFamily="var(--font-body)"
              style={{ fontWeight: 400, fill: states[i].text }}
            >
              {d.date}
            </motion.text>
            <motion.rect
              x={x - 3}
              y={162}
              width={6}
              height={16 * d.h}
              rx={3}
              style={{ fill: states[i].bar }}
            />
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* STAGE 04 — REMIND                                                   */
/* ------------------------------------------------------------------ */

const REMINDERS = [
  {
    title: "明天 15:00 · 健身",
    note: "由「明天下午三点去健身」创建 · 待确认",
    color: ACTIVITY.exercise,
  },
  {
    title: "周一 09:30 · 作品集终审",
    note: "来自每周回顾 · 微信订阅消息提醒",
    color: ACTIVITY.study,
  },
];

function RemindScreen({
  stageFloat,
  settled,
  calm,
}: {
  stageFloat: MotionValue<number>;
  settled: boolean;
  calm: boolean;
}) {
  const parked = useMotionValue(SETTLED[3]);
  const src = settled ? parked : stageFloat;
  const arrive = useTransform(src, [2.6, 2.95], [0, 1]);
  const arriveOpacity = useTransform(arrive, (v) => v);
  const arriveY = useTransform(arrive, (v) => (1 - v) * 12);

  return (
    <g>
      <StatusBar />
      <SvgText x={24} y={60} size={9} fill={MUTE} mono>
        接下来
      </SvgText>
      <SvgText x={24} y={90} size={20} fill={INK}>
        把轨迹接向未来
      </SvgText>

      <g>
        <circle cx={30} cy={132} r={4} fill={ACTIVITY.work} />
        <SvgText x={48} y={130} size={11} fill={INK}>
          今天 · 18:57
        </SvgText>
        <SvgText x={48} y={148} size={9} fill={MUTE} mono>
          已记录 11 段 · 10小时48分
        </SvgText>

        {/* The present, marked once. Everything above is memory. */}
        <line x1={22} y1={196} x2={38} y2={196} stroke={MUTE} strokeWidth="1.5" />
        <SvgText x={48} y={200} size={10} fill={MUTE} mono>
          现在
        </SvgText>

        {/* Future. Each reminder travels down the same line as the reader
            scrolls, so "tomorrow" is literally further along the track. */}
        {REMINDERS.map((r, i) => (
          <motion.g
            key={r.title}
            style={calm ? undefined : { opacity: arriveOpacity, y: arriveY }}
          >
            <circle cx={30} cy={276 + i * 104} r={5} fill={r.color} />
            <rect
              x={46}
              y={252 + i * 104}
              width={234}
              height={48}
              rx={8}
              fill="#1F2023"
              stroke={FAINT}
            />
            <SvgText x={60} y={272 + i * 104} size={11} fill={INK}>
              {r.title}
            </SvgText>
            <SvgText x={60} y={290 + i * 104} size={9} fill={MUTE}>
              {r.note}
            </SvgText>
          </motion.g>
        ))}

        {/* The open end. */}
        <SvgText x={30} y={502} size={9} fill={MUTE} mono anchor="middle">
          ·
        </SvgText>
        <SvgText x={30} y={524} size={9} fill={MUTE} mono anchor="middle">
          ·
        </SvgText>
      </g>

      <g>
        <rect
          x={22}
          y={518}
          width={258}
          height={42}
          rx={8}
          fill="#1F2023"
          stroke={FAINT}
        />
        <SvgText x={38} y={536} size={9} fill={MUTE}>
          小迹助手
        </SvgText>
        <SvgText x={38} y={552} size={10} fill={INK}>
          识别为日程草稿，确认后加入提醒
        </SvgText>
      </g>

      <NavBar active={2} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Shared chrome                                                       */
/* ------------------------------------------------------------------ */

function StatusBar() {
  return (
    <g>
      <SvgText x={24} y={30} size={9} fill={INK} mono>
        09:41
      </SvgText>
      <SvgText x={278} y={30} size={8} fill={MUTE} mono anchor="end">
        5G · 44%
      </SvgText>
    </g>
  );
}

const NAV_ITEMS = ["计时", "记录", "我的"];

function NavBar({ active }: { active: number }) {
  return (
    <g>
      <line x1={0} y1={578} x2={W} y2={578} stroke={FAINT} strokeWidth="1" />
      {NAV_ITEMS.map((label, i) => (
        <SvgText
          key={label}
          x={50 + i * 100}
          y={600}
          size={10}
          fill={i === active ? INK : MUTE}
          anchor="middle"
        >
          {label}
        </SvgText>
      ))}
      <rect
        x={40 + active * 100 - 10}
        y={606}
        width={20}
        height={2}
        rx={1}
        fill={ACTIVITY.work}
      />
    </g>
  );
}

function SvgText({
  x,
  y,
  size,
  fill,
  children,
  mono,
  anchor,
}: {
  x: number;
  y: number;
  size: number;
  fill: string;
  children: React.ReactNode;
  mono?: boolean;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={size}
      textAnchor={anchor}
      fontFamily={mono ? "var(--font-mono)" : "var(--font-body)"}
      style={{ fontWeight: 400 }}
    >
      {children}
    </text>
  );
}