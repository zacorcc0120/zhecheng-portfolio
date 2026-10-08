"use client";

import { useState } from "react";
import type { OverrideCase, ScoreBand } from "@/data/recovery";

// The score table used to be five rows of three columns read top to bottom, and
// the safety override sat three blocks further down as a separate anecdote.
// They are the same decision: a continuous score lands in a band, and a single
// safety answer can leave the band entirely. So the band picker carries both.
export function FeedbackStates({
  bands,
  override,
}: {
  bands: ScoreBand[];
  override: OverrideCase;
}) {
  const [active, setActive] = useState(bands.length - 1);
  const band = bands[active];

  return (
    <div className="fs">
      {/* A scale, not a second table. The bands below print every range, so
          repeating them here would be the same information 90px apart. */}
      <div className="fs-axis" aria-hidden="true">
        {bands.map((item, i) => (
          <span
            key={item.range}
            className={`fs-axis-band${i === active ? " is-active" : ""}`}
          />
        ))}
      </div>

      <div className="fs-body">
        <ol className="fs-bands">
          {bands.map((item, i) => (
            <li key={item.range}>
              <button
                type="button"
                className={`fs-band${i === active ? " is-active" : ""}`}
                onClick={() => setActive(i)}
                aria-pressed={i === active}
              >
                <span className="fs-band-range">{item.range}</span>
                <span className="fs-band-state">{item.mri}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="fs-readout">
          <div className="fs-readout-head">
            <span className="fs-readout-label">TOTAL SCORE</span>
            <strong className="fs-readout-range">{band.range}</strong>
          </div>

          <dl className="fs-classify">
            <div>
              <dt>Morning recovery</dt>
              <dd>{band.mri}</dd>
            </div>
            <div>
              <dt>Training readiness</dt>
              <dd>{band.tri}</dd>
            </div>
          </dl>

          <p className="fs-readout-note">
            连续分数先落进这一档，再翻译成两个可以被读懂的结论：
            当天的恢复状态，以及此刻该用什么强度训练。
          </p>
        </div>
      </div>

      <div className="fs-override">
        <span className="fs-override-label">06 / SAFETY OVERRIDE</span>

        <div className="fs-override-flow">
          <div className="fs-override-cell">
            <span>OVERALL SCORE</span>
            <strong>{override.overall}</strong>
            <small>{override.note}</small>
          </div>

          <span className="fs-override-op">+</span>

          <div className="fs-override-cell">
            <span>ABNORMAL PAIN</span>
            <strong>{override.signalValue}</strong>
            <small>{override.signal}</small>
          </div>

          <span className="fs-override-op">→</span>

          <div className="fs-override-cell fs-override-result">
            <span>FINAL STATUS</span>
            <strong>{override.finalStatus}</strong>
            <small>覆盖普通评分结果</small>
          </div>
        </div>

        <p className="fs-override-note">
          普通平均分会把这个异常稀释掉：总分仍然落在最高一档，
          但只要关键安全题回答 ≤ 2，最终状态就不再由分数决定。
          这正是低权重题可以比高权重题更重要的原因。
        </p>
      </div>
    </div>
  );
}