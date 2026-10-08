import { RecoveryQuestionIndex } from "./RecoveryQuestionIndex";
import { ScoringDiagram } from "./ScoringDiagram";
import { FeedbackStates } from "./FeedbackStates";
import {
  disclaimer,
  override,
  riskRules,
  scoreBands,
  selectedQuestions,
  weights,
} from "@/data/recovery";

/**
 * CH 04 / INSIDE THE LOGIC
 *
 * 原来是五段从上到下的静态说明：问卷覆盖、六道题、权重、总分区间、
 * 安全覆盖。读下来像研究报告，因为每段都在讲一件事，读者要自己把五段
 * 拼成一条链路。
 *
 * 这里把链路本身做成界面：六道题既是一份可展开的索引，也是评分演示的
 * 输入；选了哪一题、选了哪个回答，权重在公式里起什么作用就直接显示出来；
 * 分数落到哪一档、以及安全信号能不能覆盖这个分数，是同一次决定的两条分支。
 */
export function RecoveryLogic() {
  return (
    <div className="recovery-logic">
      <div className="ra-subsection">
        <div className="ra-subsection-heading">
          <span>01 / QUESTION EXPLORER</span>
          <h3>用具体描述解释各档分值</h3>
          <p>
            完整系统包含 55 个输入项。这里选取几个关键问题，
            展示问题如何从日常语言转化为评分锚点、权重与风险规则。
          </p>
        </div>

        <RecoveryQuestionIndex items={selectedQuestions} />

        <div className="ra-weights">
          {weights.map((item) => (
            <div key={item.value}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="ra-subsection">
        <div className="ra-subsection-heading">
          <span>02 / SCORING DIAGRAM</span>
          <h3>权重在公式里到底做了什么</h3>
          <p>
            当前原型使用启发式权重区分核心指标与辅助指标，再统一换算到
            10–100 分。下面代入一道真实的题，看同一个回答在不同权重下变成多大的加权项。
          </p>
        </div>

        <ScoringDiagram questions={selectedQuestions} />
      </div>

      <div className="ra-subsection">
        <div className="ra-subsection-heading">
          <span>03 / SCORE → FEEDBACK</span>
          <h3>从分数区间到状态提示</h3>
          <p>
            得分本身不是最终输出。系统将连续分数映射为可理解的状态，
            并在训练前进一步转换为训练调整建议。
          </p>
        </div>

        <FeedbackStates bands={scoreBands} override={override} />

        <div className="ra-risk-notes">
          {riskRules.map((rule) => (
            <article key={rule.code}>
              <span>{rule.code}</span>
              <p>{rule.body}</p>
            </article>
          ))}
        </div>
      </div>

      <p className="ra-disclaimer">{disclaimer}</p>
    </div>
  );
}