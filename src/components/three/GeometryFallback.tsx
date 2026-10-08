"use client";
import { useMemo } from "react";
import { buildLattice, type Edge, type Vec3 } from "@/lib/lattice";
import type { SceneSpec } from "./types";
export interface CameraPose {
  yaw: number;
  pitch: number;
  zoom: number;
}
export const defaultPose: CameraPose = { yaw: 0.65, pitch: 0.43, zoom: 1 };

function buildEdges(scene: SceneSpec): Edge[] {
  if (scene.kind === "lattice") return buildLattice(scene.parameters);
  const edges: Edge[] = [];
  const line = (a: Vec3, b: Vec3) => edges.push([a, b]);
  if (scene.kind === "tower") {
    const p = scene.parameters;
    const step = (p.height * 0.52) / p.floorCount;
    for (let i = 0; i < p.floorCount; i++) {
      const r = (2 - (i / p.floorCount) * 1.2) * p.roofScale,
        y = (i - p.floorCount / 2) * step,
        a = (i * p.rotation * Math.PI) / 180;
      const point = (j: number, radius: number, h: number): Vec3 => [
        Math.cos((j * Math.PI) / 4 + a) * radius,
        h,
        Math.sin((j * Math.PI) / 4 + a) * radius,
      ];
      for (let j = 0; j < 8; j++) {
        line(point(j, r, y), point(j + 1, r, y));
        line(point(j, r, y), point(j, r * 0.5, y + 0.38));
        line(point(j, r * 0.5, y + 0.38), point(j + 1, r * 0.5, y + 0.38));
        line(point(j, r * 0.45, y), point(j, r * 0.45, y - step));
      }
    }
  } else {
    const p = scene.parameters,
      width = p.bay * 0.78 + 0.35,
      step = p.courtyard ? 1.65 + (p.courtyardSize - 1) * 0.19 : 1.02;
    const box = (cx: number, cz: number, w: number, d: number) => {
      const a: Vec3[] = [
        [cx - w / 2, -1, cz - d / 2],
        [cx + w / 2, -1, cz - d / 2],
        [cx + w / 2, -1, cz + d / 2],
        [cx - w / 2, -1, cz + d / 2],
      ];
      const b = a.map(([x, y, z]) => [x, y + 0.85, z] as Vec3);
      const roof: Vec3[] = [
        [cx - w / 2, -0.15 + (p.roofHeight - 2.2) * 0.25, cz],
        [cx + w / 2, -0.15 + (p.roofHeight - 2.2) * 0.25, cz],
      ];
      for (let i = 0; i < 4; i++) {
        line(a[i], a[(i + 1) % 4]);
        line(a[i], b[i]);
        line(b[i], b[(i + 1) % 4]);
        line(b[i], roof[i === 0 || i === 3 ? 0 : 1]);
      }
      line(roof[0], roof[1]);
    };
    for (let i = 0; i <= p.depth; i++)
      box(0, (i - p.depth / 2) * step, width, 0.9);
    if (p.courtyard)
      for (let i = 0; i < p.depth; i++)
        for (const side of [-1, 1])
          box(
            side * (width / 2 - 0.29),
            (i + 0.5 - p.depth / 2) * step,
            0.6,
            step - 0.8,
          );
    if (p.screenWall) box(0, (-p.depth * step) / 2 - 0.82, width * 0.45, 0.1);
  }
  return edges;
}

export function GeometryFallback({
  scene,
  pose,
}: {
  scene: SceneSpec;
  pose: CameraPose;
}) {
  const edges = useMemo(() => buildEdges(scene), [scene]);
  const project = ([x, y, z]: Vec3) => {
    const px = x * Math.cos(pose.yaw) - z * Math.sin(pose.yaw);
    const depth = x * Math.sin(pose.yaw) + z * Math.cos(pose.yaw);
    return [
      320 + px * 50 * pose.zoom,
      220 +
        (-y * Math.cos(pose.pitch) + depth * Math.sin(pose.pitch)) *
          50 *
          pose.zoom,
    ];
  };
  const d = edges
    .map(
      ([a, b]) =>
        `M${project(a)
          .map((v) => v.toFixed(1))
          .join(",")}L${project(b)
          .map((v) => v.toFixed(1))
          .join(",")}`,
    )
    .join(" ");
  return (
    <div className="viewer-fallback">
      <svg
        viewBox="0 0 640 440"
        width="100%"
        height="100%"
        role="img"
        aria-label="Interactive projected geometry, WebGL fallback"
      >
        <path d="M25 350H615M320 20V400" stroke="#bbc1b0" strokeWidth=".6" />
        <path
          d={d}
          fill="none"
          stroke="#455237"
          strokeWidth={
            scene.kind === "lattice" ? scene.parameters.strutDiameter * 12 : 1.3
          }
          strokeLinejoin="round"
          opacity=".85"
        />
      </svg>
      <span className="caption">
        WebGL 不可用 · 几何投影模式 · 参数与视角仍可调整
      </span>
    </div>
  );
}
