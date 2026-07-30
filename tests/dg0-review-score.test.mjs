import test from "node:test";
import assert from "node:assert/strict";
import {
  SCENARIOS,
  SHAPES
} from "../docs/discovery/prototypes/src/model.mjs";
import {
  scoreReview
} from "../scripts/score-dg0-review.mjs";

function completeSession() {
  return {
    schema_version: 1,
    review_status: "COMPLETE",
    session_id: "DG0-EXAMPLE-PASS",
    reviewer_alias: "project_owner",
    date: "2026-07-30",
    selected_shape: "PROTO-C",
    runs: SHAPES.flatMap((shape) =>
      SCENARIOS.map((scenario) => ({
        shape_id: shape.id,
        scenario_id: scenario.id,
        completed_criteria: scenario.criteria.map((criterion) => criterion.id),
        critical_misunderstandings: [],
        notes: ["脱敏示例记录"]
      }))
    )
  };
}

test("passes a complete selected shape with no critical misunderstanding", () => {
  const score = scoreReview(completeSession());
  assert.equal(score.gate_status, "PASS");
  assert.equal(score.selected_shape_coverage, 1);
  assert.equal(score.selected_shape_critical_misunderstandings, 0);
});

test("returns PARTIAL below 80 percent", () => {
  const session = completeSession();
  const selected = session.runs.filter((run) => run.shape_id === "PROTO-C");
  selected[0].completed_criteria = [];
  selected[1].completed_criteria = [];
  const score = scoreReview(session);
  assert.equal(score.gate_status, "PARTIAL");
  assert.ok(score.selected_shape_coverage < 0.8);
});

test("returns PARTIAL for any selected-shape critical misunderstanding", () => {
  const session = completeSession();
  session.runs
    .find((run) => run.shape_id === "PROTO-C")
    .critical_misunderstandings.push("META_WRITE_ASSUMED");
  const score = scoreReview(session);
  assert.equal(score.gate_status, "PARTIAL");
  assert.equal(score.selected_shape_critical_misunderstandings, 1);
});

test("rejects incomplete shape and scenario coverage", () => {
  const session = completeSession();
  session.runs.pop();
  assert.throws(() => scoreReview(session), /exactly 9 runs/);
});
