"use client";
import { useState } from "react";
import Image from "next/image";
import {
  latticeImage,
  specimenResults,
  type SpecimenId,
} from "@/data/lattice-study";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
export function LatticeResults() {
  const [selected, setSelected] = useState<SpecimenId>("honeycomb");
  const [metric, setMetric] = useState<"deformation" | "stress">("deformation");
  const result = specimenResults.find((r) => r.id === selected)!;
  const unit = metric === "deformation" ? "mm" : "MPa";
  const title = metric === "deformation" ? "最大总变形" : "最大等效应力";
  const max = Math.max(...specimenResults.map((r) => r[metric]));
  return (
    <div className="lattice-results">
      <span className="eyebrow">PERFORMANCE / STATIC STRUCTURAL</span>
      <p>
        在统一尺寸与 500 N 载荷下，对比蜂巢和 Voronoi
        的结构响应，并引入泡沫作为材料参照。
      </p>
      <div className="lattice-design-takeaway">
        <span className="eyebrow">DESIGN DECISION / 01</span>
        <h3>比较蜂巢、Voronoi 与泡沫的变形</h3>
        <p>
          蜂巢的小变形对应更强的支撑倾向；Voronoi
          更大的变形则为柔顺结构提供探索方向。将这一差异转化为坐垫的功能分区，是下一步设计的依据。
        </p>
      </div>
      <SegmentedControl
        label="查看仿真指标"
        options={[
          { value: "deformation", label: "总变形 / mm" },
          { value: "stress", label: "等效应力 / MPa" },
        ]}
        value={metric}
        onChange={setMetric}
      />
      <div
        className="lattice-bars"
        role="img"
        aria-label={`${title}对比：${specimenResults.map((r) => `${r.chinese} ${r[metric]} ${unit}`).join("；")}`}
      >
        {specimenResults.map((r) => (
          <div className="lattice-bar-row" key={r.id}>
            <span>{r.label}</span>
            <div className="lattice-track">
              <div style={{ width: `${(r[metric] / max) * 100}%` }} />
            </div>
            <strong>
              {r[metric]} <small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>

      <SegmentedControl
        label="选择试件查看云图"
        options={specimenResults.map((r) => ({
          value: r.id,
          label: r.label.toUpperCase(),
        }))}
        value={selected}
        onChange={setSelected}
      />
      <div className="lattice-pair lattice-result">
        <figure className="lattice-evidence">
          <a
            href={latticeImage(`${selected}-${metric}`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${result.chinese}${title}原始云图，新标签页打开`}
          >
            <div className="lattice-cloud">
              <Image
                src={latticeImage(`${selected}-${metric}`)}
                alt={`${result.chinese} ANSYS ${title}云图`}
                fill
                sizes="(max-width:900px) 100vw, 50vw"
              />
            </div>
          </a>
          <figcaption>
            {result.chinese} / {title}
            <span>VIEW IMAGE ↗</span>
          </figcaption>
        </figure>
        <div aria-live="polite">
          <h3>{result.chinese}</h3>
          <dl className="lattice-properties">
            {[
              ["材料", result.material],
              ["弹性模量", result.modulus],
              ["密度", result.density],
              ["泊松比", result.poisson],
              [
                "云图原值",
                metric === "stress"
                  ? result.stressOriginal
                  : result.deformationOriginal,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>{result.note}</p>
        </div>
      </div>
      <details className="lattice-details">
        <summary>METHOD & DATA / 工况与完整数据</summary>
        <p>
          试件 100 × 100 × 40 mm，底面固定，顶面竖直向下施加 500 N。蜂巢与
          Voronoi 使用 TPU，泡沫为不同材料对照。图表为统一线性尺度，数值来自离线
          ANSYS 分析，不随几何控件实时变化。
        </p>
        <div className="table-scroll">
          <table className="lattice-table">
            <caption>云图原值换算：Pa ÷ 10⁶ = MPa；m × 1000 = mm</caption>
            <thead>
              <tr>
                <th scope="col">结构</th>
                <th scope="col">材料</th>
                <th scope="col">等效应力 / MPa</th>
                <th scope="col">总变形 / mm</th>
              </tr>
            </thead>
            <tbody>
              {specimenResults.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.chinese}</th>
                  <td>{r.material}</td>
                  <td>{r.stress}</td>
                  <td>{r.deformation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="demo-note">
          泡沫变形相对试件高度较大，需进一步复核材料本构与大变形设置。仿真用于方案比较，实体表现需实验校准。
        </p>
      </details>
    </div>
  );
}
