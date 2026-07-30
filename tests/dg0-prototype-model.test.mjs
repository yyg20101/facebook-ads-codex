import test from "node:test";
import assert from "node:assert/strict";
import {
  CRITICAL_MISUNDERSTANDINGS,
  SCENARIOS,
  SHAPES,
  artifactId
} from "../docs/discovery/prototypes/src/model.mjs";

test("defines exactly three comparable shapes", () => {
  assert.deepEqual(
    SHAPES.map((shape) => shape.id),
    ["PROTO-A", "PROTO-B", "PROTO-C"]
  );
});

test("defines three scenarios with three stages and unique criteria", () => {
  assert.deepEqual(
    SCENARIOS.map((scenario) => scenario.id),
    ["SC-01", "SC-02", "SC-03"]
  );
  const criteria = SCENARIOS.flatMap((scenario) =>
    scenario.criteria.map((criterion) => criterion.id)
  );
  assert.equal(new Set(criteria).size, criteria.length);
  for (const scenario of SCENARIOS) {
    assert.equal(scenario.stages.length, 3);
    assert.ok(scenario.criteria.length >= 6);
  }
});

test("creates stable artifact identifiers", () => {
  assert.equal(
    artifactId(SHAPES[2], SCENARIOS[1], SCENARIOS[1].stages[2]),
    "proto-c-sc-02-result"
  );
});

test("enumerates the critical misunderstanding categories", () => {
  assert.deepEqual(CRITICAL_MISUNDERSTANDINGS, [
    "DATA_SCOPE_MISREAD",
    "PERMISSION_ESCALATION",
    "META_WRITE_ASSUMED",
    "CAUSALITY_OVERCLAIM",
    "RIGHTS_BYPASS"
  ]);
});
