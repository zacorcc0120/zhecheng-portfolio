"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Square, Sparkles } from "lucide-react";

/**
 * LIVE PRODUCT STUDY — the page's second interactive node.
 *
 * The previous version could start and pause a timer but had no way to finish
 * one, so the "today" list never changed: the reader watched a number climb
 * and nothing was ever recorded. Ending a record is the step that turns a
 * running clock into a timeline, which is the whole argument of the chapter
 * above, so it is the step this version adds.
 *
 * Everything here is local demo state. Nothing is sent anywhere, nothing is
 * persisted, and the assistant card is a static illustration of an entry
 * point — it is not wired to a model and does not pretend to be.
 *
 * Rendering: only the ticking figures and the ring depend on the clock. The
 * record list and the assistant card are memoised, so one second of elapsed
 * time re-renders two small nodes instead of the whole panel.
 */

const categories = [
  { id: "work", label: "工作", color: "#d9d1c2" },
  { id: "study", label: "学习", color: "#cab9e8" },
  { id: "exercise", label: "运动", color: "#d9ef74" },
  { id: "life", label: "生活", color: "#a8cfcb" },
] as const;

type Category = (typeof categories)[number];
type Status = "idle" | "running" | "paused";
type Record = {
  id: number;
  label: string;
  color: string;
  seconds: number;
  clock: string;
};

const TARGET_SECONDS = 1500;

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

/** Two seeded records so the list is never empty on arrival. */
const SEED: Record[] = [
  {
    id: 1,
    label: "生活",
    color: "#a8cfcb",
    seconds: 85,
    clock: "08:30",
  },
  {
    id: 2,
    label: "工作",
    color: "#d9d1c2",
    seconds: 138,
    clock: "10:12",
  },
];

const AssistantCard = memo(function AssistantCard() {
  return (
    <div className="jiko-assistant-card">
      <Sparkles size={18} />
      <div>
        <strong>小迹助手</strong>
        <p>“提醒我今晚八点整理作品集。”</p>
      </div>
      <span className="jiko-assistant-card-note meta-key">演示入口</span>
    </div>
  );
});

const RecordList = memo(function RecordList({
  records,
  active,
  seconds,
}: {
  records: Record[];
  active: Category;
  seconds: number;
}) {
  return (
    <ol className="jiko-record-list">
      {records.map((record) => (
        <li key={record.id}>
          <time>{record.clock}</time>
          <span>
            <i style={{ background: record.color }} />
            {record.label}记录
          </span>
          <em>{formatTime(record.seconds)}</em>
        </li>
      ))}
      <li className="is-current">
        <time>NOW</time>
        <span>
          <i style={{ background: active.color }} />
          {active.label}记录
        </span>
        <em>{formatTime(seconds)}</em>
      </li>
    </ol>
  );
});

export default function JikoDemo() {
  const [active, setActive] = useState<Category>(categories[0]);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [records, setRecords] = useState<Record[]>(SEED);
  const [nextId, setNextId] = useState(3);

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [status]);

  const progress = useMemo(
    () => Math.min((seconds / TARGET_SECONDS) * 100, 100),
    [seconds],
  );

  const finish = useCallback(() => {
    if (seconds <= 0) return;
    const now = new Date();
    setRecords((current) => [
      ...current,
      {
        id: nextId,
        label: active.label,
        color: active.color,
        seconds,
        clock: `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
      },
    ]);
    setNextId((value) => value + 1);
    setSeconds(0);
    setStatus("idle");
  }, [active, nextId, seconds]);

  const reset = useCallback(() => {
    setRecords(SEED);
    setSeconds(0);
    setStatus("idle");
    setNextId(3);
  }, []);

  const running = status === "running";
  const canFinish = seconds > 0 && status !== "running";

  return (
    <div className="jiko-demo">
      <div className="jiko-demo-bar">
        <span className="eyebrow">LIVE PRODUCT STUDY</span>
        <span>本地交互演示 · 不保存数据 · 不发送任何请求</span>
      </div>

      <div className="jiko-demo-grid">
        <section className="jiko-timer-panel" aria-label="JIKO 计时器交互演示">
          <div className="jiko-demo-greeting">
            <div>
              <span>9月19日 · 周六</span>
              <h3>{running ? "Hello，正在记录" : "Hello，上午好"}</h3>
            </div>
            <span>桂林市 · 26° 晴</span>
          </div>

          {/* SVG rather than a conic gradient: the arc is one attribute write
              per second instead of a repaint of the whole circle, and it
              matches the ring used in the journey chapter above. */}
          <div
            className={`jiko-timer-ring${running ? " is-running" : ""}`}
            style={{ ["--ring-color" as string]: active.color }}
          >
            <svg viewBox="0 0 240 240" aria-hidden="true">
              <circle
                cx={120}
                cy={120}
                r={108}
                fill="none"
                stroke="currentColor"
                strokeWidth={8}
                opacity={0.12}
              />
              <circle
                cx={120}
                cy={120}
                r={108}
                fill="none"
                stroke="var(--ring-color)"
                strokeWidth={8}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={100 - progress}
                transform="rotate(-90 120 120)"
              />
            </svg>
            <div className="jiko-timer-core">
              <strong aria-live="off">{formatTime(seconds)}</strong>
              <span>{active.label}记录</span>
            </div>
          </div>

          <div className="jiko-categories" role="group" aria-label="选择记录类型">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={active.id === category.id ? "is-active" : ""}
                aria-pressed={active.id === category.id}
                onClick={() => setActive(category)}
              >
                <span style={{ background: category.color }} />
                {category.label}
              </button>
            ))}
          </div>

          <div className="jiko-timer-actions">
            <button
              type="button"
              className="jiko-icon-action"
              onClick={reset}
              aria-label="重置整个演示"
              title="重置演示"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              className="jiko-primary-action"
              onClick={() =>
                setStatus((value) => (value === "running" ? "paused" : "running"))
              }
              disabled={status === "idle" && seconds === 0 && records.length === 0}
            >
              {running ? <Pause size={19} /> : <Play size={19} />}
              {running ? "暂停记录" : seconds > 0 ? "继续记录" : "开始记录"}
            </button>

            {/* The step that was missing. Without it the timer is a clock, not
                a record — nothing ever reaches the list on the right. */}
            <button
              type="button"
              className="jiko-icon-action"
              onClick={finish}
              disabled={!canFinish}
              aria-label="结束这次记录"
              title={canFinish ? "结束这次记录" : "先开始一次计时"}
            >
              <Square size={17} />
            </button>
          </div>
          <p className="jiko-demo-hint">
            {canFinish
              ? "计时中或暂停时，可以结束并写入右侧今日记录。"
              : running
                ? "暂停后即可结束这次记录。"
                : "选择活动并开始计时。"}
          </p>
        </section>

        <aside className="jiko-insight-panel">
          <div className="jiko-insight-heading">
            <span className="eyebrow">
              TODAY / {String(records.length).padStart(2, "0")} RECORDS
            </span>
            <strong>今天留下的轨迹</strong>
          </div>

          <RecordList records={records} active={active} seconds={seconds} />

          <AssistantCard />

          <p className="jiko-demo-note">
            真实产品通过 DeepSeek 理解自然语言，并由微信订阅消息发送到期提醒。
            这里展示的是入口位置与交互流程，不会调用任何模型服务。
          </p>
        </aside>
      </div>
    </div>
  );
}