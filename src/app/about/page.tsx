import type { Metadata } from "next";
import { ArrowDownToLine } from "lucide-react";
import { site } from "@/data/site";
import { PageIntro } from "@/components/layout/PageIntro";
import { Contact } from "@/components/layout/Footer";
import { MaskReveal, MaskBlock } from "@/components/motion/MaskReveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Cao Zhecheng is a design graduate student at Guangxi Normal University exploring computation, artificial intelligence and parametric systems.",
};

const FOCUS = [
  {
    key: "FOCUS",
    value: "Parametric · Generative · AI workflow",
  },
  {
    key: "METHOD",
    value: "规则 → 参数 → 生成 → 验证",
  },
  {
    key: "SEEKING",
    value: "AI Product · Computational Design · Creative Tech",
  },
];

export default function About() {
  return (
    <main id="main" className="home">
      <PageIntro
        kickerLeft="THE PERSON BEHIND THE SYSTEMS"
        kickerRight="曹哲诚 / GUILIN, CHINA"
        lines={["ABOUT", "ZHECHENG CAO"]}
        lead="I explore how rules, data and artificial intelligence can become design tools."
      />

      <section className="about-main section-shell">
        <div className="about-monogram" aria-label="ZC typography monogram">
          ZC
          <span>DESIGN × AI × COMPUTATION × SYSTEMS</span>
        </div>

        <div className="about-bio">
          <MaskReveal
            as="h2"
            className="about-bio-title"
            lines={["我的研究与", "项目实践"]}
            stagger={0.07}
          />
          <MaskBlock className="about-bio-block">
            <p>
              我关注形式背后的规则：传统民居中的空间秩序、晶格结构中的拓扑关系，以及数字产品中数据与交互的组织方式。
            </p>
          </MaskBlock>
          <MaskBlock className="about-bio-block" delay={0.06}>
            <p>
              我的设计实践连接计算设计、AI
              工作流、参数化建模与数字产品。从研究问题出发，建立可操作的模型，再通过交互和验证理解设计选择。
            </p>
          </MaskBlock>
          <p className="about-bio-muted">
            Turning complex rules into interactive, generative and verifiable
            design systems.
          </p>

          <dl className="about-facts">
            {FOCUS.map((item) => (
              <div key={item.key}>
                <dt className="meta-key">{item.key}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="about-education">
            <span className="meta-key">EDUCATION</span>
            <div className="education-line">
              <div>Guangxi Normal University</div>
              <span className="education-role">
                Graduate Student / Design
              </span>
              <p className="education-zh">广西师范大学 · 设计学院 · 设计学研究生</p>
            </div>
          </div>

          {site.resume ? (
            <a className="button button-outline" href={site.resume} download>
              DOWNLOAD RESUME <ArrowDownToLine size={16} />
            </a>
          ) : (
            <>
              <button className="button button-outline" disabled>
                RESUME COMING SOON <ArrowDownToLine size={16} />
              </button>
              <span className="resume-note">简历 PDF 待补充</span>
            </>
          )}
        </div>
      </section>

      <Contact />
    </main>
  );
}
