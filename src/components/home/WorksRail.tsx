"use client";
import { useEffect, useState } from "react";

/**
 * Discrete index markers joined by a hairline rather than a continuous
 * progress bar: it names the project, it does not just measure distance.
 *
 * The rail appears for two reasons at once, and only when both hold:
 *   1. the METHOD → WORKS divider has handed it over (it publishes this on the
 *      document element), so the rail is the divider's end state rather than a
 *      widget that arrives on its own; and
 *   2. the chapters have actually taken the screen — the observation band is
 *      the middle strip of the viewport, so the rail can no longer land on top
 *      of the SELECTED WORKS headline.
 *
 * It retires again at the closing chapter mark. The rail's whole job is naming
 * which of the five projects you are looking at; once the section hands over to
 * RULES there is nothing left to name, and two sets of left-margin numerals in
 * the same column read as a mistake rather than as structure.
 */
export function WorksRail({ total }: { total: number }) {
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-chapter]"),
    );
    const host = document.querySelector<HTMLElement>("[data-works-body]");
    if (!sections.length) return;

    const chapterObserver = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!hit) return;
        const index = Number((hit.target as HTMLElement).dataset.chapter);
        if (!Number.isNaN(index)) setActive(index);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-18% 0px -18% 0px" },
    );
    sections.forEach((node) => chapterObserver.observe(node));

    const BAND = { threshold: 0, rootMargin: "-40% 0px -34% 0px" };

    let hostObserver: IntersectionObserver | undefined;
    if (host) {
      hostObserver = new IntersectionObserver(
        ([entry]) => setEntered(entry.isIntersecting),
        BAND,
      );
      hostObserver.observe(host);
    }

    let closeObserver: IntersectionObserver | undefined;
    const closer = document.querySelector<HTMLElement>("[data-works-close]");
    if (closer) {
      closeObserver = new IntersectionObserver(
        ([entry]) => setClosing(entry.isIntersecting),
        BAND,
      );
      closeObserver.observe(closer);
    }

    const readHandoff = () =>
      setHandoff(
        document.documentElement.dataset.dividerHandoff === "done",
      );
    readHandoff();
    const handoffObserver = new MutationObserver(readHandoff);
    handoffObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-divider-handoff"],
    });

    return () => {
      chapterObserver.disconnect();
      hostObserver?.disconnect();
      closeObserver?.disconnect();
      handoffObserver.disconnect();
    };
  }, []);

  const visible = entered && handoff && !closing;

  return (
    <aside
      className={`works-rail${visible ? " is-visible" : ""}`}
      aria-hidden="true"
    >
      <span className="works-rail-label">INDEX</span>
      <ol className="works-rail-list">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={i === active ? "is-active" : undefined}>
            <span className="works-rail-tick" />
            <span className="works-rail-num">
              {String(i + 1).padStart(2, "0")}
            </span>
          </li>
        ))}
      </ol>
      <span className="works-rail-count">
        {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </aside>
  );
}