"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useReducedMotion, useMotionTemplate } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";
import { ProjectCover } from "./ProjectCover";
import { MaskReveal } from "@/components/motion/MaskReveal";

export type ChapterVariant = "flag" | "duo" | "inset" | "weighted" | "letterbox";

const VARIANTS: ChapterVariant[] = [
  "flag",
  "duo",
  "inset",
  "weighted",
  "letterbox",
];

function chapterVariant(index: number): ChapterVariant {
  return VARIANTS[index % VARIANTS.length];
}

// The preview that follows the pointer over a project chapter. One element per
// chapter, mounted only while that chapter is hovered, so at most one exists.
// Position is written straight to CSS variables on a rAF loop, so React never
// re-renders while the pointer moves.
function CursorPreview({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    let tx = window.innerWidth * 0.5;
    let ty = window.innerHeight * 0.5;
    let x = tx;
    let y = ty;

    const tick = () => {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      // Tilt follows the pointer's distance from the viewport centre, which
      // reads as the card being turned by the hand rather than sliding.
      const nx = (x / window.innerWidth - 0.5) * 2;
      const ny = (y / window.innerHeight - 0.5) * 2;
      node.style.setProperty("--x", `${x.toFixed(1)}px`);
      node.style.setProperty("--y", `${y.toFixed(1)}px`);
      node.style.setProperty("--rx", `${(ny * -4).toFixed(2)}deg`);
      node.style.setProperty("--ry", `${(nx * 5).toFixed(2)}deg`);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      tx = event.clientX;
      ty = event.clientY;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="cursor-preview" ref={ref} aria-hidden="true">
      <div className="cursor-preview-card">
        <div className="cursor-preview-frame">
          {project.cover ? (
            <Image src={project.cover} alt="" fill sizes="340px" className="cursor-preview-img" />
          ) : (
            <ProjectCover project={project} />
          )}
        </div>
        <span className="cursor-preview-tag">
          {project.index} / {project.category}
        </span>
      </div>
    </div>
  );
}

export function ProjectChapter({
  project,
  position,
  total,
}: {
  project: Project;
  position: number;
  total: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const variant = chapterVariant(position);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  // Images settle from a slight over-scale as they enter, which reads as the
  // frame being brought into focus rather than simply appearing.
  const settle = useTransform(scrollYProgress, [0, 1], [1.07, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [26, 0]);

  // The cover is uncovered from the bottom edge as the chapter approaches.
  const calm = useReducedMotion();
  const wipe = useTransform(
    scrollYProgress,
    [0.04, 0.62],
    calm ? [0, 0] : [100, 0],
  );
  const edge = useTransform(
    scrollYProgress,
    [0.04, 0.62],
    calm ? ["100%", "100%"] : ["100%", "0%"],
  );
  const clip = useMotionTemplate`inset(0% 0% ${wipe}% 0%)`;
  const meshFade = useTransform(
    scrollYProgress,
    [0.04, 0.62],
    calm ? [0, 0] : [0.85, 0],
  );

  return (
    <article
      ref={ref}
      className={`chapter chapter-${variant}`}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      aria-labelledby={`chapter-${project.slug}`}
    >
      <div className="chapter-rail" aria-hidden="true">
        <span className="chapter-rail-index">{project.index}</span>
        <span className="chapter-rail-rule" />
        <span className="chapter-rail-total">
          {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="chapter-media">
        <Link
          href={`/work/${project.slug}`}
          className="chapter-media-link"
          aria-label={`${project.title} — ${project.year}`}
        >
          <motion.div
            className="chapter-media-frame"
            style={{ scale: settle, y: lift }}
          >
            {/* The cover is uncovered by scroll rather than fading in: the
                clip is driven continuously by the chapter's own progress, with
                a leading edge that carries the site's technical register. */}
            <motion.div className="chapter-wipe" style={{ clipPath: clip }}>
              <ProjectCover project={project} priority={position === 0} />
              {/* The drafting mesh is the scaffold: strongest while the cover is
                  still being uncovered, gone once it has landed. */}
              <motion.span
                className="chapter-wipe-mesh"
                style={{ opacity: meshFade }}
                aria-hidden="true"
              />
            </motion.div>
            <motion.span
              className="chapter-wipe-edge"
              style={{ top: edge }}
              aria-hidden="true"
            />
          </motion.div>
        </Link>
        <span className="chapter-media-caption">
          FIG. {project.index} — {project.chineseTitle}
        </span>
      </div>

      <div className="chapter-text">
        <div className="chapter-meta">
          <span className="meta-key">PROJECT</span>
          <span className="meta-val">
            {project.index} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <div className="chapter-meta">
          <span className="meta-key">YEAR</span>
          <span className="meta-val">{project.year}</span>
        </div>
        <div className="chapter-meta">
          <span className="meta-key">TYPE</span>
          <span className="meta-val">{project.category}</span>
        </div>
        <div className="chapter-meta">
          <span className="meta-key">ROLE</span>
          <span className="meta-val">{project.role}</span>
        </div>

        <MaskReveal
          as="h3"
          className="chapter-title"
          lineClassName="chapter-title-line"
          lines={project.titleLines.length ? project.titleLines : [project.title]}
          stagger={0.075}
        />

        <p className="chapter-desc">{project.description}</p>

        <ul className="chapter-tools" aria-label="Tools and methods">
          {project.tags.slice(0, 4).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <Link
          href={`/work/${project.slug}`}
          className="chapter-cta"
          onPointerEnter={() => setActive(true)}
        >
          <span>OPEN CASE STUDY</span>
          <ArrowUpRight size={20} />
        </Link>
      </div>

      {active && <CursorPreview project={project} />}
    </article>
  );
}
