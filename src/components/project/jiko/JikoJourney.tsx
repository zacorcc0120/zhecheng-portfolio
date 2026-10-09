"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { JourneyScreens } from "./JourneyScreens";
import { ease } from "@/lib/motion-tokens";

/**
 * TIME INTO MEMORY — the one signature sequence on this page.
 *
 * Four product stages, one sticky device, and a scroll position that is the
 * only clock. Nothing here is on a timer: the arc of the timer, the length of
 * the timeline, the day being inspected and the frontier of the future are all
 * read from `stageFloat`, so scrolling back runs the whole thing backwards and
 * stopping mid-stage freezes it exactly where it is.
 *
 * Scroll mapping
 * --------------
 * The left column is four 100vh steps, so the step list is 400vh tall. The
 * `start center → end center` offset spans the element's whole height rather
 * than three quarters of it: progress 0 puts step one on the reading line and
 * progress 1 puts the list's bottom there, which is 3600px of scrolling. Step k
 * reaches the reading line at progress k/4, so the stage value is progress × 4
 * and step k sits at stageFloat k.
 *
 * That gives every stage the same shape — 378px settled, 72px crossfade, 756px
 * settled — and leaves a 522px tail after step four where the closing stage
 * stays fully visible, which is the reading time it needs. (Mapping onto 0…3
 * instead put step four at stageFloat 2.25, which clamped the last stage's
 * arrival animation to zero and left the screen empty.)
 *
 * The crossfade is a real overlap — two screens briefly legible at 50% each —
 * rather than a cut. That is what stops the handover flickering.
 *
 * Performance
 * -----------
 * Every continuous value is a MotionValue written straight onto SVG attributes,
 * so scrolling does not re-render React at all. The only state here is the
 * active stage index, and it changes three times across the whole section. The
 * screens are SVG rather than images, so a stage change never triggers a
 * network request or a decode.
 */

type Stage = {
  index: string;
  code: string;
  chinese: string;
  body: string;
  detail: string;
};

const STAGES: Stage[] = [
  {
    index: "01",
    code: "RECORD",
    chinese: "记录此刻",
    body: "一次记录只需要选择一个活动并按下开始。计时器是首页的中心，也是产品里唯一需要立刻做决定的地方。",
    detail: "圆环进度 / 活动分类 / 开始与暂停",
  },
  {
    index: "02",
    code: "ORGANIZE",
    chinese: "组织记录",
    body: "结束的计时不会停在计时器里。它变成时间轴上的一个节点，带开始时间、结束时间和时长，成为可以被翻阅的轨迹。",
    detail: "时间轴节点 / 活动分类 / 时长分布",
  },
  {
    index: "03",
    code: "REVIEW",
    chinese: "回顾日常",
    body: "同一份记录在更大的时间尺度上被重新阅读。一周、七天、活动分布，回答的是这段时间究竟去了哪里。",
    detail: "周视图 / 时间分布 / 活动占比",
  },
  {
    index: "04",
    code: "REMIND",
    chinese: "连接未来",
    body: "轨迹不停在今天。自然语言被解析成结构化事项，确认后进入提醒，时间轴因此继续向还没有发生的日子延伸。",
    detail: "日程草稿 / 用户确认 / 到期提醒",
  },
];

export function JikoJourney() {
  const calm = useReducedMotion();
  const stepsRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: stepsRef,
    // start center → end center: see the note above. 3600px maps to 0…4.
    offset: ["start center", "end center"],
  });

  const stageFloat = useTransform(scrollYProgress, [0, 1], [0, 4], {
    clamp: true,
  });

  // The one piece of state, and the only reason this component re-renders
  // during a scroll at all.
  useMotionValueEvent(stageFloat, "change", (value) => {
    const next = Math.max(0, Math.min(STAGES.length - 1, Math.round(value)));
    setActive((prev) => (prev === next ? prev : next));
  });

  const goTo = useCallback(
    (index: number) => {
      const node = stepRefs.current[index];
      if (!node) return;
      setActive(index);
      node.scrollIntoView({
        block: "center",
        // Reduced motion still gets the navigation — it just arrives instead of
        // travelling, which is the whole promise of the mode.
        behavior: calm ? "auto" : "smooth",
      });
    },
    [calm],
  );

  return (
    <section className="case-section jiko-journey" id="time-into-memory">
      <header className="jiko-journey-head">
        <span className="eyebrow">TIME INTO MEMORY</span>
        <h2>
          一次记录，
          <br />
          如何成为一条可以回看的轨迹。
        </h2>
        <p className="case-lead">
          时间不只是不断经过的数字。它可以被记录、组织、回顾，并与接下来的计划建立联系。
          下面这一段由滚动推动：向下推进阶段，向上可以退回，
          设备里的界面始终由你的滚动位置决定，而不是由计时器决定。
        </p>
      </header>

      {/* Wide layout: the stage list scrolls, the device stays put. */}
      <div className="jiko-journey-body">
        <ol className="jiko-journey-steps" ref={stepsRef}>
          {STAGES.map((stage, i) => (
            <li
              key={stage.code}
              className={`jiko-journey-step${i === active ? " is-active" : ""}`}
              ref={(node) => {
                stepRefs.current[i] = node;
              }}
            >
              <span className="jiko-journey-rule" aria-hidden="true" />
              <span className="jiko-journey-index meta-key">{stage.index}</span>
              <h3 className="jiko-journey-title">
                {stage.code}
                <em>{stage.chinese}</em>
              </h3>
              <p className="jiko-journey-body-text">{stage.body}</p>
              <span className="jiko-journey-detail meta-key">
                {stage.detail}
              </span>
            </li>
          ))}
        </ol>

        <div className="jiko-journey-stage">
          <div className="jiko-device">
            <span className="jiko-device-notch" aria-hidden="true" />
            <div className="jiko-device-screen">
              <JourneyScreens
                stageFloat={stageFloat}
                active={active}
                calm={Boolean(calm)}
              />
            </div>
          </div>

          {/* Honest about what is on screen. The stages are rebuilt in SVG so
              they can be driven by scroll; the delivered renders are the real
              interface and appear in the hero and the gallery below. */}
          <p className="jiko-journey-note">
            界面为依据已发布小程序结构重建的 SVG 示意，用于说明产品流程；
            真实界面截图见首屏与下方产品图集。
          </p>

          <nav className="jiko-journey-dots" aria-label="产品阶段">
            {STAGES.map((stage, i) => (
              <button
                key={stage.code}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === active ? "true" : undefined}
              >
                <span className="meta-key">{stage.index}</span>
                <span className="jiko-journey-dot-label">{stage.code}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Narrow layout and reduced motion: no sticky, no scroll dependency.
          Each stage carries its own settled screen, so the whole sequence is
          readable by ordinary scrolling and nothing is lost when motion is off. */}
      <div className="jiko-journey-stack">
        {STAGES.map((stage, i) => (
          <article className="jiko-journey-stack-item" key={stage.code}>
            <div className="jiko-journey-stack-head">
              <span className="jiko-journey-index meta-key">{stage.index}</span>
              <h3 className="jiko-journey-title">
                {stage.code}
                <em>{stage.chinese}</em>
              </h3>
            </div>
            <div className="jiko-device is-inline">
              <div className="jiko-device-screen">
                <JourneyScreens
                  stageFloat={stageFloat}
                  active={i}
                  calm
                  only={i}
                />
              </div>
            </div>
            <p className="jiko-journey-body-text">{stage.body}</p>
            <span className="jiko-journey-detail meta-key">{stage.detail}</span>
          </article>
        ))}
        <p className="jiko-journey-note">
          界面为依据已发布小程序结构重建的 SVG 示意；真实界面截图见上方产品图集。
        </p>
      </div>

      {/* A closing statement, kept to one line of type so the section ends on
          the argument rather than on another block of copy. */}
      <motion.div
        className="jiko-journey-outro"
        initial={{ opacity: 0, y: calm ? 0 : 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: calm ? 0 : 0.42, ease: ease.out }}
      >
        <span className="eyebrow">RECORD → ORGANIZE → REVIEW → REMIND</span>
        <p>
          四个阶段不是四个功能，而是同一份记录在四个时间尺度上的样子。
          界面上的每一个控件都在回答同一个问题：这段时间发生了什么，以及接下来呢。
        </p>
      </motion.div>
    </section>
  );
}