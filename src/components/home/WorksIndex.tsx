import { projects } from "@/data/projects";
import { ProjectChapter } from "@/components/project/ProjectChapter";
import { WorksRail } from "./WorksRail";
import { MaskReveal } from "@/components/motion/MaskReveal";

// Homepage-specific presentation. /work keeps the original SelectedWorks list
// so the index page is untouched in this round.
export function WorksIndex() {
  return (
    <section className="works" id="works" data-works>
      <div className="works-head section-shell">
        <div className="section-kicker">
          <span>03 / SELECTED WORKS</span>
          <span>PROJECTS / PROCESS / RESULTS</span>
        </div>
        <div className="works-head-main">
          <MaskReveal
            as="h2"
            className="works-title"
            lineClassName="works-title-line"
            lines={["SELECTED", "WORKS"]}
            stagger={0.08}
          />
          <div className="works-head-aside">
            <span className="meta-key">COUNT</span>
            <span className="works-head-count">
              {String(projects.length).padStart(2, "0")}
            </span>
            <p>
              五个项目，三种对象：参数化建筑、数字产品和计算结构。
              每一个都从可命名、可调整的参数开始。
            </p>
          </div>
        </div>
      </div>
      <WorksRail total={projects.length} />
      <div className="works-body section-shell" data-works-body>
        {projects.map((project, i) => (
          <div data-chapter={i} key={project.slug}>
            <ProjectChapter
              project={project}
              position={i}
              total={projects.length}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
