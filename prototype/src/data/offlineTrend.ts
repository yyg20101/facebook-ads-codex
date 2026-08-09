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

export interface OfflineTrendRequest {
  dateStart: string;
  dateStop: string;
}

export const DEFAULT_OFFLINE_TREND_REQUEST: OfflineTrendRequest = {
  dateStart: "2026-08-02",
  dateStop: "2026-08-04"
};

export type OfflineTrendMetricKey =
  | "spendMinorUnits"
  | "impressions"
  | "clicks"
  | "conversions"
  | "clickThroughRate"
  | "conversionRate"
  | "costPerClickMinorUnits"
  | "costPerThousandImpressionsMinorUnits"
  | "costPerConversionMinorUnits";

export const OFFLINE_TREND_METRIC_KEYS: readonly OfflineTrendMetricKey[] = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions",
  "clickThroughRate",
  "conversionRate",
  "costPerClickMinorUnits",
  "costPerThousandImpressionsMinorUnits",
  "costPerConversionMinorUnits"
];

export interface OfflineDailyTrendItem {
  date: string;
  totals: MetricTotals;
  derived: DerivedMetrics;
}

export interface OfflineObjectTrendResponse {
  ok: true;
  data: {
    account: OfflineAdAccount;
    object: OfflineAdObject;
    requestedRange: OfflineTrendRequest;
    items: OfflineDailyTrendItem[];
  };
  context: {
    requestId: string;
    workspaceId: string;
    adAccountId: string;
    objectId: string;
    objectLevel: OfflineAdObjectLevel;
    parentObjectId: string | null;
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
    pointCount: number;
    trendPolicy: {
      minimumDays: 3;
      maximumDays: 31;
      metricSelection: "SINGLE";
      thresholdsApplied: false;
      causalClaims: false;
      trendInterpretationApplied: false;
    };
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}

const TOTAL_KEYS = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions"
] as const;
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
const STABILITY_STATUSES: readonly string[] = [
  "PROVISIONAL",
  "RECONCILING",
  "STABLE"
];
const CLICK_METRIC_KINDS: readonly string[] = [
  "ALL_CLICKS",
  "LINK_CLICKS"
];
const REQUIRED_TREND_WARNINGS = [
  "FIXTURE_DATA_ONLY",
  "NO_EXTERNAL_CONNECTION"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index])
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
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  ) {
    return null;
  }
  return timestamp;
}

function expectedDates(request: OfflineTrendRequest): string[] | null {
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
    new Date(start + index * 86_400_000).toISOString().slice(0, 10)
  );
}

function isExpectedAccount(
  value: unknown,
  expectedAccount: OfflineAdAccount
): value is OfflineAdAccount {
  return (
    isRecord(value) &&
    hasExactKeys(value, ACCOUNT_KEYS) &&
    isFixtureAccount(value) &&
    value.id === expectedAccount.id &&
    value.externalAccountRef === expectedAccount.externalAccountRef &&
    value.currency === expectedAccount.currency &&
    value.timezoneName === expectedAccount.timezoneName &&
    value.sourceKind === expectedAccount.sourceKind &&
    value.dataThrough === expectedAccount.dataThrough &&
    value.insightRowCount === expectedAccount.insightRowCount
  );
}

function isExpectedObject(
  value: unknown,
  expectedObject: OfflineAdObject
): value is OfflineAdObject {
  return (
    isRecord(value) &&
    hasExactKeys(value, OBJECT_KEYS) &&
    isFixtureAdObject(value) &&
    value.id === expectedObject.id &&
    value.externalObjectRef === expectedObject.externalObjectRef &&
    value.objectLevel === expectedObject.objectLevel &&
    value.parentObjectId === expectedObject.parentObjectId &&
    value.displayName === expectedObject.displayName &&
    value.sourceKind === expectedObject.sourceKind &&
    value.syncRunId === expectedObject.syncRunId &&
    value.fetchedAt === expectedObject.fetchedAt
  );
}

function isTrendResponse(
  value: unknown,
  expectedAccount: OfflineAdAccount,
  expectedObject: OfflineAdObject,
  request: OfflineTrendRequest,
  dates: readonly string[]
): value is OfflineObjectTrendResponse {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    !isRecord(value.context)
  ) {
    return false;
  }

  const { data, context } = value;
  const requestedRange = data.requestedRange;
  const rawItems = data.items;
  const metricContext = context.metricContext;
  const trendPolicy = context.trendPolicy;
  if (
    !isRecord(requestedRange) ||
    !Array.isArray(rawItems) ||
    !isRecord(metricContext) ||
    !isRecord(trendPolicy)
  ) {
    return false;
  }
  if (
    !isExpectedAccount(data.account, expectedAccount) ||
    !isExpectedObject(data.object, expectedObject) ||
    !hasExactKeys(requestedRange, ["dateStart", "dateStop"]) ||
    requestedRange.dateStart !== request.dateStart ||
    requestedRange.dateStop !== request.dateStop ||
    rawItems.length !== dates.length
  ) {
    return false;
  }

  const items: OfflineDailyTrendItem[] = [];
  for (const [index, item] of rawItems.entries()) {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["date", "totals", "derived"]) ||
      item.date !== dates[index] ||
      !isMetricTotals(item.totals) ||
      !isDerivedMetrics(item.derived) ||
      !metricsMatchExpected(item.derived, deriveExpectedMetrics(item.totals))
    ) {
      return false;
    }
    items.push({ date: item.date, totals: item.totals, derived: item.derived });
  }

  const syncRunIds = context.syncRunIds;
  const validSyncRunIds =
    Array.isArray(syncRunIds) &&
    syncRunIds.length > 0 &&
    syncRunIds.every(
      (syncRunId) => typeof syncRunId === "string" && syncRunId.length > 0
    ) &&
    new Set(syncRunIds).size === syncRunIds.length &&
    syncRunIds.every(
      (syncRunId, index) => index === 0 || syncRunIds[index - 1]! < syncRunId
    );

  return (
    value.ok === true &&
    typeof context.requestId === "string" &&
    context.requestId.length > 0 &&
    context.workspaceId === FIXTURE_WORKSPACE_ID &&
    context.adAccountId === expectedAccount.id &&
    context.objectId === expectedObject.id &&
    context.objectLevel === expectedObject.objectLevel &&
    context.parentObjectId === expectedObject.parentObjectId &&
    isMetricContext(metricContext) &&
    hasExactKeys(metricContext, [
      "currency",
      "timezoneName",
      "clickMetricKind",
      "conversionEventRef",
      "attributionSpecHash",
      "apiVersion"
    ]) &&
    metricContext.currency === expectedAccount.currency &&
    metricContext.timezoneName === expectedAccount.timezoneName &&
    typeof metricContext.clickMetricKind === "string" &&
    CLICK_METRIC_KINDS.includes(metricContext.clickMetricKind) &&
    typeof context.stabilityStatus === "string" &&
    STABILITY_STATUSES.includes(context.stabilityStatus) &&
    typeof context.fetchedAt === "string" &&
    Number.isFinite(Date.parse(context.fetchedAt)) &&
    validSyncRunIds &&
    context.pointCount === dates.length &&
    hasExactKeys(trendPolicy, [
      "minimumDays",
      "maximumDays",
      "metricSelection",
      "thresholdsApplied",
      "causalClaims",
      "trendInterpretationApplied"
    ]) &&
    trendPolicy.minimumDays === 3 &&
    trendPolicy.maximumDays === 31 &&
    trendPolicy.metricSelection === "SINGLE" &&
    trendPolicy.thresholdsApplied === false &&
    trendPolicy.causalClaims === false &&
    trendPolicy.trendInterpretationApplied === false &&
    context.sourceKind === "FIXTURE" &&
    hasExactTrendWarnings(value.warnings) &&
    value.nextCursor === null &&
    value.truncated === false &&
    items.length === dates.length
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
    "离线 Worker 返回了无法识别的对象趋势错误响应。"
  );
}

export function trendMetricValue(
  item: OfflineDailyTrendItem,
  metric: OfflineTrendMetricKey
): number | null {
  if (TOTAL_KEYS.includes(metric as (typeof TOTAL_KEYS)[number])) {
    return item.totals[metric as (typeof TOTAL_KEYS)[number]];
  }
  return item.derived[metric as (typeof DERIVED_KEYS)[number]];
}

export async function loadOfflineAdObjectTrend(
  account: OfflineAdAccount,
  object: OfflineAdObject,
  request: OfflineTrendRequest,
  signal: AbortSignal
): Promise<OfflineObjectTrendResponse> {
  if (!isFixtureAccount(account) || !isFixtureAdObject(object)) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "必须先从已验证的 fixture 层级选择账户和广告对象。"
    );
  }
  const dates = expectedDates(request);
  if (dates === null) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "对象趋势日期必须是连续 3 至 31 个有效 UTC 自然日。"
    );
  }

  const parameters = new URLSearchParams({
    date_start: request.dateStart,
    date_stop: request.dateStop
  });
  const path =
    `/offline-api/v1/workspaces/${FIXTURE_WORKSPACE_ID}` +
    `/ad-accounts/${encodeURIComponent(account.id)}` +
    `/objects/${encodeURIComponent(object.id)}` +
    `/trend?${parameters.toString()}`;
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
      "离线 Worker 没有返回有效的对象趋势 JSON。"
    );
  }
  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isTrendResponse(body, account, object, request, dates)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "对象趋势响应缺少账户、对象、日期、固定指标或信任边界，已拒绝展示。"
    );
  }
  return body;
}
