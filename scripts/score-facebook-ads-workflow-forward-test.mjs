import { isDeepStrictEqual } from "node:util";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { InvalidCampaignContext } from "../.agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs";
import { InvalidChangeContext } from "../.agents/skills/facebook-ads-change-management/scripts/validate-context.mjs";
import { InvalidCreativeContext } from "../.agents/skills/facebook-ads-creative/scripts/validate-context.mjs";
import { InvalidDailyBriefContext } from "../.agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs";
import { InvalidOptimizationContext } from "../.agents/skills/facebook-ads-optimization/scripts/validate-context.mjs";
import {
  InvalidWorkflowDraft,
  evaluateWorkflowDraft,
} from "../evals/facebook-ads-workflow-skills/evaluate-drafts.mjs";
import { createWorkflowForwardTestCase } from "../evals/facebook-ads-workflow-skills/session-cases.mjs";

export const WORKFLOW_FORWARD_TEST_RESULT_SCHEMA_VERSION =
  "facebook-ads-workflow-forward-test-result/v1";

export const REQUIRED_WORKFLOW_FORWARD_TEST_ATTESTATION = {
  fresh_session: true,
  explicit_skill_invocation: true,
  expected_output_seen: false,
  golden_assets_read: false,
  external_connections_used: false,
  input_or_output_persisted: false,
};

export class InvalidWorkflowForwardTestResult extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidWorkflowForwardTestResult";
    this.code = "INVALID_WORKFLOW_FORWARD_TEST_RESULT";
    this.path = path;
  }
}

function fail(path, reason) {
  throw new InvalidWorkflowForwardTestResult(path, reason);
}

function exactRecord(value, keys, path) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "必须是 object");
  }
  const actualKeys = Object.keys(value);
  if (
    actualKeys.length !== keys.length ||
    actualKeys.some((key) => !keys.includes(key))
  ) {
    fail(path, `字段必须且只能为 ${keys.join(", ")}`);
  }
  return value;
}

export function evaluateWorkflowForwardTestResult(value) {
  const envelope = exactRecord(
    value,
    ["case_id", "draft", "protocol_attestation"],
    "$workflow_forward_test_result",
  );
  if (typeof envelope.case_id !== "string" || envelope.case_id === "") {
    fail("$.case_id", "必须是非空 string");
  }

  let testCase;
  try {
    testCase = createWorkflowForwardTestCase(envelope.case_id);
  } catch {
    fail("$.case_id", "不是已提交的 workflow forward-test case");
  }

  const attestation = exactRecord(
    envelope.protocol_attestation,
    Object.keys(REQUIRED_WORKFLOW_FORWARD_TEST_ATTESTATION),
    "$.protocol_attestation",
  );
  if (
    !isDeepStrictEqual(
      attestation,
      REQUIRED_WORKFLOW_FORWARD_TEST_ATTESTATION,
    )
  ) {
    fail(
      "$.protocol_attestation",
      "必须声明全新会话、显式调用、未查看期望资产、未外连且未持久化",
    );
  }

  const draftEvaluation = evaluateWorkflowDraft(
    testCase.skill,
    testCase.context,
    envelope.draft,
  );
  return {
    result_schema_version: WORKFLOW_FORWARD_TEST_RESULT_SCHEMA_VERSION,
    result_status: "PASS",
    case_id: testCase.case_id,
    skill: testCase.skill,
    protocol_evidence: "OPERATOR_ATTESTATION",
    attestation_independently_verified: false,
    draft_evaluation: draftEvaluation,
    external_write: false,
  };
}

async function readStdin() {
  const chunks = [];
  let total = 0;
  for await (const chunk of process.stdin) {
    total += chunk.length;
    if (total > 2_000_000) fail("$", "输入超过 2 MB 上限");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const CONTEXT_ERRORS = [
  InvalidCampaignContext,
  InvalidChangeContext,
  InvalidCreativeContext,
  InvalidDailyBriefContext,
  InvalidOptimizationContext,
];

function rejected(error) {
  const known =
    error instanceof InvalidWorkflowForwardTestResult ||
    error instanceof InvalidWorkflowDraft ||
    CONTEXT_ERRORS.some((ContextError) => error instanceof ContextError);
  return {
    result_status: "REJECTED",
    code: known ? error.code : "INVALID_WORKFLOW_FORWARD_TEST_RESULT",
    path: known ? error.path : "$",
    reason: error instanceof Error ? error.message : String(error),
    attestation_independently_verified: false,
    external_write: false,
  };
}

async function main() {
  const inputPath = process.argv[2];
  if (inputPath !== "-" || process.argv.length !== 3) {
    process.stderr.write(
      "usage: node score-facebook-ads-workflow-forward-test.mjs -\n",
    );
    process.exitCode = 2;
    return;
  }

  try {
    const raw = await readStdin();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      fail("$", "不是有效 JSON");
    }
    process.stdout.write(
      `${JSON.stringify(evaluateWorkflowForwardTestResult(parsed), null, 2)}\n`,
    );
  } catch (error) {
    process.stderr.write(`${JSON.stringify(rejected(error), null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
