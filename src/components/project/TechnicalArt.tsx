import type { ProjectKind } from "@/data/projects";

type Point = [number, number, number];
const project = ([x, y, z]: Point): [number, number] => [
  400 + (x - z) * 31,
  300 + (x + z) * 14 - y * 36,
];
const path = (points: Point[]) =>
  points
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${project(p)
          .map((n) => n.toFixed(2))
          .join(",")}`,
    )
    .join(" ");

function WireGeometry({ kind }: { kind: ProjectKind }) {
  const lines: { points: Point[]; weight?: number }[] = [];
  if (kind === "lattice") {
    const rings = 19;
    const sides = 22;
    const point = (r: number, s: number): Point => {
      const t = (s / sides) * Math.PI * 2 + r * 0.085;
      const radius = 2.4 + Math.pow((r - 9) / 9, 2) * 1.4;
      return [Math.cos(t) * radius, (r - 9) * 0.48, Math.sin(t) * radius];
    };
    for (let r = 0; r < rings; r++)
      for (let s = 0; s < sides; s++) {
        lines.push({ points: [point(r, s), point(r, (s + 1) % sides)] });
        if (r < rings - 1) {
          lines.push({ points: [point(r, s), point(r + 1, s)] });
          lines.push({ points: [point(r, s), point(r + 1, (s + 1) % sides)] });
        }
      }
  } else if (kind === "tower") {
    for (let level = 0; level < 8; level++) {
      const radius = 3.6 - level * 0.34;
      const y = level * 0.95 - 3.3;
      const ring: Point[] = [];
      for (let s = 0; s <= 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        ring.push([Math.cos(a) * radius, y, Math.sin(a) * radius]);
      }
      lines.push({ points: ring, weight: 1.4 });
      ring.slice(0, 8).forEach((p) => {
        lines.push({ points: [p, [p[0] * 0.54, y + 0.72, p[2] * 0.54]] });
        lines.push({ points: [p, [p[0] * 0.9, y - 0.2, p[2] * 0.9]] });
      });
    }
    lines.push({
      points: [
        [0, -4, 0],
        [0, 5, 0],
      ],
      weight: 0.7,
    });
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2;
      lines.push({
        points: [
          [Math.cos(a) * 2.2, -4, Math.sin(a) * 2.2],
          [Math.cos(a) * 2.2, -2.5, Math.sin(a) * 2.2],
        ],
      });
    }
  } else {
    const box = (cx: number, cz: number, w: number, d: number) => {
      const y = -1.5;
      const h = 1.6;
      const corners: Point[] = [
        [cx - w / 2, y, cz - d / 2],
        [cx + w / 2, y, cz - d / 2],
        [cx + w / 2, y, cz + d / 2],
        [cx - w / 2, y, cz + d / 2],
      ];
      lines.push({ points: [...corners, corners[0]], weight: 1.2 });
      const upper = corners.map(([x, yy, z]) => [x, yy + h, z] as Point);
      lines.push({ points: [...upper, upper[0]], weight: 1.2 });
      corners.forEach((p, i) => lines.push({ points: [p, upper[i]] }));
      const ridge: Point[] = [
        [cx - w * 0.55, y + h + 0.9, cz],
        [cx + w * 0.55, y + h + 0.9, cz],
      ];
      lines.push({ points: ridge, weight: 1.6 });
      upper.forEach((p, i) =>
        lines.push({
          points: [p, ridge[i === 0 || i === 3 ? 0 : 1]],
          weight: 1.3,
        }),
      );
      for (let n = 0; n < 7; n++) {
        const x = cx - w / 2 + (w * n) / 6;
        lines.push({
          points: [
            [x, y + h, cz - d / 2],
            [x, y + h + 0.9, cz],
            [x, y + h, cz + d / 2],
          ],
          weight: 0.5,
        });
      }
    };
    box(0, -3.9, 7.5, 2);
    box(0, 0, 7.5, 1.8);
    box(0, 4, 7.5, 2);
    box(-3.05, -2, 1.4, 1.8);
    box(3.05, -2, 1.4, 1.8);
    box(-3.05, 2, 1.4, 2.1);
    box(3.05, 2, 1.4, 2.1);
    for (let x = -5; x <= 5; x++)
      lines.push({
        points: [
          [x, -1.6, -5.5],
          [x, -1.6, 5.5],
        ],
        weight: 0.3,
      });
    for (let z = -5; z <= 5; z++)
      lines.push({
        points: [
          [-5, -1.6, z],
          [5, -1.6, z],
        ],
        weight: 0.3,
      });
  }
  return (
    <g stroke="currentColor" fill="none">
      {lines.map((line, i) => (
        <path
          key={i}
          d={path(line.points)}
          strokeWidth={line.weight || 0.65}
          opacity={kind === "lattice" ? 0.66 : 0.83}
        />
      ))}
    </g>
  );
}

export function TechnicalArt({
  kind,
  className = "",
}: {
  kind: ProjectKind;
  className?: string;
}) {
  if (kind === "recovery")
    return (
      <div
        className={`recovery-cover ${className}`}
        aria-label="RecoveryX 界面概念，演示数据"
      >
        <div className="recovery-cover-brand">
          RECOVERY<span>X</span>
        </div>
        <div className="recovery-preview">
          <div className="preview-header">
            <span>YOUR TRAINING, IN FOCUS.</span>
            <span>01 — 06</span>
          </div>
          <div className="preview-number">
            62.5<span>kg / BENCH PRESS</span>
          </div>
          <svg viewBox="0 0 600 160" role="img" aria-label="虚构的卧推训练趋势">
            <path
              d="M0 155H600M0 100H600M0 45H600"
              stroke="#dadad4"
              fill="none"
            />
            <path
              d="M0 132L60 130L120 108L180 112L240 80L300 86L360 62L420 69L480 35L540 41L600 14"
              stroke="#161713"
              fill="none"
              strokeWidth="3"
            />
          </svg>
          <div className="preview-footer">
            <span>ASSESS.</span>
            <span>TRACK.</span>
            <span>PROGRESS.</span>
          </div>
        </div>
        <span className="art-note">INTERFACE CONCEPT / DEMO DATA</span>
      </div>
    );
  return (
    <div className={`technical-art ${className}`}>
      <svg
        viewBox="0 0 800 600"
        role="img"
        aria-label={
          kind === "architecture"
            ? "院落空间关系的抽象轴测示意，非真实项目模型"
            : kind === "tower"
              ? "鼓楼屋顶层级的抽象参数化示意"
              : "程序化晶格拓扑研究示意"
        }
      >
        <g stroke="currentColor" opacity=".16" strokeWidth=".6">
          <path d="M40 300H760M400 40V560" />
          <path d="M40 40h20m-10-10v20M750 40h20m-10-10v20M40 560h20m-10-10v20M750 560h20m-10-10v20" />
        </g>
        <WireGeometry kind={kind} />
        <g
          fill="currentColor"
          opacity=".5"
          fontSize="10"
          fontFamily="monospace"
        >
          <text x="40" y="28">
            FIG. {kind === "lattice" ? "02" : kind === "tower" ? "03" : "01"} /
            COMPUTATIONAL STUDY
          </text>
          <text x="40" y="585">
            X
          </text>
          <text x="745" y="585">
            Y
          </text>
        </g>
      </svg>
      <span className="art-note">ABSTRACT GEOMETRY / SCHEMATIC ONLY</span>
    </div>
  );
}
