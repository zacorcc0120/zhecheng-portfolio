import {
  LatticeModelStudy,
  LatticeApplicationStudy,
} from "@/components/project/LatticeStudy";
import { LatticeResults } from "@/components/charts/LatticeResults";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { findProject, projects, type FigureSection } from "@/data/projects";
import { Fragment, type ReactNode } from "react";
import { caseStructures, type CaseSectionId } from "@/data/case-structure";
import { caseEditorial } from "@/data/case-editorial";
import { ProjectVideo } from "@/components/project/ProjectVideo";
import { ProjectCover } from "@/components/project/ProjectCover";
import { AssetSlot } from "@/components/project/AssetSlot";
import { ArchitectureAnatomy } from "@/components/project/ArchitectureAnatomy";
import { CaseFigure, CaseFigurePair } from "@/components/project/CaseFigure";
import { ProjectDemo } from "@/components/project/ProjectDemo";
import { Workflow } from "@/components/project/Workflow";
import { CaseSystem } from "@/components/project/CaseSystem";
import { RecoveryAssessment } from "@/components/project/RecoveryAssessment";
import { RecoveryLogic } from "@/components/project/RecoveryLogic";
import { ProductJourney } from "@/components/project/ProductJourney";
import { journeySteps } from "@/data/recovery";
import { DrumTowerSystem } from "@/components/project/DrumTowerSystem";
import { CaseProgress } from "@/components/project/CaseProgress";
import { CaseHandoff } from "@/components/project/CaseHandoff";
import { MaskReveal, MaskBlock } from "@/components/motion/MaskReveal";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.subtitle,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: `${project.title} — Zhecheng Cao`,
      description: project.subtitle,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: project.title,
      description: project.subtitle,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = findProject(slug);
  if (!project) notFound();
  const editorial = caseEditorial[project.kind];
  const next =
    projects[
      (projects.findIndex((p) => p.slug === slug) + 1) % projects.length
    ];

  const navigation = caseStructures[project.kind];

  /* 接缝方向 01「满幅出血」：封面打到页面两侧，署名压在图片底部的渐变
     遮罩上，封面之下直接是正文——原来那条 330px 的等高线过渡条整个取消。
     民居仍是结构标记（CaseHandoff），RecoveryX 本来就是这个结构，所以现在
     五个项目只有两种接缝，不再各说各话。
     晶格封面是浅灰渲染图，遮罩要翻成白色，见 globals.css 的 cover-light。 */
  const bleedsCover =
    project.kind === "jiko" ||
    project.kind === "lattice" ||
    project.kind === "tower";

  const sectionNumber = (id: string) =>
    String(navigation.findIndex((section) => section.id === id) + 1).padStart(
      2,
      "0",
    );
  const demoTitles = {
    architecture: "输入一句话，查看建筑参数。",
    lattice: "调整晶胞类型、尺度与杆径。",
    tower: "调整层数、高度与屋檐尺度。",
    recovery: "从身体评估到训练历史。",
    jiko: "选择活动，开始一次计时。",
  };
  // Plates are picked by file rather than by position, so reordering the asset
  // list in the data file can never silently swap two figures.
  const plate = (name: string) =>
    project.assets.find((asset) => asset.path.includes(name));
  const isArchitecture = project.kind === "architecture";
  // RecoveryX delivers fifteen frames, which one grid cannot hold without
  // turning into a contact sheet, so its figures are split across the sections
  // that discuss them. Every other project leaves sectionFigures undefined and
  // these sections render exactly as they did before.
  const figures = (section: FigureSection) =>
    project.sectionFigures?.[section] ?? [];

  // Three of the five questionnaire screens are now owned by the stage they
  // were taken in — the timeline shows the real interface for the moment you
  // select — so only the two screens that show the scoring itself are left for
  // the grid under the section.
  const assessmentSupport =
    project.sectionFigures?.assessment?.filter(
      (asset) =>
        asset.path.includes("questionnaire") ||
        asset.path.includes("assessment-result"),
    ) ?? [];

  // The closing chapter leads with the frame that shows the whole product and
  // keeps two behind it as evidence, instead of three images in a row after
  // the final paragraph.
  const outcomeHero = project.sectionFigures?.reflection?.find((asset) =>
    asset.path.includes("feature-overview"),
  );
  const outcomeSupport =
    project.sectionFigures?.reflection?.filter(
      (asset) => !asset.path.includes("feature-overview"),
    ) ?? [];
  const sections: Record<CaseSectionId, ReactNode> = {
    overview: (
      <section id="overview" className="case-section case-overview">
        <span className="eyebrow">
          {sectionNumber("overview")} /{" "}
          {project.kind === "recovery" ? "THE PRODUCT" : "OVERVIEW"}
        </span>
        <MaskBlock className="case-question">
          <h2 className="section-heading">{project.question}</h2>
        </MaskBlock>
        <p className="case-lead">{project.overview}</p>

        {/* RecoveryX folds its problem statement into this chapter instead of
            giving it a chapter of its own. The reason the product exists is
            the same sentence as what it is, and a six-item index made a
            one-paragraph chapter look equal in weight to the product journey. */}
        {project.kind === "recovery" && (
          <div className="case-problem-inline">
            <span className="case-problem-label">THE PROBLEM</span>
            <h3>More data isn&rsquo;t always clarity.</h3>
            <div className="problem-grid">
              {project.problem.map((item) => (
                <article key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>
    ),
    problem: (
      <section id="problem" className="case-section">
        <span className="eyebrow">
          {sectionNumber("problem")} / THE PROBLEM
        </span>
        <h2>
          {editorial
            ? editorial.problemTitle
            : project.kind === "recovery"
              ? "More data isn’t always clarity."
              : project.kind === "jiko"
                ? "Recording time should feel effortless."
                : "空间、尺度与构件需要哪些约束？"}
        </h2>
        <div className="problem-grid">
          {project.problem.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    ),
    research: (
      <section id="research" className="case-section">
        {project.kind === "recovery" ? (
          <>
            <span className="eyebrow">
              {sectionNumber("research")} / INSIDE THE LOGIC
            </span>
            <h2>Explore the assessment logic.</h2>
            <p className="case-lead">
              问卷、权重、总分区间与安全覆盖曾经是五段从上到下的说明。
              现在它们是一条链路：选一题，看它带什么权重；选一个回答，
              看这个权重在公式里变成多大的加权项；再看分数落到哪一档，
              以及一个安全信号能不能把这一档整个覆盖掉。
            </p>

            <RecoveryLogic />

            {figures("research").map((asset) => (
              <CaseFigure key={asset.path} asset={asset} ratio="wide" />
            ))}
          </>
        ) : (
          <>
            <span className="eyebrow">
              {sectionNumber("research")} /{" "}
              {navigation.find((chapter) => chapter.id === "research")?.title}
            </span>
            <h2>
              {editorial
                ? editorial.decisionTitle
                : project.kind === "architecture"
                  ? "整理江头村的空间与构件规则。"
                  : project.kind === "tower"
                    ? "Understand before generating."
                    : project.kind === "jiko"
                      ? "Capture, review and remember."
                      : "Make the comparison meaningful."}
            </h2>
            <div
              className={
                editorial ? "research-grid case-decisions" : "research-grid"
              }
            >
              {(editorial?.decisions ?? project.research).map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            {isArchitecture && <CaseFigure asset={plate("01-grammar-of-dwelling")} />}
            {figures("research").map((asset) => (
              <CaseFigure key={asset.path} asset={asset} ratio="wide" />
            ))}
          </>
        )}
      </section>
    ),
    anatomy: (
      <section id="anatomy" className="case-section">
        <span className="eyebrow">
          {sectionNumber("anatomy")} / FOUR LAYERS
        </span>
        <h2>
          {editorial
            ? "把一栋房子拆成四层可以核对的规则。"
            : "拆开看，才知道它是不是生成的。"}
        </h2>
        <p>
          模型不是一整块实体，而是四层可以分别寻址的构件：台基与院落、墙体与洞口、
          木构架、屋面。每一层都有自己的构件数量与抬升高度。
          右侧滚动可以逐层取出——这正是「可拆开检查」这句话的具体做法。
        </p>
        <ArchitectureAnatomy />
        <CaseFigurePair
          assets={[plate("07-source-triangulation"), plate("08-timber-frame")]}
          ratio="tall"
        />
      </section>
    ),
    system: (
      <section id="system" className="case-section">
        <span className="eyebrow">{sectionNumber("system")} / THE SYSTEM</span>
        <h2>
          {project.kind === "recovery"
            ? "From assessment to insight."
            : project.kind === "jiko"
              ? "From a moment to a pattern."
              : "从自然语言到 JSON 与参数模型。"}
        </h2>
        {/* Only the projects that can back every figure with a recorded count
            carry a systemOutput ledger; the rest keep the plain six-card grid. */}
        {project.systemOutput ? (
          <CaseSystem
            steps={project.process}
            output={project.systemOutput}
          />
        ) : (
          <Workflow steps={project.process} />
        )}
        <p className="workflow-caption">
          {project.kind === "architecture"
            ? "语义层 → 规则层 → 参数层 → 模型层。每个环节保留可检查的输入与输出。"
            : project.kind === "lattice"
              ? "将晶格生成、打印样件和结构分析连接到坐垫的参数化设计。"
              : project.kind === "tower"
                ? "从建筑观察到几何构建，逐层说明规则与参数之间的关系。"
                : project.kind === "recovery"
                  ? "评估建立起点，记录构成历史，趋势帮助阅读变化，报告组织反馈。"
                  : "计时捕捉当下，记录形成轨迹，回顾帮助理解时间，提醒连接下一步行动。"}
        </p>
        {isArchitecture && (
          <CaseFigure asset={plate("04-rules-to-geometry")} ratio="cinema" />
        )}
      </section>
    ),
    "parametric-system": (
      <section id="parametric-system" className="case-section">
        <span className="eyebrow">
          {sectionNumber("parametric-system")} / PARAMETRIC SYSTEM
        </span>

        <h2>从柱网规则到鼓楼构架。</h2>

        <p>
          先定义平面、层级和构件参数，再逐步生成柱网、梁枋和整体构架。下面展示
          Grasshopper 控制面板、生成步骤和不同平面配置。
        </p>

        <DrumTowerSystem />
      </section>
    ),
    assessment: (
      <section id="assessment" className="case-section">
        <span className="eyebrow">
          {sectionNumber("assessment")} /{" "}
          {project.kind === "recovery"
            ? "THE ASSESSMENT SYSTEM"
            : "ASSESSMENT FRAMEWORK"}
        </span>

        {project.kind === "recovery" ? (
          <>
            <h2>晨起、训练前与训练后。</h2>
            <p className="case-lead">
              RecoveryX 不把一次主观感受直接当作结论，而是通过晨起恢复、
              训练前准备度与训练后反馈三个阶段，将分散的身体感受组织成可以重复记录、
              比较和反馈的结构化信息。
            </p>
          </>
        ) : (
          <>
            <h2>晨起、训练前与训练后的评估规则。</h2>
            <p>
              RecoveryX 不把一次主观感受直接当作结论，而是通过晨起恢复、
              训练前准备度与训练后反馈三个阶段，将分散的身体感受组织成可以重复记录、
              比较和反馈的结构化信息。
            </p>
          </>
        )}

        <RecoveryAssessment />

        {/* Three of the five questionnaire screens now belong to the stage
            they were taken in, so the timeline can show the real interface
            for the moment you select. These two are the screens that show the
            scoring itself, which no single stage owns. */}
        {assessmentSupport.length > 0 && (
          <div className="assets-grid assets-grid-recovery">
            {assessmentSupport.map((asset) => (
              <AssetSlot key={asset.path} {...asset} />
            ))}
          </div>
        )}
      </section>
    ),
    "model-study": (
      <section id="model-study" className="case-section">
        <span className="eyebrow">
          {sectionNumber("model-study")} / MODELING & FABRICATION
        </span>
        <h2>Grasshopper 建模与晶格样件打印。</h2>
        <LatticeModelStudy />
      </section>
    ),
    interactive: (
      <section id="interactive" className="case-section">
        <span className="eyebrow">
          {sectionNumber("interactive")} /{" "}
          {project.kind === "recovery"
            ? "THE EXPERIENCE"
            : "INTERACTION & PROTOTYPE"}
        </span>

        {project.kind === "recovery" ? (
          <>
            <h2>一次循环，五步走完。</h2>
            <p className="case-lead">
              这五屏不是五张截图，是同一个人在一天里经过的五个时刻。
              右侧的设备在滚动过程中不移动位置，切换的只是屏幕本身——
              这样「评估、训练、记录、恢复、历史」是一条线，而不是五个并列的功能。
            </p>
            <ProductJourney steps={journeySteps} />
          </>
        ) : (
          <>
            <h2>{demoTitles[project.kind]}</h2>
            {isArchitecture && (
              <CaseFigurePair
                assets={[plate("05-interface"), plate("06-scheme-comparison")]}
              />
            )}
            <ProjectDemo kind={project.kind} />
          </>
        )}
      </section>
    ),
    validation: (
      <section id="validation" className="case-section">
        <span className="eyebrow">
          {sectionNumber("validation")} / STRUCTURAL ANALYSIS
        </span>
        <h2>500 N 载荷下的应力与变形。</h2>
        <LatticeResults />
      </section>
    ),
    application: (
      <section id="application" className="case-section">
        <span className="eyebrow">
          {sectionNumber("application")} / PRODUCT APPLICATION
        </span>
        <h2>原始坐垫与两种开孔方案比较。</h2>
        <LatticeApplicationStudy />
        <details className="lattice-details">
          <summary>查看坐垫方案云图汇总</summary>
          {project.assets.map((asset) => (
            <AssetSlot key={asset.path} {...asset} />
          ))}
        </details>
      </section>
    ),
    outcome: (
      <section id="outcome" className="case-section">
        <span className="eyebrow">
          {sectionNumber("outcome")} / OUTCOME & DOCUMENTATION
        </span>
        <h2>{editorial?.outcomeTitle ?? "已搭建的工作流与演示。"}</h2>
        <ol className="outcomes">
          {project.outcomes.map((outcome, i) => (
            <li key={outcome}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {outcome}
            </li>
          ))}
        </ol>
        {project.kind !== "recovery" && (
          <div
            className={
              project.kind === "tower"
                ? "assets-grid assets-grid-tower"
                : "assets-grid"
            }
          >
            {(project.kind === "tower"
              ? project.assets.filter((asset) =>
                  asset.path.endsWith("render-octagonal.png"),
                )
              : isArchitecture
                ? []
                : project.assets
            ).map((asset) => (
              <AssetSlot key={asset.path} {...asset} />
            ))}
          </div>
        )}
        {isArchitecture && (
          <CaseFigure asset={plate("03-nine-configurations")} ratio="grid" />
        )}
        {project.video && <ProjectVideo {...project.video} />}
      </section>
    ),
    reflection: (
      <section id="reflection" className="case-section">
        {project.kind === "recovery" ? (
          <>
            <span className="eyebrow">
              {sectionNumber("reflection")} / THE OUTCOME
            </span>
            <h2>From isolated records to visible patterns.</h2>

            {/* One frame that shows the whole product before any summary
                text. The three closing images used to sit in a three-up grid
                after the last paragraph, which made the ending a contact
                sheet instead of a closing statement.

                All three composites are delivered as true 3200x3200 squares.
                "cinema" cut 65% off the top and bottom of the hero, and "tall"
                cut 28% off the two behind it, so all three now use the square
                token and land uncropped. */}
            {outcomeHero && (
              <CaseFigure asset={outcomeHero} ratio="square" />
            )}

            <div className="case-outcome-status">
              <article className="is-built">
                <span>Implemented</span>
                <ul>
                  {project.outcomes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="is-designed">
                <span>Designed</span>
                <ul>
                  <li>三阶段问卷结构与 55 个输入项的划分。</li>
                  <li>启发式权重、评分锚点与总分区间的映射规则。</li>
                  <li>安全覆盖机制：让低权重的高风险项压过普通平均分。</li>
                </ul>
              </article>

              <article className="is-open">
                <span>Not yet validated</span>
                <p>
                  下一阶段先检查用户能否理解题目和分值描述、能否找到过去的记录，
                  再依据试用反馈调整流程。评分权重与阈值还需要验证。当前示例数据用于说明界面组织，
                  不代表真实用户效果，也不构成训练处方。
                </p>
              </article>
            </div>

            {/* Supporting evidence, two frames — not the whole set again. Both are
                delivered squares like the hero, so the ratio follows the file
                rather than the two-value `orientation` field, which is shared
                with AssetSlot and has no square member. */}
            {outcomeSupport.map((asset) => (
              <CaseFigure key={asset.path} asset={asset} ratio="square" />
            ))}
          </>
        ) : (
          <>
            <span className="eyebrow">
              {sectionNumber("reflection")} / REFLECTION & NEXT STEPS
            </span>
            <h2>{editorial?.reflectionTitle ?? "补充一手样本与真实建模接口。"}</h2>
            <p>{project.reflection}</p>

            {figures("reflection").length > 0 && (
              <div className="assets-grid assets-grid-squares">
                {figures("reflection").map((asset) => (
                  <AssetSlot key={asset.path} {...asset} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    ),
  };
  return (
    <main id="main" className={editorial ? "case-edited" : undefined}>
      <section className={`case-hero case-${project.kind} section-shell`}>
        <div className="case-breadcrumb">
          <Link href="/work">
            <ArrowLeft size={15} /> ALL WORK
          </Link>
          <span>
            PROJECT {project.index} / {String(projects.length).padStart(2, "0")}
          </span>
        </div>
        <MaskReveal
          as="h1"
          className="case-display"
          lineClassName="case-display-line"
          lines={project.titleLines.length ? project.titleLines : [project.title]}
          stagger={0.075}
        />
        <div className="case-hero-subtitle">
          <p>{project.subtitle}</p>
          <span>{project.chineseTitle}</span>
        </div>
        <dl className="case-meta">
          <div>
            <dt>YEAR</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>ROLE / SCOPE</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt>PROJECT STATUS</dt>
            <dd>{project.status}</dd>
          </div>
        </dl>
        {editorial && (
          <div className="case-brief" aria-label="项目速览">
            <h2>{editorial.takeaway}</h2>
            <dl>
              <div>
                <dt>我的工作</dt>
                <dd>{editorial.contribution}</dd>
              </div>
              <div>
                <dt>已有成果</dt>
                <dd>{editorial.evidence}</dd>
              </div>
            </dl>
            <div className="case-brief-bottom">
              <p>{editorial.scope}</p>
              <a href={`#${editorial.evidenceTarget}`} className="text-link">
                {editorial.evidenceLabel} <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        )}
      </section>
      <div
        className={`case-cover case-${project.kind}${
          bleedsCover ? " case-bleed" : ""
        }${project.kind === "lattice" ? " cover-light" : ""}`}
      >
        <ProjectCover project={project} priority />
        {/* The cover is the first screen, so the seam is the tonal cut from the
            frame into the warm paper column rather than a strip bolted
            underneath it. The scrim is what keeps the signature legible over
            whatever the photograph does at the bottom; it carries no meaning of
            its own, so it is hidden from assistive tech. */}
        {(project.kind === "recovery" || bleedsCover) && (
          <>
            <span className="cover-scrim" aria-hidden="true" />
            <p className="cover-signature">
              <span className="cover-signature-name">{project.title}</span>
              <span className="meta-key">Case Study / {project.index}</span>
            </p>
          </>
        )}
      </div>

      {/* Two seams left in the system: the architecture study hands off through
          a structural marker, every other case closes its full-bleed cover with
          nothing at all. */}
      {project.slug === "vernacular-ai" ? (
        <CaseHandoff index={project.index} title={project.title} />
      ) : null}

      <div className={`case-layout section-shell`}>
        <CaseProgress chapters={navigation} />
        <div className="case-content">
          {navigation.map((chapter) => (
            <Fragment key={chapter.id}>{sections[chapter.id]}</Fragment>
          ))}
        </div>
      </div>
      <Link href={`/work/${next.slug}`} className="next-project section-shell">
        <span className="next-project-bar">
          <span className="meta-key">NEXT PROJECT / {next.index}</span>
          <span className="meta-key next-project-chinese">{next.chineseTitle}</span>
          <ArrowUpRight size={26} />
        </span>
        <MaskReveal
          as="h2"
          className="next-project-title"
          lineClassName="next-project-line"
          lines={next.titleLines.length ? next.titleLines : [next.title]}
          stagger={0.07}
        />
        <span className="next-project-meta meta-key">
          {next.category} · {next.year}
        </span>
      </Link>
    </main>
  );
}
