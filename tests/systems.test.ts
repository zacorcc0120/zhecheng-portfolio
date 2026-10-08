import { test } from "node:test";
import assert from "node:assert/strict";
import {
  architectureProvider,
  parseArchitecturePrompt,
} from "../src/lib/architecture";
import {
  buildLattice,
  defaultLattice,
  type LatticeType,
} from "../src/lib/lattice";
import {
  filterTraining,
  trainingRecords,
  type TimeRange,
} from "../src/data/mock-data";

test("Chinese/English requirements drive bounded, inspectable parameters", () => {
  const chinese = parseArchitecturePrompt(
    "生成一个两进院落、三开间、带天井和照壁的桂北传统民居。",
  );
  assert.equal(chinese.parameters.bay, 3);
  assert.equal(chinese.parameters.depth, 2);
  assert.equal(chinese.source, "demo");
  const english = parseArchitecturePrompt(
    "five bays, one courtyard, without a screen wall, roof height 5.2",
  );
  assert.equal(english.parameters.bay, 5);
  assert.equal(english.parameters.depth, 1);
  assert.equal(english.parameters.screenWall, false);
  assert.equal(english.parameters.roofHeight, 5.2);
  const bounded = parseArchitecturePrompt(
    "99开间，99进，没有天井，不带照壁，屋顶高度99",
  );
  assert.equal(bounded.parameters.bay, 5);
  assert.equal(bounded.parameters.depth, 3);
  assert.equal(bounded.parameters.courtyard, false);
  assert.equal(bounded.parameters.screenWall, false);
  assert.equal(bounded.parameters.roofHeight, 7);
  assert.ok(bounded.notes.length >= 4);
  assert.throws(() => parseArchitecturePrompt("   "));
  assert.throws(() => parseArchitecturePrompt("a".repeat(601)));
});
test("navigation cancellation aborts the asynchronous generation pipeline", async () => {
  const controller = new AbortController();
  const request = architectureProvider.generate("三开间两进", {
    signal: controller.signal,
  });
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
});
test("every topology has deterministic finite nondegenerate geometry within a render budget", () => {
  for (const type of [
    "octet",
    "kelvin",
    "honeycomb",
    "voronoi",
  ] as LatticeType[]) {
    const edges = buildLattice({ ...defaultLattice, type, density: 4 });
    assert.ok(edges.length > 30 && edges.length < 5000);
    assert.deepEqual(
      edges,
      buildLattice({ ...defaultLattice, type, density: 4 }),
    );
    for (const [a, b] of edges) {
      assert.ok([...a, ...b].every(Number.isFinite));
      assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 0.001);
    }
    assert.ok(
      buildLattice({ ...defaultLattice, type, density: 2 }).length <
        edges.length,
    );
  }
});
test("cell scale changes extents while topology remains stable", () => {
  const a = buildLattice({ ...defaultLattice, cellSize: 1 });
  const b = buildLattice({ ...defaultLattice, cellSize: 1.5 });
  assert.equal(a.length, b.length);
  const extent = (edges: ReturnType<typeof buildLattice>) =>
    Math.max(...edges.flat(2).map(Math.abs));
  assert.equal(extent(b), extent(a) * 1.5);
});
test("training ranges include only the requested exercise and fixed inclusive window", () => {
  for (const range of ["7D", "30D", "90D", "ALL"] as TimeRange[]) {
    const records = filterTraining("bench", range);
    assert.ok(records.length > 0);
    assert.ok(records.every((r) => r.exercise === "bench"));
    if (range !== "ALL") {
      const cutoff =
        Date.parse("2026-09-01T00:00:00Z") - (parseInt(range) - 1) * 86400000;
      assert.ok(
        records.every((r) => Date.parse(`${r.date}T12:00:00Z`) >= cutoff),
      );
    }
  }
  assert.ok(
    filterTraining("bench", "7D").length <
      filterTraining("bench", "30D").length,
  );
  assert.ok(
    filterTraining("bench", "90D").length <
      filterTraining("bench", "ALL").length,
  );
  assert.equal(
    filterTraining("legpress", "ALL").length,
    trainingRecords.filter((r) => r.exercise === "legpress").length,
  );
});
