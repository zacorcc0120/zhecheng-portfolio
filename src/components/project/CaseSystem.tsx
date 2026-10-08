"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// 05 / THE SYSTEM, for the one project whose chain can be audited.
//
// The previous version dropped six steps into a repeat(4, 1fr) grid, which put
// two cells on a second row and left the remaining tracks rendered in the grid's
// own background — a grey slab that read as unfinished work. Six equal cards
// also hid the thing the section is actually about: the steps are not six peers,
// they are a chain, and what matters is what came out the far end.
//
// So the block states the relation instead of the count. Left is the chain, in
// order, strung on one vertical axis. Right is what that chain produced,
// itemised as a ledger whose keys align. The two columns are the input side and
// the output side of the sentence the caption makes — each step keeps a
// checkable input and output — so the layout is the argument, not a wrapper
// around it.
//
// There is no card, no fill and no colour inversion. The old version turned each
// node black as it scrolled past, which is a control's feedback leaking into
// editorial typography; here the reveal is opacity and 10px of rise, nothing
// that changes what the block says at rest.
//
// The hidden start state is armed in a layout effect rather than rendered.
// Putting it in the initial markup would ship both columns at opacity 0, so a
// crawler, a reader-mode or any failed script would find this section blank —
// the numbers are the substance here, not decoration. Arming before the first
// paint costs one reflow and keeps the reveal. Reduced motion is handled in CSS
// for the same reason: no JS needs to agree about it.
//
// The reveal targets the two columns, not the fifteen rows inside them. Per-row
// thresholds left the ledger's last row invisible until you scrolled a little
// further, and a table that fills in one line at a time reads as a gimmick
// rather than as a block that arrived. Two beats instead: the chain lands, then
// what it produced.
//
// Every figure arrives through props from the project's own data. Nothing here
// computes or invents a number.

type SystemOutput = {
  total: { label: string; value: string; unit: string };
  layers?: { name: string; count: string }[];
  rows: { label: string; value: string }[];
};

const useArmedLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function CaseSystem({
  steps,
  output,
}: {
  steps: string[];
  output: SystemOutput;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  useArmedLayoutEffect(() => {
    const host = grid.current;
    setArmed(true);
    if (!host) return;

    const columns = host.querySelectorAll(".split-col");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          columns.forEach((column) => column.classList.add("is-in"));
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -4% 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`system-grid${armed ? " is-armed" : ""}`} ref={grid}>
      <div className="split-col">
        <p className="col-head">
          Generation / <b>六步链路</b>
        </p>
        <ol className="split-steps">
          {steps.map((step, i) => (
            <li className="split-step" key={step}>
              <span className="split-step-n">{`0${i + 1}`}</span>
              <span className="split-step-t">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="split-col">
        <p className="col-head">
          System Output / <b>可检查的产出</b>
        </p>
        <div className="split-spec">
          <div className="spec-row">
            <span className="spec-k">{output.total.label}</span>
            <span className="spec-v">
              <b>{output.total.value}</b> {output.total.unit}
            </span>
          </div>

          {output.rows.map((entry) => (
            <div className="spec-row" key={entry.label}>
              <span className="spec-k">{entry.label}</span>
              <span className="spec-v">{entry.value}</span>
            </div>
          ))}

          {output.layers?.length ? (
            <>
              <p className="spec-group meta-key">构件集 · 四层分解</p>
              {output.layers.map((layer) => (
                <div className="spec-row is-nested" key={layer.name}>
                  <span className="spec-k">{layer.name}</span>
                  <span className="spec-v">
                    <b>{layer.count}</b>
                  </span>
                </div>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}