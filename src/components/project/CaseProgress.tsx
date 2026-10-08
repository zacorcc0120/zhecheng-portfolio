"use client";
import { useEffect, useState } from "react";

// Interaction B — a minimal case-study section index.
//
// Deliberately not a continuous progress bar: the reader is told which chapter
// they are in and how far through the study they are, using discrete ticks
// rather than a filled track. It replaces the old full-width scaleX bar and
// upgrades the static table of contents into something scroll-aware.
export function CaseProgress({
  chapters,
}: {
  chapters: { id: string; title: string }[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    // The active chapter is the one crossing the upper band of the viewport, so
    // the label changes as a section takes over rather than after it is left.
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((entry) => entry.isIntersecting);
        if (!hit) return;
        const index = chapters.findIndex((c) => c.id === hit.target.id);
        if (index >= 0) setActive(index);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [chapters]);

  const total = chapters.length;
  const current = active + 1;

  return (
    <nav className="case-index" aria-label="Case study sections">
      <div className="case-index-head">
        <span className="case-index-label">INSIDE THE PROJECT</span>
        <span className="case-index-count">
          <span className="case-index-count-now">
            {String(current).padStart(2, "0")}
          </span>
          <span className="case-index-count-all">/ {String(total).padStart(2, "0")}</span>
        </span>
      </div>
      <ol className="case-index-list">
        {chapters.map((chapter, i) => (
          <li key={chapter.id} className={i === active ? "is-active" : undefined}>
            <a href={`#${chapter.id}`} aria-current={i === active ? "true" : undefined}>
              <span className="case-index-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="case-index-tick" />
              <span className="case-index-title">{chapter.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
