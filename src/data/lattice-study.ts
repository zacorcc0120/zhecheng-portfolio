// Source: supplied course manuscript and ANSYS images, not live simulation.
// Cloud images use Pa and m. Values below use MPa and mm.
export const latticeImage = (name: string) =>
  `/images/projects/lattice/${name}.webp`;
export const specimenResults = [
  {
    id: "honeycomb",
    label: "Honeycomb",
    chinese: "蜂巢晶格",
    material: "TPU",
    modulus: "200 MPa",
    density: "1280 kg/m³",
    poisson: "0.4",
    stress: 0.46314,
    deformation: 0.054024,
    stressOriginal: "4.6314e5 Pa",
    deformationOriginal: "5.4024e−5 m",
    note: "本次工况下总变形较小，可作为支撑结构的研究起点。",
  },
  {
    id: "voronoi",
    label: "Voronoi",
    chinese: "Voronoi 晶格",
    material: "TPU",
    modulus: "200 MPa",
    density: "1280 kg/m³",
    poisson: "0.4",
    stress: 7.6756,
    deformation: 0.9153,
    stressOriginal: "7.6756e6 Pa",
    deformationOriginal: "0.0009153 m",
    note: "在相同 TPU 材料设定下变形更大，局部节点出现应力集中。",
  },
  {
    id: "foam",
    label: "PU foam",
    chinese: "聚氨酯慢回弹泡沫",
    material: "PU foam",
    modulus: "0.12 MPa",
    density: "80 kg/m³",
    poisson: "0.3",
    stress: 0.23072,
    deformation: 20.499,
    stressOriginal: "2.3072e5 Pa",
    deformationOriginal: "0.020499 m",
    note: "泡沫与晶格采用不同材料，不能将差异完全归因于几何拓扑。",
  },
] as const;
export type SpecimenId = (typeof specimenResults)[number]["id"];
export const seatResults = [
  {
    id: "original",
    label: "原始坐垫",
    stress: 8.72,
    deformation: 10.83,
    image: "seat-original-stress",
  },
  {
    id: "a",
    label: "渐变镂空 A",
    stress: 7.29,
    deformation: 9.53,
    image: "seat-a-stress",
  },
  {
    id: "b",
    label: "渐变镂空 B",
    stress: 7.43,
    deformation: 9.53,
    image: "seat-b-stress",
  },
] as const;
export const modelingImages = [
  {
    image: "honeycomb-model",
    title: "Honeycomb",
    caption: "规则单元与连续支撑路径",
  },
  { image: "kelvin-model", title: "Kelvin cell", caption: "晶胞几何探索" },
  {
    image: "voronoi-model",
    title: "Voronoi",
    caption: "空间种子点与非均匀杆网",
  },
  {
    image: "minimal-surface",
    title: "Minimal surface",
    caption: "极小曲面形态探索",
  },
];
