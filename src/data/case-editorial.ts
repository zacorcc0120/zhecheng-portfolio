import type { ProjectKind } from "./projects";

type CaseEditorial = {
  takeaway: string;
  contribution: string;
  evidence: string;
  evidenceTarget: string;
  evidenceLabel: string;
  scope: string;
  problemTitle: string;
  decisionTitle: string;
  decisions: { title: string; body: string }[];
  outcomeTitle: string;
  reflectionTitle: string;
};

// Existing project material, edited for a quick first read. Research in progress
// is intentionally excluded until its author is ready to publish more evidence.
export const caseEditorial: Partial<Record<ProjectKind, CaseEditorial>> = {
  jiko: {
    takeaway: "把计时、回顾与提醒做进一个微信小程序。",
    contribution:
      "独立负责产品设计、界面交互、开发与发布准备；接入 DeepSeek 和 CloudBase 服务。",
    evidence:
      "已形成计时、时间轴、每日记录与周回顾流程，完成 AI 助手、提醒和云同步接入。",
    evidenceTarget: "outcome",
    evidenceLabel: "查看产品界面",
    scope:
      "当前处于审核与内部测试阶段。下方计时器是网页交互演示，不保存记录；小程序的长期使用效果仍待验证。",
    problemTitle: "记录要轻，回顾要有用。",
    decisionTitle: "围绕记录习惯组织产品。",
    decisions: [
      {
        title: "用计时器承接当下",
        body: "把圆环计时器放在首页中心，围绕活动类型、开始与暂停组织操作。记录入口服务于正在发生的事，减少开始记录前需要填写的信息。",
      },
      {
        title: "用不同时间尺度组织回顾",
        body: "时间轴保留事件顺序，每日记录与周回顾汇总活动分布。同一份记录既能回答“刚才做了什么”，也能帮助回看一段时间的安排。",
      },
      {
        title: "让自然语言服务具体任务",
        body: "小迹助手通过 DeepSeek 解析活动和时间信息，服务于记录与提醒。微信订阅消息与定时触发器承接到期通知，AI 能力围绕已有任务展开。",
      },
      {
        title: "保留本地记录与数据出口",
        body: "采用本地优先的数据方式，提供导入导出，再通过微信登录与 CloudBase 同步。界面上的记录体验与账户、同步和提醒服务分别承担清晰的职责。",
      },
    ],
    outcomeTitle: "从计时到回顾的产品界面。",
    reflectionTitle: "记录频率、提醒到达率与周回顾仍待验证。",
  },
  recovery: {
    takeaway: "把身体感受、训练记录与历史变化放到同一条反馈路径中。",
    contribution:
      "负责产品概念、信息架构与界面交互设计，组织评估、记录、历史和反馈之间的关系。",
    evidence:
      "已完成晨起、训练前与训练后评估框架，以及训练记录、恢复状态和历史界面。",
    evidenceTarget: "interactive",
    evidenceLabel: "查看核心界面",
    scope:
      "当前展示产品原型与示例数据。评分权重和阈值属于待验证的设计规则，不能据此判断实际训练效果或提供医学诊断。",
    problemTitle: "一次评分，需要放回训练情境。",
    decisionTitle: "让评估结果可以被回看和解释。",
    decisions: [
      {
        title: "按训练阶段拆分输入",
        body: "晨起恢复、训练前准备度和训练后反馈分别记录不同时间点的状态。保留记录时间与阶段，避免把一天中的不同感受混成一个分数。",
      },
      {
        title: "为主观选择提供描述",
        body: "问卷为分值配备具体的感受描述，让用户根据睡眠、关节感受或动作稳定性选择。设计目标是让重复记录更容易理解，是否改善一致性仍需通过试用检验。",
      },
      {
        title: "单独呈现关键异常项",
        body: "原型将异常信号与普通加权结果分开呈现，避免平均分掩盖单项信息。下文展示的是界面与规则设计，权重及触发条件尚需进一步验证。",
      },
      {
        title: "把当次记录接回历史",
        body: "以训练记录、恢复状态和历史页面组织回看路径。读者可以在案例中看到当前评估如何与过去的记录建立联系，示例趋势不代表真实用户改善。",
      },
    ],
    outcomeTitle: "已完成的评估与记录流程。",
    reflectionTitle: "题目理解与评分权重仍待验证。",
  },
  lattice: {
    takeaway: "从晶格试件的结构响应，走向坐垫的渐变开孔设计。",
    contribution:
      "负责参数化建模、晶格结构探索与仿真分析，将几何生成、打印样件和坐垫方案比较连接起来。",
    evidence:
      "已有数字模型、打印样件和 ANSYS 云图；PP 坐垫原型与两种开孔方案有同工况对比。",
    evidenceTarget: "validation",
    evidenceLabel: "查看仿真结果",
    scope:
      "TPU 晶格试件与 PP 坐垫属于不同阶段、不同材料的研究。现有结果是静力分析，舒适性、透气性与长期使用表现仍需实测。",
    problemTitle: "结构怎么变，支撑会怎样变？",
    decisionTitle: "先建立比较条件，再读取结果。",
    decisions: [
      {
        title: "统一试件的几何参照",
        body: "以 100 × 100 × 40 mm 为试件尺寸、约 20% 为目标填充率，用体积与骨架长度估算杆件半径，并在实体模型中复核。让拓扑比较有共同的尺寸基础。",
      },
      {
        title: "把材料差异留在结果旁",
        body: "在顶面 500 N、底面固定的工况下比较 TPU 蜂巢与 Voronoi，并将聚氨酯泡沫作为材料参照。泡沫与晶格使用不同材料，结果差异不能只归因于拓扑。",
      },
      {
        title: "用样件检查制造表达",
        body: "将数字几何转化为打印样件，观察杆件、孔隙和连接。样件用于补充几何与制造观察；结构性能仍需实体压缩实验与材料测试校准。",
      },
    ],
    outcomeTitle: "完成几何、样件与方案对比。",
    reflectionTitle: "材料测试、网格收敛与实体压缩尚待完成。",
  },
  tower: {
    takeaway: "用同一套参数规则生成四角与八角鼓楼构架。",
    contribution:
      "负责建筑特征梳理、规则提取与 Rhino / Grasshopper 参数化建模。",
    evidence:
      "已形成从柱网、层级骨架到构件实体的生成过程，并展示不同平面配置及构架爆炸图。",
    evidenceTarget: "parametric-system",
    evidenceLabel: "查看生成过程",
    scope:
      "当前研究覆盖整体形态和主要构架。榫卯、斗拱与屋面细节尚未完整建模；网页模型是参数关系的简化演示。",
    problemTitle: "怎样让建筑关系随参数一起变化？",
    decisionTitle: "把整体形态拆成相互依赖的规则。",
    decisions: [
      {
        title: "先生成柱网，再建立上部结构",
        body: "以中心点、平面边数、控制半径和柱间距建立底层参照。四角与八角配置沿用后续生成逻辑，便于比较同一规则在不同平面条件下的输出。",
      },
      {
        title: "让层级与收分共同决定轮廓",
        body: "将总体高度、檐层数量与逐层缩放组织成竖向序列。各层构架依据标高和缩放关系生成，使形态变化可以追溯到控制参数。",
      },
      {
        title: "保留骨架到实体的中间过程",
        body: "先建立柱网和结构线，再生成柱体、梁枋与顶部结构。用分解图展示中间结果，方便检查构件来源和层级关系。",
      },
    ],
    outcomeTitle: "从参数构架到材质表达。",
    reflectionTitle: "榫卯细节与地方尺寸尚待校准。",
  },
  architecture: {
    takeaway: "让自然语言成为设计入口，让地方建筑知识成为生成的约束。",
    contribution:
      "独立完成规则库整理、结构化 JSON 接口、Grasshopper 参数化模型与方案比较界面。",
    evidence:
      "已从一句场地描述推导出 660 个构件的完整院落民居，并在同一空间语法下生成九个可比较方案。",
    evidenceTarget: "anatomy",
    evidenceLabel: "查看四层构造",
    scope:
      "模型覆盖台基、墙体洞口、木构架与屋面四层，依据现场记录与文献整理。榫卯做法、砖砌砌筑方式与排水构造尚未建模；网页展示的是研究原型，不是可交付的施工图。",
    problemTitle: "怎样让建筑关系随参数一起变化？",
    decisionTitle: "把院落民居拆成四层可以核对的规则。",
    decisions: [
      {
        title: "先固定语法，再放开参数",
        body: "面宽、排数与进深不是自由输入，而是三组有区间约束的参数。约束保证每一种组合都能生成结构完整的院落，而不是生成一个看起来像民居的形状。",
      },
      {
        title: "四层构造各自可查",
        body: "台基与院落、墙体与洞口、木构架、屋面分别记录构件数量与生成条件。任何一层都能单独拆开检查来源，而不是只能接受整栋模型。",
      },
      {
        title: "方案必须能并排比较",
        body: "界面把变体放在右侧，用同一套指标比较卧室数量、进深、柱网、院落数、建筑面积与屋顶面积。没有比较，生成就只是抽签。",
      },
    ],
    outcomeTitle: "同一套语法下的九个方案。",
    reflectionTitle: "规则是否正确，仍需一手样本验证。",
  },
};
