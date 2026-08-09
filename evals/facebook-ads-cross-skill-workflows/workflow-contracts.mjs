export const CROSS_SKILL_WORKFLOW_SCHEMA_VERSION =
  "facebook-ads-cross-skill-workflow-bundle/v1";

export const CROSS_SKILL_WORKFLOW_ARTIFACT_TYPE =
  "CODEX_CROSS_SKILL_WORKFLOW_BUNDLE";

export const CROSS_SKILL_WORKFLOW_GUARDRAILS = Object.freeze({
  fixture_data_only: true,
  model_invocation_allowed: false,
  web_runtime_allowed: false,
  meta_connection_allowed: false,
  automatic_handoff_allowed: false,
  persistence_allowed: false,
  external_write: false,
});

const CREATIVE_TO_CAMPAIGN_MAPPINGS = [
  {
    from_path: "$.context.scope.workspace_ref",
    to_path: "$.context.scope.workspace_ref",
  },
  {
    from_path: "$.context.scope.account_ref",
    to_path: "$.context.scope.account_ref",
  },
  {
    from_path: "$.draft.copy_variants[0].variant_ref",
    to_path: "$.context.ad.creative_ref",
  },
  {
    from_path: "$.draft.copy_variants[0].primary_text",
    to_path: "$.context.ad.primary_text",
  },
  {
    from_path: "$.draft.copy_variants[0].headline",
    to_path: "$.context.ad.headline",
  },
  {
    from_path: "$.draft.copy_variants[0].description",
    to_path: "$.context.ad.description",
  },
  {
    from_path: "$.context.source_assets[0].asset_ref",
    to_path: "$.context.asset.asset_ref",
  },
  {
    from_path: "$.context.source_assets[0].source_type",
    to_path: "$.context.asset.source_type",
  },
  {
    from_path: "$.context.source_assets[0].commercial_rights",
    to_path: "$.context.asset.commercial_rights",
  },
  {
    from_path: "$.context.audience",
    to_path: "$.context.ad_set.audience",
  },
  {
    from_path: "$.context.placements",
    to_path: "$.context.ad_set.placements",
  },
];

const CREATIVE_TO_CAMPAIGN_MANUAL_INPUTS = [
  "$.context.campaign",
  "$.context.ad_set.name",
  "$.context.ad_set.conversion_location",
  "$.context.ad_set.optimization_event",
  "$.context.ad_set.billing_event",
  "$.context.ad_set.budget",
  "$.context.ad_set.schedule",
  "$.context.ad.name",
  "$.context.ad.call_to_action",
  "$.context.asset.review_state",
  "$.context.landing_page",
  "$.context.supported_fields",
];

const OPTIMIZATION_TO_CHANGE_MAPPINGS = [
  {
    from_path: "$.context.scope.workspace_ref",
    to_path: "$.context.scope.workspace_ref",
  },
  {
    from_path: "$.context.scope.account_ref",
    to_path: "$.context.scope.account_ref",
  },
  {
    from_path: "$.context.scope.object_ref",
    to_path: "$.context.target.object_ref",
  },
  {
    from_path: "$.context.scope.object_type",
    to_path: "$.context.target.object_type",
  },
  {
    from_path: "$.draft.recommended_actions[0].action_ref",
    to_path: "$.context.source_action.action_ref",
  },
  {
    from_path: "$.draft.recommended_actions[0].action_type",
    to_path: "$.context.source_action.action_type",
  },
  {
    from_path: "$.draft.recommended_actions[0].statement",
    to_path: "$.context.source_action.statement",
  },
  {
    from_path: "$.draft.recommended_actions[0].state",
    to_path: "$.context.source_action.state",
  },
  {
    from_path: "$.draft.recommended_actions[0].evidence_refs[0]",
    to_path: "$.context.evidence[0].evidence_ref",
  },
  {
    from_path: "$.draft.recommended_actions[0].rationale",
    to_path: "$.context.evidence[0].statement",
  },
];

const OPTIMIZATION_TO_CHANGE_MANUAL_INPUTS = [
  "$.context.source_action.draft_ref",
  "$.context.target.current_state",
  "$.context.proposed_patch",
  "$.context.policy_context",
  "$.context.approval_context",
];

export const CROSS_SKILL_WORKFLOW_CONTRACTS = Object.freeze({
  CREATIVE_TO_CAMPAIGN_DRAFT: Object.freeze({
    workflow_id: "fixture-cross-workflow-sc-01",
    scenario_id: "SC-01",
    stages: Object.freeze([
      Object.freeze({
        stage_id: "creative",
        skill: "facebook-ads-creative",
        preflight_status: "READY",
      }),
      Object.freeze({
        stage_id: "campaign",
        skill: "facebook-ads-campaign-builder",
        preflight_status: "READY",
      }),
    ]),
    handoff: Object.freeze({
      handoff_id: "fixture-handoff-sc-01-01",
      mode: "MANUAL_REVIEWED_COPY",
      from_stage: "creative",
      to_stage: "campaign",
      from_state: "DRAFT",
      to_state: "DRAFT",
      mappings: Object.freeze(CREATIVE_TO_CAMPAIGN_MAPPINGS),
      manual_inputs: Object.freeze(CREATIVE_TO_CAMPAIGN_MANUAL_INPUTS),
    }),
  }),
  OPTIMIZATION_TO_CHANGE_DRAFT: Object.freeze({
    workflow_id: "fixture-cross-workflow-sc-03",
    scenario_id: "SC-03",
    stages: Object.freeze([
      Object.freeze({
        stage_id: "optimization",
        skill: "facebook-ads-optimization",
        preflight_status: "READY",
      }),
      Object.freeze({
        stage_id: "change",
        skill: "facebook-ads-change-management",
        preflight_status: "DRAFTABLE",
      }),
    ]),
    handoff: Object.freeze({
      handoff_id: "fixture-handoff-sc-03-01",
      mode: "MANUAL_REVIEWED_COPY",
      from_stage: "optimization",
      to_stage: "change",
      from_state: "PENDING_CONFIRMATION",
      to_state: "DRAFT",
      mappings: Object.freeze(OPTIMIZATION_TO_CHANGE_MAPPINGS),
      manual_inputs: Object.freeze(OPTIMIZATION_TO_CHANGE_MANUAL_INPUTS),
    }),
  }),
});
