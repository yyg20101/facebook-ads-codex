import { INPUT_SCHEMA_VERSION } from "../../.agents/skills/facebook-ads-analysis/scripts/validate-context.mjs";

function roundSix(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function derived(totals) {
  const ratio = (numerator, denominator, scale = 1) =>
    denominator === 0 ? null : roundSix((numerator / denominator) * scale);
  return {
    clickThroughRate: ratio(totals.clicks, totals.impressions),
    conversionRate: ratio(totals.conversions, totals.clicks),
    costPerClickMinorUnits: ratio(totals.spendMinorUnits, totals.clicks),
    costPerThousandImpressionsMinorUnits: ratio(
      totals.spendMinorUnits,
      totals.impressions,
      1_000,
    ),
    costPerConversionMinorUnits: ratio(
      totals.spendMinorUnits,
      totals.conversions,
    ),
  };
}

export function dailyItem(
  date,
  spendMinorUnits,
  impressions,
  clicks,
  conversions,
) {
  const totals = { spendMinorUnits, impressions, clicks, conversions };
  return { date, totals, derived: derived(totals) };
}

const QUALITY_SNAPSHOT = {
  stability_status: "STABLE",
  fetched_at: "2026-08-05T00:00:01Z",
  sync_run_ids: ["sync_fixture_01"],
};

function period(date, spendMinorUnits, impressions, clicks, conversions) {
  const totals = { spendMinorUnits, impressions, clicks, conversions };
  return {
    requestedRange: { dateStart: date, dateStop: date },
    actualRange: { dateStart: date, dateStop: date },
    coverage: { expectedDays: 1, observedDays: 1, complete: true },
    totals,
    derived: derived(totals),
  };
}

function metricChange(baseline, current) {
  const absoluteChange = current - baseline;
  return {
    baseline,
    current,
    absoluteChange,
    relativeChange: baseline === 0 ? null : absoluteChange / baseline,
    direction:
      baseline === current
        ? "UNCHANGED"
        : current > baseline
          ? "INCREASED"
          : "DECREASED",
    relativeChangeUnavailableReason: baseline === 0 ? "BASELINE_ZERO" : null,
  };
}

function changes(baseline, current) {
  return {
    totals: Object.fromEntries(
      Object.keys(baseline.totals).map((key) => [
        key,
        metricChange(baseline.totals[key], current.totals[key]),
      ]),
    ),
    derived: Object.fromEntries(
      Object.keys(baseline.derived).map((key) => [
        key,
        metricChange(baseline.derived[key], current.derived[key]),
      ]),
    ),
  };
}

function commonContext() {
  return {
    schema_version: INPUT_SCHEMA_VERSION,
    artifact_type: "CODEX_ANALYSIS_INPUT",
    source_kind: "FIXTURE",
    scope_and_freshness: {
      workspace_ref: "ws_fixture_01",
      account_ref: "fixture-ad-account-01",
      subject: { kind: "ACCOUNT", object: null },
      data_through: "2026-08-05T00:00:01Z",
      metric_context: {
        currency: "USD",
        timezoneName: "Etc/UTC",
        clickMetricKind: "ALL_CLICKS",
        conversionEventRef: "fixture-purchase",
        attributionSpecHash: "fixture-attribution-context",
        apiVersion: "v25.0",
      },
    },
    quality_evidence: {
      status: "PASS",
      all_checks_required: true,
      attested_range: { date_start: "2026-08-01", date_stop: "2026-08-05" },
      covered_object_count: 3,
      snapshot: structuredClone(QUALITY_SNAPSHOT),
    },
    observed_patterns: [],
    driver_inputs: {
      claim_type: "FACT",
      kind: "NONE",
      ordering: "NOT_APPLICABLE",
      ranking_applied: false,
      reconciliation: null,
      items: [],
    },
    unknowns: [
      {
        claim_type: "UNKNOWN",
        code: "CAUSAL_DRIVERS_NOT_ESTABLISHED",
        statement: "离线周期差异不构成因果解释。",
      },
      {
        claim_type: "UNKNOWN",
        code: "BUSINESS_THRESHOLDS_NOT_DEFINED",
        statement: "fixture 不定义业务目标、赢家规则或优化阈值。",
      },
      {
        claim_type: "UNKNOWN",
        code: "REAL_ACCOUNT_NOT_CONNECTED",
        statement: "当前上下文未连接或验证任何真实广告账户。",
      },
      {
        claim_type: "UNKNOWN",
        code: "EXTERNAL_CONVERSION_DATA_NOT_INCLUDED",
        statement: "当前上下文不包含站外、CRM 或其他客户转化数据。",
      },
    ],
    guardrails: {
      quality_preflight_passed: true,
      fixture_data_only: true,
      real_data_connected: false,
      thresholds_applied: false,
      causal_claims: false,
      ranking_applied: false,
      recommendations_generated: false,
      external_write: false,
      persisted: false,
    },
    codex_handoff: {
      intended_skill: "facebook-ads-analysis",
      mode: "MANUAL_CONTEXT",
      context_only: true,
      required_claim_labels: ["FACT", "INFERENCE", "UNKNOWN"],
      prohibited_uses: [
        "CLAIM_REAL_DATA",
        "CLAIM_CAUSALITY",
        "EXECUTE_AD_WRITE",
        "INVENT_BUSINESS_THRESHOLDS",
      ],
    },
    warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  };
}

export function createAccountComparisonContext() {
  const baseline = period("2026-08-02", 10_000, 8_000, 160, 4);
  const current = period("2026-08-04", 12_000, 10_000, 250, 6);
  const snapshot = {
    stabilityStatus: QUALITY_SNAPSHOT.stability_status,
    fetchedAt: QUALITY_SNAPSHOT.fetched_at,
    syncRunIds: [...QUALITY_SNAPSHOT.sync_run_ids],
  };
  const context = commonContext();
  return {
    ...context,
    analysis_kind: "ACCOUNT_COMPARISON",
    fact_evidence: {
      claim_type: "FACT",
      kind: "PERIOD_COMPARISON",
      baseline: { ...baseline, snapshot: structuredClone(snapshot) },
      current: { ...current, snapshot: structuredClone(snapshot) },
      changes: changes(baseline, current),
    },
    observed_patterns: [
      {
        claim_type: "FACT",
        code: "CTR_UP_CONVERSION_RATE_DOWN",
        severity: "WATCH",
        finding_confidence: "CONFIRMED_PATTERN",
        causal_claim: false,
        summary:
          "Click-through rate increased while reported conversion rate decreased.",
        evidence_metric_paths: [
          "changes.derived.clickThroughRate",
          "changes.derived.conversionRate",
        ],
      },
      {
        claim_type: "FACT",
        code: "CONVERSION_VOLUME_UP_COST_DOWN",
        severity: "INFO",
        finding_confidence: "CONFIRMED_PATTERN",
        causal_claim: false,
        summary:
          "Reported conversions increased while reported cost per conversion decreased.",
        evidence_metric_paths: [
          "changes.totals.conversions",
          "changes.derived.costPerConversionMinorUnits",
        ],
      },
    ],
  };
}

export function createObjectComparisonContext() {
  const context = createAccountComparisonContext();
  context.analysis_kind = "OBJECT_COMPARISON";
  context.scope_and_freshness.subject = {
    kind: "OBJECT",
    object: {
      display_label: "虚构 Campaign",
      level: "CAMPAIGN",
      object_ref: "fixture-campaign-01",
    },
  };
  return context;
}

export function createDirectChildDailyTrendContext() {
  const childOne = [
    dailyItem("2026-08-02", 6_000, 4_800, 100, 3),
    dailyItem("2026-08-03", 6_500, 5_200, 120, 3),
    dailyItem("2026-08-04", 7_000, 5_600, 150, 4),
  ];
  const childTwo = [
    dailyItem("2026-08-02", 4_000, 3_200, 60, 1),
    dailyItem("2026-08-03", 4_500, 3_800, 80, 2),
    dailyItem("2026-08-04", 5_000, 4_400, 100, 2),
  ];
  const parent = childOne.map((item, index) =>
    dailyItem(
      item.date,
      item.totals.spendMinorUnits + childTwo[index].totals.spendMinorUnits,
      item.totals.impressions + childTwo[index].totals.impressions,
      item.totals.clicks + childTwo[index].totals.clicks,
      item.totals.conversions + childTwo[index].totals.conversions,
    ),
  );
  const context = commonContext();
  return {
    ...context,
    analysis_kind: "DIRECT_CHILD_DAILY_TREND",
    scope_and_freshness: {
      ...context.scope_and_freshness,
      subject: {
        kind: "DIRECT_CHILDREN",
        parent: {
          display_label: "虚构 Campaign",
          level: "CAMPAIGN",
          object_ref: "fixture-campaign-01",
        },
        child_level: "AD_SET",
      },
    },
    fact_evidence: {
      claim_type: "FACT",
      kind: "DAILY_TREND",
      requested_range: { dateStart: "2026-08-02", dateStop: "2026-08-04" },
      point_count: 3,
      metric_keys: [
        "spendMinorUnits",
        "impressions",
        "clicks",
        "conversions",
        "clickThroughRate",
        "conversionRate",
        "costPerClickMinorUnits",
        "costPerThousandImpressionsMinorUnits",
        "costPerConversionMinorUnits",
      ],
      daily_items: parent,
    },
    driver_inputs: {
      claim_type: "FACT",
      kind: "DIRECT_CHILDREN_DAILY",
      ordering: "STABLE_FIXTURE_OBJECT_ID_ASC",
      ranking_applied: false,
      reconciliation: {
        additive_metric_keys: [
          "spendMinorUnits",
          "impressions",
          "clicks",
          "conversions",
        ],
        daily_matches_parent: true,
      },
      items: [
        {
          claim_type: "FACT",
          object: {
            display_label: "虚构 Ad Set 01",
            level: "AD_SET",
            object_ref: "fixture-ad-set-01",
          },
          daily_items: childOne,
        },
        {
          claim_type: "FACT",
          object: {
            display_label: "虚构 Ad Set 02",
            level: "AD_SET",
            object_ref: "fixture-ad-set-02",
          },
          daily_items: childTwo,
        },
      ],
    },
  };
}

export function createObjectDailyTrendContext() {
  const context = createDirectChildDailyTrendContext();
  context.analysis_kind = "OBJECT_DAILY_TREND";
  context.scope_and_freshness.subject = {
    kind: "OBJECT",
    object: {
      display_label: "虚构 Campaign",
      level: "CAMPAIGN",
      object_ref: "fixture-campaign-01",
    },
  };
  context.driver_inputs = {
    claim_type: "FACT",
    kind: "NONE",
    ordering: "NOT_APPLICABLE",
    ranking_applied: false,
    reconciliation: null,
    items: [],
  };
  return context;
}

export function createDirectChildBreakdownContext() {
  const context = createAccountComparisonContext();
  const childOneBaseline = period("2026-08-02", 6_000, 4_800, 100, 3);
  const childOneCurrent = period("2026-08-04", 7_000, 5_600, 150, 4);
  const childTwoBaseline = period("2026-08-02", 4_000, 3_200, 60, 1);
  const childTwoCurrent = period("2026-08-04", 5_000, 4_400, 100, 2);
  return {
    ...context,
    analysis_kind: "DIRECT_CHILD_BREAKDOWN",
    scope_and_freshness: {
      ...context.scope_and_freshness,
      subject: {
        kind: "DIRECT_CHILDREN",
        parent: {
          display_label: "虚构 Campaign",
          level: "CAMPAIGN",
          object_ref: "fixture-campaign-01",
        },
        child_level: "AD_SET",
      },
    },
    observed_patterns: [],
    driver_inputs: {
      claim_type: "FACT",
      kind: "DIRECT_CHILDREN",
      ordering: "STABLE_FIXTURE_OBJECT_ID_ASC",
      ranking_applied: false,
      reconciliation: {
        additive_metric_keys: [
          "spendMinorUnits",
          "impressions",
          "clicks",
          "conversions",
        ],
        baseline_matches_parent: true,
        current_matches_parent: true,
      },
      items: [
        {
          claim_type: "FACT",
          object: {
            display_label: "虚构 Ad Set 01",
            level: "AD_SET",
            object_ref: "fixture-ad-set-01",
          },
          baseline: childOneBaseline,
          current: childOneCurrent,
          changes: changes(childOneBaseline, childOneCurrent),
        },
        {
          claim_type: "FACT",
          object: {
            display_label: "虚构 Ad Set 02",
            level: "AD_SET",
            object_ref: "fixture-ad-set-02",
          },
          baseline: childTwoBaseline,
          current: childTwoCurrent,
          changes: changes(childTwoBaseline, childTwoCurrent),
        },
      ],
    },
  };
}

export function createAllFixtureContexts() {
  return [
    createAccountComparisonContext(),
    createObjectComparisonContext(),
    createDirectChildBreakdownContext(),
    createObjectDailyTrendContext(),
    createDirectChildDailyTrendContext(),
  ];
}
