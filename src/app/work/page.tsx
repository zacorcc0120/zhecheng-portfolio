import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { WorkIndexList } from "@/components/project/WorkIndexList";
import { Contact } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Selected Works",
  description:
    "Projects in digital product design, parametric architecture and lattice structures by Zhecheng Cao.",
};

export default function Work() {
  return (
    <main id="main" className="home">
      <PageIntro
        kickerLeft="INDEX / 01—05"
        kickerRight="SELECTED PROJECTS · 2026"
        lines={["SELECTED", "WORK"]}
        lead="数字产品、参数化建筑与结构设计。每个项目记录了问题、规则、生成方式与可验证的结果。"
      />
      <WorkIndexList />
      <Contact compact />
    </main>
  );
}
