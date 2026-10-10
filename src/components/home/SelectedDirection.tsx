"use client";
import { useRef, useSyncExternalStore, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
  useInView,
} from "framer-motion";
import "./SelectedDirection.css";
const media = "bridge" as string;
const state = "default" as string;
const staticView = false;
const layers = ["台基与院落", "墙体与洞口", "木构架", "屋面"];

const stages = ["Site", "Wall", "Timber", "Roof", "Complete"];
const captions = [
  "让院落先于建筑出现。",
  "以墙体界定空间，保留开口。",
  "木构架连接空间与屋面。",
  "屋面完成砖木院落的形制。",
  "规则成为一座完整的建筑。",
];
const img = (name: string) => "/images/home-direction/" + name + ".webp";
function useCompact() {
  return useSyncExternalStore(
    (callback) => {
      const m = matchMedia("(max-width: 767px)");
      m.addEventListener("change", callback);
      return () => m.removeEventListener("change", callback);
    },
    () => matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}
function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const sensor = useRef<HTMLDivElement>(null);
  const visible = useInView(sensor, { once: true, amount: 0.2 });
  return (
    <div ref={sensor} className={className}>
      <motion.div
        initial={
          staticView || reduced
            ? false
            : { clipPath: "inset(0 0 100% 0)", y: 14 }
        }
        animate={{
          clipPath:
            visible || staticView || reduced
              ? "inset(0 0 0% 0)"
              : "inset(0 0 100% 0)",
          y: visible || staticView || reduced ? 0 : 14,
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function PracticeB() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const small = useCompact();
  const [manual, setManual] = useState<number | null>(
    state === "detail" ? 1 : state === "annotation" ? 2 : null,
  );
  const [scrollStage, setScrollStage] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!small && !reduced && !staticView)
      setScrollStage(Math.min(3, Math.floor(p * 4)));
  });
  const active = manual ?? scrollStage;
  const names = small
    ? ["整体", "结构细节", "规则注释", "最终构图"]
    : [
        "Overall form",
        "Structural detail",
        "Rule annotation",
        "Final composition",
      ];
  return (
    <section
      id="introduction"
      ref={ref}
      className={
        "practice-b " + (small || reduced || staticView ? "short" : "")
      }
    >
      <div className="b-sticky">
        <div className="section-kicker">
          <span>Practice / Method</span>
          <span>
            {media !== "building"
              ? "Generative Lattice System"
              : "AI-Driven Vernacular Architecture"}
          </span>
        </div>
        <div className="b-intro">
          <Reveal>
            <h2>
              数字产品、参数化建筑
              <br />
              与计算结构。
            </h2>
          </Reveal>
          <p>我把设计看成一套可以运行的系统，而不是一组界面。</p>
        </div>
        <div className={"immersive-frame media-" + media + " detail-" + active}>
          <motion.img
            src={img(
              media === "bridge"
                ? "bridge"
                : media === "kelvin"
                  ? "kelvin"
                  : "architecture",
            )}
            alt={
              media === "bridge"
                ? "有机晶格拱桥雕塑"
                : media === "kelvin"
                  ? "Kelvin 晶格结构真实项目渲染"
                  : "江头村完整院落真实模型导出"
            }
            animate={{
              scale: active === 1 ? 1.25 : active === 2 ? 1.13 : 1,
              x: active === 1 ? "-4%" : active === 2 ? "-2%" : "0%",
            }}
            transition={{
              duration: reduced || staticView ? 0 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          <AnimatePresence>
            {active === 2 && (
              <motion.div
                className="rule-note"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span>
                  {media === "bridge"
                    ? "连续的曲面，连接多尺度的结构。"
                    : media === "kelvin"
                      ? "重复的单元，连接成连续结构。"
                      : "院落组织空间，屋面回应木构。"}
                </span>
                <small>
                  {media === "bridge"
                    ? "Surface / Connection / Structure"
                    : media === "kelvin"
                      ? "Cell / Connection / Structure"
                      : "Courtyard / Timber / Roof"}
                </small>
              </motion.div>
            )}
          </AnimatePresence>
          <h2 className="b-display">
            <span>One pipeline,</span>
            <span>four surfaces.</span>
          </h2>
        </div>
        <div className="b-controls">
          <span>{String(active + 1).padStart(2, "0")} / 04</span>
          <div>
            {names.map((n, i) => (
              <button
                key={n}
                aria-pressed={active === i}
                onClick={() => setManual(i)}
              >
                {n}
              </button>
            ))}
          </div>
          <button className="scroll-reset" onClick={() => setManual(null)}>
            {manual !== null ? "恢复滚动" : "向下探索 ↓"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Surfaces() {
  return (
    <Reveal className="surface-notes">
      <div>
        <strong>Parametric Design</strong>
        <p>把构件关系写成规则。</p>
      </div>
      <div>
        <strong>AI Workflow</strong>
        <p>连接语言、知识与几何。</p>
      </div>
      <div>
        <strong>Digital Product</strong>
        <p>让日常记录形成反馈。</p>
      </div>
      <div>
        <strong>Computational Design</strong>
        <p>从单元逻辑走向制造。</p>
      </div>
    </Reveal>
  );
}

function LayerStack({
  stage = 3,
  selected = -1,
  className = "",
}: {
  stage?: number;
  selected?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div className={"layer-stack " + className}>
      {layers.map((n, i) => (
        <motion.img
          key={n}
          src={img("layer-" + i)}
          alt={n}
          animate={{
            opacity:
              i > stage ? 0 : selected === -1 || selected === i ? 1 : 0.12,
            y: selected === i ? -8 : 0,
          }}
          transition={{ duration: reduced || staticView ? 0 : 0.4 }}
        />
      ))}
    </div>
  );
}
function RulesA() {
  const ref = useRef<HTMLElement>(null);
  const small = useCompact();
  const reduced = useReducedMotion();
  const [manual, setManual] = useState<number | null>(
    state === "rules-complete" ? 4 : state === "rules-start" ? 0 : null,
  );
  const [scrollStage, setScrollStage] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!small && !reduced && !staticView)
      setScrollStage(Math.min(4, Math.floor(p * 5)));
  });
  const active = manual ?? scrollStage;
  return (
    <section
      ref={ref}
      id="rules"
      className={"rules-a " + (small || reduced || staticView ? "short" : "")}
    >
      <div className="cinema-sticky">
        <div className="section-kicker">
          <span>Rules / Jiangtou</span>
          <span>Architectural Generation Cinema</span>
        </div>
        <Reveal>
          <h2 className="cinema-title">
            RULES INTO
            <br />
            POSSIBILITIES.
          </h2>
        </Reveal>
        <div className={"cinema-art phase-" + active}>
          <LayerStack
            stage={active === 4 ? 3 : active}
            className={active === 4 ? "faded" : ""}
          />
          <motion.img
            className="complete-building"
            src={img("architecture")}
            alt="江头村砖木院落完整模型的真实导出图"
            animate={{
              opacity: active === 4 ? 1 : 0,
              scale: active === 4 ? 1 : 0.93,
            }}
            transition={{ duration: reduced || staticView ? 0 : 0.6 }}
          />
          <span className="cinema-word" aria-hidden="true">
            {stages[active]}
          </span>
        </div>
        <div className="cinema-caption" aria-live="polite">
          <span>{String(active + 1).padStart(2, "0")} / 05</span>
          <p>{captions[active]}</p>
          <small>江头村 / 规则驱动的民居生成</small>
        </div>
        <div className="phase-controls" aria-label="生成阶段">
          {stages.map((n, i) => (
            <button
              key={n}
              aria-pressed={active === i}
              onClick={() => setManual(i)}
            >
              <i />
              {n}
            </button>
          ))}
          <button className="auto-phase" onClick={() => setManual(null)}>
            {manual === null ? "滚动推进 ↓" : "恢复滚动 ↓"}
          </button>
        </div>
      </div>
    </section>
  );
}

export function SelectedPractice() {
  return (
    <div className="selectedDirection">
      <PracticeB />
      <Surfaces />
    </div>
  );
}
export function SelectedRules() {
  return (
    <div className="selectedDirection">
      <RulesA />
    </div>
  );
}

