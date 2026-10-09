"use client";

/**
 * THE PROBLEM — three readings of one instrument.
 *
 * This chapter used to be three 68vh panels of hairline and text. The panels
 * were tall on purpose (the old observer needed 60% of a tall panel before it
 * would count), but nothing was ever drawn inside them, so the reserved
 * scrolling space turned into blank paper. The fix is not shorter panels — it
 * is giving that space something to hold.
 *
 * All three scenes share one frame: a head rule with a mono label, the drawing,
 * a foot rule and one reading. That is deliberate. They are three states of one
 * model, not three illustrations, and the reader should feel the box change
 * rather than the layout change underneath it.
 *
 * The drawing is SVG so it can be redrawn at any width without a request, and
 * so the handover can be a real crossfade. Nothing here animates on mount: each
 * scene is drawn already settled, and only its opacity moves. That is what keeps
 * the chapter from replaying an entrance every time a panel returns to view.
 *
 * Honesty
 * -------
 * No delivered product screenshot is reproduced. Scene 01 is the cost of a
 * record, not a screen. Scene 02's four times are conceptual and are labelled as
 * such on the figure. Scene 03 states the relationship the design is arguing for
 * and says on its own face that it is not a shipped feature.
 */

const W = 480;
const H = 400;
/** Inner margin. The drawing never touches the frame of the plate. */
const M = 20;
const TRACK = W - M * 2;

const HEAD_Y = 28;
const HEAD_RULE = 42;
const FOOT_RULE = 322;
const FOOT_Y = 348;

const SCENES = [
  {
    key: "friction",
    label: "图示：一次记录需要经过选择活动、填写标题、补充描述、选择时长与确认保存五个操作步骤。",
    node: <FrictionScene />,
  },
  {
    key: "records",
    label: "图示：四条各自带有时间与时长的记录，时间轴位置彼此没有连接，内容字段全部未填写。",
    node: <RecordsScene />,
  },
  {
    key: "continuity",
    label: "图示：过去、现在与未来之间存在两处未连接的断裂，记录工具与待办工具之间没有通路。",
    node: <ContinuityScene />,
  },
];

const COMBINED_LABEL =
  "三张示意图：一次记录需要五个操作步骤；四条时间记录彼此没有连接且内容未填写；过去、现在与未来之间存在未连接的断裂。";

type Props = {
  /** Which scene is current. Only used in the wide, scroll-driven layout. */
  active?: number;
  /** Render exactly one scene, settled. Narrow layout and reduced motion. */
  only?: number;
};

export function ProblemVisual({ active = 0, only }: Props) {
  const current = only ?? active;
  const label = only === undefined ? COMBINED_LABEL : SCENES[only].label;

  return (
    <svg
      className="jiko-problems-canvas"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
    >
      <g transform={`translate(${M} ${M})`}>
        {SCENES.map((scene, i) => {
          if (only !== undefined && only !== i) return null;
          const live = i === current;
          return (
            <g
              key={scene.key}
              className="jiko-pv-layer"
              style={{ opacity: live ? 1 : 0 }}
              aria-hidden={live ? undefined : true}
              {...(live ? {} : { inert: true })}
            >
              {scene.node}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Shared frame                                                        */
/* ------------------------------------------------------------------ */

function FrameHead({ left, right }: { left: string; right: string }) {
  return (
    <g>
      <text
        className="jiko-pv-type jiko-pv-mute"
        x={0}
        y={HEAD_Y}
        fontSize={14}
        letterSpacing={1.2}
      >
        {left}
      </text>
      <text
        className="jiko-pv-type jiko-pv-mute"
        x={TRACK}
        y={HEAD_Y}
        fontSize={14}
        letterSpacing={1.2}
        textAnchor="end"
      >
        {right}
      </text>
      <path className="jiko-pv-line" d={`M0 ${HEAD_RULE} H${TRACK}`} />
    </g>
  );
}

function FrameFoot({ left, right }: { left: string; right: string }) {
  return (
    <g>
      <path className="jiko-pv-line" d={`M0 ${FOOT_RULE} H${TRACK}`} />
      <text className="jiko-pv-cn jiko-pv-ink" x={0} y={FOOT_Y} fontSize={15}>
        {left}
      </text>
      <text
        className="jiko-pv-type jiko-pv-mute"
        x={TRACK}
        y={FOOT_Y}
        fontSize={14}
        letterSpacing={1.2}
        textAnchor="end"
      >
        {right}
      </text>
    </g>
  );
}

/** A ten-unit cross: the surveyor's mark for "the line does not continue". */
function Break({ x, y }: { x: number; y: number }) {
  return (
    <path
      className="jiko-pv-line"
      d={`M${x - 5} ${y - 5} L${x + 5} ${y + 5} M${x + 5} ${y - 5} L${x - 5} ${y + 5}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* STATE 01 — RECORDING FRICTION                                       */
/* Five actions stacked on one spine. The length of the spine is the     */
/* subject: it is drawn at full height on purpose, so the cost of one    */
/* record is something you look at rather than something you read.       */
/* ------------------------------------------------------------------ */

const STEPS = ["选择活动", "填写标题", "补充描述", "选择时长", "确认保存"];
const NODE_Y = [88, 140, 192, 244, 296];

function FrictionScene() {
  const top = NODE_Y[0] - 14;
  const bottom = NODE_Y[NODE_Y.length - 1] + 14;

  return (
    <g>
      <FrameHead left="输入路径" right="5 STEPS" />

      <path className="jiko-pv-line" d={`M11 ${top} H5 V${bottom} H11`} />
      <path
        className="jiko-pv-line"
        d={`M${TRACK - 11} ${top} H${TRACK - 5} V${bottom} H${TRACK - 11}`}
      />
      <path className="jiko-pv-line" d={`M52 ${top} V${bottom}`} />

      {NODE_Y.map((y, i) => (
        <g key={y}>
          <text className="jiko-pv-type jiko-pv-mute" x={20} y={y + 4.5} fontSize={14}>
            {`0${i + 1}`}
          </text>
          <circle className="jiko-pv-plate" cx={52} cy={y} r={4.5} />
          <circle className="jiko-pv-line" cx={52} cy={y} r={10} />
          <FieldGlyph step={i} y={y} />
          <text className="jiko-pv-cn jiko-pv-ink" x={300} y={y + 5} fontSize={15}>
            {STEPS[i]}
          </text>
        </g>
      ))}

      <FrameFoot left="一次记录 = 5 个动作" right="OPERATION PATH" />
    </g>
  );
}

/** The five fields of the old form, drawn as fields and not as a screenshot. */
function FieldGlyph({ step, y }: { step: number; y: number }) {
  if (step === 0) {
    return (
      <g>
        <rect className="jiko-pv-box" x={80} y={y - 9} width={32} height={18} />
        <rect className="jiko-pv-plate" x={118} y={y - 9} width={32} height={18} />
        <rect className="jiko-pv-box" x={156} y={y - 9} width={32} height={18} />
      </g>
    );
  }
  if (step === 1) {
    return (
      <g>
        <rect className="jiko-pv-box" x={80} y={y - 13} width={200} height={26} />
        <path className="jiko-pv-line" d={`M90 ${y} H150`} />
        <path className="jiko-pv-line" d={`M156 ${y - 5} V${y + 5}`} />
      </g>
    );
  }
  if (step === 2) {
    return (
      <g>
        <rect className="jiko-pv-box" x={80} y={y - 16} width={200} height={32} />
        <path className="jiko-pv-line" d={`M90 ${y - 5} H170`} />
        <path className="jiko-pv-line" d={`M90 ${y + 6} H124`} />
      </g>
    );
  }
  if (step === 3) {
    return (
      <g>
        <rect className="jiko-pv-box" x={80} y={y - 10} width={52} height={20} />
        <rect className="jiko-pv-plate" x={142} y={y - 10} width={52} height={20} />
      </g>
    );
  }
  return (
    <g>
      <rect className="jiko-pv-plate" x={80} y={y - 12} width={96} height={24} />
      <text
        className="jiko-pv-cn jiko-pv-onpaper"
        x={128}
        y={y + 4.5}
        fontSize={14}
        textAnchor="middle"
      >
        保存记录
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* STATE 02 — DISCONNECTED RECORDS                                      */
/* Four records, four times, four durations, and nothing that says what */
/* any of them were. The axis is drawn dashed because the timeline is    */
/* the thing that is missing, and every content field is drawn empty.   */
/* ------------------------------------------------------------------ */

const RECORDS: { at: string; len: string }[] = [
  { at: "08:30", len: "25 MIN" },
  { at: "11:45", len: "40 MIN" },
  { at: "15:20", len: "1H 05M" },
  { at: "19:10", len: "18 MIN" },
];
const REC_Y = [96, 154, 212, 270];

function RecordsScene() {
  return (
    <g>
      <FrameHead left="四条记录" right="TIMELINE MISSING" />

      <path className="jiko-pv-dash" d="M76 66 V300" />

      {REC_Y.map((y, i) => (
        <g key={y}>
          <text className="jiko-pv-type jiko-pv-ink" x={0} y={y + 6} fontSize={20}>
            {RECORDS[i].at}
          </text>
          <circle className="jiko-pv-plate" cx={76} cy={y} r={4.5} />
          <circle className="jiko-pv-line" cx={76} cy={y} r={9} />
          <text
            className="jiko-pv-type jiko-pv-mute"
            x={94}
            y={y + 4.5}
            fontSize={14}
            letterSpacing={1.2}
          >
            {RECORDS[i].len}
          </text>
          {/* An input that was never filled in. Nothing is drawn inside it. */}
          <rect className="jiko-pv-box-dash" x={166} y={y - 14} width={254} height={28} />
          <path className="jiko-pv-line" d={`M178 ${y} H222`} />
        </g>
      ))}

      {[125, 183, 241].map((y) => (
        <Break key={y} x={76} y={y} />
      ))}

      <FrameFoot left="孤立的时间点无法互相解释" right="示意数据" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* STATE 03 — BROKEN CONTINUITY                                         */
/* Past, present and future on one axis with two gaps in it, and the two */
/* halves sitting in two different tools with no path between them.       */
/* ------------------------------------------------------------------ */

const PAST_BARS: [number, number][] = [
  [20, 58],
  [90, 50],
  [152, 44],
];
const FUTURE_SLOTS: [number, number][] = [
  [280, 42],
  [340, 42],
];

function ContinuityScene() {
  const axis = 126;

  return (
    <g>
      <FrameHead left="记录与提醒" right="PAST / PRESENT / FUTURE" />

      <text className="jiko-pv-type jiko-pv-ink" x={0} y={92} fontSize={14} letterSpacing={1.2}>
        PAST
      </text>
      <text
        className="jiko-pv-type jiko-pv-ink"
        x={238}
        y={92}
        fontSize={14}
        letterSpacing={1.2}
        textAnchor="middle"
      >
        PRESENT
      </text>
      <text
        className="jiko-pv-type jiko-pv-mute"
        x={TRACK}
        y={92}
        fontSize={14}
        letterSpacing={1.2}
        textAnchor="end"
      >
        FUTURE
      </text>

      <path className="jiko-pv-line" d={`M0 ${axis} H212`} />
      <path className="jiko-pv-dash" d={`M264 ${axis} H${TRACK}`} />
      <path className="jiko-pv-line" d={`M238 ${axis - 14} V${axis + 14}`} />
      <circle className="jiko-pv-plate" cx={238} cy={axis} r={5} />
      <Break x={225} y={axis} />
      <Break x={251} y={axis} />

      {PAST_BARS.map(([x, w]) => (
        <rect key={x} className="jiko-pv-plate" x={x} y={axis - 14} width={w} height={28} />
      ))}
      {FUTURE_SLOTS.map(([x, w]) => (
        <rect key={x} className="jiko-pv-box-dash" x={x} y={axis - 14} width={w} height={28} />
      ))}

      <text className="jiko-pv-cn jiko-pv-mute" x={0} y={166} fontSize={15}>
        已记录 × 3
      </text>
      <text
        className="jiko-pv-cn jiko-pv-ink"
        x={238}
        y={166}
        fontSize={15}
        textAnchor="middle"
      >
        未连接
      </text>
      <text
        className="jiko-pv-cn jiko-pv-mute"
        x={TRACK}
        y={166}
        fontSize={15}
        textAnchor="end"
      >
        待办 × 2
      </text>

      {/* Two tools. The space between the boxes is the problem. */}
      <rect className="jiko-pv-box" x={0} y={200} width={212} height={44} />
      <rect className="jiko-pv-box" x={264} y={200} width={156} height={44} />
      <text
        className="jiko-pv-cn jiko-pv-ink"
        x={106}
        y={227}
        fontSize={15}
        textAnchor="middle"
      >
        记录 · 时间轴工具
      </text>
      <text
        className="jiko-pv-cn jiko-pv-ink"
        x={342}
        y={227}
        fontSize={15}
        textAnchor="middle"
      >
        提醒 · 待办工具
      </text>
      <Break x={238} y={222} />
      <text
        className="jiko-pv-cn jiko-pv-mute"
        x={238}
        y={278}
        fontSize={15}
        textAnchor="middle"
      >
        两个工具之间没有通路
      </text>

      <FrameFoot left="记录与提醒彼此分离" right="设计问题 · 非已实现功能" />
    </g>
  );
}