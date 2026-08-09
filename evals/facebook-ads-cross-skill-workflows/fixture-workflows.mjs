import {
  createCampaignContext,
  createChangeContext,
  createCreativeContext,
  createOptimizationContext,
} from "../facebook-ads-workflow-skills/fixture-contexts.mjs";
import {
  createCampaignDraft,
  createChangeDraft,
  createCreativeDraft,
  createOptimizationDraft,
} from "../facebook-ads-workflow-skills/golden-drafts.mjs";
import {
  CROSS_SKILL_WORKFLOW_ARTIFACT_TYPE,
  CROSS_SKILL_WORKFLOW_CONTRACTS,
  CROSS_SKILL_WORKFLOW_GUARDRAILS,
  CROSS_SKILL_WORKFLOW_SCHEMA_VERSION,
} from "./workflow-contracts.mjs";

function clone(value) {
  return structuredClone(value);
}

function stage(stageId, skill, context, draft) {
  return { stage_id: stageId, skill, context, draft };
}

function handoff(contract) {
  return {
    handoff_id: contract.handoff_id,
    mode: contract.mode,
    from_stage: contract.from_stage,
    to_stage: contract.to_stage,
    from_state: contract.from_state,
    to_state: contract.to_state,
    mappings: clone(contract.mappings),
    manual_inputs: clone(contract.manual_inputs),
    human_review_required: true,
    automatic_handoff: false,
    target_persisted: false,
    external_write: false,
  };
}

export function createCreativeToCampaignWorkflowBundle() {
  const contract = CROSS_SKILL_WORKFLOW_CONTRACTS.CREATIVE_TO_CAMPAIGN_DRAFT;
  const creativeContext = createCreativeContext();
  const creativeDraft = createCreativeDraft(creativeContext);
  const selectedVariant = creativeDraft.copy_variants[0];
  const selectedAsset = creativeContext.source_assets[0];
  const campaignContext = createCampaignContext();

  campaignContext.scope.workspace_ref = creativeContext.scope.workspace_ref;
  campaignContext.scope.account_ref = creativeContext.scope.account_ref;
  campaignContext.ad_set.audience = clone(creativeContext.audience);
  campaignContext.ad_set.placements = clone(creativeContext.placements);
  campaignContext.ad.creative_ref = selectedVariant.variant_ref;
  campaignContext.ad.primary_text = selectedVariant.primary_text;
  campaignContext.ad.headline = selectedVariant.headline;
  campaignContext.ad.description = selectedVariant.description;
  campaignContext.asset.asset_ref = selectedAsset.asset_ref;
  campaignContext.asset.source_type = selectedAsset.source_type;
  campaignContext.asset.commercial_rights = selectedAsset.commercial_rights;

  const campaignDraft = createCampaignDraft(campaignContext);

  return {
    schema_version: CROSS_SKILL_WORKFLOW_SCHEMA_VERSION,
    artifact_type: CROSS_SKILL_WORKFLOW_ARTIFACT_TYPE,
    source_kind: "FIXTURE",
    workflow_id: contract.workflow_id,
    workflow_type: "CREATIVE_TO_CAMPAIGN_DRAFT",
    scenario_id: contract.scenario_id,
    scope: {
      workspace_ref: creativeContext.scope.workspace_ref,
      account_ref: creativeContext.scope.account_ref,
      object_ref: null,
      object_type: null,
    },
    stages: [
      stage("creative", "facebook-ads-creative", creativeContext, creativeDraft),
      stage(
        "campaign",
        "facebook-ads-campaign-builder",
        campaignContext,
        campaignDraft,
      ),
    ],
    handoffs: [handoff(contract.handoff)],
    guardrails: clone(CROSS_SKILL_WORKFLOW_GUARDRAILS),
  };
}

export function createOptimizationToChangeWorkflowBundle() {
  const contract = CROSS_SKILL_WORKFLOW_CONTRACTS.OPTIMIZATION_TO_CHANGE_DRAFT;
  const optimizationContext = createOptimizationContext();
  optimizationContext.scope.object_ref = "fixture-ad-01";
  optimizationContext.scope.object_type = "AD";
  optimizationContext.allowed_action_types = ["PROPOSE_CREATIVE_CHANGE"];
  const optimizationDraft = createOptimizationDraft(optimizationContext);
  const selectedAction = optimizationDraft.recommended_actions[0];

  const changeContext = createChangeContext();
  changeContext.scope.workspace_ref = optimizationContext.scope.workspace_ref;
  changeContext.scope.account_ref = optimizationContext.scope.account_ref;
  changeContext.source_action.action_ref = selectedAction.action_ref;
  changeContext.source_action.action_type = selectedAction.action_type;
  changeContext.source_action.statement = selectedAction.statement;
  changeContext.source_action.state = selectedAction.state;
  changeContext.target.object_ref = optimizationContext.scope.object_ref;
  changeContext.target.object_type = optimizationContext.scope.object_type;
  changeContext.evidence[0].evidence_ref = selectedAction.evidence_refs[0];
  changeContext.evidence[0].statement = selectedAction.rationale;
  const changeDraft = createChangeDraft(changeContext);

  return {
    schema_version: CROSS_SKILL_WORKFLOW_SCHEMA_VERSION,
    artifact_type: CROSS_SKILL_WORKFLOW_ARTIFACT_TYPE,
    source_kind: "FIXTURE",
    workflow_id: contract.workflow_id,
    workflow_type: "OPTIMIZATION_TO_CHANGE_DRAFT",
    scenario_id: contract.scenario_id,
    scope: {
      workspace_ref: optimizationContext.scope.workspace_ref,
      account_ref: optimizationContext.scope.account_ref,
      object_ref: optimizationContext.scope.object_ref,
      object_type: optimizationContext.scope.object_type,
    },
    stages: [
      stage(
        "optimization",
        "facebook-ads-optimization",
        optimizationContext,
        optimizationDraft,
      ),
      stage(
        "change",
        "facebook-ads-change-management",
        changeContext,
        changeDraft,
      ),
    ],
    handoffs: [handoff(contract.handoff)],
    guardrails: clone(CROSS_SKILL_WORKFLOW_GUARDRAILS),
  };
}

export function createAllCrossSkillWorkflowBundles() {
  return [
    createCreativeToCampaignWorkflowBundle(),
    createOptimizationToChangeWorkflowBundle(),
  ];
}
