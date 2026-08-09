import {
  FIXTURE_WORKSPACE_ID,
  ISO_DATE,
  OfflineComparisonError,
  hasRequiredFixtureWarnings,
  isComparisonPeriod,
  isFixtureAccount,
  isMetricChanges,
  isMetricContext,
  isPeriodContext,
  type ComparisonPeriod,
  type OfflineAdAccount,
  type OfflineComparisonRequest,
  type OfflineComparisonResponse,
  type PeriodMetricChanges,
} from "./offlineComparison";
import {
  isFixtureAdObject,
  type OfflineAdObject,
  type OfflineAdObjectLevel,
} from "./offlineHierarchy";

type DirectChildObjectLevel = "AD_SET" | "AD";
type AdditiveMetricKey =
  | "spendMinorUnits"
  | "impressions"
  | "clicks"
  | "conversions";

const ADDITIVE_METRIC_KEYS: readonly AdditiveMetricKey[] = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions",
];
const MAX_OFFLINE_DIRECT_CHILDREN = 10;

export interface OfflineDirectChildBreakdownItem {
  object: OfflineAdObject;
  baseline: ComparisonPeriod;
  current: ComparisonPeriod;
  changes: PeriodMetricChanges;
}

export interface OfflineDirectChildBreakdownResponse {
  ok: true;
  data: {
    account: OfflineAdAccount;
    parent: OfflineAdObject;
    baseline: ComparisonPeriod;
    current: ComparisonPeriod;
    changes: PeriodMetricChanges;
    items: OfflineDirectChildBreakdownItem[];
    reconciliation: {
      additiveMetricKeys: AdditiveMetricKey[];
      baselineMatchesParent: true;
      currentMatchesParent: true;
    };
  };
  context: {
    requestId: string;
    workspaceId: string;
    adAccountId: string;
    parentObjectId: string;
    parentObjectLevel: "CAMPAIGN" | "AD_SET";
    childObjectLevel: DirectChildObjectLevel;
    childCount: number;
    metricContext: OfflineComparisonResponse["context"]["metricContext"];
    periodContext: OfflineComparisonResponse["context"]["periodContext"];
    comparisonPolicy: OfflineComparisonResponse["context"]["comparisonPolicy"] & {
      rankingApplied: false;
    };
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isExpectedAccount(
  value: unknown,
  expected: OfflineAdAccount,
): value is OfflineAdAccount {
  return (
    isFixtureAccount(value) &&
    value.id === expected.id &&
    value.externalAccountRef === expected.externalAccountRef &&
    value.currency === expected.currency &&
    value.timezoneName === expected.timezoneName &&
    value.sourceKind === expected.sourceKind
  );
}

function isExpectedObject(
  value: unknown,
  expected: OfflineAdObject,
): value is OfflineAdObject {
  return (
    isFixtureAdObject(value) &&
    value.id === expected.id &&
    value.externalObjectRef === expected.externalObjectRef &&
    value.objectLevel === expected.objectLevel &&
    value.parentObjectId === expected.parentObjectId &&
    value.displayName === expected.displayName &&
    value.sourceKind === expected.sourceKind &&
    value.syncRunId === expected.syncRunId &&
    value.fetchedAt === expected.fetchedAt
  );
}

function isExpectedPeriod(
  value: unknown,
  expectedStart: string,
  expectedStop: string,
): value is ComparisonPeriod {
  return (
    isComparisonPeriod(value) &&
    value.requestedRange.dateStart === expectedStart &&
    value.requestedRange.dateStop === expectedStop &&
    value.actualRange.dateStart === expectedStart &&
    value.actualRange.dateStop === expectedStop
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
  parent: ComparisonPeriod,
  children: readonly OfflineDirectChildBreakdownItem[],
  period: "baseline" | "current",
): boolean {
  return ADDITIVE_METRIC_KEYS.every((metric) =>
    metricRollupMatches(
      parent.totals[metric],
      children.map((child) => child[period].totals[metric]),
    ),
  );
}

function expectedChildLevel(
  parentLevel: OfflineAdObjectLevel,
): DirectChildObjectLevel | null {
  if (parentLevel === "CAMPAIGN") {
    return "AD_SET";
  }
  if (parentLevel === "AD_SET") {
    return "AD";
  }
  return null;
}

function isBreakdownResponse(
  value: unknown,
  expectedAccount: OfflineAdAccount,
  expectedParent: OfflineAdObject,
  expectedRequest: OfflineComparisonRequest,
): value is OfflineDirectChildBreakdownResponse {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    !isRecord(value.context) ||
    !isRecord(value.data.reconciliation) ||
    !isRecord(value.context.periodContext) ||
    !isRecord(value.context.comparisonPolicy)
  ) {
    return false;
  }

  const childLevel = expectedChildLevel(expectedParent.objectLevel);
  const items = value.data.items;
  if (
    childLevel === null ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > MAX_OFFLINE_DIRECT_CHILDREN
  ) {
    return false;
  }

  const typedItems: OfflineDirectChildBreakdownItem[] = [];
  for (const item of items) {
    if (
      !isRecord(item) ||
      !isFixtureAdObject(item.object) ||
      item.object.parentObjectId !== expectedParent.id ||
      item.object.objectLevel !== childLevel ||
      !isExpectedPeriod(
        item.baseline,
        expectedRequest.baselineStart,
        expectedRequest.baselineStop,
      ) ||
      !isExpectedPeriod(
        item.current,
        expectedRequest.currentStart,
        expectedRequest.currentStop,
      ) ||
      !isMetricChanges(item.changes)
    ) {
      return false;
    }
    typedItems.push({
      object: item.object,
      baseline: item.baseline,
      current: item.current,
      changes: item.changes,
    });
  }

  const uniqueIds = new Set(typedItems.map((item) => item.object.id));
  const uniqueExternalRefs = new Set(
    typedItems.map((item) => item.object.externalObjectRef),
  );
  const stableOrder = typedItems.every(
    (item, index) => index === 0 || typedItems[index - 1]!.object.id < item.object.id,
  );
  const reconciliation = value.data.reconciliation;
  const periodContext = value.context.periodContext;
  const comparisonPolicy = value.context.comparisonPolicy;
  const additiveMetricKeys = reconciliation.additiveMetricKeys;

  return (
    value.ok === true &&
    isExpectedAccount(value.data.account, expectedAccount) &&
    isExpectedObject(value.data.parent, expectedParent) &&
    isExpectedPeriod(
      value.data.baseline,
      expectedRequest.baselineStart,
      expectedRequest.baselineStop,
    ) &&
    isExpectedPeriod(
      value.data.current,
      expectedRequest.currentStart,
      expectedRequest.currentStop,
    ) &&
    isMetricChanges(value.data.changes) &&
    uniqueIds.size === typedItems.length &&
    uniqueExternalRefs.size === typedItems.length &&
    stableOrder &&
    Array.isArray(additiveMetricKeys) &&
    additiveMetricKeys.length === ADDITIVE_METRIC_KEYS.length &&
    additiveMetricKeys.every(
      (metric, index) => metric === ADDITIVE_METRIC_KEYS[index],
    ) &&
    reconciliation.baselineMatchesParent === true &&
    reconciliation.currentMatchesParent === true &&
    periodRollupMatches(value.data.baseline, typedItems, "baseline") &&
    periodRollupMatches(value.data.current, typedItems, "current") &&
    typeof value.context.requestId === "string" &&
    value.context.workspaceId === FIXTURE_WORKSPACE_ID &&
    value.context.adAccountId === expectedAccount.id &&
    value.context.parentObjectId === expectedParent.id &&
    value.context.parentObjectLevel === expectedParent.objectLevel &&
    value.context.childObjectLevel === childLevel &&
    value.context.childCount === typedItems.length &&
    isMetricContext(value.context.metricContext) &&
    value.context.metricContext.currency === expectedAccount.currency &&
    value.context.metricContext.timezoneName === expectedAccount.timezoneName &&
    isPeriodContext(periodContext.baseline) &&
    isPeriodContext(periodContext.current) &&
    isNonNegativeInteger(comparisonPolicy.periodLengthDays) &&
    comparisonPolicy.periodLengthDays > 0 &&
    comparisonPolicy.periodLengthDays === value.data.baseline.coverage.expectedDays &&
    comparisonPolicy.periodLengthDays === value.data.current.coverage.expectedDays &&
    comparisonPolicy.periodsOverlap === false &&
    comparisonPolicy.thresholdsApplied === false &&
    comparisonPolicy.causalClaims === false &&
    comparisonPolicy.rankingApplied === false &&
    value.context.sourceKind === "FIXTURE" &&
    hasRequiredFixtureWarnings(value.warnings) &&
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
    "离线 Worker 返回了无法识别的直接子对象错误响应。",
  );
}

export async function loadOfflineDirectChildBreakdown(
  account: OfflineAdAccount,
  parent: OfflineAdObject,
  request: OfflineComparisonRequest,
  signal: AbortSignal,
): Promise<OfflineDirectChildBreakdownResponse> {
  if (!isFixtureAccount(account) || !isFixtureAdObject(parent)) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "必须先从已验证的 fixture 层级选择父对象。",
    );
  }
  if (parent.objectLevel === "AD") {
    throw new OfflineComparisonError(
      "NO_CHILD_OBJECTS",
      "Ad 是当前层级的叶子对象，没有可拆解的直接子对象。",
    );
  }

  const dates = [
    request.baselineStart,
    request.baselineStop,
    request.currentStart,
    request.currentStop,
  ];
  if (!dates.every((date) => ISO_DATE.test(date))) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "四个周期日期都必须使用 YYYY-MM-DD。",
    );
  }

  const parameters = new URLSearchParams({
    baseline_start: request.baselineStart,
    baseline_stop: request.baselineStop,
    current_start: request.currentStart,
    current_stop: request.currentStop,
  });
  const path =
    `/offline-api/v1/workspaces/${FIXTURE_WORKSPACE_ID}` +
    `/ad-accounts/${encodeURIComponent(account.id)}` +
    `/objects/${encodeURIComponent(parent.id)}` +
    `/children-comparison?${parameters.toString()}`;
  const response = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    credentials: "omit",
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "离线 Worker 没有返回有效的直接子对象 JSON。",
    );
  }

  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isBreakdownResponse(body, account, parent, request)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "直接子对象响应缺少父子绑定、汇总对账或无排名信任标记，已拒绝展示。",
    );
  }

  return body;
}
