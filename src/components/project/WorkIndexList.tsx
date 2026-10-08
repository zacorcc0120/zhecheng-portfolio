import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectCover } from "./ProjectCover";

// The work index. Deliberately much denser than the homepage chapters: an
// index page is for scanning, so the same content is set as a ruled table
// rather than five full-height visual sections.
export function WorkIndexList() {
  return (
    <div className="work-list section-shell">
      <div className="work-list-head">
        <span className="meta-key">NO.</span>
        <span className="meta-key">PROJECT</span>
        <span className="meta-key work-list-head-type">TYPE / YEAR</span>
        <span className="meta-key work-list-head-thumb">COVER</span>
      </div>
      <ol className="work-list-body">
        {projects.map((project) => (
          <li key={project.slug} className="work-list-row">
            <Link href={`/work/${project.slug}`} className="work-list-link">
              <span className="work-list-num">{project.index}</span>
              <span className="work-list-main">
                <span className="work-list-title">{project.title}</span>
                <span className="work-list-zh">{project.chineseTitle}</span>
              </span>
              <span className="work-list-meta">
                <span className="work-list-type">{project.category}</span>
                <span className="work-list-year">{project.year}</span>
              </span>
              <span className="work-list-thumb" aria-hidden="true">
                <ProjectCover project={project} />
              </span>
              <span className="work-list-go" aria-hidden="true">
                <ArrowUpRight size={20} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
