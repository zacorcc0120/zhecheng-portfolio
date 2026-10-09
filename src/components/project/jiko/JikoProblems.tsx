"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ProblemVisual } from "./ProblemVisual";
import { ease, motion as m } from "@/lib/motion-tokens";

/**
 * THE PROBLEM — three complaints, one instrument.
 *
 * The previous version stacked three 68vh panels separated by hairlines, with a
 * 64px rail of three 1px lines at the side. Every panel reserved most of its own
 * height for nothing: the reserved room existed so the old IntersectionObserver
 * could clear a 60% threshold on a tall element, and once it was reserved it was
 * never filled. Three panels of roughly 250px of copy were spread over two and a
 * half screens, and the column meant to hold an interactive visual held three
 * lines of rule.
 *
 * So the layout was rebuilt around what the section was missing rather than
 * around its height: a fixed-width instrument on the left that stays put, and
 * three much shorter panels on the right. The panel height is now roughly the
 * height of the drawing beside it, which is what makes the section read as a
 * single composed spread instead of three separate screens of whitespace.
 *
 * Reading the current panel
 * -------------------------
 * The old observer asked for `threshold: 0.6`, which only stays unambiguous
 * while the panels are tall — two adjacent panels can both be 60% visible once
 * the panel is shorter than about 1.25 viewports, and compact panels are exactly
 * that. Instead the observer now watches a narrow band across the middle of the
 * viewport (`rootMargin: -45%` top and bottom, `threshold: 0`). A band that
 * narrow intersects exactly one contiguous panel at any panel height, so "the
 * current problem" is never ambiguous, and it behaves identically scrolling up
 * and scrolling down.
 *
 * Moving between problems
 * -----------------------
 * Only opacity changes. Each scene is drawn already settled, so returning to a
 * panel never replays an entrance, and the handover is a real overlap rather
 * than a cut — which is what stops the left column flickering on the way past.
 * The rail under the drawing is a set of buttons as well as a readout, so the
 * chapter can be walked by clicking instead of only by scrolling.
 *
 * Narrow screens and reduced motion
 * ---------------------------------
 * Both drop the sticky column and the scroll dependency entirely: each problem
 * carries its own figure, reached by ordinary scrolling. That switch is CSS, so
 * the server sends one markup and there is nothing to hydrate differently. The
 * plate is SVG rather than an image, so this doubling costs no requests.
 */

type LegendItem = { key: string; value: string };

type Problem = {
  index: string;
  code: string;
  title: string;
  body: string;
  note: string;
  legend: LegendItem[];
  legendNote: string;
};

const PROBLEMS: Problem[] = [
  {
    index: "01",
    code: "RECORDING FRICTION",
    title: "记录行为的操作成本。",
    body: "传统时间记录需要频繁填写表单：先选分类，再写内容，最后保存。记录动作一旦太重，用户很难在真实生活中持续使用。",
    note: "计时器因此成为首页唯一的中心控件",
    legend: [
      { key: "01", value: "选择活动" },
      { key: "02", value: "填写标题" },
      { key: "03", value: "补充描述" },
      { key: "04", value: "选择时长" },
      { key: "05", value: "确认保存" },
    ],
    legendNote: "图为操作路径示意，不是产品截图。",
  },
  {
    index: "02",
    code: "DISCONNECTED RECORDS",
    title: "零散记录缺乏上下文。",
    body: "单条计时数据很难回答时间究竟去了哪里。需要时间轴、每日记录与周回顾，把碎片组织成可以比较、可以回看的连续反馈。",
    note: "同一份记录需要支持多个时间尺度",
    legend: [
      { key: "NODES", value: "04 条" },
      { key: "LINKS", value: "00 条" },
      { key: "内容字段", value: "全部未填写" },
    ],
    legendNote: "时间为概念示意数据，非真实用户记录。",
  },
  {
    index: "03",
    code: "BROKEN CONTINUITY",
    title: "记录与提醒彼此分离。",
    body: "记录与待办通常存在于不同工具。正在发生的事与接下来要做的事被拆成两处，回顾因此失去了下一步的落点。",
    note: "轨迹需要能一直延伸到还没有发生的日子",
    legend: [
      { key: "PAST", value: "已记录 × 3" },
      { key: "PRESENT", value: "现在" },
      { key: "FUTURE", value: "待办 × 2" },
    ],
    legendNote: "图示设计问题与三者关系，不是已实现的功能。",
  },
];

export function JikoProblems() {
  const calm = useReducedMotion();
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter(Boolean) as HTMLLIElement[];
    if (!nodes.length) return;
    // A band across the middle tenth of the viewport, not a share of the
    // element. See the note at the top of the file.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = nodes.indexOf(entry.target as HTMLLIElement);
          if (index >= 0) setActive((prev) => (prev === index ? prev : index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const node = itemRefs.current[index];
      if (!node) return;
      setActive(index);
      node.scrollIntoView({
        block: "center",
        // Reduced motion still gets the navigation — it arrives instead of
        // travelling, which is the whole promise of the mode.
        behavior: calm ? "auto" : "smooth",
      });
    },
    [calm],
  );

  const current = PROBLEMS[active];

  return (
    <>
      {/* Wide layout: the panels scroll, the instrument stays put. */}
      <div className="jiko-problems-body">
        <div className="jiko-problems-stage">
          <div className="jiko-problems-visual">
            <ProblemVisual active={active} />
          </div>

          <p className="jiko-problems-legend">
            {current.legend.map((item) => (
              <span key={item.key}>
                <b className="meta-key">{item.key}</b>
                {item.value}
              </span>
            ))}
          </p>

          <p className="jiko-problems-stage-note">{current.legendNote}</p>

          <nav className="jiko-problems-rail" aria-label="问题进度">
            {PROBLEMS.map((problem, i) => (
              <button
                key={problem.code}
                type="button"
                className={i === active ? "is-active" : ""}
                onClick={() => goTo(i)}
                aria-current={i === active ? "true" : undefined}
              >
                <span className="jiko-problems-rail-index meta-key">{problem.index}</span>
                <span className="jiko-problems-rail-bar" aria-hidden="true">
                  <i style={{ transform: `scaleX(${i <= active ? 1 : 0})` }} />
                </span>
                <span className="jiko-problems-rail-code">{problem.code}</span>
              </button>
            ))}
          </nav>
        </div>

        <ol className="jiko-problems-list">
          {PROBLEMS.map((problem, i) => (
            <li
              key={problem.code}
              className={`jiko-problem${i === active ? " is-active" : ""}`}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
              // Contrast and the tick meter are the whole interaction, so they
              // are the only two things that transition.
              style={{
                transitionDuration: `${m.ui}s`,
                transitionTimingFunction: ease.out.join(", "),
              }}
            >
              <div className="jiko-problem-head">
                <span className="jiko-problem-code meta-key">
                  {problem.index} {problem.code}
                </span>
                <span className="jiko-problem-tally" aria-hidden="true">
                  {PROBLEMS.map((other, k) => (
                    <i key={other.code} className={k <= i ? "is-on" : ""} />
                  ))}
                </span>
                <span className="jiko-problem-count meta-key">
                  {problem.index} / 0{PROBLEMS.length}
                </span>
              </div>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
              <span className="jiko-problem-note">{problem.note}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Narrow layout and reduced motion: no sticky, no scroll dependency. Each
          problem carries its own figure — title, drawing, then the short copy —
          so the sequence is reached by ordinary scrolling and nothing is lost
          when motion is off. */}
      <div className="jiko-problems-stack">
        {PROBLEMS.map((problem, i) => (
          <article className="jiko-problems-stack-item" key={problem.code}>
            <div className="jiko-problems-stack-text">
              <div className="jiko-problems-stack-head">
                <span className="jiko-problem-code meta-key">
                  {problem.index} {problem.code}
                </span>
                <h3>{problem.title}</h3>
              </div>
              <p className="jiko-problems-stack-body">{problem.body}</p>
              <span className="jiko-problem-note">{problem.note}</span>
            </div>
            <div className="jiko-problems-visual is-inline">
              <ProblemVisual only={i} />
              <p className="jiko-problems-legend">
                {problem.legend.map((item) => (
                  <span key={item.key}>
                    <b className="meta-key">{item.key}</b>
                    {item.value}
                  </span>
                ))}
              </p>
              <p className="jiko-problems-stage-note">{problem.legendNote}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}