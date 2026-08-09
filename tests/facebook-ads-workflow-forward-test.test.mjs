import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createCampaignDraft,
  createChangeDraft,
  createCreativeDraft,
  createDailyBriefDraft,
  createOptimizationDraft,
} from "../evals/facebook-ads-workflow-skills/golden-drafts.mjs";
import {
  createWorkflowForwardTestCase,
  listWorkflowForwardTestCases,
} from "../evals/facebook-ads-workflow-skills/session-cases.mjs";
import {
  REQUIRED_WORKFLOW_FORWARD_TEST_ATTESTATION,
  evaluateWorkflowForwardTestResult,
} from "../scripts/score-facebook-ads-workflow-forward-test.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PREPARE_SCRIPT = resolve(
  ROOT,
  "scripts/prepare-facebook-ads-workflow-forward-test.mjs",
);
const SCORE_SCRIPT = resolve(
  ROOT,
  "scripts/score-facebook-ads-workflow-forward-test.mjs",
);

const DRAFT_FACTORIES = new Map([
  ["facebook-ads-creative", createCreativeDraft],
  ["facebook-ads-campaign-builder", createCampaignDraft],
  ["facebook-ads-daily-brief", createDailyBriefDraft],
  ["facebook-ads-optimization", createOptimizationDraft],
  ["facebook-ads-change-management", createChangeDraft],
]);

function resultEnvelope(caseId) {
  const testCase = createWorkflowForwardTestCase(caseId);
  return {
    case_id: caseId,
    draft: DRAFT_FACTORIES.get(testCase.skill)(testCase.context),
    protocol_attestation: {
      ...REQUIRED_WORKFLOW_FORWARD_TEST_ATTESTATION,
    },
  };
}

describe("facebook-ads workflow Skills fresh-session forward-test kit", () => {
  it("lists one isolated prompt for each of the five workflow Skills", () => {
    expect(listWorkflowForwardTestCases()).toEqual([
      expect.objectContaining({
        case_id: "FWD-FBW-001",
        skill: "facebook-ads-creative",
      }),
      expect.objectContaining({
        case_id: "FWD-FBW-002",
        skill: "facebook-ads-campaign-builder",
      }),
      expect.objectContaining({
        case_id: "FWD-FBW-003",
        skill: "facebook-ads-daily-brief",
      }),
      expect.objectContaining({
        case_id: "FWD-FBW-004",
        skill: "facebook-ads-optimization",
      }),
      expect.objectContaining({
        case_id: "FWD-FBW-005",
        skill: "facebook-ads-change-management",
      }),
    ]);
  });

  it("withholds golden drafts and expected answers from every workflow case", () => {
    for (const { case_id, skill } of listWorkflowForwardTestCases()) {
      const testCase = createWorkflowForwardTestCase(case_id);
      const serialized = JSON.stringify(testCase);

      expect(testCase.prompt).toContain(`$${skill}`);
      expect(testCase.protocol.expected_output_withheld).toBe(true);
      expect(testCase.protocol.external_connections_allowed).toBe(false);
      expect(testCase.protocol.repository_result_persistence_allowed).toBe(
        false,
      );
      expect(testCase.protocol.allowed_skill_assets).toHaveLength(4);
      expect(testCase).not.toHaveProperty("draft");
      expect(serialized).not.toContain('"expected_answer"');
      expect(serialized).not.toContain("createGoldenWorkflowCases");
    }
  });

  it("rejects an unknown workflow case before preparing a session input", () => {
    expect(() => createWorkflowForwardTestCase("FWD-FBW-999")).toThrow(
      /未知 workflow forward-test case/,
    );
  });

  it("prepares a workflow NOT_RUN case without starting a model or writing a result", () => {
    const result = spawnSync(process.execPath, [PREPARE_SCRIPT, "FWD-FBW-004"], {
      cwd: ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      preparation_status: "READY",
      execution_status: "NOT_RUN",
      case: {
        case_id: "FWD-FBW-004",
        skill: "facebook-ads-optimization",
        context: { validity: { sample_state: "INSUFFICIENT" } },
      },
      external_write: false,
    });
  });

  it("lists the five workflow session cases through the preparation CLI", () => {
    const result = spawnSync(process.execPath, [PREPARE_SCRIPT, "--list"], {
      cwd: ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      preparation_status: "READY",
      execution_status: "NOT_RUN",
      cases: expect.arrayContaining([
        expect.objectContaining({ case_id: "FWD-FBW-001" }),
        expect.objectContaining({ case_id: "FWD-FBW-005" }),
      ]),
      external_write: false,
    });
  });

  it("scores operator-attested drafts for all five workflow contexts", () => {
    const results = listWorkflowForwardTestCases().map(({ case_id }) =>
      evaluateWorkflowForwardTestResult(resultEnvelope(case_id)),
    );

    expect(results.every((result) => result.result_status === "PASS")).toBe(
      true,
    );
    expect(
      results.every((result) => result.draft_evaluation.score.ratio === 1),
    ).toBe(true);
    expect(
      results.every(
        (result) => result.attestation_independently_verified === false,
      ),
    ).toBe(true);
  });

  it("rejects a workflow draft scored against the wrong session case", () => {
    const envelope = resultEnvelope("FWD-FBW-001");
    envelope.case_id = "FWD-FBW-002";

    expect(() => evaluateWorkflowForwardTestResult(envelope)).toThrow(
      /campaign_mode/,
    );
  });

  it("rejects an incomplete or unsafe workflow protocol attestation", () => {
    const notFresh = resultEnvelope("FWD-FBW-001");
    notFresh.protocol_attestation.fresh_session = false;
    expect(() => evaluateWorkflowForwardTestResult(notFresh)).toThrow(
      /必须声明全新会话/,
    );

    const extraField = resultEnvelope("FWD-FBW-001");
    extraField.protocol_attestation.session_id = "not-recorded";
    expect(() => evaluateWorkflowForwardTestResult(extraField)).toThrow(
      /字段必须且只能为/,
    );
  });

  it("scores a workflow stdin result without persisting session data", () => {
    const result = spawnSync(process.execPath, [SCORE_SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(resultEnvelope("FWD-FBW-005")),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      result_status: "PASS",
      case_id: "FWD-FBW-005",
      skill: "facebook-ads-change-management",
      protocol_evidence: "OPERATOR_ATTESTATION",
      attestation_independently_verified: false,
      draft_evaluation: { score: { passed: 8, total: 8, ratio: 1 } },
      external_write: false,
    });
  });

  it("returns a safe rejected workflow CLI result for invalid evidence", () => {
    const envelope = resultEnvelope("FWD-FBW-004");
    envelope.protocol_attestation.golden_assets_read = true;
    const result = spawnSync(process.execPath, [SCORE_SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(envelope),
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      result_status: "REJECTED",
      code: "INVALID_WORKFLOW_FORWARD_TEST_RESULT",
      path: "$.protocol_attestation",
      attestation_independently_verified: false,
      external_write: false,
    });
  });

  it("requires stdin so workflow session evidence is not read from a persisted file", () => {
    const result = spawnSync(process.execPath, [SCORE_SCRIPT, "result.json"], {
      cwd: ROOT,
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("usage:");
  });

  it("keeps workflow preparation and scoring model-free, local, and non-persistent", () => {
    const source = [PREPARE_SCRIPT, SCORE_SCRIPT]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(source).not.toMatch(
      /\bfetch\s*\(|XMLHttpRequest|WebSocket|\bOpenAI\b|responses\.create|writeFile|appendFile|localStorage|sessionStorage|indexedDB/u,
    );
  });
});
