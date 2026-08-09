import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  InvalidOfflineAnalysisDraft,
  evaluateOfflineAnalysisDraft,
} from "../.agents/skills/facebook-ads-analysis/scripts/evaluate-draft.mjs";
import { InvalidOfflineAnalysisContext } from "../.agents/skills/facebook-ads-analysis/scripts/validate-context.mjs";
import { createForwardTestCase } from "../evals/facebook-ads-analysis/session-cases.mjs";

export const FORWARD_TEST_RESULT_SCHEMA_VERSION =
  "facebook-ads-analysis-forward-test-result/v1";

export const REQUIRED_FORWARD_TEST_ATTESTATION = {
  fresh_session: true,
  explicit_skill_invocation: true,
  expected_output_seen: false,
  golden_assets_read: false,
  external_connections_used: false,
  input_or_output_persisted: false,
};

export class InvalidForwardTestResult extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidForwardTestResult";
    this.code = "INVALID_FORWARD_TEST_RESULT";
    this.path = path;
  }
}

function fail(path, reason) {
  throw new InvalidForwardTestResult(path, reason);
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

export function evaluateForwardTestResult(value) {
  const envelope = exactRecord(
    value,
    ["case_id", "draft", "protocol_attestation"],
    "$forward_test_result",
  );
  if (typeof envelope.case_id !== "string" || envelope.case_id === "") {
    fail("$.case_id", "必须是非空 string");
  }

  let testCase;
  try {
    testCase = createForwardTestCase(envelope.case_id);
  } catch {
    fail("$.case_id", "不是已提交的 forward-test case");
  }

  const attestation = exactRecord(
    envelope.protocol_attestation,
    Object.keys(REQUIRED_FORWARD_TEST_ATTESTATION),
    "$.protocol_attestation",
  );
  if (!isDeepStrictEqual(attestation, REQUIRED_FORWARD_TEST_ATTESTATION)) {
    fail(
      "$.protocol_attestation",
      "必须声明全新会话、显式调用、未查看期望资产、未外连且未持久化",
    );
  }

  const draftEvaluation = evaluateOfflineAnalysisDraft(
    testCase.context,
    envelope.draft,
  );
  return {
    result_schema_version: FORWARD_TEST_RESULT_SCHEMA_VERSION,
    result_status: "PASS",
    case_id: testCase.case_id,
    analysis_kind: testCase.context.analysis_kind,
    protocol_evidence: "OPERATOR_ATTESTATION",
    attestation_independently_verified: false,
    draft_evaluation: draftEvaluation,
    external_write: false,
  };
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function rejected(error) {
  const known =
    error instanceof InvalidForwardTestResult ||
    error instanceof InvalidOfflineAnalysisDraft ||
    error instanceof InvalidOfflineAnalysisContext;
  return {
    result_status: "REJECTED",
    code: known ? error.code : "INVALID_FORWARD_TEST_RESULT",
    path: known ? error.path : "$",
    reason: error instanceof Error ? error.message : String(error),
    attestation_independently_verified: false,
    external_write: false,
  };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || process.argv.length !== 3) {
    process.stderr.write(
      "usage: node score-facebook-ads-analysis-forward-test.mjs <result.json|->\n",
    );
    process.exitCode = 2;
    return;
  }

  try {
    const raw =
      inputPath === "-"
        ? await readStdin()
        : await readFile(resolve(inputPath), "utf8");
    if (Buffer.byteLength(raw, "utf8") > 2_000_000) {
      fail("$", "输入超过 2 MB 上限");
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      fail("$", "不是有效 JSON");
    }
    process.stdout.write(
      `${JSON.stringify(evaluateForwardTestResult(parsed), null, 2)}\n`,
    );
  } catch (error) {
    process.stderr.write(`${JSON.stringify(rejected(error), null, 2)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
