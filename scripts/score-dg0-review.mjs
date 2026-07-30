import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CRITICAL_MISUNDERSTANDINGS,
  SCENARIOS,
  SHAPES
} from "../docs/discovery/prototypes/src/model.mjs";

function assertSession(session) {
  if (session.schema_version !== 1) {
    throw new Error("review schema_version must be 1");
  }
  if (session.review_status !== "COMPLETE") {
    throw new Error("review_status must be COMPLETE");
  }
  if (session.reviewer_alias !== "project_owner") {
    throw new Error("reviewer_alias must be project_owner");
  }
  if (!SHAPES.some((shape) => shape.id === session.selected_shape)) {
    throw new Error("selected_shape is invalid");
  }
  if (!Array.isArray(session.runs) || session.runs.length !== 9) {
    throw new Error("review must contain exactly 9 runs");
  }

  const expectedKeys = new Set(
    SHAPES.flatMap((shape) =>
      SCENARIOS.map((scenario) => `${shape.id}|${scenario.id}`)
    )
  );
  const actualKeys = new Set(
    session.runs.map((run) => `${run.shape_id}|${run.scenario_id}`)
  );
  if (
    actualKeys.size !== expectedKeys.size ||
    [...expectedKeys].some((key) => !actualKeys.has(key))
  ) {
    throw new Error("review runs must cover each shape and scenario once");
  }

  for (const run of session.runs) {
    const scenario = SCENARIOS.find((item) => item.id === run.scenario_id);
    if (!Array.isArray(run.completed_criteria)) {
      throw new Error("completed_criteria must be an array");
    }
    if (!Array.isArray(run.critical_misunderstandings)) {
      throw new Error("critical_misunderstandings must be an array");
    }
    const allowedCriteria = new Set(
      scenario.criteria.map((criterion) => criterion.id)
    );
    for (const criterion of run.completed_criteria) {
      if (!allowedCriteria.has(criterion)) {
        throw new Error(`unknown criterion ${criterion}`);
      }
    }
    if (new Set(run.completed_criteria).size !== run.completed_criteria.length) {
      throw new Error("completed_criteria cannot contain duplicates");
    }
    for (const misunderstanding of run.critical_misunderstandings) {
      if (!CRITICAL_MISUNDERSTANDINGS.includes(misunderstanding)) {
        throw new Error(`unknown critical misunderstanding ${misunderstanding}`);
      }
    }
    if (
      new Set(run.critical_misunderstandings).size !==
      run.critical_misunderstandings.length
    ) {
      throw new Error("critical_misunderstandings cannot contain duplicates");
    }
  }
}

export function scoreReview(session) {
  assertSession(session);
  const selectedRuns = session.runs.filter(
    (run) => run.shape_id === session.selected_shape
  );
  const possible = SCENARIOS.reduce(
    (sum, scenario) => sum + scenario.criteria.length,
    0
  );
  const completed = selectedRuns.reduce(
    (sum, run) => sum + new Set(run.completed_criteria).size,
    0
  );
  const critical = selectedRuns.reduce(
    (sum, run) => sum + run.critical_misunderstandings.length,
    0
  );
  const coverage = completed / possible;

  return {
    gate_status: coverage >= 0.8 && critical === 0 ? "PASS" : "PARTIAL",
    selected_shape: session.selected_shape,
    selected_shape_completed_criteria: completed,
    selected_shape_possible_criteria: possible,
    selected_shape_coverage: coverage,
    selected_shape_critical_misunderstandings: critical,
    all_shape_critical_misunderstandings: session.runs.reduce(
      (sum, run) => sum + run.critical_misunderstandings.length,
      0
    )
  };
}

function renderSummary(session, score) {
  const rows = session.runs
    .map((run) => {
      const scenario = SCENARIOS.find((item) => item.id === run.scenario_id);
      const rate = run.completed_criteria.length / scenario.criteria.length;
      return `| ${run.shape_id} | ${run.scenario_id} | ` +
        `${run.completed_criteria.length}/${scenario.criteria.length} | ` +
        `${Math.round(rate * 100)}% | ` +
        `${run.critical_misunderstandings.join("、") || "0"} |`;
    })
    .join("\n");

  return `---
doc_id: DISC-DG0-REVIEW-RESULT
type: planning
status: DRAFT
owner: project_owner
last_reviewed: ${session.date}
---

# DG0 三形态同任务走查结果

## 结论

\`\`\`yaml
gate_status: ${score.gate_status}
selected_shape: ${score.selected_shape}
selected_shape_coverage: ${Math.round(score.selected_shape_coverage * 100)}%
selected_shape_critical_misunderstandings: ${score.selected_shape_critical_misunderstandings}
\`\`\`

该结果只验证项目负责人对脱敏低保真任务的完成与理解，不构成真实用户、市场或广告效果
验证，也不自动改变项目状态或授权。

## 逐项结果

| Shape | Scenario | 完成项 | 覆盖率 | 关键误解 |
| --- | --- | ---: | ---: | --- |
${rows}
`;
}

export async function scoreFile(inputPath, outputPath) {
  const session = JSON.parse(await readFile(resolve(inputPath), "utf8"));
  const score = scoreReview(session);
  await writeFile(resolve(outputPath), renderSummary(session, score), "utf8");
  return score;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    throw new Error(
      "usage: node scripts/score-dg0-review.mjs <session.json> <summary.md>"
    );
  }
  const score = await scoreFile(inputPath, outputPath);
  process.stdout.write(`${JSON.stringify(score)}\n`);
}
