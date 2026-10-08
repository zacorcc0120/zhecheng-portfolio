"use client";
import { useState } from "react";
import {
  exercises,
  filterTraining,
  demoReferenceDate,
  MOCK_DATA_NOTICE,
  type Exercise,
  type TimeRange,
} from "@/data/mock-data";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LineChart } from "./LineChart";
export default function RecoveryDashboard() {
  const [exercise, setExercise] = useState<Exercise>("bench");
  const [range, setRange] = useState<TimeRange>("30D");
  const records = filterTraining(exercise, range);
  const first = records[0];
  const latest = records.at(-1);
  const change = first && latest ? latest.weight - first.weight : 0;
  const definition = exercises.find((e) => e.id === exercise)!;
  return (
    <>
      <div className="dashboard">
        <div className="dashboard-header">
          <span className="dashboard-brand">RECOVERYX</span>
          <span className="mock-badge">DEMO ACCOUNT</span>
        </div>
        <div className="dashboard-body">
          <div className="dashboard-intro">
            <div>
              <h3>Every session tells a story.</h3>
              <p>
                训练历史 / {definition.chinese} · 截至 {demoReferenceDate}
              </p>
            </div>
            <span className="caption">PROGRESS / OVERVIEW</span>
          </div>
          <div className="dashboard-filters">
            <SegmentedControl
              label="Exercise"
              options={exercises.map((e) => ({ value: e.id, label: e.label }))}
              value={exercise}
              onChange={setExercise}
            />
            <SegmentedControl
              label="Time range"
              options={(["7D", "30D", "90D", "ALL"] as TimeRange[]).map(
                (value) => ({ value, label: value }),
              )}
              value={range}
              onChange={setRange}
            />
          </div>
          <dl className="metric-grid" aria-live="polite">
            <div>
              <dt>Latest working weight</dt>
              <dd>
                {latest?.weight ?? "—"}
                <small>kg</small>
              </dd>
            </div>
            <div>
              <dt>Change in this period</dt>
              <dd>
                {change >= 0 ? "+" : ""}
                {Number(change.toFixed(1))}
                <small>kg</small>
              </dd>
            </div>
            <div>
              <dt>Logged sessions</dt>
              <dd>
                {records.length}
                <small>sessions</small>
              </dd>
            </div>
          </dl>
          <div className="chart-frame">
            <div className="chart-heading">
              <span className="eyebrow">
                {definition.label.toUpperCase()} / WORKING WEIGHT
              </span>
              <span className="caption">{range} VIEW</span>
            </div>
            <LineChart
              points={records.map((r) => ({
                x: Date.parse(`${r.date}T12:00:00Z`),
                y: r.weight,
                label: r.date.slice(5).replace("-", "/"),
              }))}
              label={`${definition.label} mock working weight over ${range}`}
              xLabel="SESSION DATE"
              yLabel="WEIGHT (kg)"
              formatY={(v) => v.toFixed(0)}
            />
          </div>
          <details className="data-table-details">
            <summary>View training records / 查看训练记录</summary>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  {definition.label} demo training records
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Working weight (kg)</th>
                    <th scope="col">Repetitions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.date}>
                      <td>{record.date}</td>
                      <td>{record.weight}</td>
                      <td>{record.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
      <p className="demo-note">
        {MOCK_DATA_NOTICE}。时间筛选以固定演示日期为基准；指标为训练工作重量，非
        1RM。纵轴按数据范围显示，以便阅读变化。
      </p>
      <div className="tower-rule-strip">
        <div>
          <strong>01 / Assessment</strong>
          <p>身体评估与初始指标构成报告起点。</p>
        </div>
        <div>
          <strong>02 / Records</strong>
          <p>以动作、时间、重量和次数形成可回溯的记录。</p>
        </div>
        <div>
          <strong>03 / Progress</strong>
          <p>在同一动作和时间范围内比较变化。</p>
        </div>
        <div>
          <strong>04 / Report</strong>
          <p>组织评测与训练趋势，保留数据来源与上下文。</p>
        </div>
      </div>
    </>
  );
}
