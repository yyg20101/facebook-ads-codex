import type { OfflineDirectChildBreakdownResponse } from "./offlineBreakdown";
import type { OfflineDirectChildTrendResponse } from "./offlineChildTrend";
import {
  OfflineComparisonError,
  type ComparisonPeriod,
  type DiagnosticSignal,
  type OfflineComparisonResponse,
  type PeriodMetricChanges,
} from "./offlineComparison";
import {
  offlineAnalysisContextMatchesAttestation,
  offlineDataQualityAttestsRanges,
  type OfflineDataQualityAttestation,
} from "./offlineDataQuality";
import type {
  OfflineAdObject,
  OfflineAdObjectComparisonResponse,
} from "./offlineHierarchy";
import type {
  OfflineDailyTrendItem,
  OfflineObjectTrendResponse,
  OfflineTrendRequest,
} from "./offlineTrend";

export const OFFLINE_CODEX_EVIDENCE_SCHEMA_VERSION =
  "facebook-ads-offline-analysis-context/v2" as const;

export type OfflineCodexEvidenceSource =
  | OfflineComparisonResponse
  | OfflineAdObjectComparisonResponse
  | OfflineDirectChildBreakdownResponse
  | OfflineObjectTrendResponse
  | OfflineDirectChildTrendResponse;

type OfflineCodexAnalysisKind =
  | "ACCOUNT_COMPARISON"
  | "DIRECT_CHILD_BREAKDOWN"
  | "DIRECT_CHILD_DAILY_TREND"
  | "OBJECT_COMPARISON"
  | "OBJECT_DAILY_TREND";

interface OfflineCodexObjectReference {
  display_label: string;
  level: OfflineAdObject["objectLevel"];
  object_ref: string;
}

interface OfflineCodexPeriodEvidence extends ComparisonPeriod {
  snapshot: OfflineComparisonResponse["context"]["periodContext"]["baseline"];
}

interface OfflineCodexDriverItem {
  claim_type: "FACT";
  object: OfflineCodexObjectReference;
  baseline: ComparisonPeriod;
  current: ComparisonPeriod;
  changes: PeriodMetricChanges;
}

interface OfflineCodexDailyDriverItem {
  claim_type: "FACT";
  object: OfflineCodexObjectReference;
  daily_items: OfflineDailyTrendItem[];
}

interface OfflineCodexComparisonFactEvidence {
  claim_type: "FACT";
  kind: "PERIOD_COMPARISON";
  baseline: OfflineCodexPeriodEvidence;
  current: OfflineCodexPeriodEvidence;
  changes: PeriodMetricChanges;
}

interface OfflineCodexDailyTrendFactEvidence {
  claim_type: "FACT";
  kind: "DAILY_TREND";
  requested_range: OfflineTrendRequest;
  point_count: number;
  metric_keys: readonly [
    "spendMinorUnits",
    "impressions",
    "clicks",
    "conversions",
    "clickThroughRate",
    "conversionRate",
    "costPerClickMinorUnits",
    "costPerThousandImpressionsMinorUnits",
    "costPerConversionMinorUnits",
  ];
  daily_items: OfflineDailyTrendItem[];
}

type OfflineCodexDriverInputs =
  | {
      claim_type: "FACT";
      kind: "NONE";
      ordering: "NOT_APPLICABLE";
      ranking_applied: false;
      reconciliation: null;
      items: [];
    }
  | {
      claim_type: "FACT";
      kind: "DIRECT_CHILDREN";
      ordering: "STABLE_FIXTURE_OBJECT_ID_ASC";
      ranking_applied: false;
      reconciliation: {
        additive_metric_keys: string[];
        baseline_matches_parent: true;
        current_matches_parent: true;
      };
      items: OfflineCodexDriverItem[];
    }
  | {
      claim_type: "FACT";
      kind: "DIRECT_CHILDREN_DAILY";
      ordering: "STABLE_FIXTURE_OBJECT_ID_ASC";
      ranking_applied: false;
      reconciliation: {
        additive_metric_keys: string[];
        daily_matches_parent: true;
      };
      items: OfflineCodexDailyDriverItem[];
    };

export interface OfflineCodexEvidenceBundle {
  schema_version: typeof OFFLINE_CODEX_EVIDENCE_SCHEMA_VERSION;
  artifact_type: "CODEX_ANALYSIS_INPUT";
  source_kind: "FIXTURE";
  analysis_kind: OfflineCodexAnalysisKind;
  scope_and_freshness: {
    workspace_ref: string;
    account_ref: string;
    subject:
      | { kind: "ACCOUNT"; object: null }
      | { kind: "OBJECT"; object: OfflineCodexObjectReference }
      | {
          kind: "DIRECT_CHILDREN";
          parent: OfflineCodexObjectReference;
          child_level: "AD" | "AD_SET";
        };
    data_through: string | null;
    metric_context: OfflineComparisonResponse["context"]["metricContext"];
  };
  quality_evidence: {
    status: "PASS";
    all_checks_required: true;
    attested_range: {
      date_start: string;
      date_stop: string;
    };
    covered_object_count: number;
    snapshot: {
      stability_status: OfflineDataQualityAttestation["stabilityStatus"];
      fetched_at: string;
      sync_run_ids: string[];
    };
  };
  fact_evidence:
    | OfflineCodexComparisonFactEvidence
    | OfflineCodexDailyTrendFactEvidence;
  observed_patterns: Array<{
    claim_type: "FACT";
    code: DiagnosticSignal["code"];
    severity: DiagnosticSignal["severity"];
    finding_confidence: DiagnosticSignal["findingConfidence"];
    causal_claim: false;
    summary: string;
    evidence_metric_paths: string[];
  }>;
  driver_inputs: OfflineCodexDriverInputs;
  unknowns: Array<{
    claim_type: "UNKNOWN";
    code:
      | "BUSINESS_THRESHOLDS_NOT_DEFINED"
      | "CAUSAL_DRIVERS_NOT_ESTABLISHED"
      | "EXTERNAL_CONVERSION_DATA_NOT_INCLUDED"
      | "REAL_ACCOUNT_NOT_CONNECTED";
    statement: string;
  }>;
  guardrails: {
    quality_preflight_passed: true;
    fixture_data_only: true;
    real_data_connected: false;
    thresholds_applied: false;
    causal_claims: false;
    ranking_applied: false;
    recommendations_generated: false;
    external_write: false;
    persisted: false;
  };
  codex_handoff: {
    intended_skill: "facebook-ads-analysis";
    mode: "MANUAL_CONTEXT";
    context_only: true;
    required_claim_labels: ["FACT", "INFERENCE", "UNKNOWN"];
    prohibited_uses: [
      "CLAIM_REAL_DATA",
      "CLAIM_CAUSALITY",
      "EXECUTE_AD_WRITE",
      "INVENT_BUSINESS_THRESHOLDS",
    ];
  };
  warnings: string[];
}

function rejectEvidence(message: string): never {
  throw new OfflineComparisonError("INVALID_EVIDENCE_SOURCE", message);
}

function copyPeriod(
  period: ComparisonPeriod,
  snapshot: OfflineComparisonResponse["context"]["periodContext"]["baseline"],
): OfflineCodexPeriodEvidence {
  return {
    requestedRange: { ...period.requestedRange },
    actualRange: { ...period.actualRange },
    coverage: { ...period.coverage },
    totals: { ...period.totals },
    derived: { ...period.derived },
    snapshot: {
      stabilityStatus: snapshot.stabilityStatus,
      fetchedAt: snapshot.fetchedAt,
      syncRunIds: [...snapshot.syncRunIds],
    },
  };
}

function copyChanges(changes: PeriodMetricChanges): PeriodMetricChanges {
  return {
    totals: {
      spendMinorUnits: { ...changes.totals.spendMinorUnits },
      impressions: { ...changes.totals.impressions },
      clicks: { ...changes.totals.clicks },
      conversions: { ...changes.totals.conversions },
    },
    derived: {
      clickThroughRate: { ...changes.derived.clickThroughRate },
      conversionRate: { ...changes.derived.conversionRate },
      costPerClickMinorUnits: { ...changes.derived.costPerClickMinorUnits },
      costPerThousandImpressionsMinorUnits: {
        ...changes.derived.costPerThousandImpressionsMinorUnits,
      },
      costPerConversionMinorUnits: {
        ...changes.derived.costPerConversionMinorUnits,
      },
    },
  };
}

function copyComparisonPeriod(period: ComparisonPeriod): ComparisonPeriod {
  return {
    requestedRange: { ...period.requestedRange },
    actualRange: { ...period.actualRange },
    coverage: { ...period.coverage },
    totals: { ...period.totals },
    derived: { ...period.derived },
  };
}

function objectReference(object: OfflineAdObject): OfflineCodexObjectReference {
  return {
    display_label: object.displayName,
    level: object.objectLevel,
    object_ref: object.externalObjectRef,
  };
}

function isDirectChildBreakdown(
  source: OfflineCodexEvidenceSource,
): source is OfflineDirectChildBreakdownResponse {
  return (
    "parent" in source.data &&
    "items" in source.data &&
    !("parentItems" in source.data)
  );
}

function isDirectChildTrend(
  source: OfflineCodexEvidenceSource,
): source is OfflineDirectChildTrendResponse {
  return "parentItems" in source.data;
}

function isObjectTrend(
  source: OfflineCodexEvidenceSource,
): source is OfflineObjectTrendResponse {
  return "object" in source.data && "requestedRange" in source.data;
}

function isObjectComparison(
  source: OfflineCodexEvidenceSource,
): source is OfflineAdObjectComparisonResponse {
  return "object" in source.data && !("requestedRange" in source.data);
}

const ADDITIVE_METRIC_KEYS = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions",
] as const;

const TREND_METRIC_KEYS = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions",
  "clickThroughRate",
  "conversionRate",
  "costPerClickMinorUnits",
  "costPerThousandImpressionsMinorUnits",
  "costPerConversionMinorUnits",
] as const;

const DERIVED_METRIC_KEYS = [
  "clickThroughRate",
  "conversionRate",
  "costPerClickMinorUnits",
  "costPerThousandImpressionsMinorUnits",
  "costPerConversionMinorUnits",
] as const;

function rangesEqual(
  left: ComparisonPeriod["requestedRange"],
  right: ComparisonPeriod["requestedRange"],
): boolean {
  return (
    left.dateStart === right.dateStart && left.dateStop === right.dateStop
  );
}

function periodIsCompleteAndExact(
  period: ComparisonPeriod,
  expectedDays: number,
): boolean {
  return (
    period.coverage.complete === true &&
    period.coverage.expectedDays === expectedDays &&
    period.coverage.observedDays === expectedDays &&
    rangesEqual(period.requestedRange, period.actualRange)
  );
}

function metricRollupMatches(
  parentValue: number | null,
  childValues: readonly (number | null)[],
): boolean {
  if (parentValue === null) {
    return childValues.every((value) => value === null);
  }
  if (childValues.some((value) => value === null)) {
    return false;
  }
  const total = childValues.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  );
  return Number.isSafeInteger(total) && total === parentValue;
}

function directChildRollupMatches(
  source: OfflineDirectChildBreakdownResponse,
  period: "baseline" | "current",
): boolean {
  return ADDITIVE_METRIC_KEYS.every((metric) =>
    metricRollupMatches(
      source.data[period].totals[metric],
      source.data.items.map((item) => item[period].totals[metric]),
    ),
  );
}

function parseIsoDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null;
}

function expectedTrendDates(request: OfflineTrendRequest): string[] | null {
  const start = parseIsoDate(request.dateStart);
  const stop = parseIsoDate(request.dateStop);
  if (start === null || stop === null) {
    return null;
  }
  const dayCount = (stop - start) / 86_400_000 + 1;
  if (!Number.isSafeInteger(dayCount) || dayCount < 3 || dayCount > 31) {
    return null;
  }
  return Array.from({ length: dayCount }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10),
  );
}

function roundSix(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function scaledRatio(
  numerator: number | null,
  denominator: number | null,
  scale = 1,
): number | null {
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }
  return roundSix((numerator / denominator) * scale);
}

function dailyItemIsValid(
  item: OfflineDailyTrendItem,
  expectedDate: string,
): boolean {
  const totalsAreValid = ADDITIVE_METRIC_KEYS.every((key) => {
    const value = item.totals[key];
    return (
      value === null ||
      (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
    );
  });
  const derivedAreValid = DERIVED_METRIC_KEYS.every((key) => {
    const value = item.derived[key];
    return (
      value === null ||
      (typeof value === "number" && Number.isFinite(value) && value >= 0)
    );
  });
  if (item.date !== expectedDate || !totalsAreValid || !derivedAreValid) {
    return false;
  }
  const expectedDerived = {
    clickThroughRate: scaledRatio(
      item.totals.clicks,
      item.totals.impressions,
    ),
    conversionRate: scaledRatio(
      item.totals.conversions,
      item.totals.clicks,
    ),
    costPerClickMinorUnits: scaledRatio(
      item.totals.spendMinorUnits,
      item.totals.clicks,
    ),
    costPerThousandImpressionsMinorUnits: scaledRatio(
      item.totals.spendMinorUnits,
      item.totals.impressions,
      1_000,
    ),
    costPerConversionMinorUnits: scaledRatio(
      item.totals.spendMinorUnits,
      item.totals.conversions,
    ),
  };
  return DERIVED_METRIC_KEYS.every(
    (key) => item.derived[key] === expectedDerived[key],
  );
}

function dailySeriesIsComplete(
  items: readonly OfflineDailyTrendItem[],
  expectedDates: readonly string[],
): boolean {
  return (
    items.length === expectedDates.length &&
    items.every((item, index) =>
      dailyItemIsValid(item, expectedDates[index] ?? ""),
    )
  );
}

function copyDailyItems(
  items: readonly OfflineDailyTrendItem[],
): OfflineDailyTrendItem[] {
  return items.map((item) => ({
    date: item.date,
    totals: { ...item.totals },
    derived: { ...item.derived },
  }));
}

function directChildDailyRollupMatches(
  source: OfflineDirectChildTrendResponse,
): boolean {
  return source.data.parentItems.every((parentItem, dayIndex) =>
    ADDITIVE_METRIC_KEYS.every((metric) =>
      metricRollupMatches(
        parentItem.totals[metric],
        source.data.items.map(
          (item) => item.items[dayIndex]?.totals[metric] ?? null,
        ),
      ),
    ),
  );
}

function assertTrustedSource(
  attestation: OfflineDataQualityAttestation,
  source: OfflineCodexEvidenceSource,
): void {
  const { account } = source.data;

  if (
    source.ok !== true ||
    source.context.sourceKind !== "FIXTURE" ||
    account.sourceKind !== "FIXTURE" ||
    !source.warnings.includes("FIXTURE_DATA_ONLY") ||
    !source.warnings.includes("NO_EXTERNAL_CONNECTION")
  ) {
    rejectEvidence("只有带完整离线信任标记的 fixture 响应才能生成 Codex 上下文。");
  }
  if (
    source.context.adAccountId !== account.id ||
    source.context.workspaceId !== attestation.workspaceId
  ) {
    rejectEvidence("响应与当前 fixture Workspace 或账户绑定不一致。");
  }

  if (isObjectTrend(source) || isDirectChildTrend(source)) {
    const requestedRange = source.data.requestedRange;
    const dates = expectedTrendDates(requestedRange);
    const targetObject = isDirectChildTrend(source)
      ? source.data.parent
      : source.data.object;
    const parentItems = isDirectChildTrend(source)
      ? source.data.parentItems
      : source.data.items;
    if (
      dates === null ||
      source.context.trendPolicy.minimumDays !== 3 ||
      source.context.trendPolicy.maximumDays !== 31 ||
      source.context.trendPolicy.metricSelection !== "SINGLE" ||
      source.context.trendPolicy.thresholdsApplied !== false ||
      source.context.trendPolicy.causalClaims !== false ||
      source.context.trendPolicy.trendInterpretationApplied !== false ||
      source.context.pointCount !== dates.length ||
      !dailySeriesIsComplete(parentItems, dates)
    ) {
      rejectEvidence("趋势结果缺少完整日级覆盖、固定指标或无阈值/非因果边界。");
    }
    if (
      !offlineDataQualityAttestsRanges(
        attestation,
        account,
        [requestedRange],
        targetObject.id,
      ) ||
      !offlineAnalysisContextMatchesAttestation(attestation, source.context)
    ) {
      rejectEvidence("趋势结果不在当前数据质量凭证的日期、对象或快照覆盖内。");
    }
    if (
      targetObject.sourceKind !== "FIXTURE" ||
      !attestation.objectIds.includes(targetObject.id) ||
      targetObject.fetchedAt !== attestation.fetchedAt ||
      !attestation.syncRunIds.includes(targetObject.syncRunId)
    ) {
      rejectEvidence("趋势对象未被当前数据质量凭证覆盖。");
    }

    if (isObjectTrend(source)) {
      if (
        source.context.objectId !== source.data.object.id ||
        source.context.objectLevel !== source.data.object.objectLevel ||
        source.context.parentObjectId !== source.data.object.parentObjectId
      ) {
        rejectEvidence("对象趋势与响应对象绑定不一致。");
      }
      return;
    }

    const childIds = source.data.items.map((item) => item.object.id);
    const childExternalRefs = source.data.items.map(
      (item) => item.object.externalObjectRef,
    );
    const stableOrder = childIds.every(
      (id, index) => index === 0 || childIds[index - 1]! < id,
    );
    const expectedChildLevel =
      source.data.parent.objectLevel === "CAMPAIGN"
        ? "AD_SET"
        : source.data.parent.objectLevel === "AD_SET"
          ? "AD"
          : null;
    if (
      expectedChildLevel === null ||
      source.context.parentObjectId !== source.data.parent.id ||
      source.context.parentObjectLevel !== source.data.parent.objectLevel ||
      source.context.childObjectLevel !== expectedChildLevel ||
      source.context.childCount !== source.data.items.length ||
      source.data.items.length === 0 ||
      source.context.trendPolicy.seriesOrder !== "STABLE_OBJECT_ID" ||
      source.context.trendPolicy.rankingApplied !== false ||
      source.data.reconciliation.dailyMatchesParent !== true ||
      source.data.reconciliation.additiveMetricKeys.length !==
        ADDITIVE_METRIC_KEYS.length ||
      !source.data.reconciliation.additiveMetricKeys.every(
        (metric, index) => metric === ADDITIVE_METRIC_KEYS[index],
      ) ||
      !stableOrder ||
      new Set(childIds).size !== childIds.length ||
      new Set(childExternalRefs).size !== childExternalRefs.length ||
      !childIds.every((id) => attestation.objectIds.includes(id)) ||
      !source.data.items.every(
        (item) =>
          item.object.sourceKind === "FIXTURE" &&
          item.object.parentObjectId === source.data.parent.id &&
          item.object.objectLevel === expectedChildLevel &&
          item.object.fetchedAt === attestation.fetchedAt &&
          attestation.syncRunIds.includes(item.object.syncRunId) &&
          dailySeriesIsComplete(item.items, dates),
      ) ||
      !directChildDailyRollupMatches(source)
    ) {
      rejectEvidence("直接子对象趋势缺少稳定顺序、父子绑定或逐日汇总对账。");
    }
    return;
  }

  const { baseline, current } = source.data;
  const ranges = [baseline.requestedRange, current.requestedRange];
  const targetObjectId = isDirectChildBreakdown(source)
    ? source.data.parent.id
    : isObjectComparison(source)
      ? source.data.object.id
      : undefined;
  if (
    source.context.comparisonPolicy.thresholdsApplied !== false ||
    source.context.comparisonPolicy.causalClaims !== false ||
    source.context.comparisonPolicy.periodsOverlap !== false ||
    baseline.requestedRange.dateStop >= current.requestedRange.dateStart ||
    !periodIsCompleteAndExact(
      baseline,
      source.context.comparisonPolicy.periodLengthDays,
    ) ||
    !periodIsCompleteAndExact(
      current,
      source.context.comparisonPolicy.periodLengthDays,
    )
  ) {
    rejectEvidence("比较结果缺少完整周期、账户绑定或无阈值/非因果边界。");
  }
  if (
    !offlineDataQualityAttestsRanges(
      attestation,
      account,
      ranges,
      targetObjectId,
    ) ||
    !offlineAnalysisContextMatchesAttestation(attestation, source.context)
  ) {
    rejectEvidence("比较结果不在当前数据质量凭证的日期、对象或快照覆盖内。");
  }

  if (isObjectComparison(source)) {
    if (
      source.data.object.sourceKind !== "FIXTURE" ||
      source.context.objectId !== source.data.object.id ||
      source.context.objectLevel !== source.data.object.objectLevel ||
      source.context.parentObjectId !== source.data.object.parentObjectId ||
      !attestation.objectIds.includes(source.data.object.id)
    ) {
      rejectEvidence("对象级结果与数据质量凭证或响应对象绑定不一致。");
    }
  }

  if (isDirectChildBreakdown(source)) {
    const childIds = source.data.items.map((item) => item.object.id);
    const childExternalRefs = source.data.items.map(
      (item) => item.object.externalObjectRef,
    );
    const stableOrder = childIds.every(
      (id, index) => index === 0 || childIds[index - 1]! < id,
    );
    const expectedChildLevel =
      source.data.parent.objectLevel === "CAMPAIGN"
        ? "AD_SET"
        : source.data.parent.objectLevel === "AD_SET"
          ? "AD"
          : null;
    if (
      source.data.parent.sourceKind !== "FIXTURE" ||
      source.context.parentObjectId !== source.data.parent.id ||
      source.context.parentObjectLevel !== source.data.parent.objectLevel ||
      source.context.childObjectLevel !== expectedChildLevel ||
      source.context.childCount !== source.data.items.length ||
      source.data.items.length === 0 ||
      source.context.comparisonPolicy.rankingApplied !== false ||
      source.data.reconciliation.baselineMatchesParent !== true ||
      source.data.reconciliation.currentMatchesParent !== true ||
      source.data.reconciliation.additiveMetricKeys.length !==
        ADDITIVE_METRIC_KEYS.length ||
      !source.data.reconciliation.additiveMetricKeys.every(
        (metric, index) => metric === ADDITIVE_METRIC_KEYS[index],
      ) ||
      !stableOrder ||
      new Set(childIds).size !== childIds.length ||
      new Set(childExternalRefs).size !== childExternalRefs.length ||
      !childIds.every((id) => attestation.objectIds.includes(id)) ||
      !source.data.items.every(
        (item) =>
          item.object.sourceKind === "FIXTURE" &&
          item.object.parentObjectId === source.data.parent.id &&
          item.object.objectLevel === expectedChildLevel &&
          rangesEqual(
            item.baseline.requestedRange,
            source.data.baseline.requestedRange,
          ) &&
          rangesEqual(
            item.current.requestedRange,
            source.data.current.requestedRange,
          ) &&
          periodIsCompleteAndExact(
            item.baseline,
            source.context.comparisonPolicy.periodLengthDays,
          ) &&
          periodIsCompleteAndExact(
            item.current,
            source.context.comparisonPolicy.periodLengthDays,
          ),
      ) ||
      !directChildRollupMatches(source, "baseline") ||
      !directChildRollupMatches(source, "current")
    ) {
      rejectEvidence("直接子对象结果缺少凭证覆盖、稳定顺序、父子绑定或汇总对账。");
    }
  }
}

function analysisKind(
  source: OfflineCodexEvidenceSource,
): OfflineCodexAnalysisKind {
  if (isDirectChildTrend(source)) {
    return "DIRECT_CHILD_DAILY_TREND";
  }
  if (isObjectTrend(source)) {
    return "OBJECT_DAILY_TREND";
  }
  if (isDirectChildBreakdown(source)) {
    return "DIRECT_CHILD_BREAKDOWN";
  }
  if (isObjectComparison(source)) {
    return "OBJECT_COMPARISON";
  }
  return "ACCOUNT_COMPARISON";
}

function analysisSubject(
  source: OfflineCodexEvidenceSource,
): OfflineCodexEvidenceBundle["scope_and_freshness"]["subject"] {
  if (isDirectChildTrend(source)) {
    return {
      kind: "DIRECT_CHILDREN",
      parent: objectReference(source.data.parent),
      child_level: source.context.childObjectLevel,
    };
  }
  if (isObjectTrend(source)) {
    return {
      kind: "OBJECT",
      object: objectReference(source.data.object),
    };
  }
  if (isDirectChildBreakdown(source)) {
    return {
      kind: "DIRECT_CHILDREN",
      parent: objectReference(source.data.parent),
      child_level: source.context.childObjectLevel,
    };
  }
  if (isObjectComparison(source)) {
    return {
      kind: "OBJECT",
      object: objectReference(source.data.object),
    };
  }
  return { kind: "ACCOUNT", object: null };
}

function observedPatterns(
  source: OfflineCodexEvidenceSource,
): OfflineCodexEvidenceBundle["observed_patterns"] {
  if (
    isDirectChildBreakdown(source) ||
    isDirectChildTrend(source) ||
    isObjectTrend(source)
  ) {
    return [];
  }
  return source.data.diagnostics.map((diagnostic) => ({
    claim_type: "FACT" as const,
    code: diagnostic.code,
    severity: diagnostic.severity,
    finding_confidence: diagnostic.findingConfidence,
    causal_claim: false as const,
    summary: diagnostic.summary,
    evidence_metric_paths: [...diagnostic.evidenceMetrics],
  }));
}

function driverInputs(
  source: OfflineCodexEvidenceSource,
): OfflineCodexEvidenceBundle["driver_inputs"] {
  if (isDirectChildTrend(source)) {
    return {
      claim_type: "FACT",
      kind: "DIRECT_CHILDREN_DAILY",
      ordering: "STABLE_FIXTURE_OBJECT_ID_ASC",
      ranking_applied: false,
      reconciliation: {
        additive_metric_keys: [...source.data.reconciliation.additiveMetricKeys],
        daily_matches_parent: true,
      },
      items: source.data.items.map((item) => ({
        claim_type: "FACT",
        object: objectReference(item.object),
        daily_items: copyDailyItems(item.items),
      })),
    };
  }
  if (!isDirectChildBreakdown(source)) {
    return {
      claim_type: "FACT",
      kind: "NONE",
      ordering: "NOT_APPLICABLE",
      ranking_applied: false,
      reconciliation: null,
      items: [],
    };
  }

  return {
    claim_type: "FACT",
    kind: "DIRECT_CHILDREN",
    ordering: "STABLE_FIXTURE_OBJECT_ID_ASC",
    ranking_applied: false,
    reconciliation: {
      additive_metric_keys: [...source.data.reconciliation.additiveMetricKeys],
      baseline_matches_parent: true,
      current_matches_parent: true,
    },
    items: source.data.items.map((item) => ({
      claim_type: "FACT",
      object: objectReference(item.object),
      baseline: copyComparisonPeriod(item.baseline),
      current: copyComparisonPeriod(item.current),
      changes: copyChanges(item.changes),
    })),
  };
}

function factEvidence(
  source: OfflineCodexEvidenceSource,
): OfflineCodexEvidenceBundle["fact_evidence"] {
  if (isObjectTrend(source) || isDirectChildTrend(source)) {
    const dailyItems = isDirectChildTrend(source)
      ? source.data.parentItems
      : source.data.items;
    return {
      claim_type: "FACT",
      kind: "DAILY_TREND",
      requested_range: { ...source.data.requestedRange },
      point_count: dailyItems.length,
      metric_keys: [...TREND_METRIC_KEYS],
      daily_items: copyDailyItems(dailyItems),
    };
  }
  return {
    claim_type: "FACT",
    kind: "PERIOD_COMPARISON",
    baseline: copyPeriod(
      source.data.baseline,
      source.context.periodContext.baseline,
    ),
    current: copyPeriod(
      source.data.current,
      source.context.periodContext.current,
    ),
    changes: copyChanges(source.data.changes),
  };
}

export function buildOfflineCodexEvidenceBundle(
  attestation: OfflineDataQualityAttestation,
  source: OfflineCodexEvidenceSource,
): OfflineCodexEvidenceBundle {
  assertTrustedSource(attestation, source);

  return {
    schema_version: OFFLINE_CODEX_EVIDENCE_SCHEMA_VERSION,
    artifact_type: "CODEX_ANALYSIS_INPUT",
    source_kind: "FIXTURE",
    analysis_kind: analysisKind(source),
    scope_and_freshness: {
      workspace_ref: source.context.workspaceId,
      account_ref: source.data.account.externalAccountRef,
      subject: analysisSubject(source),
      data_through: source.data.account.dataThrough,
      metric_context: { ...source.context.metricContext },
    },
    quality_evidence: {
      status: "PASS",
      all_checks_required: true,
      attested_range: {
        date_start: attestation.dateStart,
        date_stop: attestation.dateStop,
      },
      covered_object_count: attestation.objectIds.length,
      snapshot: {
        stability_status: attestation.stabilityStatus,
        fetched_at: attestation.fetchedAt,
        sync_run_ids: [...attestation.syncRunIds],
      },
    },
    fact_evidence: factEvidence(source),
    observed_patterns: observedPatterns(source),
    driver_inputs: driverInputs(source),
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
    warnings: [...source.warnings],
  };
}

export function serializeOfflineCodexEvidenceBundle(
  bundle: OfflineCodexEvidenceBundle,
): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}
