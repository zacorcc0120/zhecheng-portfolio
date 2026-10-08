"use client";
import dynamic from "next/dynamic";
import { Component, useRef, useState, type ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import {
  RotateCcw,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useWebGL } from "@/hooks/useWebGL";
import {
  GeometryFallback,
  defaultPose,
  type CameraPose,
} from "./GeometryFallback";
import { modelAssets } from "@/data/model-assets";
import { TechnicalArt } from "@/components/project/TechnicalArt";
import type { SceneSpec, CameraAction, CameraCommand } from "./types";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => (
    <div className="viewer-fallback">
      <span className="caption">LOADING INTERACTIVE GEOMETRY…</span>
    </div>
  ),
});
class ViewerBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function ModelViewer({
  scene,
  children,
}: {
  scene: SceneSpec;
  children: ReactNode;
}) {
  const external =
    scene.kind === "lattice"
      ? modelAssets.lattice[scene.parameters.type]
      : modelAssets[scene.kind];
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "150px" });
  const loaded = useInView(ref, { once: true, margin: "200px" });
  const reduced = useReducedMotion();
  const webgl = useWebGL(loaded);
  const [pose, setPose] = useState<CameraPose>(defaultPose);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [command, setCommand] = useState<CameraCommand>({
    action: "reset",
    sequence: 0,
  });
  const send = (action: CameraAction) => {
    setCommand((previous) => ({ action, sequence: previous.sequence + 1 }));
    setPose((previous) => {
      switch (action) {
        case "left":
          return { ...previous, yaw: previous.yaw - 0.25 };
        case "right":
          return { ...previous, yaw: previous.yaw + 0.25 };
        case "up":
          return { ...previous, pitch: Math.min(1.3, previous.pitch + 0.15) };
        case "down":
          return { ...previous, pitch: Math.max(-0.3, previous.pitch - 0.15) };
        case "in":
          return { ...previous, zoom: Math.min(2, previous.zoom * 1.15) };
        case "out":
          return { ...previous, zoom: Math.max(0.45, previous.zoom / 1.15) };
        default:
          return defaultPose;
      }
    });
  };
  const fallback = <GeometryFallback scene={scene} pose={pose} />;
  return (
    <div className="viewer-layout" ref={ref}>
      <div className="viewer-main">
        <div
          className="viewer-stage"
          role="region"
          aria-label={`${scene.kind} interactive 3D viewer`}
          tabIndex={0}
          onPointerDown={(event) => {
            if (webgl === false && event.pointerType === "mouse") {
              pointer.current = { x: event.clientX, y: event.clientY };
              event.currentTarget.setPointerCapture(event.pointerId);
            }
          }}
          onPointerMove={(event) => {
            if (!pointer.current || webgl !== false) return;
            const dx = event.clientX - pointer.current.x,
              dy = event.clientY - pointer.current.y;
            pointer.current = { x: event.clientX, y: event.clientY };
            setPose((previous) => ({
              ...previous,
              yaw: previous.yaw + dx * 0.007,
              pitch: Math.max(-0.3, Math.min(1.3, previous.pitch + dy * 0.005)),
            }));
          }}
          onPointerUp={() => {
            pointer.current = null;
          }}
          onPointerCancel={() => {
            pointer.current = null;
          }}
          onKeyDown={(event) => {
            const map: Record<string, CameraAction> = {
              ArrowLeft: "left",
              ArrowRight: "right",
              ArrowUp: "up",
              ArrowDown: "down",
              "+": "in",
              "=": "in",
              "-": "out",
              Home: "reset",
            };
            if (map[event.key]) {
              event.preventDefault();
              send(map[event.key]);
            }
          }}
        >
          <span className="viewer-caption">
            {external
              ? "PROJECT GLB / DRAG TO ORBIT"
              : "PROCEDURAL MODEL / DRAG TO ORBIT"}
          </span>
          {loaded && webgl === true ? (
            <ViewerBoundary fallback={fallback}>
              <SceneCanvas
                scene={scene}
                autoRotate={autoRotate && !reduced && visible}
                active={visible}
                command={command}
              />
            </ViewerBoundary>
          ) : webgl === false ? (
            fallback
          ) : (
            <TechnicalArt kind={scene.kind} />
          )}
        </div>
        <div className="viewer-toolbar">
          <div className="viewer-actions">
            {[
              {
                action: "left" as const,
                label: "Rotate left",
                icon: ChevronLeft,
              },
              {
                action: "right" as const,
                label: "Rotate right",
                icon: ChevronRight,
              },
              { action: "up" as const, label: "Rotate up", icon: ChevronUp },
              {
                action: "down" as const,
                label: "Rotate down",
                icon: ChevronDown,
              },
              { action: "in" as const, label: "Zoom in", icon: Plus },
              { action: "out" as const, label: "Zoom out", icon: Minus },
              {
                action: "reset" as const,
                label: "Reset view",
                icon: RotateCcw,
              },
            ].map(({ action, label, icon: Icon }) => (
              <button
                type="button"
                key={action}
                aria-label={label}
                title={label}
                onClick={() => send(action)}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
          <label className="auto-rotate">
            <input
              type="checkbox"
              checked={autoRotate}
              disabled={!!reduced || webgl !== true}
              onChange={(event) => setAutoRotate(event.target.checked)}
            />
            AUTO ROTATE
          </label>
        </div>
      </div>
      <fieldset className="parameter-controls" disabled={!!external}>
        <legend className="sr-only">Geometry parameters</legend>
        {external && (
          <p className="demo-note">已加载真实 GLB；静态模型不响应参数控件。</p>
        )}
        {children}
      </fieldset>
    </div>
  );
}
