"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { SelectedQuestion } from "@/data/recovery";

const WEIGHT_MEANING: Record<string, { label: string; body: string }> = {
  "3×": {
    label: "Core signal",
    body: "对当前恢复或训练准备度影响更直接的核心指标。",
  },
  "2×": {
    label: "Supporting signal",
    body: "用于补充整体状态判断的辅助指标。",
  },
  "1×": {
    label: "Context signal",
    body: "影响较低，但仍为长期趋势提供上下文的信息。",
  },
};

// QUESTION → WEIGHT → SCORE → STATE.
//
// This is a real calculator over real records, not a decorative slider. The
// formula on the page is Σ (response × weight) ÷ Σ (10 × weight) × 100, and
// every number below is that formula applied to the one question you picked:
// the term it contributes, the ceiling it is capped at, and the share of a
// perfect answer it represents. The overall 55-input score is deliberately not
// faked — it needs all 55 answers, so it is stated as out of reach rather than
// approximated with invented data.
export function ScoringDiagram({
  questions,
}: {
  questions: SelectedQuestion[];
}) {
  const [pick, setPick] = useState(0);
  const [anchor, setAnchor] = useState(1);
  const reduce = useReducedMotion();
  const question = questions[pick];

  const result = useMemo(() => {
    const weight = Number.parseFloat(question.weight) || 1;
    const [raw, phrase] = question.anchors[anchor] ?? question.anchors[0];
    const response = Number.parseFloat(raw) || 0;
    const term = response * weight;
    const ceiling = 10 * weight;
    return {
      weight,
      response,
      phrase,
      term,
      ceiling,
      ratio: ceiling ? (term / ceiling) * 100 : 0,
    };
  }, [question, anchor]);

  const meaning = WEIGHT_MEANING[question.weight] ?? WEIGHT_MEANING["1×"];

  return (
    <div className="sd">
      <ol className="sd-questions">
        {questions.map((item, i) => (
          <li key={item.code}>
            <button
              type="button"
              className={`sd-question${i === pick ? " is-active" : ""}`}
              onClick={() => {
                setPick(i);
                setAnchor(1);
              }}
              aria-pressed={i === pick}
            >
              <span className="sd-question-code">{item.code}</span>
              <span className="sd-question-title">{item.title}</span>
              <span className="sd-question-weight">{item.weight}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="sd-flow">
        <div className="sd-stage">
          <span className="sd-stage-label">01 / QUESTION</span>
          <strong className="sd-stage-value">{question.code}</strong>
          <span className="sd-stage-note">
            {question.stage} · {question.title}
          </span>
        </div>

        <div className="sd-stage">
          <span className="sd-stage-label">02 / WEIGHT</span>
          <strong className="sd-stage-value">{question.weight}</strong>
          <span className="sd-stage-note">
            {meaning.label} — {meaning.body}
          </span>
        </div>

        <div className="sd-stage sd-stage-wide">
          <span className="sd-stage-label">03 / RESPONSE</span>
          <div className="sd-anchors" role="group" aria-label="选择该题的回答">
            {question.anchors.map(([value, phrase], i) => (
              <button
                key={`${value}-${phrase}`}
                type="button"
                className={`sd-anchor${i === anchor ? " is-active" : ""}`}
                onClick={() => setAnchor(i)}
                aria-pressed={i === anchor}
              >
                <strong>{value}</strong>
                <span>{phrase}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sd-stage sd-stage-wide">
          <span className="sd-stage-label">04 / SCORE TERM</span>
          <div className="sd-term">
            <div className="sd-term-equation">
              <span>
                {result.response} × {result.weight} ={" "}
                <strong>{result.term}</strong>
              </span>
              <span className="sd-term-ceiling">
                满分项 10 × {result.weight} = {result.ceiling}
              </span>
            </div>

            <div className="sd-meter" aria-hidden="true">
              <motion.span
                className="sd-meter-fill"
                initial={false}
                animate={{ scaleX: result.ratio / 100 }}
                transition={{
                  duration: reduce ? 0 : 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              <span className="sd-meter-value">{result.ratio.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="sd-stage sd-stage-wide">
          <span className="sd-stage-label">05 / STATE</span>
          <strong className="sd-state">{result.phrase}</strong>
          <span className="sd-stage-note">
            该回答按 {question.code} 的锚点落在这一档；题目标记为{" "}
            <b className="sd-flag">{question.flag}</b>，标记决定它是否参与
            安全覆盖，而不只是参与平均。
          </span>
        </div>
      </div>

      <p className="sd-footnote">
        演示只代入上面这一道题。完整总分需要 55 个输入项全部作答，
        因此这里不给出整体分数，也不使用示例数据代替真实作答。
      </p>
    </div>
  );
}