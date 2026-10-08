"use client";

import { useState } from "react";

import { ModelViewer } from "@/components/three/ModelViewer";
import type { TowerParameters } from "@/components/three/types";
import { RangeControl } from "@/components/ui/RangeControl";

export default function DrumTowerDemo() {
  const [parameters, setParameters] = useState<TowerParameters>({
    floorCount: 7,
    roofScale: 1,
    rotation: 0,
    height: 9,
  });

  const update = (key: keyof TowerParameters, value: number) =>
    setParameters((previous) => ({ ...previous, [key]: value }));

  return (
    <>
      <p className="demo-note">
        先调整层数，再改变高度或屋檐尺度，观察轮廓如何响应。旋转参数用于几何探索；上方的构架图展示实际
        Grasshopper 模型。
      </p>
      <div className="architecture-result-label">
        <span className="eyebrow">PARAMETRIC MASSING STUDY</span>
        <span className="caption">LIVE GEOMETRY</span>
      </div>

      <ModelViewer scene={{ kind: "tower", parameters }}>
        <RangeControl
          label="Floor count"
          value={parameters.floorCount}
          min={3}
          max={11}
          onChange={(value) => update("floorCount", value)}
        />
        <RangeControl
          label="Roof scale"
          value={parameters.roofScale}
          min={0.6}
          max={1.4}
          step={0.05}
          unit="×"
          onChange={(value) => update("roofScale", value)}
        />
        <RangeControl
          label="Rotation / tier"
          value={parameters.rotation}
          min={0}
          max={30}
          step={1}
          unit="°"
          onChange={(value) => update("rotation", value)}
        />
        <RangeControl
          label="Height"
          value={parameters.height}
          min={6}
          max={12}
          step={0.5}
          unit="u"
          onChange={(value) => update("height", value)}
        />
      </ModelViewer>

      <p className="demo-note">
        该交互模型用于展示层数、尺度、旋转与高度变化如何影响整体鼓楼轮廓，
        是对参数逻辑的抽象表达，不对应真实鼓楼的全部构造细节。
      </p>
    </>
  );
}
