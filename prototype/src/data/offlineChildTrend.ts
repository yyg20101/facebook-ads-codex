import {
  FIXTURE_WORKSPACE_ID,
  OfflineComparisonError,
  hasRequiredFixtureWarnings,
  isFixtureAccount,
  isMetricContext,
  type DerivedMetrics,
  type MetricTotals,
  type OfflineAdAccount
} from "./offlineComparison";
import {
  isFixtureAdObject,
  type OfflineAdObject,
  type OfflineAdObjectLevel
} from "./offlineHierarchy";
import type {
  OfflineDailyTrendItem,
  OfflineTrendRequest
} from "./offlineTrend";

const ADDITIVE_METRIC_KEYS = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions"
] as const;
type AdditiveMetricKey = (typeof ADDITIVE_METRIC_KEYS)[number];

export interface OfflineDirectChildTrendItem {
  object: OfflineAdObject;
  items: OfflineDailyTrendItem[];
}

export interface OfflineDirectChildTrendResponse {
  ok: true;
  data: {
    account: OfflineAdAccount;
    parent: OfflineAdObject;
    requestedRange: OfflineTrendRequest;
    parentItems: OfflineDailyTrendItem[];
    items: OfflineDirectChildTrendItem[];
    reconciliation: {
      additiveMetricKeys: readonly AdditiveMetricKey[];
      dailyMatchesParent: true;
    };
  };
  context: {
    requestId: string;
    workspaceId: string;
    adAccountId: string;
    parentObjectId: string;
    parentObjectLevel: "CAMPAIGN" | "AD_SET";
    childObjectLevel: "AD_SET" | "AD";
    childCount: number;
    pointCount: number;
    metricContext: {
      currency: string;
      timezoneName: string;
      clickMetricKind: "ALL_CLICKS" | "LINK_CLICKS";
      conversionEventRef: string;
      attributionSpecHash: string;
      apiVersion: string;
    };
    stabilityStatus: "PROVISIONAL" | "RECONCILING" | "STABLE";
    fetchedAt: string;
    syncRunIds: string[];
    trendPolicy: {
      minimumDays: 3;
      maximumDays: 31;
      metricSelection: "SINGLE";
      seriesOrder: "STABLE_OBJECT_ID";
      thresholdsApplied: false;
      causalClaims: false;
      rankingApplied: false;
      trendInterpretationApplied: false;
    };
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}

const TOTAL_KEYS = ADDITIVE_METRIC_KEYS;
const DERIVED_KEYS = [
  "clickThroughRate",
  "conversionRate",
  "costPerClickMinorUnits",
  "costPerThousandImpressionsMinorUnits",
  "costPerConversionMinorUnits"
] as const;
const ACCOUNT_KEYS = [
  "id",
  "externalAccountRef",
  "currency",
  "timezoneName",
  "sourceKind",
  "dataThrough",
  "insightRowCount"
] as const;
const OBJECT_KEYS = [
  "id",
  "externalObjectRef",
  "objectLevel",
  "parentObjectId",
  "displayName",
  "sourceKind",
  "syncRunId",
  "fetchedAt"
] as const;
const REQUIRED_TREND_WARNINGS = [
  "FIXTURE_DATA_ONLY",
  "NO_EXTERNAL_CONNECTION"
] as const;
const MAX_OFFLINE_DIRECT_CHILDREN = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function hasExactTrendWarnings(value: unknown): value is string[] {
  return (
    hasRequiredFixtureWarnings(value) &&
    value.length === REQUIRED_TREND_WARNINGS.length &&
    value.every((warning, index) => warning === REQUIRED_TREND_WARNINGS[index])
  );
}

function isNonNegativeIntegerOrNull(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
  );
}

function isNonNegativeFiniteOrNull(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0)
  );
}

function roundSix(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function scaledRatio(
  numerator: number | null,
  denominator: number | null,
  scale = 1
): number | null {
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }
  return roundSix((numerator / denominator) * scale);
}

function deriveExpectedMetrics(totals: MetricTotals): DerivedMetrics {
  return {
    clickThroughRate: scaledRatio(totals.clicks, totals.impressions),
    conversionRate: scaledRatio(totals.conversions, totals.clicks),
    costPerClickMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.clicks
    ),
    costPerThousandImpressionsMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.impressions,
      1000
    ),
    costPerConversionMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.conversions
    )
  };
}

function isMetricTotals(value: unknown): value is MetricTotals {
  return (
    isRecord(value) &&
    hasExactKeys(value, TOTAL_KEYS) &&
    TOTAL_KEYS.every((key) => isNonNegativeIntegerOrNull(value[key]))
  );
}

function isDerivedMetrics(value: unknown): value is DerivedMetrics {
  return (
    isRecord(value) &&
    hasExactKeys(value, DERIVED_KEYS) &&
    DERIVED_KEYS.every((key) => isNonNegativeFiniteOrNull(value[key]))
  );
}

function metricsMatchExpected(
  actual: DerivedMetrics,
  expected: DerivedMetrics
): boolean {
  return DERIVED_KEYS.every((key) => actual[key] === expected[key]);
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

function expectedDates(request: OfflineTrendRequest): string[] | null {
  const start = parseIsoDate(request.dateStart);
  const stop = parseIsoDate(request.dateStop);
  if (start === null || stop === null) {
    return null;
  }
  const count = (stop - start) / 86_400_000 + 1;
  if (!Number.isSafeInteger(count) || count < 3 || count > 31) {
    return null;
  }
  return Array.from({ length: count }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10)
  );
}

function isExpectedAccount(
  value: unknown,
  expected: OfflineAdAccount
): value is OfflineAdAccount {
  return (
    isRecord(value) &&
    hasExactKeys(value, ACCOUNT_KEYS) &&
    isFixtureAccount(value) &&
    ACCOUNT_KEYS.every((key) => value[key] === expected[key])
  );
}

function isExpectedParent(
  value: unknown,
  expected: OfflineAdObject
): value is OfflineAdObject {
  return (
    isRecord(value) &&
    hasExactKeys(value, OBJECT_KEYS) &&
    isFixtureAdObject(value) &&
    OBJECT_KEYS.every((key) => value[key] === expected[key])
  );
}

function isDailySeries(
  value: unknown,
  dates: readonly string[]
): value is OfflineDailyTrendItem[] {
  if (!Array.isArray(value) || value.length !== dates.length) {
    return false;
  }
  return value.every((item, index) => {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["date", "totals", "derived"]) ||
      item.date !== dates[index] ||
      !isMetricTotals(item.totals) ||
      !isDerivedMetrics(item.derived)
    ) {
      return false;
    }
    return metricsMatchExpected(
      item.derived,
      deriveExpectedMetrics(item.totals)
    );
  });
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

function dailyRollupMatches(
  parentItems: readonly OfflineDailyTrendItem[],
  children: readonly OfflineDirectChildTrendItem[]
): boolean {
  return parentItems.every((parentItem, dayIndex) =>
    ADDITIVE_METRIC_KEYS.every((metric) =>
      metricRollupMatches(
        parentItem.totals[metric],
        children.map((child) => child.items[dayIndex]?.totals[metric] ?? null)
      )
    )
  );
}

function isDirectChildTrendResponse(
  value: unknown,
  expectedAccount: OfflineAdAccount,
  expectedParent: OfflineAdObject,
  request: OfflineTrendRequest,
  dates: readonly string[]
): value is OfflineDirectChildTrendResponse {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "ok",
      "data",
      "context",
      "warnings",
      "nextCursor",
      "truncated"
    ]) ||
    !isRecord(value.data) ||
    !hasExactKeys(value.data, [
      "account",
      "parent",
      "requestedRange",
      "parentItems",
      "items",
      "reconciliation"
    ]) ||
    !isRecord(value.context)
  ) {
    return false;
  }

  const { data, context } = value;
  if (
    !isExpectedAccount(data.account, expectedAccount) ||
    !isExpectedParent(data.parent, expectedParent) ||
    !isRecord(data.requestedRange) ||
    !hasExactKeys(data.requestedRange, ["dateStart", "dateStop"]) ||
    data.requestedRange.dateStart !== request.dateStart ||
    data.requestedRange.dateStop !== request.dateStop ||
    !isDailySeries(data.parentItems, dates) ||
    !Array.isArray(data.items) ||
    data.items.length < 1 ||
    data.items.length > MAX_OFFLINE_DIRECT_CHILDREN ||
    !isRecord(data.reconciliation) ||
    !hasExactKeys(data.reconciliation, [
      "additiveMetricKeys",
      "dailyMatchesParent"
    ]) ||
    !Array.isArray(data.reconciliation.additiveMetricKeys) ||
    data.reconciliation.additiveMetricKeys.length !==
      ADDITIVE_METRIC_KEYS.length ||
    !data.reconciliation.additiveMetricKeys.every(
      (key, index) => key === ADDITIVE_METRIC_KEYS[index]
    ) ||
    data.reconciliation.dailyMatchesParent !== true
  ) {
    return false;
  }

  const expectedChildLevel: OfflineAdObjectLevel =
    expectedParent.objectLevel === "CAMPAIGN" ? "AD_SET" : "AD";
  const items: OfflineDirectChildTrendItem[] = [];
  for (const rawItem of data.items) {
    if (
      !isRecord(rawItem) ||
      !hasExactKeys(rawItem, ["object", "items"]) ||
      !isRecord(rawItem.object) ||
      !hasExactKeys(rawItem.object, OBJECT_KEYS) ||
      !isFixtureAdObject(rawItem.object) ||
      rawItem.object.objectLevel !== expectedChildLevel ||
      rawItem.object.parentObjectId !== expectedParent.id ||
      !isDailySeries(rawItem.items, dates)
    ) {
      return false;
    }
    items.push({ object: rawItem.object, items: rawItem.items });
  }
  const ids = items.map((item) => item.object.id);
  const externalRefs = items.map((item) => item.object.externalObjectRef);
  if (
    new Set(ids).size !== items.length ||
    new Set(externalRefs).size !== items.length ||
    !ids.every((id, index) => index === 0 || ids[index - 1]! < id) ||
    !dailyRollupMatches(data.parentItems, items)
  ) {
    return false;
  }

  const metricContext = context.metricContext;
  const trendPolicy = context.trendPolicy;
  const syncRunIds = context.syncRunIds;
  return (
    value.ok === true &&
    typeof context.requestId === "string" &&
    context.requestId.length > 0 &&
    context.workspaceId === FIXTURE_WORKSPACE_ID &&
    context.adAccountId === expectedAccount.id &&
    context.parentObjectId === expectedParent.id &&
    context.parentObjectLevel === expectedParent.objectLevel &&
    context.childObjectLevel === expectedChildLevel &&
    context.childCount === items.length &&
    context.pointCount === dates.length &&
    isRecord(metricContext) &&
    hasExactKeys(metricContext, [
      "currency",
      "timezoneName",
      "clickMetricKind",
      "conversionEventRef",
      "attributionSpecHash",
      "apiVersion"
    ]) &&
    isMetricContext(metricContext) &&
    metricContext.currency === expectedAccount.currency &&
    metricContext.timezoneName === expectedAccount.timezoneName &&
    ["PROVISIONAL", "RECONCILING", "STABLE"].includes(
      `${context.stabilityStatus}`
    ) &&
    typeof context.fetchedAt === "string" &&
    Number.isFinite(Date.parse(context.fetchedAt)) &&
    Array.isArray(syncRunIds) &&
    syncRunIds.length > 0 &&
    syncRunIds.every(
      (id) => typeof id === "string" && id.length > 0
    ) &&
    new Set(syncRunIds).size === syncRunIds.length &&
    syncRunIds.every(
      (id, index) => index === 0 || syncRunIds[index - 1]! < id
    ) &&
    isRecord(trendPolicy) &&
    hasExactKeys(trendPolicy, [
      "minimumDays",
      "maximumDays",
      "metricSelection",
      "seriesOrder",
      "thresholdsApplied",
      "causalClaims",
      "rankingApplied",
      "trendInterpretationApplied"
    ]) &&
    trendPolicy.minimumDays === 3 &&
    trendPolicy.maximumDays === 31 &&
    trendPolicy.metricSelection === "SINGLE" &&
    trendPolicy.seriesOrder === "STABLE_OBJECT_ID" &&
    trendPolicy.thresholdsApplied === false &&
    trendPolicy.causalClaims === false &&
    trendPolicy.rankingApplied === false &&
    trendPolicy.trendInterpretationApplied === false &&
    context.sourceKind === "FIXTURE" &&
    hasExactTrendWarnings(value.warnings) &&
    value.nextCursor === null &&
    value.truncated === false
  );
}

function errorFromEnvelope(value: unknown, status: number): OfflineComparisonError {
  if (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  ) {
    return new OfflineComparisonError(value.error.code, value.error.message);
  }
  return new OfflineComparisonError(
    `HTTP_${status}`,
    "离线 Worker 返回了无法识别的直接子对象趋势错误响应。"
  );
}

export async function loadOfflineDirectChildTrend(
  account: OfflineAdAccount,
  parent: OfflineAdObject,
  request: OfflineTrendRequest,
  signal: AbortSignal
): Promise<OfflineDirectChildTrendResponse> {
  if (!isFixtureAccount(account) || !isFixtureAdObject(parent)) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "必须先从已验证的 fixture 层级选择账户和父对象。"
    );
  }
  if (parent.objectLevel === "AD") {
    throw new OfflineComparisonError(
      "NO_CHILD_OBJECTS",
      "Ad 是叶子对象，没有可读取的直接子对象趋势。"
    );
  }
  const dates = expectedDates(request);
  if (dates === null) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "直接子对象趋势日期必须是连续 3 至 31 个有效 UTC 自然日。"
    );
  }

  const parameters = new URLSearchParams({
    date_start: request.dateStart,
    date_stop: request.dateStop
  });
  const path =
    `/offline-api/v1/workspaces/${FIXTURE_WORKSPACE_ID}` +
    `/ad-accounts/${encodeURIComponent(account.id)}` +
    `/objects/${encodeURIComponent(parent.id)}` +
    `/children-trend?${parameters.toString()}`;
  const response = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    credentials: "omit",
    signal
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "离线 Worker 没有返回有效的直接子对象趋势 JSON。"
    );
  }
  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isDirectChildTrendResponse(body, account, parent, request, dates)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "直接子对象趋势响应缺少父子绑定、连续日期、逐日对账或信任边界，已拒绝展示。"
    );
  }
  return body;
}
