import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { site } from "@/data/site";
import { Contact } from "@/components/layout/Footer";
import { HeroField } from "@/components/home/HeroField";
import { HeroHeadline } from "@/components/home/HeroHeadline";
import { MethodIndex } from "@/components/home/MethodIndex";
import { FormField } from "@/components/home/FormField";
import { RuleIndexDivider } from "@/components/home/RuleIndexDivider";
import { ChapterMarkDivider } from "@/components/home/ChapterMarkDivider";
import { WorksIndex } from "@/components/home/WorksIndex";
import { MaskReveal, MaskBlock } from "@/components/motion/MaskReveal";

export default function Home() {
  return (
    <main id="main" className="home">
      {/* 01 — Impact. The field is the work, the headline is the position. */}
      <section className="hero section-shell">
        <div className="hero-bar">
          <span className="meta-key">ZHECHENG CAO / {site.chineseName}</span>
        </div>

        <div className="hero-stage">
          <HeroField />
          <HeroHeadline />
        </div>

        <div className="hero-foot">
          <span className="hero-coord">25.27°N / 110.29°E</span>
          <a href="#works" className="hero-scroll">
            <span>SCROLL</span>
            <ArrowDown size={16} />
          </a>
        </div>
      </section>

      {/* 02 — Dense. Short, specific, sets the vocabulary. */}
      <section className="manifesto section-shell" id="introduction">
        <div className="section-kicker">
          <span>01 / PRACTICE</span>
          <span>曹哲诚 · 设计学研究生</span>
        </div>
        <MaskReveal
          as="h2"
          className="manifesto-statement"
          lineClassName="manifesto-line"
          lines={["数字产品、参数化建筑", "与计算结构。"]}
          stagger={0.08}
        />
        <div className="manifesto-body">
          <p className="manifesto-lead">
            我把设计看成一套可以运行的系统，而不是一组界面。
          </p>
          <p>
            从桂北传统民居的生成式参数化工作流，到微信小程序里的时间记录与日常回顾，
            再到晶格结构与鼓楼形制的规则提取——对象不同，但都在做同一件事：
            把模糊的需求变成可命名、可调整的参数，交给系统去生成，再回到人的判断。
          </p>
        </div>
      </section>

      <MethodIndex />

      {/* The method's own rule chains become the project index. The rail that
          follows is this band's end state, not a separate widget. */}
      <RuleIndexDivider />

      {/* Large visual: five chapters, five presentations. */}
      <WorksIndex />

      {/* Five projects, one method. Nothing else. */}
      <ChapterMarkDivider />

      {/* Quiet, and no longer only type. The headline keeps the whole width it
          had — it is the last thing the page says before it introduces the
          person — and the generative field sits underneath it in the space the
          section was already giving away. */}
      <section className="quiet section-shell">
        <div className="quiet-head">
          <p className="quiet-line">
            <MaskBlock duration={1.2}>
              RULES INTO
            </MaskBlock>
            <MaskBlock delay={0.12} duration={1.2}>
              POSSIBILITIES.
            </MaskBlock>
          </p>
          <span className="quiet-note meta-key">
            方法先于形式 / METHOD BEFORE FORM
          </span>
        </div>

        <FormField />
      </section>

      <section className="home-about section-shell">
        <div className="section-kicker">
          <span>04 / ABOUT</span>
          <span>{site.location}</span>
        </div>
        <div className="home-about-grid">
          <MaskReveal
            as="h2"
            className="home-about-title"
            lineClassName="manifesto-line"
            lines={["关于我"]}
          />
          <div className="home-about-body">
            <p>
              广西师范大学设计学研究生。长期在做参数化建模与数字产品，
              习惯把设计过程写下来：用了什么规则、为什么这样取舍、结果如何被验证。
            </p>
            <ul className="home-about-facts">
              <li>
                <span className="meta-key">FOCUS</span>
                <span>Parametric · Generative · AI workflow</span>
              </li>
              <li>
                <span className="meta-key">TOOLS</span>
                <span>Grasshopper / Rhino / Figma / Frontend</span>
              </li>
              <li>
                <span className="meta-key">SEEKING</span>
                <span>AI Product · Computational Design · Creative Tech</span>
              </li>
            </ul>
            <Link href="/about" className="text-link">
              MORE ABOUT ME <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Contact />
    </main>
  );
}
