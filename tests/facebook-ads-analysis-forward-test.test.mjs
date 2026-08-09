import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createForwardTestCase,
  listForwardTestCases,
} from "../evals/facebook-ads-analysis/session-cases.mjs";
import { createGoldenCases } from "../evals/facebook-ads-analysis/golden-cases.mjs";
import {
  REQUIRED_FORWARD_TEST_ATTESTATION,
  evaluateForwardTestResult,
} from "../scripts/score-facebook-ads-analysis-forward-test.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PREPARE_SCRIPT = resolve(
  ROOT,
  "scripts/prepare-facebook-ads-analysis-forward-test.mjs",
);
const SCORE_SCRIPT = resolve(
  ROOT,
  "scripts/score-facebook-ads-analysis-forward-test.mjs",
);

function resultEnvelope(index) {
  return {
    case_id: `FWD-FBA-${String(index + 1).padStart(3, "0")}`,
    draft: createGoldenCases()[index].draft,
    protocol_attestation: { ...REQUIRED_FORWARD_TEST_ATTESTATION },
  };
}

describe("facebook-ads-analysis fresh-session forward-test kit", () => {
  it("lists one isolated prompt for all five analysis kinds", () => {
    expect(listForwardTestCases()).toEqual([
      expect.objectContaining({
        case_id: "FWD-FBA-001",
        analysis_kind: "ACCOUNT_COMPARISON",
      }),
      expect.objectContaining({
        case_id: "FWD-FBA-002",
        analysis_kind: "OBJECT_COMPARISON",
      }),
      expect.objectContaining({
        case_id: "FWD-FBA-003",
        analysis_kind: "DIRECT_CHILD_BREAKDOWN",
      }),
      expect.objectContaining({
        case_id: "FWD-FBA-004",
        analysis_kind: "OBJECT_DAILY_TREND",
      }),
      expect.objectContaining({
        case_id: "FWD-FBA-005",
        analysis_kind: "DIRECT_CHILD_DAILY_TREND",
      }),
    ]);
  });

  it("withholds golden drafts and expected answers from every prepared case", () => {
    for (const { case_id } of listForwardTestCases()) {
      const testCase = createForwardTestCase(case_id);
      const serialized = JSON.stringify(testCase);

      expect(testCase.prompt).toContain("$facebook-ads-analysis");
      expect(testCase.protocol.expected_output_withheld).toBe(true);
      expect(testCase.protocol.external_connections_allowed).toBe(false);
      expect(testCase.protocol.repository_result_persistence_allowed).toBe(
        false,
      );
      expect(testCase).not.toHaveProperty("draft");
      expect(serialized).not.toContain('"expected_answer"');
      expect(serialized).not.toContain('"evidence_values"');
      expect(serialized).not.toContain("EVAL-FBA-");
    }
  });

  it("rejects an unknown case before preparing a session input", () => {
    expect(() => createForwardTestCase("FWD-FBA-999")).toThrow(
      /未知 forward-test case/,
    );
  });

  it("prepares a NOT_RUN case without starting a model or writing a result", () => {
    const result = spawnSync(process.execPath, [PREPARE_SCRIPT, "FWD-FBA-004"], {
      cwd: ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      preparation_status: "READY",
      execution_status: "NOT_RUN",
      case: {
        case_id: "FWD-FBA-004",
        context: { analysis_kind: "OBJECT_DAILY_TREND" },
      },
      external_write: false,
    });
  });

  it("lists the five session cases through the preparation CLI", () => {
    const result = spawnSync(process.execPath, [PREPARE_SCRIPT, "--list"], {
      cwd: ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      preparation_status: "READY",
      execution_status: "NOT_RUN",
      cases: expect.arrayContaining([
        expect.objectContaining({ case_id: "FWD-FBA-001" }),
        expect.objectContaining({ case_id: "FWD-FBA-005" }),
      ]),
      external_write: false,
    });
  });

  it("scores operator-attested drafts for all five fixed contexts", () => {
    const results = createGoldenCases().map((_, index) =>
      evaluateForwardTestResult(resultEnvelope(index)),
    );

    expect(results.every((result) => result.result_status === "PASS")).toBe(
      true,
    );
    expect(
      results.every(
        (result) => result.draft_evaluation.score.ratio === 1,
      ),
    ).toBe(true);
    expect(
      results.every(
        (result) => result.attestation_independently_verified === false,
      ),
    ).toBe(true);
  });

  it("rejects a draft scored against the wrong session case", () => {
    const envelope = resultEnvelope(0);
    envelope.case_id = "FWD-FBA-002";

    expect(() => evaluateForwardTestResult(envelope)).toThrow(/analysis_kind/);
  });

  it("rejects an incomplete or unsafe protocol attestation", () => {
    const notFresh = resultEnvelope(0);
    notFresh.protocol_attestation.fresh_session = false;
    expect(() => evaluateForwardTestResult(notFresh)).toThrow(
      /必须声明全新会话/,
    );

    const extraField = resultEnvelope(0);
    extraField.protocol_attestation.session_id = "not-recorded";
    expect(() => evaluateForwardTestResult(extraField)).toThrow(
      /字段必须且只能为/,
    );
  });

  it("scores a stdin result without persisting the session input or output", () => {
    const result = spawnSync(process.execPath, [SCORE_SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(resultEnvelope(4)),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      result_status: "PASS",
      case_id: "FWD-FBA-005",
      analysis_kind: "DIRECT_CHILD_DAILY_TREND",
      protocol_evidence: "OPERATOR_ATTESTATION",
      attestation_independently_verified: false,
      draft_evaluation: { score: { passed: 8, total: 8, ratio: 1 } },
      external_write: false,
    });
  });

  it("returns a safe rejected CLI result when session evidence is invalid", () => {
    const envelope = resultEnvelope(0);
    envelope.protocol_attestation.expected_output_seen = true;
    const result = spawnSync(process.execPath, [SCORE_SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(envelope),
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      result_status: "REJECTED",
      code: "INVALID_FORWARD_TEST_RESULT",
      path: "$.protocol_attestation",
      attestation_independently_verified: false,
      external_write: false,
    });
  });

  it("keeps preparation and scoring scripts free of model, network, and write clients", () => {
    const source = [PREPARE_SCRIPT, SCORE_SCRIPT]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(source).not.toMatch(
      /\bfetch\s*\(|XMLHttpRequest|WebSocket|openai|responses\.create|writeFile|appendFile|localStorage|sessionStorage|indexedDB/u,
    );
  });
});
