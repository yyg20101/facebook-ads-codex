import { validateCampaignContext } from "../../.agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs";
import { validateChangeContext } from "../../.agents/skills/facebook-ads-change-management/scripts/validate-context.mjs";
import { validateCreativeContext } from "../../.agents/skills/facebook-ads-creative/scripts/validate-context.mjs";
import { validateDailyBriefContext } from "../../.agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs";
import { validateOptimizationContext } from "../../.agents/skills/facebook-ads-optimization/scripts/validate-context.mjs";
import {
  createBlockedCampaignContext,
  createBlockedChangeContext,
  createBlockedCreativeContext,
  createCampaignContext,
  createChangeContext,
  createCreativeContext,
  createDailyBriefContext,
  createDataIssueDailyBriefContext,
  createInconclusiveOptimizationContext,
  createOptimizationContext,
} from "./fixture-contexts.mjs";

function clone(value) {
  return structuredClone(value);
}

function commonReview(checklist) {
  return { required: true, checklist };
}

function commonHandoff(targetWebArea, targetState, additional = {}) {
  return {
    mode: "MANUAL_CONTEXT",
    target_web_area: targetWebArea,
    ...additional,
    ...(targetState ? { target_state: targetState } : {}),
    external_write: false,
    persisted: false,
  };
}

export function createCreativeDraft(context = createCreativeContext()) {
  const preflight = validateCreativeContext(context);
  const ready = preflight.status === "READY";
  const sourceFactPaths = context.product.approved_messages.map(
    (_, index) => `$.product.approved_messages[${index}]`,
  );
  const hooks = ["通勤场景切入", "轻盈体验切入", "夏日节奏切入", "日常搭配切入", "版位适配切入"];
  const copyVariants = ready
    ? Array.from({ length: context.variant_request.count }, (_, index) => ({
        variant_ref: `fixture-creative-variant-${String(index + 1).padStart(2, "0")}`,
        claim_type: "DRAFT",
        primary_text: `${hooks[index]}：${context.product.approved_messages[0].message}，了解${context.product.name}。`,
        headline: `${context.product.name}｜${hooks[index]}`,
        description: context.product.offer,
        call_to_action_label: "了解更多",
        controlled_variable_value: hooks[index],
        fixed_elements: clone(context.variant_request.fixed_elements),
        source_fact_paths: clone(sourceFactPaths),
        human_review_required: true,
      }))
    : [];
  const visualDirections = ready
    ? copyVariants.map((variant) => ({
        variant_ref: variant.variant_ref,
        claim_type: "DRAFT",
        concept: `${variant.controlled_variable_value}的固定虚构商品画面方向。`,
        composition: "以固定 fixture 商品素材为主体，保留清晰信息层级。",
        format_notes: ["FEED 与 STORY 需分别人工适配"],
        source_asset_refs: context.source_assets.map((asset) => asset.asset_ref),
        controlled_variable_value: variant.controlled_variable_value,
        fixed_elements: clone(context.variant_request.fixed_elements),
        source_fact_paths: context.source_assets.map((_, index) => `$.source_assets[${index}]`),
        asset_generated: false,
        human_review_required: true,
      }))
    : [];
  const assetRisks = ready
    ? context.source_assets.map((asset) => ({
        code: "ASSET_RIGHTS_REVIEW_REQUIRED",
        severity: "INFO",
        asset_ref: asset.asset_ref,
        statement: "商业使用权在输入中标记为已确认，仍需人工复核来源与使用范围。",
        blocking: false,
      }))
    : preflight.blockers.map((blocker) => ({
        code: blocker.code,
        severity: "BLOCKER",
        asset_ref: blocker.path.startsWith("$.source_assets[")
          ? context.source_assets[Number(blocker.path.match(/\[(\d+)\]/u)?.[1] ?? 0)]?.asset_ref ?? null
          : null,
        statement: blocker.statement,
        blocking: true,
      }));

  return {
    creative_mode: "OFFLINE_FIXTURE_DRAFT",
    source_schema_version: context.schema_version,
    scenario_id: context.scenario_id,
    scope: clone(context.scope),
    preflight,
    creative_brief: ready
      ? {
          claim_type: "DRAFT",
          communication_goal: context.communication_goal,
          product_message: context.product.approved_messages.map((item) => item.message).join("；"),
          audience_context: `${context.audience.locations.join("、")}，${context.audience.age_min}-${context.audience.age_max} 岁；${context.audience.notes.join("；")}`,
          placement_context: clone(context.placements),
          controlled_variable: context.variant_request.controlled_variable,
          fixed_elements: clone(context.variant_request.fixed_elements),
          source_fact_paths: sourceFactPaths,
        }
      : null,
    copy_variants: copyVariants,
    visual_directions: visualDirections,
    asset_risks: assetRisks,
    unknowns: clone(context.unknowns),
    human_review: commonReview([
      "ASSET_RIGHTS_AND_SOURCE",
      "CLAIM_SUBSTANTIATION",
      "BRAND_CONSISTENCY",
      "META_POLICY_REVIEW",
      "PLACEMENT_ADAPTATION",
    ]),
    handoff: commonHandoff("ASSET_CENTER", "DRAFT"),
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_SEARCH",
      "NO_IMAGE_GENERATION",
      "NO_META_POLICY_APPROVAL",
      "NO_PERFORMANCE_GUARANTEE",
      "NO_EXTERNAL_WRITE",
    ],
    external_write: false,
  };
}

export function createCampaignDraft(context = createCampaignContext()) {
  const preflight = validateCampaignContext(context);
  const ready = preflight.status === "READY";
  return {
    campaign_mode: "OFFLINE_FIXTURE_DRAFT",
    source_schema_version: context.schema_version,
    scenario_id: context.scenario_id,
    scope: clone(context.scope),
    preflight,
    campaign_draft: ready
      ? {
          claim_type: "DRAFT",
          state: "DRAFT",
          fields: clone(context.campaign),
          source_fact_paths: ["$.campaign"],
        }
      : null,
    ad_set_draft: ready
      ? {
          claim_type: "DRAFT",
          state: "DRAFT",
          fields: clone(context.ad_set),
          source_fact_paths: ["$.ad_set"],
        }
      : null,
    ad_draft: ready
      ? {
          claim_type: "DRAFT",
          state: "DRAFT",
          fields: {
            ...clone(context.ad),
            destination_ref: context.landing_page.destination_ref,
          },
          source_fact_paths: ["$.ad", "$.asset", "$.landing_page"],
        }
      : null,
    preflight_input: {
      supported_fields: clone(context.supported_fields),
      known_constraints: clone(context.known_constraints),
      asset_review_state: context.asset.review_state,
      domain_review_state: context.landing_page.domain_review_state,
    },
    unknown_fields: clone(context.unknowns),
    human_review: commonReview([
      "CAMPAIGN_OBJECTIVE_AND_CATEGORY",
      "CONVERSION_AND_OPTIMIZATION_EVENT",
      "BUDGET_CURRENCY_TIMEZONE_AND_SCHEDULE",
      "AUDIENCE_AND_PLACEMENTS",
      "ASSET_RIGHTS_AND_COPY",
      "LANDING_PAGE_AND_META_POLICY",
    ]),
    handoff: commonHandoff("CAMPAIGN_DRAFTS", "DRAFT"),
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_META_CONNECTION",
      "NO_ACCOUNT_CAPABILITY_VALIDATION",
      "NO_POLICY_APPROVAL",
      "NO_PERFORMANCE_GUARANTEE",
      "NO_PUBLISH_OR_EXTERNAL_WRITE",
    ],
    external_write: false,
  };
}

export function createDailyBriefDraft(context = createDailyBriefContext()) {
  const preflight = validateDailyBriefContext(context);
  const dataIssue = preflight.status === "DATA_ISSUE";
  const noAction = preflight.no_action_required;
  return {
    brief_mode: "OFFLINE_FIXTURE_BRIEF",
    source_schema_version: context.schema_version,
    scenario_id: context.scenario_id,
    scope: clone(context.scope),
    preflight,
    headline: dataIssue
      ? "数据不可用于表现判断，请人工检查数据状态"
      : noAction
        ? "无须处理"
        : "存在已声明事项，需人工查看",
    data_status: {
      claim_type: "FACT",
      report_date: context.report_date,
      freshness: clone(context.freshness),
      data_quality: clone(context.data_quality),
    },
    material_changes: clone(context.material_events),
    review_status: {
      claim_type: "FACT",
      summary: clone(context.review_summary),
      source_fact_paths: ["$.review_summary"],
    },
    today_items: context.open_items.map((item) => ({
      ...clone(item),
      human_review_required: true,
    })),
    no_action_required: noAction,
    unknowns: clone(context.unknowns),
    human_review: commonReview([
      "DATA_FRESHNESS_AND_QUALITY",
      "MATERIAL_EVENT_EVIDENCE",
      "REVIEW_STATUS",
      "OPEN_ITEMS",
    ]),
    handoff: commonHandoff("DAILY_BRIEF", null, { delivery_mode: "MANUAL" }),
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_REALTIME_REFRESH",
      "NO_PERFORMANCE_DIAGNOSIS",
      "NO_OPTIMIZATION_RECOMMENDATIONS",
      "NO_CHANGE_REQUEST",
      "NO_SCHEDULED_DELIVERY",
      "NO_EXTERNAL_WRITE",
    ],
    external_write: false,
  };
}

const CONCLUSION_MAP = new Map([
  ["SUPPORTS_KEEP", "KEEP"],
  ["SUPPORTS_STOP", "STOP"],
  ["SUPPORTS_ITERATE", "ITERATE"],
  ["INCONCLUSIVE", "INCONCLUSIVE"],
]);

export function createOptimizationDraft(context = createOptimizationContext()) {
  const preflight = validateOptimizationContext(context);
  const actionType = preflight.permitted_action_types.includes("DRAFT_NEXT_TEST")
    ? "DRAFT_NEXT_TEST"
    : preflight.permitted_action_types[0];
  return {
    optimization_mode: "OFFLINE_FIXTURE_REVIEW",
    source_schema_version: context.schema_version,
    scenario_id: context.scenario_id,
    scope: clone(context.scope),
    preflight,
    evidence_summary: clone(context.evidence),
    recommended_actions: actionType
      ? [
          {
            action_ref: "fixture-optimization-action-01",
            claim_type: "DRAFT",
            action_type: actionType,
            statement: "待人工确认的下一测试草稿。",
            rationale: context.evidence[0].statement,
            evidence_refs: [context.evidence[0].evidence_ref],
            state: "PENDING_CONFIRMATION",
            automatic_action: false,
          },
        ]
      : [],
    test_plan: clone(context.test_plan),
    test_conclusion:
      preflight.status === "INCONCLUSIVE"
        ? "INCONCLUSIVE"
        : CONCLUSION_MAP.get(context.test_plan.rule_evaluation.state),
    stop_conditions: [
      "TRACKING_NOT_STABLE",
      "MID_TEST_CONFIGURATION_CHANGE",
      "ALLOCATION_NOT_AS_PLANNED",
      "SAMPLE_NOT_SUFFICIENT",
      "COMPARISON_WINDOW_INCOMPLETE",
      "EVIDENCE_CONFLICT",
      "HUMAN_CONFIRMATION_WITHDRAWN",
    ],
    next_review: {
      date: context.review_window.next_review_date,
      scheduled: false,
    },
    unknowns: clone(context.unknowns),
    human_review: commonReview([
      "TRACKING_AND_DATA_QUALITY",
      "SAMPLE_AND_ALLOCATION_VALIDITY",
      "SINGLE_VARIABLE_CONTROL",
      "EVIDENCE_AND_RULE_EVALUATION",
      "NON_EXECUTABLE_ACTION_BOUNDARY",
    ]),
    handoff: commonHandoff("OPTIMIZATION_REVIEW", "PENDING_CONFIRMATION"),
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_WINNER_RANKING",
      "NO_UNSUPPORTED_CAUSAL_CLAIMS",
      "NO_GUESSED_THRESHOLDS",
      "NO_AUTOMATIC_ACTION",
      "NO_CHANGE_REQUEST",
      "NO_EXTERNAL_WRITE",
    ],
    external_write: false,
  };
}

export function createChangeDraft(context = createChangeContext()) {
  const preflight = validateChangeContext(context);
  const draftable = preflight.status === "DRAFTABLE";
  return {
    change_mode: "OFFLINE_FIXTURE_CHANGE_DRAFT",
    source_schema_version: context.schema_version,
    scenario_id: context.scenario_id,
    scope: clone(context.scope),
    preflight,
    change_request_draft: draftable
      ? {
          draft_ref: context.source_action.draft_ref,
          claim_type: "DRAFT",
          state: "DRAFT",
          source_action_ref: context.source_action.action_ref,
          target: clone(context.target),
          proposed_patch: clone(context.proposed_patch),
          evidence_refs: context.evidence.map((item) => item.evidence_ref),
          executable: false,
          human_confirmation_required: true,
        }
      : null,
    policy_gaps: [
      { code: "POLICY_NOT_EVALUATED", blocking_execution: true },
      { code: "META_WRITE_NOT_AUTHORIZED", blocking_execution: true },
    ],
    approval_requirements: {
      web_approval_state: "NOT_REQUESTED",
      required_before_execution: true,
      approver_ref: null,
      expires_at: null,
    },
    execution: {
      status: "NOT_AUTHORIZED",
      change_request_id: null,
      submitted: false,
      approved: false,
      executed: false,
      external_write: false,
    },
    unknowns: clone(context.unknowns),
    human_review: commonReview([
      "SOURCE_ACTION_AND_EVIDENCE",
      "TARGET_AND_PATCH_SEMANTICS",
      "POLICY_AND_ASSET_RIGHTS",
      "WRITE_AUTHORIZATION",
      "WEB_APPROVAL_AND_EXPIRY",
      "EMERGENCY_STOP",
    ]),
    handoff: commonHandoff("CHANGE_DRAFTS", "DRAFT"),
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NON_EXECUTABLE_DRAFT_ONLY",
      "NO_META_CONNECTION",
      "NO_SUBMISSION_OR_APPROVAL",
      "NO_STATUS_QUERY",
      "NO_PERSISTENCE",
      "NO_EXTERNAL_WRITE",
    ],
    external_write: false,
  };
}

export function createGoldenWorkflowCases() {
  const cases = [
    ["facebook-ads-creative", createCreativeContext, createCreativeDraft],
    ["facebook-ads-creative", createBlockedCreativeContext, createCreativeDraft],
    ["facebook-ads-campaign-builder", createCampaignContext, createCampaignDraft],
    ["facebook-ads-campaign-builder", createBlockedCampaignContext, createCampaignDraft],
    ["facebook-ads-daily-brief", createDailyBriefContext, createDailyBriefDraft],
    ["facebook-ads-daily-brief", () => createDailyBriefContext({ withItems: true }), createDailyBriefDraft],
    ["facebook-ads-daily-brief", createDataIssueDailyBriefContext, createDailyBriefDraft],
    ["facebook-ads-optimization", createOptimizationContext, createOptimizationDraft],
    ["facebook-ads-optimization", createInconclusiveOptimizationContext, createOptimizationDraft],
    ["facebook-ads-change-management", createChangeContext, createChangeDraft],
    ["facebook-ads-change-management", createBlockedChangeContext, createChangeDraft],
  ];
  return cases.map(([skill, contextFactory, draftFactory]) => {
    const context = contextFactory();
    return { skill, context, draft: draftFactory(context) };
  });
}
