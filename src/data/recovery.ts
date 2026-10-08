// Every RecoveryX-specific fact used by the case study lives here so the five
// chapters read one set of numbers instead of five copies of them. The record
// shapes live here too, so components consume this module and it imports
// nothing back — no type-only cycle between data and presentation.
//
// Nothing in this file is illustrative. The stage counts, question weights,
// scoring anchors, score bands and override thresholds are the prototype's
// actual rules; the copy only restates them. Where a value does not exist —
// the overall score needs all 55 inputs — the interface says so rather than
// filling the gap.

// CH 02 — the five delivered screens, in the order a person meets them.
export type JourneyStep = {
  index: string;
  code: string;
  chinese: string;
  body: string;
  src: string;
  alt: string;
  label: string;
};

// CH 03 — one point in the day.
export type StageNode = {
  code: string;
  index: string;
  title: string;
  chinese: string;
  count: string;
  description: string;
  image: { src: string; alt: string; label: string };
  // The real question codes that belong to this stage, taken from the same
  // records the explorer in the next chapter renders.
  items: { code: string; title: string }[];
};

// CH 04 — one of the 55 inputs, kept whole.
export type SelectedQuestion = {
  code: string;
  stage: string;
  title: string;
  question: string;
  weight: string;
  flag: string;
  rationale: string;
  anchors: [string, string][];
};

export type ScoreBand = { range: string; mri: string; tri: string };

export type OverrideCase = {
  overall: string;
  signal: string;
  signalValue: string;
  finalStatus: string;
  note: string;
};

// CH 02 — THE EXPERIENCE
//
// The five delivered screens that make up the main product interface. Same
// files as projects.assets; only the order and the sentence attached to each
// one are editorial.
export const journeySteps: JourneyStep[] = [
  {
    index: "01",
    code: "ASSESS",
    chinese: "评估入口",
    body: "今天的状态从首页开始：晨起评估与最近一次训练并排出现，进入产品先看到的是「现在怎么样」，而不是一列功能。",
    src: "/images/projects/recoveryx/training-home.webp",
    alt: "RecoveryX 训练首页，今日训练与上次训练入口",
    label: "Training home / 训练首页",
  },
  {
    index: "02",
    code: "TRAIN",
    chinese: "训练记录",
    body: "训练详情保留当天练了什么、每组多少重量，以及完成了多少——记录先于解释存在。",
    src: "/images/projects/recoveryx/training-detail.webp",
    alt: "RecoveryX 训练详情界面，训练日计划与动作组数",
    label: "Session detail / 训练详情",
  },
  {
    index: "03",
    code: "LOG",
    chinese: "动作与组数",
    body: "动作按训练部位组织，添加时直接选部位、重量与组数，不要求先建一套完整的动作库。",
    src: "/images/projects/recoveryx/add-exercise.webp",
    alt: "RecoveryX 添加动作界面，按训练部位选择动作",
    label: "Add movement / 添加动作",
  },
  {
    index: "04",
    code: "REVIEW",
    chinese: "恢复反馈",
    body: "训练之后回到恢复中心：评分在这里被翻译成状态，同时给出近七次训练感受的变化。",
    src: "/images/projects/recoveryx/recovery-center.webp",
    alt: "RecoveryX 恢复中心，恢复状态评分与近七次训练感受趋势",
    label: "Recovery center / 恢复中心",
  },
  {
    index: "05",
    code: "TRACK",
    chinese: "历史追踪",
    body: "历史按月回看，训练与恢复留在同一条时间线上；只有两者并排，变化才有参照。",
    src: "/images/projects/recoveryx/training-history.webp",
    alt: "RecoveryX 训练历史界面，按月回看训练记录",
    label: "Training history / 训练历史",
  },
];

// CH 03 — THE ASSESSMENT SYSTEM
export const stages: StageNode[] = [
  {
    code: "MRI",
    index: "01",
    title: "Morning Recovery",
    chinese: "晨起恢复评估",
    count: "20 questions",
    description:
      "观察睡眠、身体恢复、精神状态、营养支持与健康不适，建立当天的基础恢复状态。",
    image: {
      src: "/images/projects/recoveryx/sleep-assessment.webp",
      alt: "RecoveryX 晨起睡眠自评问卷，含时长与质量评分",
      label: "Sleep / 睡眠自评",
    },
    items: [
      { code: "MRI-1", title: "Sleep quality" },
      { code: "MRI-7", title: "Joint comfort" },
    ],
  },
  {
    code: "TRI",
    index: "02",
    title: "Pre-training Readiness",
    chinese: "训练前准备度评估",
    count: "23 questions",
    description:
      "结合热身反应、动作质量、训练意愿、关节承受与异常症状，判断此刻的训练准备状态。",
    image: {
      src: "/images/projects/recoveryx/energy-assessment.webp",
      alt: "RecoveryX 训练前精力自评问卷与五级量表",
      label: "Energy / 精力自评",
    },
    items: [
      { code: "TRI-4", title: "Fixed warm-up load" },
      { code: "TRI-6", title: "Movement stability" },
      { code: "TRI-22", title: "Abnormal pain" },
    ],
  },
  {
    code: "PF",
    index: "03",
    title: "Post-training Feedback",
    chinese: "训练后反馈",
    count: "12 inputs",
    description:
      "记录训练完成度、主项执行、主动降载、异常疼痛与实际表现，回看训练前判断是否准确。",
    image: {
      src: "/images/projects/recoveryx/discomfort-assessment.webp",
      alt: "RecoveryX 训练后身体不适自评，按部位选择与程度评分",
      label: "Discomfort / 身体不适自评",
    },
    items: [{ code: "PF-12", title: "Actual vs expected" }],
  },
];

export const dimensions = [
  {
    index: "01",
    title: "Recovery state",
    chinese: "基础恢复",
    body: "睡眠质量、睡眠时长、醒后恢复感与全身疲劳共同描述当天的基础状态。",
  },
  {
    index: "02",
    title: "Movement quality",
    chinese: "动作表现",
    body: "热身重量感受、动作速度、稳定性与技术信心帮助判断状态能否转化为实际训练表现。",
  },
  {
    index: "03",
    title: "Mental readiness",
    chinese: "心理准备",
    body: "精力、专注、训练意愿与主观信心补充单纯身体指标无法表达的信息。",
  },
  {
    index: "04",
    title: "Safety signals",
    chinese: "风险信号",
    body: "关节不适、异常疼痛、头晕恶心等指标不会只作为普通平均分的一部分处理。",
  },
];

// CH 04 — INSIDE THE LOGIC
//
// Six of the 55 inputs, kept verbatim: code, stage, prompt, weight, flag,
// rationale and the scoring anchors that turn a daily sentence into a number.
export const selectedQuestions: SelectedQuestion[] = [
  {
    code: "MRI-1",
    stage: "Morning Recovery",
    title: "Sleep quality",
    question: "你昨晚整体睡得怎么样？",
    weight: "3×",
    flag: "NORMAL",
    rationale:
      "睡眠是晨起恢复判断的核心输入之一。这里不要求用户提供睡眠设备数据，而是记录醒来后的整体恢复感受，使评估可以低成本持续完成。",
    anchors: [
      ["10", "非常好，醒来明显感觉恢复"],
      ["7", "整体正常"],
      ["5", "恢复感有限"],
      ["3", "醒来明显疲惫"],
      ["1", "几乎没有恢复感"],
    ],
  },
  {
    code: "MRI-7",
    stage: "Morning Recovery",
    title: "Joint comfort",
    question: "今天肩、肘、手腕、髋、膝、腰这些关节感觉怎么样？",
    weight: "3×",
    flag: "HARD RISK",
    rationale:
      "关节状态不是普通疲劳指标。即使睡眠、精力等项目得分很高，明显的关节不适也可能改变当天训练决策，因此它既是高权重指标，也是独立风险信号。",
    anchors: [
      ["10", "稳定、无明显不适"],
      ["7", "正常"],
      ["5", "一般"],
      ["3", "明显不舒服"],
      ["1", "不适合负重训练"],
    ],
  },
  {
    code: "TRI-4",
    stage: "Pre-training Readiness",
    title: "Fixed warm-up load",
    question: "你平时常用来热身的固定重量，今天做起来感觉轻松吗？",
    weight: "3×",
    flag: "RED FLAG",
    rationale:
      "固定热身重量相当于一个个人化基线。同一个人在相似动作和重量下的主观难度变化，比单独问“今天状态好吗”更接近实际训练表现。",
    anchors: [
      ["10", "明显比平时轻松"],
      ["7", "和平时差不多"],
      ["5", "一般"],
      ["3", "明显感觉重"],
      ["1", "不适合按原计划训练"],
    ],
  },
  {
    code: "TRI-6",
    stage: "Pre-training Readiness",
    title: "Movement stability",
    question: "今天动作做起来稳不稳？有没有飘、晃、控制不住的感觉？",
    weight: "3×",
    flag: "RED FLAG",
    rationale:
      "训练准备度不仅是有没有力气，还包括动作能否被稳定控制。动作稳定性下降时，即使主观精力不错，也可能意味着当天不适合追求高质量或高负荷训练。",
    anchors: [
      ["10", "动作控制非常稳定"],
      ["7", "正常"],
      ["5", "一般"],
      ["3", "明显发飘"],
      ["1", "不适合高质量训练"],
    ],
  },
  {
    code: "TRI-22",
    stage: "Pre-training Readiness",
    title: "Abnormal pain",
    question: "今天有没有刺痛、卡痛、扯痛这类不是普通酸痛的异常疼痛？",
    weight: "2×",
    flag: "HARD RISK",
    rationale:
      "这一题的数字权重只有 2×，但安全优先级高于普通加权系统。低分会触发 Hard Risk Override，避免危险信号被大量正常答案平均掉。",
    anchors: [
      ["10", "完全没有异常疼痛"],
      ["7", "基本正常"],
      ["5", "一般"],
      ["3", "明显疼痛"],
      ["1", "明显不适合训练"],
    ],
  },
  {
    code: "PF-12",
    stage: "Post-training Feedback",
    title: "Actual vs expected",
    question: "今天整堂训练的实际表现，和训练前的预期相比如何？",
    weight: "3×",
    flag: "FEEDBACK",
    rationale:
      "训练后不只是记录完成了多少，更重要的是验证训练前判断是否准确。这个问题把 readiness prediction 与实际训练结果连接起来，形成下一次评估可以参考的反馈闭环。",
    anchors: [
      ["10", "明显好于预期"],
      ["8", "略好于预期"],
      ["6", "基本符合预期"],
      ["4", "略差于预期"],
      ["2", "明显差于预期"],
      ["1", "远低于预期"],
    ],
  },
];

export const weights = [
  {
    value: "3×",
    label: "Core signal",
    body: "对当前恢复或训练准备度影响更直接的核心指标。",
  },
  {
    value: "2×",
    label: "Supporting signal",
    body: "用于补充整体状态判断的辅助指标。",
  },
  {
    value: "1×",
    label: "Context signal",
    body: "影响较低，但仍为长期趋势提供上下文的信息。",
  },
];

export const scoreBands: ScoreBand[] = [
  { range: "85–100", mri: "Very good", tri: "Highly ready" },
  { range: "75–84.9", mri: "Good", tri: "Ready" },
  { range: "65–74.9", mri: "Fair", tri: "Train with adjustment" },
  { range: "55–64.9", mri: "Poor", tri: "Reduce load" },
  { range: "< 55", mri: "Very poor", tri: "Avoid high-quality training" },
];

export const override: OverrideCase = {
  overall: "96.6",
  signal: "hard-risk signal",
  signalValue: "1 / 10",
  finalStatus: "RISK",
  note: "otherwise excellent responses",
};

export const riskRules = [
  {
    code: "RED FLAG",
    body: "被标记的问题回答 ≤ 3 时，即使总分仍然较高，也会进入谨慎状态。",
  },
  {
    code: "HARD RISK",
    body: "关键关节承受、异常疼痛或头晕恶心等项目 ≤ 2 时，直接覆盖普通评分结果。",
  },
];

export const disclaimer =
  "The current model is a rule-based, self-reported readiness prototype. Weights and thresholds are heuristic rather than clinically validated, and the result is not intended as a medical diagnosis.";