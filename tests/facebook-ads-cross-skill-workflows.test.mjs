import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  InvalidCrossSkillWorkflow,
  evaluateCrossSkillWorkflow,
} from "../evals/facebook-ads-cross-skill-workflows/evaluate-workflows.mjs";
import {
  createAllCrossSkillWorkflowBundles,
  createCreativeToCampaignWorkflowBundle,
  createOptimizationToChangeWorkflowBundle,
} from "../evals/facebook-ads-cross-skill-workflows/fixture-workflows.mjs";
import { createCampaignDraft } from "../evals/facebook-ads-workflow-skills/golden-drafts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = resolve(
  ROOT,
  "evals/facebook-ads-cross-skill-workflows/evaluate-workflows.mjs",
);

describe("offline Facebook Ads cross-Skill manual workflows", () => {
  it("defines only the two evidence-backed cross-Skill chains", () => {
    const bundles = createAllCrossSkillWorkflowBundles();
    expect(bundles.map((bundle) => bundle.workflow_type)).toEqual([
      "CREATIVE_TO_CAMPAIGN_DRAFT",
      "OPTIMIZATION_TO_CHANGE_DRAFT",
    ]);
    expect(bundles.flatMap((bundle) => bundle.stages).map((stage) => stage.skill)).toEqual([
      "facebook-ads-creative",
      "facebook-ads-campaign-builder",
      "facebook-ads-optimization",
      "facebook-ads-change-management",
    ]);
  });

  it("passes both fixed fixture chains with no model, persistence, or write", () => {
    const results = createAllCrossSkillWorkflowBundles().map((bundle) =>
      evaluateCrossSkillWorkflow(bundle),
    );
    expect(results).toHaveLength(2);
    expect(results.every((result) => result.evaluation_status === "PASS")).toBe(true);
    expect(results.every((result) => result.score.ratio === 1)).toBe(true);
    expect(results.every((result) => result.score.total === 10)).toBe(true);
    expect(results.every((result) => result.model_invoked === false)).toBe(true);
    expect(results.every((result) => result.persisted === false)).toBe(true);
    expect(results.every((result) => result.external_write === false)).toBe(true);
  });

  it("copies the selected creative fields into the Campaign context exactly", () => {
    const bundle = createCreativeToCampaignWorkflowBundle();
    const [creative, campaign] = bundle.stages;
    const variant = creative.draft.copy_variants[0];
    expect(campaign.context.ad).toMatchObject({
      creative_ref: variant.variant_ref,
      primary_text: variant.primary_text,
      headline: variant.headline,
      description: variant.description,
    });
    expect(campaign.context.asset.asset_ref).toBe(
      creative.context.source_assets[0].asset_ref,
    );
    expect(campaign.context.ad_set.audience).toEqual(creative.context.audience);
    expect(campaign.context.ad_set.placements).toEqual(creative.context.placements);
  });

  it("copies a pending Optimization action into a non-executable Change context", () => {
    const bundle = createOptimizationToChangeWorkflowBundle();
    const [optimization, change] = bundle.stages;
    const action = optimization.draft.recommended_actions[0];
    expect(change.context.source_action).toMatchObject({
      action_ref: action.action_ref,
      source_skill: "facebook-ads-optimization",
      action_type: action.action_type,
      statement: action.statement,
      state: "PENDING_CONFIRMATION",
    });
    expect(change.context.target.object_ref).toBe(optimization.context.scope.object_ref);
    expect(change.draft.change_request_draft.executable).toBe(false);
    expect(change.draft.execution).toMatchObject({
      status: "NOT_AUTHORIZED",
      submitted: false,
      approved: false,
      executed: false,
      external_write: false,
    });
  });

  it("rejects a downstream Campaign value even when its own draft remains valid", () => {
    const bundle = createCreativeToCampaignWorkflowBundle();
    const campaign = bundle.stages[1];
    campaign.context.ad.primary_text = "与上游不一致的固定虚构正文";
    campaign.draft = createCampaignDraft(campaign.context);
    expect(() => evaluateCrossSkillWorkflow(bundle)).toThrowError(
      InvalidCrossSkillWorkflow,
    );
    expect(() => evaluateCrossSkillWorkflow(bundle)).toThrow(/交接两端/);
  });

  it("rejects stage order, scope, and workflow identity drift", () => {
    const orderBundle = createCreativeToCampaignWorkflowBundle();
    orderBundle.stages.reverse();
    expect(() => evaluateCrossSkillWorkflow(orderBundle)).toThrow(/stage_id/);

    const scopeBundle = createCreativeToCampaignWorkflowBundle();
    scopeBundle.scope.account_ref = "fixture-ad-account-02";
    expect(() => evaluateCrossSkillWorkflow(scopeBundle)).toThrow(/account_ref/);

    const identityBundle = createOptimizationToChangeWorkflowBundle();
    identityBundle.workflow_id = "fixture-cross-workflow-untrusted";
    expect(() => evaluateCrossSkillWorkflow(identityBundle)).toThrow(/workflow_id/);
  });

  it("rejects mapping or manual-input contract changes", () => {
    const mappingBundle = createCreativeToCampaignWorkflowBundle();
    mappingBundle.handoffs[0].mappings[2].from_path =
      "$.draft.copy_variants[1].variant_ref";
    expect(() => evaluateCrossSkillWorkflow(mappingBundle)).toThrow(
      /固定跨 Skill 契约/,
    );

    const manualBundle = createOptimizationToChangeWorkflowBundle();
    manualBundle.handoffs[0].manual_inputs.pop();
    expect(() => evaluateCrossSkillWorkflow(manualBundle)).toThrow(
      /固定跨 Skill 契约/,
    );
  });

  it("rejects automatic handoff, persistence, and external-write claims", () => {
    const automaticBundle = createCreativeToCampaignWorkflowBundle();
    automaticBundle.handoffs[0].automatic_handoff = true;
    expect(() => evaluateCrossSkillWorkflow(automaticBundle)).toThrow(
      /automatic_handoff/,
    );

    const persistedBundle = createCreativeToCampaignWorkflowBundle();
    persistedBundle.handoffs[0].target_persisted = true;
    expect(() => evaluateCrossSkillWorkflow(persistedBundle)).toThrow(
      /target_persisted/,
    );

    const writeBundle = createOptimizationToChangeWorkflowBundle();
    writeBundle.handoffs[0].external_write = true;
    expect(() => evaluateCrossSkillWorkflow(writeBundle)).toThrow(/external_write/);
  });

  it("rejects unsafe content before it can become a handoff artifact", () => {
    const bundle = createCreativeToCampaignWorkflowBundle();
    bundle.stages[0].context.scope.request_id = "fixture-request-trace-01";
    expect(() => evaluateCrossSkillWorkflow(bundle)).toThrow(
      /敏感|请求追踪|禁止/,
    );
  });

  it("evaluates a bundle from stdin without persisting session data", () => {
    const bundle = createOptimizationToChangeWorkflowBundle();
    const result = spawnSync(process.execPath, [SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(bundle),
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      evaluation_status: "PASS",
      workflow_type: "OPTIMIZATION_TO_CHANGE_DRAFT",
      handoff_count: 1,
      score: { passed: 10, total: 10, ratio: 1 },
      model_invoked: false,
      persisted: false,
      external_write: false,
    });
  });

  it("refuses file input and returns a safe rejected CLI envelope", () => {
    const result = spawnSync(process.execPath, [SCRIPT, "workflow-result.json"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      evaluation_status: "REJECTED",
      code: "INVALID_CROSS_SKILL_WORKFLOW",
      path: "$input",
      model_invoked: false,
      persisted: false,
      external_write: false,
    });
  });
});
