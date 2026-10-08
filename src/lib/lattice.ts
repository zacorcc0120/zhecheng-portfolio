export type Vec3 = [number, number, number];
export type Edge = [Vec3, Vec3];
export type LatticeType = "octet" | "kelvin" | "honeycomb" | "voronoi";
export interface LatticeParameters {
  cellSize: number;
  strutDiameter: number;
  density: number;
  type: LatticeType;
}
export const defaultLattice: LatticeParameters = {
  cellSize: 1,
  strutDiameter: 0.075,
  density: 3,
  type: "octet",
};
const distance = (a: Vec3, b: Vec3) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Bounded deterministic illustrative geometry. Density controls cell repetition,
// not measured relative material density. ANSYS values are not computed here.
export function buildLattice(params: LatticeParameters): Edge[] {
  const n = Math.max(2, Math.min(4, Math.round(params.density)));
  const s = Math.max(0.65, Math.min(1.5, params.cellSize));
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const add = (a: Vec3, b: Vec3) => {
    if (distance(a, b) < 0.0001) return;
    const key = [
      a.map((v) => v.toFixed(4)).join(","),
      b.map((v) => v.toFixed(4)).join(","),
    ]
      .sort()
      .join("/");
    if (!seen.has(key)) {
      seen.add(key);
      edges.push([a, b]);
    }
  };
  const translated = (
    p: Vec3,
    x: number,
    y: number,
    z: number,
    spacing = 1,
  ): Vec3 => [
    (p[0] + (x - (n - 1) / 2) * spacing) * s,
    (p[1] + (y - (n - 1) / 2) * spacing) * s,
    (p[2] + (z - (n - 1) / 2) * spacing) * s,
  ];
  if (params.type === "octet") {
    const corners: Vec3[] = [];
    for (const x of [-0.5, 0.5])
      for (const y of [-0.5, 0.5])
        for (const z of [-0.5, 0.5]) corners.push([x, y, z]);
    const faces: Vec3[] = [
      [0.5, 0, 0],
      [-0.5, 0, 0],
      [0, 0.5, 0],
      [0, -0.5, 0],
      [0, 0, 0.5],
      [0, 0, -0.5],
    ];
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++)
        for (let z = 0; z < n; z++) {
          const connect = (a: Vec3, b: Vec3) =>
            add(translated(a, x, y, z), translated(b, x, y, z));
          faces.forEach((face) =>
            corners.forEach((corner) => {
              if (Math.abs(distance(face, corner) - Math.SQRT1_2) < 0.001)
                connect(face, corner);
            }),
          );
          faces.forEach((a, i) =>
            faces.slice(i + 1).forEach((b) => {
              if (Math.abs(distance(a, b) - Math.SQRT1_2) < 0.001)
                connect(a, b);
            }),
          );
        }
  } else if (params.type === "kelvin") {
    const vertices: Vec3[] = [];
    for (let zero = 0; zero < 3; zero++)
      for (const order of [false, true])
        for (const a of [-1, 1])
          for (const b of [-1, 1]) {
            const p: Vec3 = [0, 0, 0];
            const ids = [0, 1, 2].filter((i) => i !== zero);
            p[ids[0]] = (a * (order ? 2 : 1)) / 4;
            p[ids[1]] = (b * (order ? 1 : 2)) / 4;
            vertices.push(p);
          }
    // Truncated octahedra on a body-centred cubic lattice share square/hex faces.
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++)
        for (let z = 0; z < n; z++)
          for (const offset of [0, 0.5]) {
            if (offset && (x === n - 1 || y === n - 1 || z === n - 1)) continue;
            vertices.forEach((a, i) =>
              vertices.slice(i + 1).forEach((b) => {
                if (Math.abs(distance(a, b) - Math.SQRT2 / 4) < 0.001)
                  add(
                    translated(a, x + offset, y + offset, z + offset),
                    translated(b, x + offset, y + offset, z + offset),
                  );
              }),
            );
          }
  } else if (params.type === "honeycomb") {
    const radius = 0.56;
    const depth = Math.max(1, n * 0.6);
    for (let col = 0; col < n; col++)
      for (let row = 0; row < n; row++) {
        const cx = (col - (n - 1) / 2) * 1.5 * radius;
        const cy =
          (row - (n - 1) / 2) * Math.sqrt(3) * radius +
          ((col % 2) * Math.sqrt(3) * radius) / 2;
        const p = (i: number, z: number): Vec3 => [
          (cx + Math.cos((i * Math.PI) / 3) * radius) * s,
          (cy + Math.sin((i * Math.PI) / 3) * radius) * s,
          z * s,
        ];
        for (let i = 0; i < 6; i++) {
          add(p(i, -depth / 2), p((i + 1) % 6, -depth / 2));
          add(p(i, depth / 2), p((i + 1) % 6, depth / 2));
          add(p(i, -depth / 2), p(i, depth / 2));
        }
      }
  } else {
    // Voronoi-inspired irregular edge graph; explicitly not a Voronoi solver.
    const hash = (i: number) => (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;
    const point = (x: number, y: number, z: number): Vec3 => [
      (x - n / 2 + hash(x * 91 + y * 13 + z) * 0.24) * s,
      (y - n / 2 + hash(x * 33 + y * 27 + z + 4) * 0.24) * s,
      (z - n / 2 + hash(x * 51 + y * 11 + z + 9) * 0.24) * s,
    ];
    for (let x = 0; x <= n; x++)
      for (let y = 0; y <= n; y++)
        for (let z = 0; z <= n; z++) {
          const a = point(x, y, z);
          if (x < n) add(a, point(x + 1, y, z));
          if (y < n) add(a, point(x, y + 1, z));
          if (z < n) add(a, point(x, y, z + 1));
          if (x < n && y < n && z < n && (x + y + z) % 2 === 0)
            add(a, point(x + 1, y + 1, z + 1));
        }
  }
  return edges;
}
