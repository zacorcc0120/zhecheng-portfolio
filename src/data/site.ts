// Edit personal information and real contact links here. Null links render as
// honest unavailable states, never broken anchors or fictitious contact details.
export const site = {
  name: "Zhecheng Cao",
  chineseName: "曹哲诚",
  title: "Zhecheng Cao — Computational Designer",
  description:
    "Portfolio of Zhecheng Cao, exploring computational design, artificial intelligence, parametric systems and digital products.",
  location: "Guilin, China",
  email: "caozhecheng0120@gmail.com" as string | null,
  // Stored in E.164 so the tel: href stays machine-readable, and shown in
  // site.phoneLabel because a number hidden behind a channel name cannot be
  // copied or dialled by a reader.
  phone: "+8618335792002" as string | null,
  phoneLabel: "+86 183 3579 2002",
  github: null as string | null,
  linkedin: null as string | null,
  resume: "/resume/zhecheng-cao-resume.pdf" as string | null,
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export const disciplines = [
  {
    name: "Parametric design",
    description: "把几何、构件和尺度关系写成可以调整与复用的规则。",
    detail: "Geometry → Rules → Form",
  },
  {
    name: "AI workflow",
    description: "将自然语言、领域知识和生成工具连接为可执行的设计流程。",
    detail: "Language → Knowledge → Action",
  },
  {
    name: "Digital product",
    description: "把复杂的记录、评估和反馈变成清晰、可操作的产品体验。",
    detail: "Needs → Interaction → Feedback",
  },
  {
    name: "Computational design",
    description: "用参数、数据与验证，让设计过程可探索，也可被解释。",
    detail: "Parameters → Iteration → Validation",
  },
];

export const skills = [
  {
    category: "Computational",
    tools: ["Rhino", "Grasshopper", "Dendro", "Parametric modeling"],
  },
  { category: "Simulation", tools: ["ANSYS", "Structural analysis"] },
  {
    category: "Digital product",
    tools: ["Figma", "UI / UX", "Frontend", "Data visualization"],
  },
  {
    category: "AI",
    tools: [
      "LLM workflow",
      "Prompt engineering",
      "AI-assisted coding",
      "Knowledge base",
    ],
  },
];
