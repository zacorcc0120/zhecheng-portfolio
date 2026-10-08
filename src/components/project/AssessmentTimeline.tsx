"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { StageNode } from "@/data/recovery";

// The three stages were three equal-weight rectangles, which said "here are
// three more boxes". They are actually one timeline: the same person answered
// at three points in a day, and each point answers a different question. So the
// track is the interface — select a moment, and the real questionnaire screen
// and the real question codes for that moment arrive with it.
export function AssessmentTimeline({ stages }: { stages: StageNode[] }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const stage = stages[active];

  return (
    <div className="at">
      <div className="at-track" role="tablist" aria-label="评估阶段">
        {stages.map((node, i) => (
          <button
            key={node.code}
            type="button"
            role="tab"
            id={`at-tab-${node.code}`}
            aria-selected={i === active}
            aria-controls={`at-panel-${node.code}`}
            tabIndex={i === active ? 0 : -1}
            className={`at-node${i === active ? " is-active" : ""}`}
            onClick={() => setActive(i)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const next =
                event.key === "ArrowRight"
                  ? (i + 1) % stages.length
                  : (i - 1 + stages.length) % stages.length;
              setActive(next);
              document
                .getElementById(`at-tab-${stages[next].code}`)
                ?.focus();
            }}
          >
            <span className="at-node-dot" aria-hidden="true" />
            <span className="at-node-index">{node.index}</span>
            <span className="at-node-code">{node.code}</span>
            <span className="at-node-title">{node.title}</span>
          </button>
        ))}
      </div>

      <div
        className="at-panel"
        id={`at-panel-${stage.code}`}
        role="tabpanel"
        aria-labelledby={`at-tab-${stage.code}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage.code}
            className="at-panel-inner"
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -6 }}
            transition={{
              duration: reduce ? 0 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="at-copy">
              <span className="at-chinese">{stage.chinese}</span>
              <p className="at-description">{stage.description}</p>

              <div className="at-meta">
                <div>
                  <span>SCOPE</span>
                  <strong>{stage.count}</strong>
                </div>
                <div>
                  <span>STAGE CODE</span>
                  <strong>{stage.code}</strong>
                </div>
              </div>

              <div className="at-items">
                <span className="at-items-label">
                  本阶段展示的真实题目
                </span>
                <ul>
                  {stage.items.map((item) => (
                    <li key={item.code}>
                      <span className="at-item-code">{item.code}</span>
                      <span className="at-item-title">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <figure className="at-shot">
              <div className="pj-shot-image">
                <Image
                  src={stage.image.src}
                  alt={stage.image.alt}
                  fill
                  sizes="(max-width: 900px) 92vw, 34vw"
                />
              </div>
              <figcaption>{stage.image.label}</figcaption>
            </figure>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}