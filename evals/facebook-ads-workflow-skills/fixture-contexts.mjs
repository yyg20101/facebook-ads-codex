const SUPPORTED_CAMPAIGN_FIELDS = [
  "campaign.objective",
  "ad_set.conversion_location",
  "ad_set.optimization_event",
  "ad_set.billing_event",
  "ad_set.budget",
  "ad_set.schedule",
  "ad_set.audience",
  "ad_set.placements",
  "ad.creative_ref",
  "ad.primary_text",
  "ad.headline",
  "ad.call_to_action",
  "landing_page.destination_ref",
];

function clone(value) {
  return structuredClone(value);
}

export function createCreativeContext() {
  return {
    schema_version: "facebook-ads-creative-context/v1",
    artifact_type: "CODEX_CREATIVE_INPUT",
    source_kind: "FIXTURE",
    scenario_id: "SC-01",
    scope: {
      workspace_ref: "ws_fixture_01",
      account_ref: "fixture-ad-account-01",
      product_ref: "fixture-product-01",
    },
    product: {
      name: "虚构夏日轻装",
      category: "虚构服饰",
      offer: "轻量通勤服饰信息，不包含价格或折扣",
      approved_messages: [
        {
          message: "轻盈面料，适合夏日通勤场景",
          evidence_ref: "fixture-product-claim-01",
        },
      ],
      prohibited_claims: ["保证效果"],
    },
    communication_goal: "PRODUCT_CONSIDERATION",
    audience: {
      locations: ["FIXTURE-CN"],
      age_min: 18,
      age_max: 44,
      notes: ["虚构通勤场景受众"],
    },
    placements: ["FEED", "STORY"],
    brand: {
      tone: ["CLEAR", "RELAXED"],
      required_terms: ["夏日轻装"],
      prohibited_terms: ["保证"],
    },
    source_assets: [
      {
        asset_ref: "fixture-asset-01",
        media_type: "IMAGE",
        source_type: "OWNED",
        commercial_rights: "CONFIRMED",
        ai_generated: false,
        generation_disclosure_required: false,
        notes: ["固定虚构品牌拍摄素材"],
      },
    ],
    variant_request: {
      count: 3,
      controlled_variable: "COPY_HOOK",
      fixed_elements: ["PRODUCT_MESSAGE", "AUDIENCE", "PLACEMENT"],
    },
    known_constraints: ["只形成文本和视觉方向草稿"],
    unknowns: [
      {
        claim_type: "UNKNOWN",
        code: "META_POLICY_REVIEW_NOT_RUN",
        statement: "当前 fixture 未执行 Meta 政策审核。",
      },
    ],
    guardrails: {
      fixture_data_only: true,
      external_search_allowed: false,
      image_generation_allowed: false,
      policy_approval_guaranteed: false,
      performance_guaranteed: false,
      external_write: false,
      persisted: false,
    },
    codex_handoff: {
      intended_skill: "facebook-ads-creative",
      mode: "MANUAL_CONTEXT",
      context_only: true,
      target_web_area: "ASSET_CENTER",
    },
  };
}

export function createBlockedCreativeContext() {
  const context = createCreativeContext();
  context.source_assets[0].commercial_rights = "UNCONFIRMED";
  return context;
}

export function createCampaignContext() {
  return {
    schema_version: "facebook-ads-campaign-context/v1",
    artifact_type: "CODEX_CAMPAIGN_DRAFT_INPUT",
    source_kind: "FIXTURE",
    scenario_id: "SC-01",
    scope: {
      workspace_ref: "ws_fixture_01",
      account_ref: "fixture-ad-account-01",
    },
    campaign: {
      name: "虚构夏日轻装 Campaign",
      objective: "OUTCOME_SALES",
      buying_type: "AUCTION",
      special_ad_categories: ["NONE"],
    },
    ad_set: {
      name: "虚构夏日轻装 Ad Set",
      conversion_location: "WEBSITE",
      optimization_event: "PURCHASE",
      billing_event: "IMPRESSIONS",
      budget: { amount_minor: 10_000, currency: "CNY", period: "DAILY" },
      schedule: { start_date: "2026-08-10", end_date: "2026-08-17" },
      audience: {
        locations: ["FIXTURE-CN"],
        age_min: 18,
        age_max: 44,
        notes: ["固定虚构受众描述"],
      },
      placements: ["FEED", "STORY"],
    },
    ad: {
      name: "虚构夏日轻装 Ad",
      creative_ref: "fixture-creative-01",
      primary_text: "待人工评审的虚构广告正文",
      headline: "待人工评审的虚构标题",
      description: "待人工评审的虚构描述",
      call_to_action: "LEARN_MORE",
    },
    asset: {
      asset_ref: "fixture-asset-01",
      source_type: "OWNED",
      commercial_rights: "CONFIRMED",
      review_state: "REVIEWED",
    },
    landing_page: {
      destination_ref: "fixture-destination-01",
      domain_review_state: "REVIEWED",
    },
    supported_fields: clone(SUPPORTED_CAMPAIGN_FIELDS),
    known_constraints: ["未连接真实广告账户"],
    unknowns: [
      {
        claim_type: "UNKNOWN",
        code: "ACCOUNT_TIMEZONE_NOT_CONNECTED",
        statement: "fixture 未连接真实账户，因此未验证账户时区。",
      },
    ],
    guardrails: {
      fixture_data_only: true,
      meta_connection_allowed: false,
      publish_allowed: false,
      policy_approval_guaranteed: false,
      external_write: false,
      persisted: false,
      approvals_bypassed: false,
    },
    codex_handoff: {
      intended_skill: "facebook-ads-campaign-builder",
      mode: "MANUAL_CONTEXT",
      context_only: true,
      target_web_area: "CAMPAIGN_DRAFTS",
    },
  };
}

export function createBlockedCampaignContext() {
  const context = createCampaignContext();
  context.campaign.objective = "UNRESOLVED";
  return context;
}

export function createDailyBriefContext({ withItems = false } = {}) {
  const materialEvents = withItems
    ? [
        {
          event_ref: "fixture-event-01",
          event_type: "REVIEW",
          severity: "WARNING",
          statement: "一个虚构广告审核被拒绝，需人工查看原因。",
          evidence_paths: ["$.review_summary.rejected"],
        },
      ]
    : [];
  const openItems = withItems
    ? [
        {
          item_ref: "fixture-open-item-01",
          kind: "REVIEW",
          state: "OPEN",
          statement: "人工查看固定 fixture 审核原因。",
          evidence_paths: ["$.material_events[0]"],
        },
      ]
    : [];
  return {
    schema_version: "facebook-ads-daily-brief-context/v1",
    artifact_type: "CODEX_DAILY_BRIEF_INPUT",
    source_kind: "FIXTURE",
    scenario_id: "SC-02",
    scope: {
      workspace_ref: "ws_fixture_01",
      account_ref: "fixture-ad-account-01",
    },
    report_date: "2026-08-09",
    freshness: { updated_at: "2026-08-09T08:00:00Z", state: "STABLE" },
    data_quality: { status: "PASS", checks_failed: [] },
    delivery_summary: {
      spend_minor: 10_000,
      impressions: 2_000,
      clicks: 120,
      conversions: 8,
      currency: "CNY",
    },
    review_summary: { approved: 2, rejected: withItems ? 1 : 0, pending: 0 },
    material_events: materialEvents,
    open_items: openItems,
    known_constraints: ["只使用固定虚构汇总"],
    unknowns: [
      {
        claim_type: "UNKNOWN",
        code: "REALTIME_REFRESH_NOT_RUN",
        statement: "当前 fixture 未连接实时数据源。",
      },
    ],
    guardrails: {
      fixture_data_only: true,
      meta_connection_allowed: false,
      scheduled_delivery_allowed: false,
      optimization_recommendations_allowed: false,
      change_request_allowed: false,
      external_write: false,
      persisted: false,
    },
    codex_handoff: {
      intended_skill: "facebook-ads-daily-brief",
      mode: "MANUAL_CONTEXT",
      context_only: true,
      target_web_area: "DAILY_BRIEF",
    },
  };
}

export function createDataIssueDailyBriefContext() {
  const context = createDailyBriefContext();
  context.freshness.state = "STALE";
  return context;
}

export function createOptimizationContext() {
  return {
    schema_version: "facebook-ads-optimization-context/v1",
    artifact_type: "CODEX_OPTIMIZATION_INPUT",
    source_kind: "FIXTURE",
    scenario_id: "SC-03",
    scope: {
      workspace_ref: "ws_fixture_01",
      account_ref: "fixture-ad-account-01",
      object_ref: "fixture-campaign-01",
      object_type: "CAMPAIGN",
    },
    evidence: [
      {
        evidence_ref: "fixture-evidence-01",
        claim_type: "FACT",
        statement: "固定 fixture 中两个变体完成同周期观察。",
        source_paths: ["$.variants", "$.review_window"],
      },
    ],
    test_plan: {
      test_ref: "fixture-test-01",
      hypothesis: "在固定其他条件时测试一个素材变量。",
      primary_variable: "CREATIVE",
      primary_metric: "CONVERSIONS",
      guardrail_metrics: ["SPEND"],
      allocation_rule: "两个变体使用固定且相同的 fixture 分配规则。",
      rule_evaluation: {
        state: "SUPPORTS_ITERATE",
        statement: "现有规则评估支持继续迭代，但不支持执行投放变更。",
        evidence_refs: ["fixture-evidence-01"],
      },
    },
    validity: {
      tracking_state: "STABLE",
      mid_test_configuration_change: false,
      allocation_state: "AS_PLANNED",
      sample_state: "SUFFICIENT",
      comparison_window_complete: true,
    },
    variants: [
      {
        variant_ref: "fixture-variant-01",
        label: "Control",
        metrics: {
          spend_minor: 10_000,
          impressions: 2_000,
          clicks: 120,
          conversions: 8,
          conversion_value_minor: 16_000,
          currency: "CNY",
        },
      },
      {
        variant_ref: "fixture-variant-02",
        label: "Variant",
        metrics: {
          spend_minor: 10_200,
          impressions: 2_050,
          clicks: 128,
          conversions: 9,
          conversion_value_minor: 17_000,
          currency: "CNY",
        },
      },
    ],
    allowed_action_types: [
      "CONTINUE_OBSERVATION",
      "COLLECT_DATA",
      "DRAFT_NEXT_TEST",
      "REQUEST_HUMAN_REVIEW",
      "PROPOSE_CREATIVE_CHANGE",
    ],
    review_window: {
      start_date: "2026-08-01",
      end_date: "2026-08-07",
      next_review_date: "2026-08-10",
    },
    known_constraints: ["不得从 fixture 指标推断因果"],
    unknowns: [
      {
        claim_type: "UNKNOWN",
        code: "EXTERNAL_CAUSAL_FACTORS_NOT_PROVIDED",
        statement: "当前 fixture 未提供外部因果因素。",
      },
    ],
    guardrails: {
      fixture_data_only: true,
      meta_connection_allowed: false,
      causal_claims_allowed: false,
      automatic_actions_allowed: false,
      change_request_allowed: false,
      external_write: false,
      persisted: false,
    },
    codex_handoff: {
      intended_skill: "facebook-ads-optimization",
      mode: "MANUAL_CONTEXT",
      context_only: true,
      target_web_area: "OPTIMIZATION_REVIEW",
    },
  };
}

export function createInconclusiveOptimizationContext() {
  const context = createOptimizationContext();
  context.validity.sample_state = "INSUFFICIENT";
  return context;
}

export function createChangeContext() {
  return {
    schema_version: "facebook-ads-change-context/v1",
    artifact_type: "CODEX_CHANGE_DRAFT_INPUT",
    source_kind: "FIXTURE",
    scenario_id: "SC-03",
    scope: {
      workspace_ref: "ws_fixture_01",
      account_ref: "fixture-ad-account-01",
    },
    source_action: {
      draft_ref: "fixture-change-draft-01",
      action_ref: "fixture-optimization-action-01",
      source_skill: "facebook-ads-optimization",
      action_type: "PROPOSE_CREATIVE_CHANGE",
      statement: "待人工评审的虚构素材替换建议。",
      state: "PENDING_CONFIRMATION",
    },
    target: {
      object_ref: "fixture-ad-01",
      object_type: "AD",
      current_state: "ACTIVE",
    },
    proposed_patch: [
      {
        field: "creative_ref",
        operation: "REPLACE",
        before: "fixture-creative-01",
        after: "fixture-creative-02",
      },
    ],
    evidence: [
      {
        evidence_ref: "fixture-evidence-01",
        claim_type: "FACT",
        statement: "结构化优化输入给出了待评审的素材变化。",
        source_paths: ["$.source_action", "$.proposed_patch"],
      },
    ],
    policy_context: {
      policy_state: "NOT_EVALUATED",
      emergency_stop: false,
      write_authorized: false,
    },
    approval_context: {
      web_approval_state: "NOT_REQUESTED",
      approver_ref: null,
      expires_at: null,
    },
    known_constraints: ["开发期不形成真实变更请求"],
    unknowns: [
      {
        claim_type: "UNKNOWN",
        code: "POLICY_DETAILS_NOT_PROVIDED",
        statement: "当前 fixture 未提供可执行政策结果。",
      },
    ],
    guardrails: {
      fixture_data_only: true,
      meta_connection_allowed: false,
      submission_allowed: false,
      approval_execution_allowed: false,
      natural_language_execution_allowed: false,
      external_write: false,
      persisted: false,
    },
    codex_handoff: {
      intended_skill: "facebook-ads-change-management",
      mode: "MANUAL_CONTEXT",
      context_only: true,
      target_web_area: "CHANGE_DRAFTS",
    },
  };
}

export function createBlockedChangeContext() {
  const context = createChangeContext();
  context.target.current_state = "UNKNOWN";
  return context;
}

export function createAllWorkflowContexts() {
  return [
    createCreativeContext(),
    createCampaignContext(),
    createDailyBriefContext(),
    createOptimizationContext(),
    createChangeContext(),
  ];
}
