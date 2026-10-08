export type ProjectKind =
  "architecture" | "lattice" | "tower" | "recovery" | "jiko";

export type Asset = {
  label: string;
  meta?: string;
  path: string;
  src: string | null;
  alt: string;
  orientation?: "landscape" | "portrait";
  fit?: "cover" | "contain";
};

/**
 * Case sections that can own their own figures. Only a project with more
 * delivered screens than one grid can hold needs this; everyone else leaves
 * `sectionFigures` undefined and their sections render exactly as before.
 */
export type FigureSection = "assessment" | "research" | "reflection";

export interface Project {
  video?: { src: string; poster?: string; captions?: string; caption: string };
  slug: string;
  index: string;
  title: string;
  titleLines: string[];
  chineseTitle: string;
  subtitle: string;
  year: string;
  category: string;
  description: string;
  tags: string[];
  kind: ProjectKind;
  role: string;
  status: string;
  question: string;
  overview: string;
  process: string[];
  // What the process actually produced. Only the projects that can back every
  // figure with a recorded count carry this; the ones that cannot keep the
  // plain process list rather than get a ledger of invented numbers.
  systemOutput?: {
    total: { label: string; value: string; unit: string };
    layers?: { name: string; count: string }[];
    rows: { label: string; value: string }[];
  };
  problem: { title: string; body: string }[];
  research: { title: string; body: string }[];
  outcomes: string[];
  reflection: string;
  cover: string | null;
  assets: Asset[];
  sectionFigures?: Partial<Record<FigureSection, Asset[]>>;
}

// Add projects here; the home, work index, static routes and next-project links
// are generated from this collection. Demo selection is isolated in ProjectDemo.
export const projects: Project[] = [
  {
    slug: "vernacular-ai",
    index: "01",
    title: "AI-Driven Vernacular Architecture",
    titleLines: ["AI-DRIVEN", "VERNACULAR", "ARCHITECTURE"],
    chineseTitle: "自然语言驱动的桂北传统民居 AI 参数化设计工作流",
    subtitle:
      "A natural-language-driven parametric workflow for traditional northern Guangxi dwellings.",
    year: "2026",
    category: "AI / Parametric architecture",
    kind: "architecture",
    description: "让自然语言成为设计入口，让地方建筑知识成为生成的约束。",
    tags: [
      "LLM",
      "Natural language",
      "Knowledge base",
      "JSON",
      "Grasshopper",
      "Rhino",
    ],
    role: "Graduate research · Rule base, parametric system & interface",
    status: "Working system · 9 seeded schemes generated",
    question: "Can a sentence become an architectural system?",
    overview:
      "以桂林灵川江头村砖木院落式传统民居为主要参照，将空间布局、构件关系、尺度参数与风貌特征整理为结构化规则，并用结构化 JSON 连接语言理解与 Grasshopper 模型。研究关注自然语言如何在地方建筑知识约束下驱动参数化模型，而不止于建筑图像生成。当前系统已能从一句场地描述推导出 660 个构件，并在一套空间语法下生成九种可比较的院落方案。",
    process: [
      "Validate brief",
      "Resolve grammar",
      "Connect spaces",
      "Construct openings",
      "Assemble members",
      "Render specification",
    ],
    // Every figure here is already on record elsewhere in this project, so the
    // block restates them instead of adding any: the 660 total and the four
    // layers come from outcomes, the per-layer counts from the LAYERS table in
    // ArchitectureAnatomy.tsx, the 9 schemes from outcomes and the
    // configurations plate meta, and the dimensions / areas are the footers of
    // the interface and comparison captures.
    systemOutput: {
      total: { label: "构件总数", value: "660", unit: "个" },
      layers: [
        { name: "台基", count: "79" },
        { name: "墙体", count: "292" },
        { name: "木构架", count: "265" },
        { name: "屋面", count: "24" },
      ],
      rows: [
        { label: "可比较方案", value: "9 个 · 3 面宽 × 3 排数" },
        { label: "面宽 × 进深", value: "18.0 m × 12.0 m" },
        { label: "建筑面积", value: "112.1 m²" },
      ],
    },
    problem: [
      {
        title: "01 / Symbolic appearance",
        body: "通用生成模型可能用屋顶、门楼等视觉符号替代完整的地方建筑逻辑。",
      },
      {
        title: "02 / Missing spatial logic",
        body: "院落、天井、房间与交通关系需要明确的空间规则。",
      },
      {
        title: "03 / Uncontrolled scale",
        body: "开间、进深与屋顶尺度需要范围约束与一致的单位体系。",
      },
      {
        title: "04 / Inconsistent components",
        body: "构件间的依赖关系需要在进入建模前检查，而非依赖图像表面的合理性。",
      },
    ],
    research: [
      {
        title: "Read the place",
        body: "以江头村为主要研究样本，结合现场测绘、照片与文献，把院落类型、柱网、开间与屋面做法拆成可以逐条核对的记录，而不是一句风格描述。",
      },
      {
        title: "Structure the knowledge",
        body: "规则按四层组织：台基与院落、墙体与洞口、木构架、屋面。每层记录构件数量、生成条件与高度区间，模型因此可以被拆开检查，而不是只能整栋看。",
      },
      {
        title: "Define the interface",
        body: "用结构化 JSON 连接语言理解与 Grasshopper 模型。界面把场地与需求放在左侧、变体方案放在右侧，每次生成的输入、修正与输出都留在同一次会话里。",
      },
    ],
    outcomes: [
      "从一句场地描述推导出完整构件集：660 个构件，按台基、墙体、木构架、屋面四层分解。",
      "一套语法、九种配置：3 种面宽 × 3 排数的九个方案在同一正投影比例下生成。",
      "可比较的方案界面：并排比较卧室数量、进深、柱网、院落数、建筑面积与屋顶面积。",
      "六步生成链路从需求文档到构件网格全程可追溯，图示直接取自实际构件记录。",
    ],
    reflection:
      "现在能证明的是「规则可以被执行」：同样的语法在不同参数下稳定地产出可比较、可拆解的构件集。还需要补的是「规则是否正确」——参数有效率、空间一致性与构件完整性要在一手测绘样本上做量化验证，模型对场地差异的敏感度也尚未系统测试。在此之前，这套系统是研究原型，不是可交付的生产工具。",
    cover: "/images/projects/vernacular/cover.webp",
    assets: [
      {
        label: "A grammar of dwelling",
        meta: "dv2_c233bda44634eeebf2b6 / 660 source components",
        path: "/images/projects/vernacular/01-grammar-of-dwelling.webp",
        src: "/images/projects/vernacular/01-grammar-of-dwelling.webp",
        alt: "江头院落实测生成的三开间带天井民居轴测图",
      },
      {
        label: "One grammar. Nine configurations.",
        meta: "3 widths × 3 row counts / seeded variants diversity_v1",
        path: "/images/projects/vernacular/03-nine-configurations.webp",
        src: "/images/projects/vernacular/03-nine-configurations.webp",
        alt: "三种面宽乘三种排数生成的九个院落方案缩略图",
      },
      {
        label: "From spatial rules to built geometry",
        meta: "input_v0.md → composition → building_rules.json → integrated_model → model_bridge.py",
        path: "/images/projects/vernacular/04-rules-to-geometry.webp",
        src: "/images/projects/vernacular/04-rules-to-geometry.webp",
        alt: "从校验任务书、解析语法、连接空间到导出模型的六步生成链路",
      },
      {
        label: "Interface / 方案与参数",
        meta: "WIDTH 18.0 m · DEPTH 12.0 m · BEDROOMS 4",
        path: "/images/projects/vernacular/05-interface.webp",
        src: "/images/projects/vernacular/05-interface.webp",
        alt: "参数界面与 Grasshopper 视口，左侧场地与需求，右侧变体方案",
      },
      {
        label: "Comparison / 方案并排比较",
        meta: "NET AREA 112.1 m² · UNUSED SITE 15.8 m² · COURTYARD 2",
        path: "/images/projects/vernacular/06-scheme-comparison.webp",
        src: "/images/projects/vernacular/06-scheme-comparison.webp",
        alt: "变体面板展开为对照表，比较卧室数量、进深、柱网、院落与建筑面积",
      },
      {
        label: "Source triangulation",
        meta: "source triangulation / roof surfaces included",
        path: "/images/projects/vernacular/07-source-triangulation.webp",
        src: "/images/projects/vernacular/07-source-triangulation.webp",
        alt: "模型来源三角网，包含屋面在内的线框三角化结构",
      },
      {
        label: "The timber frame, revealed",
        meta: "roof surfaces hidden / timber members retained",
        path: "/images/projects/vernacular/08-timber-frame.webp",
        src: "/images/projects/vernacular/08-timber-frame.webp",
        alt: "隐藏屋面后的木构架轴测图，可见梁架、檩条与洞口",
      },
    ],
  },
  {
    slug: "jiko",
    index: "02",
    title: "JIKO",
    titleLines: ["JIKO", "迹刻"],
    chineseTitle: "围绕时间记录、日常回顾与事项提醒的微信小程序",
    subtitle:
      "A WeChat mini program for recording time, reviewing everyday life and remembering what comes next.",
    year: "2026",
    category: "AI product / WeChat mini program",
    kind: "jiko",
    description:
      "把一天留下的时间轨迹整理成可回顾的记录，并让自然语言成为创建记录与提醒的入口。",
    tags: [
      "Product design",
      "WeChat Mini Program",
      "DeepSeek API",
      "CloudBase",
      "Interaction design",
      "AI assistant",
    ],
    role: "Independent product · Design, development & release",
    status: "Product review / Internal testing",
    question: "让日常记录成为可以回看的时间轨迹。",
    overview:
      "JIKO 迹刻是一款围绕时间记录、日常回顾和事项提醒设计的微信小程序。用户可以用圆环计时器记录工作、学习、运动与生活，通过时间轴、每日报告和每周回顾理解时间分配；小迹助手则把自然语言转化为记录、提醒或简单对话。产品采用本地优先的数据策略，并通过微信登录与 CloudBase 完成云端同步。",
    process: [
      "Capture time",
      "Structure records",
      "Review the day",
      "Create reminders",
      "Sync across sessions",
      "Reflect & adjust",
    ],
    problem: [
      {
        title: "01 / Recording creates friction",
        body: "传统时间记录需要频繁填写表单。记录动作一旦太重，用户很难在真实生活中持续使用。",
      },
      {
        title: "02 / Data lacks a narrative",
        body: "单条计时数据很难回答时间花去了哪里，需要用时间轴、每日记录与周回顾把碎片组织成连续反馈。",
      },
      {
        title: "03 / Reminders are separated from context",
        body: "记录与待办通常存在于不同工具。JIKO 尝试让正在发生的事与接下来要做的事处于同一个时间系统。",
      },
      {
        title: "04 / Personal tools should feel personal",
        body: "长期使用的记录工具需要适应个人审美与环境，因此提供主题、圆环、壁纸强度和深浅色模式。",
      },
    ],
    research: [
      {
        title: "Record",
        body: "以圆环计时器作为首页核心，让工作、学习、运动和生活等活动可以用很少的步骤开始与结束，并保留本地记录。",
      },
      {
        title: "Review",
        body: "通过时间轴、日志、每日记录和每周回顾呈现时间分布，让用户从单次记录转向理解自己的日常结构。",
      },
      {
        title: "Assist",
        body: "小迹助手接入 DeepSeek API，理解自然语言中的活动与时间信息，用于创建记录、提醒和完成简单对话。",
      },
      {
        title: "Synchronize",
        body: "使用微信登录、CloudBase 云函数和文档型数据库实现账户识别、云端同步、请求限制与提醒调度。",
      },
    ],
    outcomes: [
      "完成计时、时间轴、日志、每日记录与每周回顾的核心产品闭环。",
      "完成微信订阅消息、定时触发器、天气服务和 AI 助手的服务接入。",
      "建立本地优先、支持导入导出与云端同步的数据管理方式。",
      "完成主题、圆环、壁纸、深浅色模式和交互反馈等个性化体验。",
      "完成隐私保护指引、审核材料、体验版上传与正式发布准备。",
    ],
    reflection:
      "JIKO 从个人需求出发，逐步变成一个完整可运行的小程序。下一阶段需要通过更长周期的真实使用验证记录频率、提醒到达率和周回顾价值，并继续减少创建记录时的操作成本。AI 助手将保持明确边界，优先服务记录与提醒，而不是扩展为无目的的聊天入口。",
    cover: "/images/projects/jiko/ai-assistant.webp",
    assets: [
      {
        label: "Weekly review / 每周时间回顾",
        path: "/images/projects/jiko/weekly-review.webp",
        src: "/images/projects/jiko/weekly-review.webp",
        alt: "JIKO 每周时间记录与活动分布界面",
        orientation: "portrait",
        fit: "contain",
      },
      {
        label: "Xiaoji assistant / 自然语言助手",
        path: "/images/projects/jiko/ai-assistant.webp",
        src: "/images/projects/jiko/ai-assistant.webp",
        alt: "JIKO 小迹自然语言助手界面",
        orientation: "portrait",
        fit: "contain",
      },
      {
        label: "Theme system / 主题色系统",
        path: "/images/projects/jiko/theme-system.webp",
        src: "/images/projects/jiko/theme-system.webp",
        alt: "JIKO 主题色与壁纸强度设置界面",
        orientation: "portrait",
        fit: "contain",
      },
      {
        label: "Appearance system / 圆环与显示模式",
        path: "/images/projects/jiko/appearance-system.webp",
        src: "/images/projects/jiko/appearance-system.webp",
        alt: "JIKO 深浅色模式、全局壁纸与计时圆环设置界面",
        orientation: "portrait",
        fit: "contain",
      },
    ],
  },
  {
    slug: "recoveryx",
    index: "03",
    title: "RecoveryX",
    titleLines: ["RECOVERY X"],
    chineseTitle: "健身评估与训练追踪数字产品",
    subtitle: "Fitness assessment and training progress tracking system.",
    year: "2026",
    category: "Digital product / UX / Fitness",
    kind: "recovery",
    description: "连接评估、记录和反馈，让训练变化成为能看懂、可追踪的信息。",
    tags: [
      "Product design",
      "UX",
      "Data visualization",
      "Interaction design",
      "Fitness technology",
    ],
    role: "Product concept · UX & interface design",
    status: "Digital product prototype",
    question: "把当下的身体感受放回训练历史中。",
    overview:
      "RecoveryX 围绕晨起、训练前和训练后三个时间点组织身体感受，再通过训练记录与历史界面保留变化。项目重点是评估信息如何进入记录、如何被回看，以及界面如何解释评分和单项异常。当前展示评估规则与产品界面原型。",
    process: [
      "Assessment",
      "Training records",
      "Progress tracking",
      "Personal report",
    ],
    problem: [
      {
        title: "Scattered records",
        body: "评测、训练重量与日常感受分散记录，难以从单次数据理解长期变化。",
      },
      {
        title: "From a number to a trend",
        body: "用户需要知道同一个动作、同一指标随时间如何变化。",
      },
    ],
    research: [
      {
        title: "Information architecture",
        body: "以评估、训练记录、进度和报告四个模块建立信息结构。",
      },
      {
        title: "Assessment",
        body: "记录评测时间与指标，让变化有可回溯的起点。此界面不提供医学诊断。",
      },
      {
        title: "Feedback design",
        body: "支持动作筛选与时间区间切换，使用清晰单位与上下文，减少对趋势的误读。尚未声明完成正式用户研究。",
      },
    ],
    outcomes: [
      "组织身体评测、训练记录与历史追踪的产品流程。",
      "完成晨起恢复、训练前准备度与训练后反馈的问卷和评分呈现。",
      "完成训练记录、身体状态评估、恢复状态与历史界面，展示从输入到回看的产品路径。",
    ],
    reflection:
      "下一阶段先检查用户能否理解题目和分值描述、能否找到过去的记录，再依据试用反馈调整流程。评分权重与阈值还需要验证。当前示例数据用于说明界面组织，不代表真实用户效果，也不构成训练处方。",
    cover: "/images/projects/recoveryx/cover.webp",
    // Five of the delivered screens, all 4:5 portrait, for 03 / 评估与记录界面.
    // The rest of the set is spread across the sections that actually talk about
    // them — see sectionFigures below — because one grid cannot hold fifteen
    // frames without turning into a contact sheet.
    assets: [
      {
        label: "Training home / 训练首页",
        path: "/images/projects/recoveryx/training-home.webp",
        src: "/images/projects/recoveryx/training-home.webp",
        alt: "RecoveryX 训练首页，今日训练与上次训练入口",
        orientation: "portrait",
      },
      {
        label: "Recovery center / 恢复中心",
        path: "/images/projects/recoveryx/recovery-center.webp",
        src: "/images/projects/recoveryx/recovery-center.webp",
        alt: "RecoveryX 恢复中心，恢复状态评分与近七次训练感受趋势",
        orientation: "portrait",
      },
      {
        label: "Add movement / 添加动作",
        path: "/images/projects/recoveryx/add-exercise.webp",
        src: "/images/projects/recoveryx/add-exercise.webp",
        alt: "RecoveryX 添加动作界面，按训练部位选择动作",
        orientation: "portrait",
      },
      {
        label: "Session detail / 训练详情",
        path: "/images/projects/recoveryx/training-detail.webp",
        src: "/images/projects/recoveryx/training-detail.webp",
        alt: "RecoveryX 训练详情界面，训练日计划与动作组数",
        orientation: "portrait",
      },
      {
        label: "Training history / 训练历史",
        path: "/images/projects/recoveryx/training-history.webp",
        src: "/images/projects/recoveryx/training-history.webp",
        alt: "RecoveryX 训练历史界面，按月回看训练记录",
        orientation: "portrait",
      },
    ],
    // 04 / 问卷与评分规则 — the questionnaire family and the result screen.
    // 05 / 反馈如何呈现 — the data-facing hero.
    // 06 / 题目与权重验证 — the closing overview frames.
    sectionFigures: {
      assessment: [
        {
          label: "Sleep / 睡眠自评",
          path: "/images/projects/recoveryx/sleep-assessment.webp",
          src: "/images/projects/recoveryx/sleep-assessment.webp",
          alt: "RecoveryX 晨起睡眠自评问卷，含时长与质量评分",
          orientation: "portrait",
        },
        {
          label: "Energy / 精力自评",
          path: "/images/projects/recoveryx/energy-assessment.webp",
          src: "/images/projects/recoveryx/energy-assessment.webp",
          alt: "RecoveryX 训练前精力自评问卷与五级量表",
          orientation: "portrait",
        },
        {
          label: "Discomfort / 身体不适自评",
          path: "/images/projects/recoveryx/discomfort-assessment.webp",
          src: "/images/projects/recoveryx/discomfort-assessment.webp",
          alt: "RecoveryX 训练后身体不适自评，按部位选择与程度评分",
          orientation: "portrait",
        },
        {
          label: "Questionnaire / 问卷评估",
          path: "/images/projects/recoveryx/questionnaire.webp",
          src: "/images/projects/recoveryx/questionnaire.webp",
          alt: "RecoveryX 问卷评估页，按条目逐项打分并汇总",
          orientation: "portrait",
        },
        {
          label: "Assessment result / 评估结果",
          path: "/images/projects/recoveryx/assessment-result.webp",
          src: "/images/projects/recoveryx/assessment-result.webp",
          alt: "RecoveryX 评估结果页，分项评分与文字说明",
          orientation: "portrait",
        },
      ],
      research: [
        {
          label: "Recovery, explained / 恢复状态如何呈现",
          path: "/images/projects/recoveryx/recovery-hero.webp",
          src: "/images/projects/recoveryx/recovery-hero.webp",
          alt: "RecoveryX 恢复中心主视觉，88% 恢复评分与近七次训练感受趋势",
          orientation: "landscape",
        },
      ],
      reflection: [
        {
          label: "Feature overview / 功能总览",
          path: "/images/projects/recoveryx/feature-overview.webp",
          src: "/images/projects/recoveryx/feature-overview.webp",
          alt: "RecoveryX 功能总览，五个主要界面同框",
        },
        {
          label: "Brand poster / 品牌展示",
          path: "/images/projects/recoveryx/brand-poster.webp",
          src: "/images/projects/recoveryx/brand-poster.webp",
          alt: "RecoveryX 品牌海报，训练首页与恢复中心双设备同框",
        },
        {
          label: "Closing overview / 收尾总览",
          path: "/images/projects/recoveryx/closing-overview.webp",
          src: "/images/projects/recoveryx/closing-overview.webp",
          alt: "RecoveryX 收尾总览，训练、评估与恢复三个界面并列",
        },
      ],
    },
  },
  {
    slug: "lattice-system",
    index: "04",
    title: "Generative Lattice System",
    titleLines: ["GENERATIVE", "LATTICE SYSTEM"],
    chineseTitle: "参数化晶格与增材制造坐垫设计研究",
    subtitle: "Designing support through geometry.",
    year: "2026",
    category: "Computational design / Simulation",
    kind: "lattice",
    description:
      "以晶格参数化、打印样件与有限元分析，探索坐垫支撑结构和渐变镂空设计。",
    tags: [
      "Grasshopper",
      "Rhino",
      "ANSYS",
      "Voronoi",
      "Additive manufacturing",
    ],
    role: "Computational design · Parametric modeling · Simulation",
    status: "Design development / Prototype & FEA",
    question: "让结构分析成为几何调整的依据。",
    overview:
      "研究分为两个阶段：先通过参数化模型、打印样件与静力学分析比较多孔试件，再将基于受力调整几何的方法用于 PP 腰托坐垫。前一阶段关注拓扑与结构响应，后一阶段比较原始坐垫与两种渐变开孔方案，分别交代材料、载荷和边界条件。",
    process: [
      "Geometry rules",
      "Parametric model",
      "Printed specimens",
      "ANSYS analysis",
      "Seat development",
    ],
    problem: [
      {
        title: "Support & ventilation",
        body: "多孔结构提供局部几何调节的空间，但支撑与透气表现需要分别验证。",
      },
      {
        title: "Comparable conditions",
        body: "几何、材料和载荷共同影响结果。比较晶格时统一试件尺寸与目标填充率，并明确泡沫对照采用不同材料。",
      },
      {
        title: "Evidence to geometry",
        body: "依据受力分布确定开孔区域与尺度，保留连接处及边缘的主要受力路径。",
      },
    ],
    research: [
      {
        title: "100 × 100 × 40 mm",
        body: "统一晶格试件外部尺寸，目标相对填充率约 20%。利用骨架长度估算杆件半径，并在实体模型中复核。",
      },
      {
        title: "Printed specimens",
        body: "通过晶格建模、打印与实体观察，检查数字规则如何转化为可制造的结构。",
      },
      {
        title: "500 N / Static Structural",
        body: "顶面 500 N 竖向载荷、底面固定，对比 TPU 蜂巢、TPU Voronoi 与聚氨酯慢回弹泡沫。",
      },
    ],
    outcomes: [
      "建立基于体积、骨架长度与杆件半径的参数化建模关系。",
      "形成晶格数字模型、打印样件和可追溯的静力学仿真图像。",
      "将坐垫受力分析转译为 Voronoi 渐变开孔规则，并对比 PP 原型及两种方案。",
    ],
    reflection:
      "下一阶段将结合人体压力分布细化支撑分区，并以材料测试、网格收敛与实体压缩实验校准模型。设计重点从单一几何生成，进一步转向可测量的支撑与使用体验。",
    cover: "/images/projects/lattice/cover-editorial.webp",
    assets: [
      {
        label: "Application / PP 坐垫方案云图汇总",
        path: "/images/projects/lattice/seat-results.webp",
        src: "/images/projects/lattice/seat-results.webp",
        alt: "PP 渐变开孔坐垫应力与总变形云图汇总",
        fit: "contain",
      },
    ],
  },
  {
    slug: "drum-tower",
    index: "05",

    title: "Parametric Drum Tower",
    titleLines: ["PARAMETRIC", "DRUM TOWER"],

    chineseTitle: "侗族鼓楼传统营造规则的参数化转译与生成",

    subtitle:
      "Translating the spatial hierarchy, structural framework and proportional rules of Dong drum towers into a generative parametric system.",

    year: "2026",

    category: "Computational design / Cultural heritage",

    kind: "tower",

    description:
      "将传统鼓楼中隐性的柱网、层级、收分与构件关系转译为可调整、可生成的数字规则。",

    tags: [
      "Computational design",
      "Grasshopper",
      "Rhino",
      "Rule-based design",
      "Parametric architecture",
      "Cultural heritage",
    ],

    role: "Architectural research · Rule extraction · Parametric modeling",

    status: "Parametric modeling study",

    question: "让柱网、层级与构件沿着同一套规则生成。",

    overview:
      "项目以广西三江侗族鼓楼为研究对象。与复刻一座固定鼓楼不同，我尝试从其平面组织、柱网关系、层檐数量、竖向高度、逐层收分、构件尺度与顶部结构中提取可计算的关系，并在 Rhino + Grasshopper 中建立联动参数系统。模型能够通过改变多个控制变量重新生成柱网、层级骨架与构架实体，用于观察传统建筑形态如何由一套相互依赖的规则产生。",

    process: [
      "Traditional building rules",
      "Parameter extraction",
      "Base column grid",
      "Vertical hierarchy",
      "Layer scaling",
      "Structural skeleton",
      "Member generation",
      "Design variations",
    ],

    problem: [
      {
        title: "The form is not the rule",
        body: "鼓楼最容易被识别的是密集屋檐和塔式轮廓，但复制外观并不能解释它如何形成。参数化模型需要描述柱网、层级、比例与构件之间的关系，而不是只描摹最终形态。",
      },
      {
        title: "Dimensions are interdependent",
        body: "平面边数、柱距、建筑高度、檐层数量与收分比例并不是独立变量。修改一个参数会影响多个构件，因此模型必须建立明确的数据依赖关系。",
      },
      {
        title: "From implicit knowledge to explicit logic",
        body: "传统营造知识大量存在于比例经验、丈杆体系和工匠实践中。数字化转译的重点，是把这些隐性的关系整理成可读取、可修改和可检查的参数逻辑。",
      },
    ],

    research: [
      {
        title: "01 / Plan & column grid",
        body: "以建筑中心点为基准，通过平面边数、底层控制半径、主副柱间距与内柱间距建立向心式柱网。改变平面边数后，同一生成逻辑可以适配不同多边形平面。",
      },
      {
        title: "02 / Vertical hierarchy",
        body: "将整体高度、层檐数量与层间标高转化为竖向序列，使鼓楼由底层柱网向上生成连续的结构层级，而不是逐层手工建模。",
      },
      {
        title: "03 / Tapering & proportion",
        body: "通过逐层缩放控制建筑由下至上的收分。收分比例与层数共同决定鼓楼的整体轮廓，使形态变化来源于同一套比例关系。",
      },
      {
        title: "04 / Structural members",
        body: "在骨架线框基础上生成主柱、外围柱、环向梁枋、向心构件与顶部结构，并通过柱体与梁枋尺度参数完成实体化表达。",
      },
    ],

    outcomes: [
      "建立由平面、柱网、层级、收分、构件与顶部结构共同组成的 Grasshopper 参数控制系统。",
      "完成从底层柱网、层级骨架到柱梁构架实体化的连续生成流程。",
      "使用同一套生成逻辑输出四角、八角等不同平面条件下的鼓楼模型。",
      "通过 Rhino 模型渲染与 AI 辅助材质表达，对结构逻辑与最终建筑形态进行不同层级的可视化。",
    ],

    reflection:
      "当前模型主要表达鼓楼的整体形态、柱网、层檐关系和主要构架逻辑，并不能等同于真实施工模型。榫卯节点、斗拱细部、屋面瓦作以及不同地区鼓楼的具体尺寸差异仍未被完整建模。现阶段参数范围主要来自文献整理、建筑特征归纳与模型推演，后续需要结合更多实测案例校准参数，并进一步研究构件级营造规则。",

    cover: "/images/projects/drum-tower/cover-hero.png",

    assets: [
      {
        label: "Global parameters / 全局参数控制",
        path: "/images/projects/drum-tower/parameters.png",
        src: "/images/projects/drum-tower/parameters.png",
        alt: "侗族鼓楼 Grasshopper 全局建筑参数控制面板",
        fit: "contain",
      },
      {
        label: "Grasshopper definition / 参数化系统",
        path: "/images/projects/drum-tower/grasshopper-system.png",
        src: "/images/projects/drum-tower/grasshopper-system.png",
        alt: "侗族鼓楼完整 Grasshopper 参数化建模逻辑",
        fit: "contain",
      },
      {
        label: "Square configuration / 四角鼓楼",
        path: "/images/projects/drum-tower/square-model.png",
        src: "/images/projects/drum-tower/square-model.png",
        alt: "同一参数系统生成的四角鼓楼模型",
        fit: "contain",
      },
      {
        label: "Octagonal configuration / 八角鼓楼",
        path: "/images/projects/drum-tower/octagonal-model.png",
        src: "/images/projects/drum-tower/octagonal-model.png",
        alt: "同一参数系统生成的八角鼓楼模型",
        fit: "contain",
      },
      {
        label: "Primary columns / 主要支撑柱",
        path: "/images/projects/drum-tower/primary-columns.png",
        src: "/images/projects/drum-tower/primary-columns.png",
        alt: "鼓楼主要柱体与底层柱网生成结果",
        orientation: "portrait",
        fit: "contain",
      },
      {
        label: "Horizontal framework / 横向构架",
        path: "/images/projects/drum-tower/horizontal-frame.png",
        src: "/images/projects/drum-tower/horizontal-frame.png",
        alt: "鼓楼横向梁枋构架生成结果",
        orientation: "portrait",
        fit: "contain",
      },
      {
        label: "Vertical framework / 竖向构架",
        path: "/images/projects/drum-tower/vertical-frame.png",
        src: "/images/projects/drum-tower/vertical-frame.png",
        alt: "鼓楼竖向支撑结构生成结果",
        orientation: "portrait",
        fit: "contain",
      },
      {
        label: "Exploded structure / 构架爆炸图",
        path: "/images/projects/drum-tower/exploded-structure.png",
        src: "/images/projects/drum-tower/exploded-structure.png",
        alt: "八角鼓楼构架层级爆炸图",
        orientation: "portrait",
        fit: "contain",
      },
      {
        label: "Material visualization / 材质表达",
        path: "/images/projects/drum-tower/render-octagonal.png",
        src: "/images/projects/drum-tower/render-octagonal.png",
        alt: "八角鼓楼 AI 辅助真实材质视觉表达",
        fit: "contain",
      },
    ],
  },
];
export const findProject = (slug: string) =>
  projects.find((project) => project.slug === slug);
