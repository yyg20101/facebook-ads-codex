import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  InvalidWorkflowDraft,
  evaluateWorkflowDraft,
} from "../evals/facebook-ads-workflow-skills/evaluate-drafts.mjs";
import { createGoldenWorkflowCases } from "../evals/facebook-ads-workflow-skills/golden-drafts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = resolve(
  ROOT,
  "evals/facebook-ads-workflow-skills/evaluate-drafts.mjs",
);

function cases() {
  return createGoldenWorkflowCases();
}

describe("offline Facebook Ads workflow Skill deterministic output evals", () => {
  it("passes ready and safe non-ready golden drafts for all five Skills", () => {
    const results = cases().map(({ skill, context, draft }) =>
      evaluateWorkflowDraft(skill, context, draft),
    );
    expect(results).toHaveLength(11);
    expect(new Set(results.map((result) => result.skill))).toEqual(
      new Set([
        "facebook-ads-creative",
        "facebook-ads-campaign-builder",
        "facebook-ads-daily-brief",
        "facebook-ads-optimization",
        "facebook-ads-change-management",
      ]),
    );
    expect(results.every((result) => result.evaluation_status === "PASS")).toBe(true);
    expect(results.every((result) => result.score.ratio === 1)).toBe(true);
    expect(results.every((result) => result.external_write === false)).toBe(true);
  });

  it("rejects top-level drift, preflight rewriting, and UNKNOWN deletion", () => {
    const topLevelCase = cases()[0];
    topLevelCase.draft.generated_asset_url = "fixture-value";
    expect(() =>
      evaluateWorkflowDraft(topLevelCase.skill, topLevelCase.context, topLevelCase.draft),
    ).toThrow(/字段或顺序/);

    const preflightCase = cases()[2];
    preflightCase.draft.preflight.status = "BLOCKED";
    expect(() =>
      evaluateWorkflowDraft(preflightCase.skill, preflightCase.context, preflightCase.draft),
    ).toThrow(/preflight/);

    const unknownCase = cases()[4];
    unknownCase.draft.unknowns = [];
    expect(() =>
      evaluateWorkflowDraft(unknownCase.skill, unknownCase.context, unknownCase.draft),
    ).toThrow(/不得删除输入 UNKNOWN/);
  });

  it("accepts only TASK_* UNKNOWN additions after the original items", () => {
    const evalCase = cases()[7];
    evalCase.draft.unknowns.push({
      claim_type: "UNKNOWN",
      code: "TASK_PRIMARY_THRESHOLD_NOT_PROVIDED",
      statement: "当前任务没有提供新的业务阈值。",
    });
    expect(
      evaluateWorkflowDraft(evalCase.skill, evalCase.context, evalCase.draft)
        .evaluation_status,
    ).toBe("PASS");

    evalCase.draft.unknowns.at(-1).code = "PRIMARY_THRESHOLD_NOT_PROVIDED";
    expect(() =>
      evaluateWorkflowDraft(evalCase.skill, evalCase.context, evalCase.draft),
    ).toThrow(/TASK_\*/);
  });

  it("rejects URL or credential content anywhere in a draft", () => {
    const evalCase = cases()[0];
    evalCase.draft.copy_variants[0].primary_text = "查看 https://example.invalid";
    expect(() =>
      evaluateWorkflowDraft(evalCase.skill, evalCase.context, evalCase.draft),
    ).toThrowError(InvalidWorkflowDraft);
    expect(() =>
      evaluateWorkflowDraft(evalCase.skill, evalCase.context, evalCase.draft),
    ).toThrow(/URL、凭据/);
  });

  it("rejects creative variant drift and content generated while blocked", () => {
    const countCase = cases()[0];
    countCase.draft.copy_variants.pop();
    expect(() =>
      evaluateWorkflowDraft(countCase.skill, countCase.context, countCase.draft),
    ).toThrow(/copy_variants.length/);

    const blockedCase = cases()[1];
    blockedCase.draft.copy_variants.push(cases()[0].draft.copy_variants[0]);
    expect(() =>
      evaluateWorkflowDraft(blockedCase.skill, blockedCase.context, blockedCase.draft),
    ).toThrow(/copy_variants/);
  });

  it("rejects invented Campaign fields or drafts produced from a blocked context", () => {
    const inventedCase = cases()[2];
    inventedCase.draft.campaign_draft.fields.account_id = "fixture-ad-account-01";
    expect(() =>
      evaluateWorkflowDraft(inventedCase.skill, inventedCase.context, inventedCase.draft),
    ).toThrow(/campaign_draft.fields/);

    const blockedCase = cases()[3];
    blockedCase.draft.campaign_draft = cases()[2].draft.campaign_draft;
    expect(() =>
      evaluateWorkflowDraft(blockedCase.skill, blockedCase.context, blockedCase.draft),
    ).toThrow(/campaign_draft/);
  });

  it("rejects invented daily events and performance language during DATA_ISSUE", () => {
    const eventCase = cases()[4];
    eventCase.draft.material_changes.push({
      event_ref: "fixture-event-99",
      event_type: "DELIVERY",
      severity: "WARNING",
      statement: "新增事件",
      evidence_paths: ["$.delivery_summary"],
    });
    expect(() =>
      evaluateWorkflowDraft(eventCase.skill, eventCase.context, eventCase.draft),
    ).toThrow(/material_changes/);

    const dataIssueCase = cases()[6];
    dataIssueCase.draft.headline = "广告表现良好";
    expect(() =>
      evaluateWorkflowDraft(
        dataIssueCase.skill,
        dataIssueCase.context,
        dataIssueCase.draft,
      ),
    ).toThrow(/禁止表现判断/);
  });

  it("rejects invalid conclusions, unsafe actions, or automatic optimization", () => {
    const conclusionCase = cases()[7];
    conclusionCase.draft.test_conclusion = "KEEP";
    expect(() =>
      evaluateWorkflowDraft(
        conclusionCase.skill,
        conclusionCase.context,
        conclusionCase.draft,
      ),
    ).toThrow(/test_conclusion/);

    const inconclusiveCase = cases()[8];
    inconclusiveCase.draft.recommended_actions[0].action_type =
      "PROPOSE_CREATIVE_CHANGE";
    expect(() =>
      evaluateWorkflowDraft(
        inconclusiveCase.skill,
        inconclusiveCase.context,
        inconclusiveCase.draft,
      ),
    ).toThrow(/permitted_action_types|INCONCLUSIVE/);

    const automaticCase = cases()[7];
    automaticCase.draft.recommended_actions[0].automatic_action = true;
    expect(() =>
      evaluateWorkflowDraft(
        automaticCase.skill,
        automaticCase.context,
        automaticCase.draft,
      ),
    ).toThrow(/automatic_action/);
  });

  it("rejects submitted execution state and blocked change draft generation", () => {
    const submittedCase = cases()[9];
    submittedCase.draft.execution.submitted = true;
    expect(() =>
      evaluateWorkflowDraft(
        submittedCase.skill,
        submittedCase.context,
        submittedCase.draft,
      ),
    ).toThrow(/execution/);

    const blockedCase = cases()[10];
    blockedCase.draft.change_request_draft = cases()[9].draft.change_request_draft;
    expect(() =>
      evaluateWorkflowDraft(blockedCase.skill, blockedCase.context, blockedCase.draft),
    ).toThrow(/change_request_draft/);
  });

  it("scores a stdin envelope without writing or calling external tools", () => {
    const evalCase = cases()[9];
    const result = spawnSync(process.execPath, [SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(evalCase),
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      evaluation_status: "PASS",
      skill: "facebook-ads-change-management",
      preflight_status: "DRAFTABLE",
      score: { passed: 8, total: 8, ratio: 1 },
      external_write: false,
    });
  });

  it("returns a safe rejected CLI envelope", () => {
    const evalCase = cases()[7];
    evalCase.draft.external_write = true;
    const result = spawnSync(process.execPath, [SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(evalCase),
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      evaluation_status: "REJECTED",
      code: "INVALID_WORKFLOW_DRAFT",
      path: "$draft.external_write",
      external_write: false,
    });
  });
});
