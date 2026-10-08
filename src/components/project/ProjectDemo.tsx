"use client";
import dynamic from "next/dynamic";
import type { ProjectKind } from "@/data/projects";
const ArchitectureDemo = dynamic(() => import("./demos/ArchitectureDemo"), {
  loading: () => <p className="case-note">Loading workflow…</p>,
});
const LatticeDemo = dynamic(() => import("./demos/LatticeDemo"), {
  loading: () => <p className="case-note">Loading lattice explorer…</p>,
});
const DrumTowerDemo = dynamic(() => import("./demos/DrumTowerDemo"), {
  loading: () => <p className="case-note">Loading parameter study…</p>,
});
const RecoveryDashboard = dynamic(
  () => import("@/components/charts/RecoveryDashboard"),
  { loading: () => <p className="case-note">Loading dashboard…</p> },
);
const JikoDemo = dynamic(() => import("./demos/JikoDemo"), {
  loading: () => <p className="case-note">Loading JIKO product study…</p>,
});
export function ProjectDemo({ kind }: { kind: ProjectKind }) {
  switch (kind) {
    case "architecture":
      return <ArchitectureDemo />;
    case "lattice":
      return <LatticeDemo />;
    case "tower":
      return <DrumTowerDemo />;
    case "recovery":
      return <RecoveryDashboard />;
    case "jiko":
      return <JikoDemo />;
  }
}
