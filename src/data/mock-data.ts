// ALL numbers in this file are fictional demonstration data.
// Replace with original ANSYS exports / anonymized RecoveryX records.
export const MOCK_DATA_NOTICE = "演示数据 / 非真实实验或用户结果";
export type CompressionDirection = "x" | "z";
export const simulationData = {
  x: {
    maxStress: 18.4,
    displacement: 0.34,
    equivalentStress: 14.2,
    points: [
      { x: 0, y: 0 },
      { x: 0.05, y: 18 },
      { x: 0.1, y: 32 },
      { x: 0.15, y: 47 },
      { x: 0.2, y: 61 },
      { x: 0.25, y: 77 },
      { x: 0.3, y: 92 },
      { x: 0.34, y: 100 },
    ],
  },
  z: {
    maxStress: 12.7,
    displacement: 0.22,
    equivalentStress: 9.8,
    points: [
      { x: 0, y: 0 },
      { x: 0.03, y: 14 },
      { x: 0.06, y: 28 },
      { x: 0.09, y: 43 },
      { x: 0.12, y: 59 },
      { x: 0.15, y: 75 },
      { x: 0.18, y: 89 },
      { x: 0.22, y: 100 },
    ],
  },
};
export const exercises = [
  { id: "bench", label: "Bench Press", chinese: "卧推", base: 50, gain: 2.5 },
  {
    id: "pulldown",
    label: "Lat Pulldown",
    chinese: "高位下拉",
    base: 42,
    gain: 3.5,
  },
  { id: "legpress", label: "Leg Press", chinese: "腿举", base: 100, gain: 10 },
] as const;
export type Exercise = (typeof exercises)[number]["id"];
export type TimeRange = "7D" | "30D" | "90D" | "ALL";
export interface TrainingRecord {
  date: string;
  weight: number;
  reps: number;
  exercise: Exercise;
}
export const demoReferenceDate = "2026-09-01";
export const trainingRecords: TrainingRecord[] = exercises.flatMap((exercise) =>
  Array.from({ length: 52 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 4, 22 + i * 2)).toISOString().slice(0, 10),
    weight:
      Math.round(
        (exercise.base +
          Math.floor(i / 9) * exercise.gain +
          (i % 7 === 3 ? -exercise.gain / 2 : 0)) *
          10,
      ) / 10,
    reps: 8 + (i % 3),
    exercise: exercise.id,
  })),
);
export function filterTraining(
  exercise: Exercise,
  range: TimeRange,
): TrainingRecord[] {
  const end = Date.parse(`${demoReferenceDate}T23:59:59Z`);
  const days = range === "ALL" ? Infinity : Number.parseInt(range, 10);
  const start =
    range === "ALL"
      ? -Infinity
      : Date.parse(`${demoReferenceDate}T00:00:00Z`) - (days - 1) * 86400000;
  return trainingRecords.filter(
    (r) =>
      r.exercise === exercise &&
      Date.parse(`${r.date}T12:00:00Z`) >= start &&
      Date.parse(`${r.date}T12:00:00Z`) <= end,
  );
}
