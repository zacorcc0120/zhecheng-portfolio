"use client";
import { useState } from "react";
import {
  simulationData,
  MOCK_DATA_NOTICE,
  type CompressionDirection,
} from "@/data/mock-data";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LineChart } from "./LineChart";
export function SimulationChart() {
  const [direction, setDirection] = useState<CompressionDirection>("x");
  const data = simulationData[direction];
  return (
    <div id="simulation">
      <div className="chart-heading">
        <h3 style={{ fontSize: 28, letterSpacing: "-.04em" }}>
          Reading the response.
        </h3>
        <span className="mock-badge">MOCK DATA</span>
      </div>
      <p className="demo-note" style={{ marginBottom: 22 }}>
        固定示例试件的载荷响应。此数据独立于上方几何控件，调参不会触发或模拟
        ANSYS 求解。
      </p>
      <SegmentedControl
        label="Compression direction"
        options={[
          { value: "x", label: "X COMPRESSION" },
          { value: "z", label: "Z COMPRESSION" },
        ]}
        value={direction}
        onChange={setDirection}
      />
      <dl className="metric-grid">
        <div>
          <dt>Maximum stress</dt>
          <dd>
            {data.maxStress}
            <small>MPa</small>
          </dd>
        </div>
        <div>
          <dt>Displacement</dt>
          <dd>
            {data.displacement}
            <small>mm</small>
          </dd>
        </div>
        <div>
          <dt>Equivalent stress</dt>
          <dd>
            {data.equivalentStress}
            <small>MPa</small>
          </dd>
        </div>
      </dl>
      <div className="chart-frame">
        <div className="chart-heading">
          <span className="eyebrow">
            LOAD–DISPLACEMENT / {direction.toUpperCase()}
          </span>
          <span className="caption">ILLUSTRATIVE RESPONSE</span>
        </div>
        <LineChart
          points={data.points}
          label={`${direction.toUpperCase()} compression mock load-displacement curve`}
          xLabel="DISPLACEMENT (mm)"
          yLabel="LOAD (N)"
          formatX={(v) => v.toFixed(2)}
          formatY={(v) => v.toFixed(0)}
          zeroBaseline
        />
      </div>
      <details className="data-table-details">
        <summary>View example data / 查看演示数据</summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              {direction.toUpperCase()} compression mock observations
            </caption>
            <thead>
              <tr>
                <th scope="col">Displacement (mm)</th>
                <th scope="col">Load (N)</th>
              </tr>
            </thead>
            <tbody>
              {data.points.map((point) => (
                <tr key={point.x}>
                  <td>{point.x.toFixed(2)}</td>
                  <td>{point.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="demo-note">
        {MOCK_DATA_NOTICE}。Maximum stress 表示演示最大主应力，Equivalent stress
        表示演示 von Mises 应力；真实定义、材料与边界条件待原始数据补充。
      </p>
    </div>
  );
}
