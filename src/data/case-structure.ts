import type { ProjectKind } from "./projects";

export type CaseSectionId =
  | "overview"
  | "problem"
  | "research"
  | "anatomy"
  | "system"
  | "assessment"
  | "parametric-system"
  | "model-study"
  | "validation"
  | "application"
  | "interactive"
  | "outcome"
  | "reflection";
type Chapter = { id: CaseSectionId; title: string };

// Reading order follows the work: product tasks, building rules, or experiments.
export const caseStructures: Record<ProjectKind, Chapter[]> = {
  jiko: [
    { id: "overview", title: "产品与职责" },
    { id: "problem", title: "记录中的困难" },
    { id: "interactive", title: "开始一次计时" },
    { id: "outcome", title: "回顾、提醒与设置" },
    { id: "research", title: "交互与数据设计" },
    { id: "reflection", title: "待验证的使用体验" },
  ],
  // Five chapters, not six. The problem statement used to be its own chapter
  // and it is one sentence long, which made it look as important as the
  // product journey; it now opens THE PRODUCT, where it belongs. The
  // questionnaire moved out of its own chapter too: the stage timeline and the
  // scoring logic are one argument, so they sit next to each other.
  recovery: [
    { id: "overview", title: "产品与定位" },
    { id: "interactive", title: "产品流程" },
    { id: "assessment", title: "评估系统" },
    { id: "research", title: "评分逻辑" },
    { id: "reflection", title: "成果与验证" },
  ],
  tower: [
    { id: "overview", title: "建模对象与范围" },
    { id: "research", title: "柱网与层级规则" },
    { id: "parametric-system", title: "构架生成与变体" },
    { id: "interactive", title: "调整参数看轮廓" },
    { id: "outcome", title: "材质表达" },
    { id: "reflection", title: "构造细节与校准" },
  ],
  lattice: [
    { id: "overview", title: "研究对象与范围" },
    { id: "research", title: "比较条件" },
    { id: "model-study", title: "建模与打印" },
    { id: "validation", title: "ANSYS 仿真结果" },
    { id: "application", title: "PP 坐垫方案比较" },
    { id: "interactive", title: "晶胞参数演示" },
    { id: "reflection", title: "实测与材料校准" },
  ],
  architecture: [
    { id: "overview", title: "研究目标" },
    { id: "problem", title: "空间与尺度约束" },
    { id: "research", title: "地方建筑规则" },
    { id: "anatomy", title: "四层构造" },
    { id: "system", title: "规则到构件的链路" },
    { id: "interactive", title: "参数界面与方案比较" },
    { id: "outcome", title: "九种配置与当前成果" },
    { id: "reflection", title: "规则是否正确" },
  ],
};
