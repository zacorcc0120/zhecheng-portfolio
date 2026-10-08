import Image from "next/image";
import type { Project } from "@/data/projects";
import { TechnicalArt } from "./TechnicalArt";
import { JikoCover } from "./JikoCover";
export function ProjectCover({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return project.kind === "jiko" ? (
    <JikoCover />
  ) : project.cover ? (
    <div className="project-cover-image">
      <Image
        src={project.cover}
        alt={
          project.kind === "lattice"
            ? "晶格结构概念封面，AI 辅助视觉创作"
            : project.chineseTitle
        }
        priority={priority}
        fill
        quality={90}
        sizes="(max-width: 768px) 100vw, 92vw"
      />
    </div>
  ) : (
    <TechnicalArt kind={project.kind} />
  );
}
