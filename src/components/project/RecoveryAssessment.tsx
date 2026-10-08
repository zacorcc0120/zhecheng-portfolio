import { AssessmentTimeline } from "./AssessmentTimeline";
import { dimensions, stages } from "@/data/recovery";

/**
 * CH 03 / THE ASSESSMENT SYSTEM
 *
 * 三个阶段不再是三张等权重的矩形卡片。晨起、训练前、训练后其实是同一个
 * 人一天的三个时刻，所以这里给的是一条可以点选的时间轨道：选一个时刻，
 * 真实的问卷界面和这个时刻真实包含的题号一起过来。
 */
export function RecoveryAssessment() {
  return (
    <div className="recovery-assessment">
      <AssessmentTimeline stages={stages} />

      <div className="ra-subsection">
        <div className="ra-subsection-heading">
          <span>QUESTION COVERAGE</span>
          <h3>问卷覆盖哪些状态</h3>
          <p>
            单一指标很难描述训练状态，因此评估同时观察恢复、动作表现、
            心理准备与风险信号。不同阶段的问题并非重复，而是在不同时间点回答不同的问题。
          </p>
        </div>

        <div className="ra-dimensions">
          {dimensions.map((item) => (
            <article key={item.index}>
              <span>{item.index}</span>
              <h4>{item.title}</h4>
              <strong>{item.chinese}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}