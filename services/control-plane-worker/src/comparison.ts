import type { DerivedMetrics, MetricTotals } from "./metrics";
import type {
  AccountSummary,
  FixtureAdObject,
  FixtureAdObjectTrend
} from "./read-model";

export type ChangeDirection =
  | "DECREASED"
  | "INCREASED"
  | "NOT_COMPARABLE"
  | "UNCHANGED";

export type RelativeChangeUnavailableReason =
  | "BASELINE_ZERO"
  | "MISSING_VALUE"
  | null;

export interface MetricChange {
  baseline: number | null;
  current: number | null;
  absoluteChange: number | null;
  relativeChange: number | null;
  direction: ChangeDirection;
  relativeChangeUnavailableReason: RelativeChangeUnavailableReason;
}

export interface PeriodMetricChanges {
  totals: {
    spendMinorUnits: MetricChange;
    impressions: MetricChange;
    clicks: MetricChange;
    conversions: MetricChange;
  };
  derived: {
    clickThroughRate: MetricChange;
    conversionRate: MetricChange;
    costPerClickMinorUnits: MetricChange;
    costPerThousandImpressionsMinorUnits: MetricChange;
    costPerConversionMinorUnits: MetricChange;
  };
}

export type DiagnosticCode =
  | "CLICKS_UP_CONVERSIONS_NOT_UP"
  | "CONVERSION_VOLUME_UP_COST_DOWN"
  | "CTR_UP_CONVERSION_RATE_DOWN"
  | "SPEND_UP_CONVERSIONS_DOWN"
  | "SPEND_WITH_ZERO_CONVERSIONS";

export interface DiagnosticSignal {
  code: DiagnosticCode;
  severity: "INFO" | "WARNING" | "WATCH";
  findingConfidence: "CONFIRMED_PATTERN";
  causalClaim: false;
  summary: string;
  evidenceMetrics: string[];
  nextChecks: string[];
}

export interface PeriodComparison {
  account: AccountSummary["account"];
  baseline: Pick<
    AccountSummary,
    "requestedRange" | "actualRange" | "coverage" | "totals" | "derived"
  >;
  current: Pick<
    AccountSummary,
    "requestedRange" | "actualRange" | "coverage" | "totals" | "derived"
  >;
  changes: PeriodMetricChanges;
  diagnostics: DiagnosticSignal[];
  metricContext: Pick<
    AccountSummary["context"],
    | "currency"
    | "timezoneName"
    | "clickMetricKind"
    | "conversionEventRef"
    | "attributionSpecHash"
    | "apiVersion"
  >;
  periodContext: {
    baseline: Pick<
      AccountSummary["context"],
      "stabilityStatus" | "fetchedAt" | "syncRunIds"
    >;
    current: Pick<
      AccountSummary["context"],
      "stabilityStatus" | "fetchedAt" | "syncRunIds"
    >;
  };
}

export type PeriodComparisonResult =
  | { kind: "ok"; comparison: PeriodComparison }
  | { kind: "incompatible_context" }
  | { kind: "incomplete_coverage" };

export const ADDITIVE_METRIC_KEYS = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions"
] as const;

export type AdditiveMetricKey = (typeof ADDITIVE_METRIC_KEYS)[number];

export interface DirectChildComparisonItem {
  object: FixtureAdObject;
  comparison: PeriodComparison;
}

export interface DirectChildBreakdown {
  parent: {
    object: FixtureAdObject;
    comparison: PeriodComparison;
  };
  items: DirectChildComparisonItem[];
  reconciliation: {
    additiveMetricKeys: readonly AdditiveMetricKey[];
    baselineMatchesParent: true;
    currentMatchesParent: true;
  };
}

export type DirectChildBreakdownResult =
  | { kind: "ok"; breakdown: DirectChildBreakdown }
  | { kind: "no_children" }
  | { kind: "incompatible_hierarchy" }
  | { kind: "incompatible_context" }
  | { kind: "incompatible_rollup" };

export interface DirectChildTrendItem {
  object: FixtureAdObject;
  trend: FixtureAdObjectTrend;
}

export interface DirectChildDailyTrend {
  parent: DirectChildTrendItem;
  items: DirectChildTrendItem[];
  reconciliation: {
    additiveMetricKeys: readonly AdditiveMetricKey[];
    dailyMatchesParent: true;
  };
}

export type DirectChildDailyTrendResult =
  | { kind: "ok"; trend: DirectChildDailyTrend }
  | { kind: "no_children" }
  | { kind: "incompatible_hierarchy" }
  | { kind: "incompatible_context" }
  | { kind: "incompatible_rollup" };

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function compareMetricValues(
  baseline: number | null,
  current: number | null
): MetricChange {
  if (baseline === null || current === null) {
    return {
      baseline,
      current,
      absoluteChange: null,
      relativeChange: null,
      direction: "NOT_COMPARABLE",
      relativeChangeUnavailableReason: "MISSING_VALUE"
    };
  }

  const absoluteChange = round(current - baseline);
  const direction =
    absoluteChange > 0
      ? "INCREASED"
      : absoluteChange < 0
        ? "DECREASED"
        : "UNCHANGED";

  return {
    baseline,
    current,
    absoluteChange,
    relativeChange:
      baseline === 0 ? null : round(absoluteChange / baseline),
    direction,
    relativeChangeUnavailableReason:
      baseline === 0 ? "BASELINE_ZERO" : null
  };
}

export function compareMetricSets(
  baselineTotals: MetricTotals,
  baselineDerived: DerivedMetrics,
  currentTotals: MetricTotals,
  currentDerived: DerivedMetrics
): PeriodMetricChanges {
  return {
    totals: {
      spendMinorUnits: compareMetricValues(
        baselineTotals.spendMinorUnits,
        currentTotals.spendMinorUnits
      ),
      impressions: compareMetricValues(
        baselineTotals.impressions,
        currentTotals.impressions
      ),
      clicks: compareMetricValues(baselineTotals.clicks, currentTotals.clicks),
      conversions: compareMetricValues(
        baselineTotals.conversions,
        currentTotals.conversions
      )
    },
    derived: {
      clickThroughRate: compareMetricValues(
        baselineDerived.clickThroughRate,
        currentDerived.clickThroughRate
      ),
      conversionRate: compareMetricValues(
        baselineDerived.conversionRate,
        currentDerived.conversionRate
      ),
      costPerClickMinorUnits: compareMetricValues(
        baselineDerived.costPerClickMinorUnits,
        currentDerived.costPerClickMinorUnits
      ),
      costPerThousandImpressionsMinorUnits: compareMetricValues(
        baselineDerived.costPerThousandImpressionsMinorUnits,
        currentDerived.costPerThousandImpressionsMinorUnits
      ),
      costPerConversionMinorUnits: compareMetricValues(
        baselineDerived.costPerConversionMinorUnits,
        currentDerived.costPerConversionMinorUnits
      )
    }
  };
}

export function diagnosePeriodChange(
  currentTotals: MetricTotals,
  changes: PeriodMetricChanges
): DiagnosticSignal[] {
  const diagnostics: DiagnosticSignal[] = [];

  if (
    currentTotals.spendMinorUnits !== null &&
    currentTotals.spendMinorUnits > 0 &&
    currentTotals.conversions === 0
  ) {
    diagnostics.push({
      code: "SPEND_WITH_ZERO_CONVERSIONS",
      severity: "WARNING",
      findingConfidence: "CONFIRMED_PATTERN",
      causalClaim: false,
      summary: "The current period has reported spend and zero reported conversions.",
      evidenceMetrics: [
        "current.totals.spendMinorUnits",
        "current.totals.conversions"
      ],
      nextChecks: [
        "VERIFY_CONVERSION_EVENT_AND_ATTRIBUTION",
        "VERIFY_DATA_COMPLETENESS",
        "REVIEW_POST_CLICK_FLOW"
      ]
    });
  }

  if (
    changes.totals.spendMinorUnits.direction === "INCREASED" &&
    changes.totals.conversions.direction === "DECREASED"
  ) {
    diagnostics.push({
      code: "SPEND_UP_CONVERSIONS_DOWN",
      severity: "WARNING",
      findingConfidence: "CONFIRMED_PATTERN",
      causalClaim: false,
      summary: "Reported spend increased while reported conversions decreased.",
      evidenceMetrics: [
        "changes.totals.spendMinorUnits",
        "changes.totals.conversions"
      ],
      nextChecks: [
        "VERIFY_COMPARISON_CONTEXT",
        "REVIEW_DELIVERY_AND_AUDIENCE_MIX",
        "REVIEW_CREATIVE_AND_POST_CLICK_FLOW"
      ]
    });
  }

  if (
    changes.totals.clicks.direction === "INCREASED" &&
    ["DECREASED", "UNCHANGED"].includes(
      changes.totals.conversions.direction
    )
  ) {
    diagnostics.push({
      code: "CLICKS_UP_CONVERSIONS_NOT_UP",
      severity: "WATCH",
      findingConfidence: "CONFIRMED_PATTERN",
      causalClaim: false,
      summary: "Reported clicks increased without an increase in reported conversions.",
      evidenceMetrics: [
        "changes.totals.clicks",
        "changes.totals.conversions"
      ],
      nextChecks: [
        "VERIFY_CLICK_METRIC_KIND",
        "VERIFY_CONVERSION_EVENT_AND_ATTRIBUTION",
        "REVIEW_POST_CLICK_FLOW"
      ]
    });
  }

  if (
    changes.derived.clickThroughRate.direction === "INCREASED" &&
    changes.derived.conversionRate.direction === "DECREASED"
  ) {
    diagnostics.push({
      code: "CTR_UP_CONVERSION_RATE_DOWN",
      severity: "WATCH",
      findingConfidence: "CONFIRMED_PATTERN",
      causalClaim: false,
      summary: "Click-through rate increased while reported conversion rate decreased.",
      evidenceMetrics: [
        "changes.derived.clickThroughRate",
        "changes.derived.conversionRate"
      ],
      nextChecks: [
        "REVIEW_CREATIVE_MESSAGE_MATCH",
        "REVIEW_AUDIENCE_QUALITY",
        "REVIEW_POST_CLICK_FLOW"
      ]
    });
  }

  if (
    changes.totals.conversions.direction === "INCREASED" &&
    changes.derived.costPerConversionMinorUnits.direction === "DECREASED"
  ) {
    diagnostics.push({
      code: "CONVERSION_VOLUME_UP_COST_DOWN",
      severity: "INFO",
      findingConfidence: "CONFIRMED_PATTERN",
      causalClaim: false,
      summary: "Reported conversions increased while reported cost per conversion decreased.",
      evidenceMetrics: [
        "changes.totals.conversions",
        "changes.derived.costPerConversionMinorUnits"
      ],
      nextChecks: [
        "VERIFY_PATTERN_PERSISTS",
        "REVIEW_DELIVERY_AND_CREATIVE_MIX"
      ]
    });
  }

  return diagnostics;
}

function contextsAreCompatible(
  baseline: AccountSummary,
  current: AccountSummary
): boolean {
  return (
    baseline.context.currency === current.context.currency &&
    baseline.context.timezoneName === current.context.timezoneName &&
    baseline.context.clickMetricKind === current.context.clickMetricKind &&
    baseline.context.conversionEventRef === current.context.conversionEventRef &&
    baseline.context.attributionSpecHash ===
      current.context.attributionSpecHash &&
    baseline.context.apiVersion === current.context.apiVersion
  );
}

function stringArraysEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function fixtureObjectsEqual(
  left: FixtureAdObject,
  right: FixtureAdObject
): boolean {
  return (
    left.id === right.id &&
    left.externalObjectRef === right.externalObjectRef &&
    left.objectLevel === right.objectLevel &&
    left.parentObjectId === right.parentObjectId &&
    left.displayName === right.displayName &&
    left.sourceKind === right.sourceKind &&
    left.syncRunId === right.syncRunId &&
    left.fetchedAt === right.fetchedAt
  );
}

function trendsShareContext(
  parent: FixtureAdObjectTrend,
  child: FixtureAdObjectTrend
): boolean {
  return (
    parent.account.id === child.account.id &&
    parent.account.externalAccountRef === child.account.externalAccountRef &&
    parent.account.currency === child.account.currency &&
    parent.account.timezoneName === child.account.timezoneName &&
    parent.account.sourceKind === child.account.sourceKind &&
    parent.requestedRange.dateStart === child.requestedRange.dateStart &&
    parent.requestedRange.dateStop === child.requestedRange.dateStop &&
    parent.context.currency === child.context.currency &&
    parent.context.timezoneName === child.context.timezoneName &&
    parent.context.clickMetricKind === child.context.clickMetricKind &&
    parent.context.conversionEventRef === child.context.conversionEventRef &&
    parent.context.attributionSpecHash === child.context.attributionSpecHash &&
    parent.context.apiVersion === child.context.apiVersion &&
    parent.context.stabilityStatus === child.context.stabilityStatus &&
    parent.context.fetchedAt === child.context.fetchedAt &&
    stringArraysEqual(parent.context.syncRunIds, child.context.syncRunIds) &&
    parent.items.length === child.items.length &&
    parent.items.every((item, index) => item.date === child.items[index]?.date)
  );
}

function comparisonsShareContext(
  parent: PeriodComparison,
  child: PeriodComparison
): boolean {
  return (
    parent.account.id === child.account.id &&
    parent.account.externalAccountRef === child.account.externalAccountRef &&
    parent.account.currency === child.account.currency &&
    parent.account.timezoneName === child.account.timezoneName &&
    parent.account.sourceKind === child.account.sourceKind &&
    parent.metricContext.currency === child.metricContext.currency &&
    parent.metricContext.timezoneName === child.metricContext.timezoneName &&
    parent.metricContext.clickMetricKind === child.metricContext.clickMetricKind &&
    parent.metricContext.conversionEventRef ===
      child.metricContext.conversionEventRef &&
    parent.metricContext.attributionSpecHash ===
      child.metricContext.attributionSpecHash &&
    parent.metricContext.apiVersion === child.metricContext.apiVersion &&
    parent.baseline.requestedRange.dateStart ===
      child.baseline.requestedRange.dateStart &&
    parent.baseline.requestedRange.dateStop ===
      child.baseline.requestedRange.dateStop &&
    parent.current.requestedRange.dateStart ===
      child.current.requestedRange.dateStart &&
    parent.current.requestedRange.dateStop ===
      child.current.requestedRange.dateStop &&
    parent.periodContext.baseline.stabilityStatus ===
      child.periodContext.baseline.stabilityStatus &&
    parent.periodContext.baseline.fetchedAt ===
      child.periodContext.baseline.fetchedAt &&
    stringArraysEqual(
      parent.periodContext.baseline.syncRunIds,
      child.periodContext.baseline.syncRunIds
    ) &&
    parent.periodContext.current.stabilityStatus ===
      child.periodContext.current.stabilityStatus &&
    parent.periodContext.current.fetchedAt ===
      child.periodContext.current.fetchedAt &&
    stringArraysEqual(
      parent.periodContext.current.syncRunIds,
      child.periodContext.current.syncRunIds
    )
  );
}

function metricRollupMatches(
  parentValue: number | null,
  childValues: readonly (number | null)[]
): boolean {
  if (parentValue === null) {
    return childValues.every((value) => value === null);
  }
  if (childValues.some((value) => value === null)) {
    return false;
  }

  let total = 0;
  for (const value of childValues) {
    if (value === null) {
      return false;
    }
    total += value;
    if (!Number.isSafeInteger(total)) {
      return false;
    }
  }
  return total === parentValue;
}

function periodRollupMatches(
  parent: PeriodComparison,
  children: readonly DirectChildComparisonItem[],
  period: "baseline" | "current"
): boolean {
  return ADDITIVE_METRIC_KEYS.every((metric) =>
    metricRollupMatches(
      parent[period].totals[metric],
      children.map((child) => child.comparison[period].totals[metric])
    )
  );
}

export function buildDirectChildBreakdown(
  parentObject: FixtureAdObject,
  parentComparison: PeriodComparison,
  children: readonly DirectChildComparisonItem[]
): DirectChildBreakdownResult {
  const expectedChildLevel =
    parentObject.objectLevel === "CAMPAIGN"
      ? "AD_SET"
      : parentObject.objectLevel === "AD_SET"
        ? "AD"
        : null;
  if (expectedChildLevel === null || children.length === 0) {
    return { kind: "no_children" };
  }

  const orderedChildren = [...children].sort((left, right) =>
    left.object.id.localeCompare(right.object.id)
  );
  const uniqueIds = new Set(orderedChildren.map((child) => child.object.id));
  const uniqueExternalRefs = new Set(
    orderedChildren.map((child) => child.object.externalObjectRef)
  );
  if (
    uniqueIds.size !== orderedChildren.length ||
    uniqueExternalRefs.size !== orderedChildren.length ||
    orderedChildren.some(
      (child) =>
        child.object.parentObjectId !== parentObject.id ||
        child.object.objectLevel !== expectedChildLevel
    )
  ) {
    return { kind: "incompatible_hierarchy" };
  }

  if (
    orderedChildren.some(
      (child) => !comparisonsShareContext(parentComparison, child.comparison)
    )
  ) {
    return { kind: "incompatible_context" };
  }

  if (
    !periodRollupMatches(parentComparison, orderedChildren, "baseline") ||
    !periodRollupMatches(parentComparison, orderedChildren, "current")
  ) {
    return { kind: "incompatible_rollup" };
  }

  return {
    kind: "ok",
    breakdown: {
      parent: { object: parentObject, comparison: parentComparison },
      items: orderedChildren,
      reconciliation: {
        additiveMetricKeys: ADDITIVE_METRIC_KEYS,
        baselineMatchesParent: true,
        currentMatchesParent: true
      }
    }
  };
}

function dailyTrendRollupMatches(
  parent: FixtureAdObjectTrend,
  children: readonly DirectChildTrendItem[]
): boolean {
  return parent.items.every((parentItem, dayIndex) =>
    ADDITIVE_METRIC_KEYS.every((metric) =>
      metricRollupMatches(
        parentItem.totals[metric],
        children.map((child) => child.trend.items[dayIndex]?.totals[metric] ?? null)
      )
    )
  );
}

export function buildDirectChildTrend(
  parentObject: FixtureAdObject,
  parentTrend: FixtureAdObjectTrend,
  children: readonly DirectChildTrendItem[]
): DirectChildDailyTrendResult {
  const expectedChildLevel =
    parentObject.objectLevel === "CAMPAIGN"
      ? "AD_SET"
      : parentObject.objectLevel === "AD_SET"
        ? "AD"
        : null;
  if (expectedChildLevel === null || children.length === 0) {
    return { kind: "no_children" };
  }

  const orderedChildren = [...children].sort((left, right) =>
    left.object.id.localeCompare(right.object.id)
  );
  const uniqueIds = new Set(orderedChildren.map((child) => child.object.id));
  const uniqueExternalRefs = new Set(
    orderedChildren.map((child) => child.object.externalObjectRef)
  );
  if (
    !fixtureObjectsEqual(parentObject, parentTrend.object) ||
    uniqueIds.size !== orderedChildren.length ||
    uniqueExternalRefs.size !== orderedChildren.length ||
    orderedChildren.some(
      (child) =>
        child.object.parentObjectId !== parentObject.id ||
        child.object.objectLevel !== expectedChildLevel ||
        !fixtureObjectsEqual(child.object, child.trend.object)
    )
  ) {
    return { kind: "incompatible_hierarchy" };
  }

  if (
    orderedChildren.some(
      (child) => !trendsShareContext(parentTrend, child.trend)
    )
  ) {
    return { kind: "incompatible_context" };
  }

  if (!dailyTrendRollupMatches(parentTrend, orderedChildren)) {
    return { kind: "incompatible_rollup" };
  }

  return {
    kind: "ok",
    trend: {
      parent: { object: parentObject, trend: parentTrend },
      items: orderedChildren,
      reconciliation: {
        additiveMetricKeys: ADDITIVE_METRIC_KEYS,
        dailyMatchesParent: true
      }
    }
  };
}

export function buildPeriodComparison(
  baseline: AccountSummary,
  current: AccountSummary
): PeriodComparisonResult {
  if (!baseline.coverage.complete || !current.coverage.complete) {
    return { kind: "incomplete_coverage" };
  }
  if (!contextsAreCompatible(baseline, current)) {
    return { kind: "incompatible_context" };
  }

  const changes = compareMetricSets(
    baseline.totals,
    baseline.derived,
    current.totals,
    current.derived
  );

  return {
    kind: "ok",
    comparison: {
      account: current.account,
      baseline: {
        requestedRange: baseline.requestedRange,
        actualRange: baseline.actualRange,
        coverage: baseline.coverage,
        totals: baseline.totals,
        derived: baseline.derived
      },
      current: {
        requestedRange: current.requestedRange,
        actualRange: current.actualRange,
        coverage: current.coverage,
        totals: current.totals,
        derived: current.derived
      },
      changes,
      diagnostics: diagnosePeriodChange(current.totals, changes),
      metricContext: {
        currency: current.context.currency,
        timezoneName: current.context.timezoneName,
        clickMetricKind: current.context.clickMetricKind,
        conversionEventRef: current.context.conversionEventRef,
        attributionSpecHash: current.context.attributionSpecHash,
        apiVersion: current.context.apiVersion
      },
      periodContext: {
        baseline: {
          stabilityStatus: baseline.context.stabilityStatus,
          fetchedAt: baseline.context.fetchedAt,
          syncRunIds: baseline.context.syncRunIds
        },
        current: {
          stabilityStatus: current.context.stabilityStatus,
          fetchedAt: current.context.fetchedAt,
          syncRunIds: current.context.syncRunIds
        }
      }
    }
  };
}
