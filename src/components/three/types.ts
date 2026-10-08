import type { ArchitectureParameters } from "@/lib/architecture";
import type { LatticeParameters } from "@/lib/lattice";
export interface TowerParameters {
  floorCount: number;
  roofScale: number;
  rotation: number;
  height: number;
}
export type SceneSpec =
  | { kind: "lattice"; parameters: LatticeParameters }
  | { kind: "architecture"; parameters: ArchitectureParameters }
  | { kind: "tower"; parameters: TowerParameters };
export type CameraAction =
  "left" | "right" | "up" | "down" | "in" | "out" | "reset";
export interface CameraCommand {
  action: CameraAction;
  sequence: number;
}
