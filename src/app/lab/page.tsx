import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { experiments } from "@/data/experiments";
import { TechnicalArt } from "@/components/project/TechnicalArt";
import { PageIntro } from "@/components/layout/PageIntro";
import { Contact } from "@/components/layout/Footer";
import { MaskReveal } from "@/components/motion/MaskReveal";

export const metadata: Metadata = {
  title: "Lab / Experiments",
  description:
    "Small experiments in generative forms, parametric models, AI workflows and interface design.",
  // Parked, not deleted. noindex keeps this section out of search results while
  // the studies are still being made genuinely interactive, so it cannot surface
  // as a finished body of work. The page still renders for a direct link, which
  // is why this is metadata and not a redirect. robots.txt deliberately stays
  // permissive: a Disallow here would stop crawlers fetching the page and they
  // would never see this tag in the first place.
  robots: { index: false, follow: false },
};

export default function Lab() {
  return (
    <main id="main" className="home">
      <PageIntro
        kickerLeft="AN OPEN-ENDED PRACTICE"
        kickerRight="STUDIES / 2026"
        lines={["LAB /", "EXPERIMENTS"]}
        lead="A place for questions, iterations and unexpected forms."
        note="实验档案持续整理中。第一版以可操作的几何、工作流与数据演示建立入口。"
      />
      <div className="lab-grid section-shell">
        {experiments.map((experiment) => (
          <article key={experiment.id} className="experiment">
            <Link
              href={experiment.href}
              aria-label={`Explore ${experiment.title}`}
              className="experiment-art"
            >
              <TechnicalArt kind={experiment.kind} />
            </Link>
            <div className="experiment-body">
              <div className="experiment-bar">
                <span className="meta-key">
                  {experiment.id} / {experiment.category}
                </span>
                <span className="meta-key">{experiment.year}</span>
              </div>
              <MaskReveal
                as="h2"
                className="experiment-title"
                lines={[experiment.title]}
                stagger={0.06}
              />
              <p>{experiment.description}</p>
              <div className="experiment-foot">
                <span className="experiment-state">INTERACTIVE STUDY / 演示</span>
                <Link className="experiment-cta" href={experiment.href}>
                  OPEN EXPERIMENT <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Contact compact />
    </main>
  );
}
