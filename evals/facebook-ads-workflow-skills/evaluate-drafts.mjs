import { readFile, realpath, lstat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCampaignContext } from "../../.agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs";
import { validateChangeContext } from "../../.agents/skills/facebook-ads-change-management/scripts/validate-context.mjs";
import { validateCreativeContext } from "../../.agents/skills/facebook-ads-creative/scripts/validate-context.mjs";
import { validateDailyBriefContext } from "../../.agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs";
import { validateOptimizationContext } from "../../.agents/skills/facebook-ads-optimization/scripts/validate-context.mjs";

export const EVALUATION_SCHEMA_VERSION =
  "facebook-ads-workflow-draft-evaluation/v1";

const MAX_BYTES = 2 * 1024 * 1024;
const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const FORBIDDEN_NORMALIZED_KEYS = new Set([
  "accesstoken",
  "approvaltoken",
  "authorization",
  "bearertoken",
  "clientsecret",
  "cookie",
  "customerdata",
  "endpoint",
  "executedat",
  "idempotencykey",
  "metapayload",
  "password",
  "publishpayload",
  "realaccountid",
  "requestid",
  "submittedat",
  "url",
]);
const URL_OR_CREDENTIAL_PATTERN =
  /(?:https?:\/\/|www\.|authorization\s*:|bearer\s+[A-Za-z0-9._-]+|access[_ -]?token\s*[:=]|client[_ -]?secret\s*[:=])/iu;

const COMMON = {
  "facebook-ads-creative": {
    validator: validateCreativeContext,
    modeKey: "creative_mode",
    mode: "OFFLINE_FIXTURE_DRAFT",
    topKeys: [
      "creative_mode",
      "source_schema_version",
      "scenario_id",
      "scope",
      "preflight",
      "creative_brief",
      "copy_variants",
      "visual_directions",
      "asset_risks",
      "unknowns",
      "human_review",
      "handoff",
      "limitations",
      "external_write",
    ],
    unknownKey: "unknowns",
    humanReview: {
      required: true,
      checklist: [
        "ASSET_RIGHTS_AND_SOURCE",
        "CLAIM_SUBSTANTIATION",
        "BRAND_CONSISTENCY",
        "META_POLICY_REVIEW",
        "PLACEMENT_ADAPTATION",
      ],
    },
    handoff: {
      mode: "MANUAL_CONTEXT",
      target_web_area: "ASSET_CENTER",
      target_state: "DRAFT",
      external_write: false,
      persisted: false,
    },
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_SEARCH",
      "NO_IMAGE_GENERATION",
      "NO_META_POLICY_APPROVAL",
      "NO_PERFORMANCE_GUARANTEE",
      "NO_EXTERNAL_WRITE",
    ],
  },
  "facebook-ads-campaign-builder": {
    validator: validateCampaignContext,
    modeKey: "campaign_mode",
    mode: "OFFLINE_FIXTURE_DRAFT",
    topKeys: [
      "campaign_mode",
      "source_schema_version",
      "scenario_id",
      "scope",
      "preflight",
      "campaign_draft",
      "ad_set_draft",
      "ad_draft",
      "preflight_input",
      "unknown_fields",
      "human_review",
      "handoff",
      "limitations",
      "external_write",
    ],
    unknownKey: "unknown_fields",
    humanReview: {
      required: true,
      checklist: [
        "CAMPAIGN_OBJECTIVE_AND_CATEGORY",
        "CONVERSION_AND_OPTIMIZATION_EVENT",
        "BUDGET_CURRENCY_TIMEZONE_AND_SCHEDULE",
        "AUDIENCE_AND_PLACEMENTS",
        "ASSET_RIGHTS_AND_COPY",
        "LANDING_PAGE_AND_META_POLICY",
      ],
    },
    handoff: {
      mode: "MANUAL_CONTEXT",
      target_web_area: "CAMPAIGN_DRAFTS",
      target_state: "DRAFT",
      external_write: false,
      persisted: false,
    },
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_META_CONNECTION",
      "NO_ACCOUNT_CAPABILITY_VALIDATION",
      "NO_POLICY_APPROVAL",
      "NO_PERFORMANCE_GUARANTEE",
      "NO_PUBLISH_OR_EXTERNAL_WRITE",
    ],
  },
  "facebook-ads-daily-brief": {
    validator: validateDailyBriefContext,
    modeKey: "brief_mode",
    mode: "OFFLINE_FIXTURE_BRIEF",
    topKeys: [
      "brief_mode",
      "source_schema_version",
      "scenario_id",
      "scope",
      "preflight",
      "headline",
      "data_status",
      "material_changes",
      "review_status",
      "today_items",
      "no_action_required",
      "unknowns",
      "human_review",
      "handoff",
      "limitations",
      "external_write",
    ],
    unknownKey: "unknowns",
    humanReview: {
      required: true,
      checklist: [
        "DATA_FRESHNESS_AND_QUALITY",
        "MATERIAL_EVENT_EVIDENCE",
        "REVIEW_STATUS",
        "OPEN_ITEMS",
      ],
    },
    handoff: {
      mode: "MANUAL_CONTEXT",
      target_web_area: "DAILY_BRIEF",
      delivery_mode: "MANUAL",
      external_write: false,
      persisted: false,
    },
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_REALTIME_REFRESH",
      "NO_PERFORMANCE_DIAGNOSIS",
      "NO_OPTIMIZATION_RECOMMENDATIONS",
      "NO_CHANGE_REQUEST",
      "NO_SCHEDULED_DELIVERY",
      "NO_EXTERNAL_WRITE",
    ],
  },
  "facebook-ads-optimization": {
    validator: validateOptimizationContext,
    modeKey: "optimization_mode",
    mode: "OFFLINE_FIXTURE_REVIEW",
    topKeys: [
      "optimization_mode",
      "source_schema_version",
      "scenario_id",
      "scope",
      "preflight",
      "evidence_summary",
      "recommended_actions",
      "test_plan",
      "test_conclusion",
      "stop_conditions",
      "next_review",
      "unknowns",
      "human_review",
      "handoff",
      "limitations",
      "external_write",
    ],
    unknownKey: "unknowns",
    humanReview: {
      required: true,
      checklist: [
        "TRACKING_AND_DATA_QUALITY",
        "SAMPLE_AND_ALLOCATION_VALIDITY",
        "SINGLE_VARIABLE_CONTROL",
        "EVIDENCE_AND_RULE_EVALUATION",
        "NON_EXECUTABLE_ACTION_BOUNDARY",
      ],
    },
    handoff: {
      mode: "MANUAL_CONTEXT",
      target_web_area: "OPTIMIZATION_REVIEW",
      target_state: "PENDING_CONFIRMATION",
      external_write: false,
      persisted: false,
    },
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NO_WINNER_RANKING",
      "NO_UNSUPPORTED_CAUSAL_CLAIMS",
      "NO_GUESSED_THRESHOLDS",
      "NO_AUTOMATIC_ACTION",
      "NO_CHANGE_REQUEST",
      "NO_EXTERNAL_WRITE",
    ],
  },
  "facebook-ads-change-management": {
    validator: validateChangeContext,
    modeKey: "change_mode",
    mode: "OFFLINE_FIXTURE_CHANGE_DRAFT",
    topKeys: [
      "change_mode",
      "source_schema_version",
      "scenario_id",
      "scope",
      "preflight",
      "change_request_draft",
      "policy_gaps",
      "approval_requirements",
      "execution",
      "unknowns",
      "human_review",
      "handoff",
      "limitations",
      "external_write",
    ],
    unknownKey: "unknowns",
    humanReview: {
      required: true,
      checklist: [
        "SOURCE_ACTION_AND_EVIDENCE",
        "TARGET_AND_PATCH_SEMANTICS",
        "POLICY_AND_ASSET_RIGHTS",
        "WRITE_AUTHORIZATION",
        "WEB_APPROVAL_AND_EXPIRY",
        "EMERGENCY_STOP",
      ],
    },
    handoff: {
      mode: "MANUAL_CONTEXT",
      target_web_area: "CHANGE_DRAFTS",
      target_state: "DRAFT",
      external_write: false,
      persisted: false,
    },
    limitations: [
      "FIXTURE_DATA_ONLY",
      "NON_EXECUTABLE_DRAFT_ONLY",
      "NO_META_CONNECTION",
      "NO_SUBMISSION_OR_APPROVAL",
      "NO_STATUS_QUERY",
      "NO_PERSISTENCE",
      "NO_EXTERNAL_WRITE",
    ],
  },
};

export class InvalidWorkflowDraft extends Error {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = "InvalidWorkflowDraft";
    this.code = "INVALID_WORKFLOW_DRAFT";
    this.path = path;
  }
}

function fail(path, message) {
  throw new InvalidWorkflowDraft(path, message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactRecord(value, keys, path) {
  if (!isRecord(value)) fail(path, "必须是 object");
  const actual = Object.keys(value);
  if (
    actual.length !== keys.length ||
    actual.some((key, index) => key !== keys[index])
  ) {
    fail(path, `字段或顺序必须精确为 ${keys.join(", ")}`);
  }
  return value;
}

function deepEqual(actual, expected, path) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(path, "必须原样匹配输入或固定契约值");
  }
}

function literal(actual, expected, path) {
  if (actual !== expected) fail(path, `必须为 ${JSON.stringify(expected)}`);
}

function stringValue(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(path, "必须是非空 string");
  }
}

function arrayValue(value, path) {
  if (!Array.isArray(value)) fail(path, "必须是 array");
  return value;
}

function normalizedKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/gu, "");
}

function assertSafeContent(value, path = "$draft") {
  if (typeof value === "string") {
    if (URL_OR_CREDENTIAL_PATTERN.test(value)) {
      fail(path, "不得包含 URL、凭据或 Authorization 内容");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSafeContent(entry, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_NORMALIZED_KEYS.has(normalizedKey(key))) {
      fail(`${path}.${key}`, "包含禁止的外部调用、敏感或请求追踪字段");
    }
    assertSafeContent(nested, `${path}.${key}`);
  }
}

function assertUnknowns(source, output, path) {
  arrayValue(output, path);
  if (output.length < source.length) fail(path, "不得删除输入 UNKNOWN");
  source.forEach((item, index) => deepEqual(output[index], item, `${path}[${index}]`));
  const seen = new Set(source.map((item) => item.code));
  output.slice(source.length).forEach((item, offset) => {
    const itemPath = `${path}[${source.length + offset}]`;
    exactRecord(item, ["claim_type", "code", "statement"], itemPath);
    literal(item.claim_type, "UNKNOWN", `${itemPath}.claim_type`);
    if (typeof item.code !== "string" || !/^TASK_[A-Z0-9_]+$/u.test(item.code)) {
      fail(`${itemPath}.code`, "新增 UNKNOWN 必须使用 TASK_* code");
    }
    if (seen.has(item.code)) fail(`${itemPath}.code`, "UNKNOWN code 不得重复");
    seen.add(item.code);
    stringValue(item.statement, `${itemPath}.statement`);
  });
}

function assertSourcePaths(paths, allowed, path) {
  arrayValue(paths, path);
  if (paths.length === 0) fail(path, "至少需要一个来源路径");
  paths.forEach((item, index) => {
    if (!allowed.has(item)) fail(`${path}[${index}]`, "来源路径不在允许的 fixture 事实中");
  });
}

function evaluateCommon(skill, context, draft) {
  const config = COMMON[skill];
  if (!config) fail("$.skill", "不是受支持的工作流 Skill");
  const preflight = config.validator(context);
  exactRecord(draft, config.topKeys, "$draft");
  literal(draft[config.modeKey], config.mode, `$draft.${config.modeKey}`);
  literal(
    draft.source_schema_version,
    context.schema_version,
    "$draft.source_schema_version",
  );
  literal(draft.scenario_id, context.scenario_id, "$draft.scenario_id");
  deepEqual(draft.scope, context.scope, "$draft.scope");
  deepEqual(draft.preflight, preflight, "$draft.preflight");
  assertUnknowns(context.unknowns, draft[config.unknownKey], `$draft.${config.unknownKey}`);
  deepEqual(draft.human_review, config.humanReview, "$draft.human_review");
  deepEqual(draft.handoff, config.handoff, "$draft.handoff");
  deepEqual(draft.limitations, config.limitations, "$draft.limitations");
  literal(draft.external_write, false, "$draft.external_write");
  assertSafeContent(draft);
  return preflight;
}

function evaluateCreative(context, draft, preflight) {
  const ready = preflight.status === "READY";
  if (!ready) {
    literal(draft.creative_brief, null, "$draft.creative_brief");
    deepEqual(draft.copy_variants, [], "$draft.copy_variants");
    deepEqual(draft.visual_directions, [], "$draft.visual_directions");
  } else {
    const brief = exactRecord(
      draft.creative_brief,
      [
        "claim_type",
        "communication_goal",
        "product_message",
        "audience_context",
        "placement_context",
        "controlled_variable",
        "fixed_elements",
        "source_fact_paths",
      ],
      "$draft.creative_brief",
    );
    literal(brief.claim_type, "DRAFT", "$draft.creative_brief.claim_type");
    literal(
      brief.communication_goal,
      context.communication_goal,
      "$draft.creative_brief.communication_goal",
    );
    literal(
      brief.product_message,
      context.product.approved_messages.map((item) => item.message).join("；"),
      "$draft.creative_brief.product_message",
    );
    stringValue(brief.audience_context, "$draft.creative_brief.audience_context");
    deepEqual(brief.placement_context, context.placements, "$draft.creative_brief.placement_context");
    literal(
      brief.controlled_variable,
      context.variant_request.controlled_variable,
      "$draft.creative_brief.controlled_variable",
    );
    deepEqual(brief.fixed_elements, context.variant_request.fixed_elements, "$draft.creative_brief.fixed_elements");
    const approvedPaths = new Set(
      context.product.approved_messages.map((_, index) => `$.product.approved_messages[${index}]`),
    );
    assertSourcePaths(brief.source_fact_paths, approvedPaths, "$draft.creative_brief.source_fact_paths");

    arrayValue(draft.copy_variants, "$draft.copy_variants");
    arrayValue(draft.visual_directions, "$draft.visual_directions");
    literal(draft.copy_variants.length, context.variant_request.count, "$draft.copy_variants.length");
    literal(draft.visual_directions.length, context.variant_request.count, "$draft.visual_directions.length");
    const assetRefs = context.source_assets.map((asset) => asset.asset_ref);
    const assetPaths = new Set(context.source_assets.map((_, index) => `$.source_assets[${index}]`));
    const controlledValues = new Set();
    draft.copy_variants.forEach((item, index) => {
      const path = `$draft.copy_variants[${index}]`;
      exactRecord(
        item,
        [
          "variant_ref",
          "claim_type",
          "primary_text",
          "headline",
          "description",
          "call_to_action_label",
          "controlled_variable_value",
          "fixed_elements",
          "source_fact_paths",
          "human_review_required",
        ],
        path,
      );
      literal(item.variant_ref, `fixture-creative-variant-${String(index + 1).padStart(2, "0")}`, `${path}.variant_ref`);
      literal(item.claim_type, "DRAFT", `${path}.claim_type`);
      ["primary_text", "headline", "description", "call_to_action_label", "controlled_variable_value"].forEach((key) =>
        stringValue(item[key], `${path}.${key}`),
      );
      deepEqual(item.fixed_elements, context.variant_request.fixed_elements, `${path}.fixed_elements`);
      assertSourcePaths(item.source_fact_paths, approvedPaths, `${path}.source_fact_paths`);
      literal(item.human_review_required, true, `${path}.human_review_required`);
      if (controlledValues.has(item.controlled_variable_value)) {
        fail(`${path}.controlled_variable_value`, "受控变量值不得重复");
      }
      controlledValues.add(item.controlled_variable_value);
      context.brand.prohibited_terms.forEach((term) => {
        if ([item.primary_text, item.headline, item.description].some((text) => text.includes(term))) {
          fail(path, `不得使用品牌禁用词 ${term}`);
        }
      });
    });
    draft.visual_directions.forEach((item, index) => {
      const path = `$draft.visual_directions[${index}]`;
      exactRecord(
        item,
        [
          "variant_ref",
          "claim_type",
          "concept",
          "composition",
          "format_notes",
          "source_asset_refs",
          "controlled_variable_value",
          "fixed_elements",
          "source_fact_paths",
          "asset_generated",
          "human_review_required",
        ],
        path,
      );
      literal(item.variant_ref, draft.copy_variants[index].variant_ref, `${path}.variant_ref`);
      literal(item.claim_type, "DRAFT", `${path}.claim_type`);
      stringValue(item.concept, `${path}.concept`);
      stringValue(item.composition, `${path}.composition`);
      arrayValue(item.format_notes, `${path}.format_notes`).forEach((note, noteIndex) =>
        stringValue(note, `${path}.format_notes[${noteIndex}]`),
      );
      deepEqual(item.source_asset_refs, assetRefs, `${path}.source_asset_refs`);
      literal(item.controlled_variable_value, draft.copy_variants[index].controlled_variable_value, `${path}.controlled_variable_value`);
      deepEqual(item.fixed_elements, context.variant_request.fixed_elements, `${path}.fixed_elements`);
      assertSourcePaths(item.source_fact_paths, assetPaths, `${path}.source_fact_paths`);
      literal(item.asset_generated, false, `${path}.asset_generated`);
      literal(item.human_review_required, true, `${path}.human_review_required`);
    });
  }
  arrayValue(draft.asset_risks, "$draft.asset_risks").forEach((item, index) => {
    const path = `$draft.asset_risks[${index}]`;
    exactRecord(item, ["code", "severity", "asset_ref", "statement", "blocking"], path);
    stringValue(item.code, `${path}.code`);
    if (!["INFO", "WARNING", "BLOCKER"].includes(item.severity)) fail(`${path}.severity`, "不是允许的风险级别");
    if (item.asset_ref !== null && !context.source_assets.some((asset) => asset.asset_ref === item.asset_ref)) {
      fail(`${path}.asset_ref`, "不是输入中的素材引用");
    }
    stringValue(item.statement, `${path}.statement`);
    if (typeof item.blocking !== "boolean") fail(`${path}.blocking`, "必须是 boolean");
    if (item.severity === "BLOCKER" && item.blocking !== true) fail(`${path}.blocking`, "BLOCKER 必须阻断");
  });
  if (!ready) {
    const riskCodes = new Set(draft.asset_risks.filter((risk) => risk.blocking).map((risk) => risk.code));
    preflight.blockers.forEach((blocker) => {
      if (!riskCodes.has(blocker.code)) fail("$draft.asset_risks", `缺少 blocker ${blocker.code}`);
    });
  }
}

function evaluateCampaign(context, draft, preflight) {
  const ready = preflight.status === "READY";
  const draftKeys = ["claim_type", "state", "fields", "source_fact_paths"];
  if (!ready) {
    ["campaign_draft", "ad_set_draft", "ad_draft"].forEach((key) =>
      literal(draft[key], null, `$draft.${key}`),
    );
  } else {
    const expected = [
      ["campaign_draft", context.campaign, ["$.campaign"]],
      ["ad_set_draft", context.ad_set, ["$.ad_set"]],
      [
        "ad_draft",
        { ...context.ad, destination_ref: context.landing_page.destination_ref },
        ["$.ad", "$.asset", "$.landing_page"],
      ],
    ];
    expected.forEach(([key, fields, paths]) => {
      const item = exactRecord(draft[key], draftKeys, `$draft.${key}`);
      literal(item.claim_type, "DRAFT", `$draft.${key}.claim_type`);
      literal(item.state, "DRAFT", `$draft.${key}.state`);
      deepEqual(item.fields, fields, `$draft.${key}.fields`);
      deepEqual(item.source_fact_paths, paths, `$draft.${key}.source_fact_paths`);
    });
  }
  exactRecord(
    draft.preflight_input,
    ["supported_fields", "known_constraints", "asset_review_state", "domain_review_state"],
    "$draft.preflight_input",
  );
  deepEqual(draft.preflight_input.supported_fields, context.supported_fields, "$draft.preflight_input.supported_fields");
  deepEqual(draft.preflight_input.known_constraints, context.known_constraints, "$draft.preflight_input.known_constraints");
  literal(draft.preflight_input.asset_review_state, context.asset.review_state, "$draft.preflight_input.asset_review_state");
  literal(draft.preflight_input.domain_review_state, context.landing_page.domain_review_state, "$draft.preflight_input.domain_review_state");
}

function evaluateDailyBrief(context, draft, preflight) {
  exactRecord(draft.data_status, ["claim_type", "report_date", "freshness", "data_quality"], "$draft.data_status");
  literal(draft.data_status.claim_type, "FACT", "$draft.data_status.claim_type");
  literal(draft.data_status.report_date, context.report_date, "$draft.data_status.report_date");
  deepEqual(draft.data_status.freshness, context.freshness, "$draft.data_status.freshness");
  deepEqual(draft.data_status.data_quality, context.data_quality, "$draft.data_status.data_quality");
  deepEqual(draft.material_changes, context.material_events, "$draft.material_changes");
  exactRecord(draft.review_status, ["claim_type", "summary", "source_fact_paths"], "$draft.review_status");
  literal(draft.review_status.claim_type, "FACT", "$draft.review_status.claim_type");
  deepEqual(draft.review_status.summary, context.review_summary, "$draft.review_status.summary");
  deepEqual(draft.review_status.source_fact_paths, ["$.review_summary"], "$draft.review_status.source_fact_paths");
  const expectedItems = context.open_items.map((item) => ({ ...item, human_review_required: true }));
  deepEqual(draft.today_items, expectedItems, "$draft.today_items");
  literal(draft.no_action_required, preflight.no_action_required, "$draft.no_action_required");
  stringValue(draft.headline, "$draft.headline");
  if (preflight.status === "DATA_ISSUE" && !draft.headline.includes("数据不可用于表现判断")) {
    fail("$draft.headline", "DATA_ISSUE 必须明确禁止表现判断");
  }
  if (preflight.no_action_required) literal(draft.headline, "无须处理", "$draft.headline");
}

const CONCLUSION_MAP = new Map([
  ["SUPPORTS_KEEP", "KEEP"],
  ["SUPPORTS_STOP", "STOP"],
  ["SUPPORTS_ITERATE", "ITERATE"],
  ["INCONCLUSIVE", "INCONCLUSIVE"],
]);
const STOP_CONDITIONS = [
  "TRACKING_NOT_STABLE",
  "MID_TEST_CONFIGURATION_CHANGE",
  "ALLOCATION_NOT_AS_PLANNED",
  "SAMPLE_NOT_SUFFICIENT",
  "COMPARISON_WINDOW_INCOMPLETE",
  "EVIDENCE_CONFLICT",
  "HUMAN_CONFIRMATION_WITHDRAWN",
];

function evaluateOptimization(context, draft, preflight) {
  deepEqual(draft.evidence_summary, context.evidence, "$draft.evidence_summary");
  arrayValue(draft.recommended_actions, "$draft.recommended_actions").forEach((item, index) => {
    const path = `$draft.recommended_actions[${index}]`;
    exactRecord(
      item,
      [
        "action_ref",
        "claim_type",
        "action_type",
        "statement",
        "rationale",
        "evidence_refs",
        "state",
        "automatic_action",
      ],
      path,
    );
    literal(item.action_ref, `fixture-optimization-action-${String(index + 1).padStart(2, "0")}`, `${path}.action_ref`);
    literal(item.claim_type, "DRAFT", `${path}.claim_type`);
    if (!preflight.permitted_action_types.includes(item.action_type)) fail(`${path}.action_type`, "不在 preflight permitted_action_types 中");
    if (preflight.status === "INCONCLUSIVE" && item.action_type.startsWith("PROPOSE_")) fail(`${path}.action_type`, "INCONCLUSIVE 时禁止 PROPOSE_* 动作");
    stringValue(item.statement, `${path}.statement`);
    stringValue(item.rationale, `${path}.rationale`);
    arrayValue(item.evidence_refs, `${path}.evidence_refs`).forEach((ref, refIndex) => {
      if (!context.evidence.some((entry) => entry.evidence_ref === ref)) fail(`${path}.evidence_refs[${refIndex}]`, "不是输入 evidence ref");
    });
    literal(item.state, "PENDING_CONFIRMATION", `${path}.state`);
    literal(item.automatic_action, false, `${path}.automatic_action`);
  });
  deepEqual(draft.test_plan, context.test_plan, "$draft.test_plan");
  const expectedConclusion =
    preflight.status === "INCONCLUSIVE"
      ? "INCONCLUSIVE"
      : CONCLUSION_MAP.get(context.test_plan.rule_evaluation.state);
  literal(draft.test_conclusion, expectedConclusion, "$draft.test_conclusion");
  deepEqual(draft.stop_conditions, STOP_CONDITIONS, "$draft.stop_conditions");
  exactRecord(draft.next_review, ["date", "scheduled"], "$draft.next_review");
  literal(draft.next_review.date, context.review_window.next_review_date, "$draft.next_review.date");
  literal(draft.next_review.scheduled, false, "$draft.next_review.scheduled");
}

function evaluateChange(context, draft, preflight) {
  if (preflight.status === "BLOCKED") {
    literal(draft.change_request_draft, null, "$draft.change_request_draft");
  } else {
    const item = exactRecord(
      draft.change_request_draft,
      [
        "draft_ref",
        "claim_type",
        "state",
        "source_action_ref",
        "target",
        "proposed_patch",
        "evidence_refs",
        "executable",
        "human_confirmation_required",
      ],
      "$draft.change_request_draft",
    );
    literal(item.draft_ref, context.source_action.draft_ref, "$draft.change_request_draft.draft_ref");
    literal(item.claim_type, "DRAFT", "$draft.change_request_draft.claim_type");
    literal(item.state, "DRAFT", "$draft.change_request_draft.state");
    literal(item.source_action_ref, context.source_action.action_ref, "$draft.change_request_draft.source_action_ref");
    deepEqual(item.target, context.target, "$draft.change_request_draft.target");
    deepEqual(item.proposed_patch, context.proposed_patch, "$draft.change_request_draft.proposed_patch");
    deepEqual(item.evidence_refs, context.evidence.map((entry) => entry.evidence_ref), "$draft.change_request_draft.evidence_refs");
    literal(item.executable, false, "$draft.change_request_draft.executable");
    literal(item.human_confirmation_required, true, "$draft.change_request_draft.human_confirmation_required");
  }
  deepEqual(
    draft.policy_gaps,
    [
      { code: "POLICY_NOT_EVALUATED", blocking_execution: true },
      { code: "META_WRITE_NOT_AUTHORIZED", blocking_execution: true },
    ],
    "$draft.policy_gaps",
  );
  deepEqual(
    draft.approval_requirements,
    {
      web_approval_state: "NOT_REQUESTED",
      required_before_execution: true,
      approver_ref: null,
      expires_at: null,
    },
    "$draft.approval_requirements",
  );
  deepEqual(
    draft.execution,
    {
      status: "NOT_AUTHORIZED",
      change_request_id: null,
      submitted: false,
      approved: false,
      executed: false,
      external_write: false,
    },
    "$draft.execution",
  );
}

const WORKFLOW_EVALUATORS = {
  "facebook-ads-creative": evaluateCreative,
  "facebook-ads-campaign-builder": evaluateCampaign,
  "facebook-ads-daily-brief": evaluateDailyBrief,
  "facebook-ads-optimization": evaluateOptimization,
  "facebook-ads-change-management": evaluateChange,
};

export function evaluateWorkflowDraft(skill, context, draft) {
  const preflight = evaluateCommon(skill, context, draft);
  WORKFLOW_EVALUATORS[skill](context, draft, preflight);
  const checks = [
    "INPUT_CONTRACT",
    "TOP_LEVEL_CONTRACT",
    "PREFLIGHT_INTEGRITY",
    "SCOPE_INTEGRITY",
    "UNKNOWN_PRESERVATION",
    "WORKFLOW_CONTRACT",
    "HANDOFF_CONTRACT",
    "SAFETY_INVARIANTS",
  ];
  return {
    evaluation_schema_version: EVALUATION_SCHEMA_VERSION,
    evaluation_status: "PASS",
    skill,
    preflight_status: preflight.status,
    score: { passed: checks.length, total: checks.length, ratio: 1 },
    checks,
    external_write: false,
  };
}

function isWithinRoot(rootPath, candidatePath) {
  const pathFromRoot = relative(rootPath, candidatePath);
  return (
    pathFromRoot !== ".." &&
    !pathFromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromRoot)
  );
}

async function readInput(argument) {
  if (!argument || argument === "-") {
    const chunks = [];
    let total = 0;
    for await (const chunk of process.stdin) {
      total += chunk.length;
      if (total > MAX_BYTES) fail("$input", "输入超过 2 MiB 限制");
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  const candidate = resolve(REPOSITORY_ROOT, argument);
  const rootReal = await realpath(REPOSITORY_ROOT);
  const candidateReal = await realpath(candidate);
  if (!isWithinRoot(rootReal, candidateReal)) fail("$input", "文件必须位于当前仓库内");
  const stat = await lstat(candidate);
  if (stat.isSymbolicLink() || !stat.isFile()) fail("$input", "必须是仓库内的普通非符号链接文件");
  if (stat.size > MAX_BYTES) fail("$input", "文件超过 2 MiB 限制");
  return readFile(candidate, "utf8");
}

async function main() {
  try {
    const raw = await readInput(process.argv[2]);
    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch {
      fail("$input", "必须是有效 JSON");
    }
    exactRecord(envelope, ["skill", "context", "draft"], "$input");
    const result = evaluateWorkflowDraft(envelope.skill, envelope.context, envelope.draft);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    const safeError =
      error instanceof InvalidWorkflowDraft
        ? { code: error.code, path: error.path, statement: error.message }
        : {
            code: "WORKFLOW_DRAFT_EVALUATION_FAILED",
            path: "$input",
            statement: "无法安全评估工作流草稿",
          };
    process.stderr.write(
      `${JSON.stringify(
        {
          evaluation_schema_version: EVALUATION_SCHEMA_VERSION,
          evaluation_status: "REJECTED",
          ...safeError,
          external_write: false,
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
