"use client";
import { useState } from "react";
import {
  defaultLattice,
  type LatticeParameters,
  type LatticeType,
} from "@/lib/lattice";
import { ModelViewer } from "@/components/three/ModelViewer";
import { RangeControl } from "@/components/ui/RangeControl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
export default function LatticeDemo() {
  const [parameters, setParameters] =
    useState<LatticeParameters>(defaultLattice);
  const update = (key: keyof LatticeParameters, value: number | string) =>
    setParameters((previous) => ({ ...previous, [key]: value }));
  return (
    <>
      <span className="mock-badge">SIMPLIFIED PROCEDURAL GEOMETRY</span>
      <div className="lattice-select">
        <SegmentedControl<LatticeType>
          label="Lattice topology"
          options={[
            { value: "octet", label: "OCTET" },
            { value: "kelvin", label: "KELVIN" },
            { value: "honeycomb", label: "HONEYCOMB" },
            { value: "voronoi", label: "VORONOI" },
          ]}
          value={parameters.type}
          onChange={(value) => update("type", value)}
        />
      </div>
      <ModelViewer scene={{ kind: "lattice", parameters }}>
        <RangeControl
          label="Cell size"
          value={parameters.cellSize}
          min={0.65}
          max={1.5}
          step={0.05}
          unit="×"
          onChange={(value) => update("cellSize", value)}
        />
        <RangeControl
          label="Strut diameter"
          value={parameters.strutDiameter}
          min={0.035}
          max={0.15}
          step={0.005}
          unit="u"
          onChange={(value) => update("strutDiameter", value)}
        />
        <RangeControl
          label="Density / repeats"
          value={parameters.density}
          min={2}
          max={4}
          unit="×"
          onChange={(value) => update("density", value)}
        />
        <button
          className="text-link"
          type="button"
          onClick={() =>
            setParameters({ ...defaultLattice, type: parameters.type })
          }
        >
          RESET PARAMETERS ↺
        </button>
      </ModelViewer>
      <p className="demo-note">
        拖动旋转，使用 + / − 缩放；键盘方向键调整视角，Home 复位。Density
        控制晶胞重复数量，u 为模型单位。
        {parameters.type === "voronoi"
          ? "当前 Voronoi 为确定性的非规则杆网示意，未实现 Voronoi 分区求解。"
          : "当前模型仅解释拓扑和参数关系，不作为可制造实体或有限元输入。"}
      </p>
    </>
  );
}
