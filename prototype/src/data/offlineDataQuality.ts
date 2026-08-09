import {
  FIXTURE_WORKSPACE_ID,
  ISO_DATE,
  OfflineComparisonError,
  isFixtureAccount,
  isMetricContext,
  type OfflineAdAccount
} from "./offlineComparison";
import type { OfflineTrendRequest } from "./offlineTrend";

export const OFFLINE_DATA_QUALITY_CHECK_CODES = [
  "PRIMARY_GRAIN_UNIQUE",
  "DAILY_COVERAGE_COMPLETE",
  "REPORTING_CONTEXT_CONSISTENT",
  "OBJECT_HIERARCHY_COMPLETE",
  "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP",
  "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
  "AD_SET_TO_AD_DAILY_ROLLUP"
] as const;

export type OfflineDataQualityCheckCode =
  (typeof OFFLINE_DATA_QUALITY_CHECK_CODES)[number];

export type OfflineDataQualityCheckUnit =
  | "ROWS"
  | "SUBJECT_DAYS"
  | "OBJECTS"
  | "PARENT_DAYS";

export interface OfflineDataQualityCheck {
  code: OfflineDataQualityCheckCode;
  status: "PASS";
  unit: OfflineDataQualityCheckUnit;
  checkedUnits: number;
  failedUnits: 0;
}

export interface OfflineDataQualityResponse {
  ok: true;
  data: {
    account: OfflineAdAccount;
    requestedRange: OfflineTrendRequest;
    dataset: {
      grain: "SUBJECT_DAY";
      subjectCount: number;
      observedRows: number;
      expectedRows: number;
    };
    hierarchy: {
      campaigns: number;
      adSets: number;
      ads: number;
      objectCount: number;
      objectIds: string[];
    };
    checks: OfflineDataQualityCheck[];
  };
  context: {
    requestId: string;
    workspaceId: string;
    adAccountId: string;
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
    qualityPolicy: {
      minimumDays: 3;
      maximumDays: 31;
      requiredChecks: readonly OfflineDataQualityCheckCode[];
      allChecksRequired: true;
      performanceEvaluationApplied: false;
      businessThresholdsApplied: false;
      causalClaims: false;
      gateEvidence: false;
    };
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}

export interface OfflineDataQualityAttestation {
  workspaceId: typeof FIXTURE_WORKSPACE_ID;
  accountId: string;
  dateStart: string;
  dateStop: string;
  objectIds: readonly string[];
  metricContext: OfflineDataQualityResponse["context"]["metricContext"];
  stabilityStatus: OfflineDataQualityResponse["context"]["stabilityStatus"];
  fetchedAt: string;
  syncRunIds: readonly string[];
  requestId: string;
  sourceKind: "FIXTURE";
}

interface OfflineAnalysisSnapshotContext {
  stabilityStatus: OfflineDataQualityAttestation["stabilityStatus"];
  fetchedAt: string;
  syncRunIds: readonly string[];
}

export interface OfflineAnalysisContextForAttestation {
  workspaceId: string;
  adAccountId: string;
  metricContext: {
    currency: string;
    timezoneName: string;
    clickMetricKind: string;
    conversionEventRef: string;
    attributionSpecHash: string;
    apiVersion: string;
  };
  sourceKind: "FIXTURE";
  stabilityStatus?: OfflineAnalysisSnapshotContext["stabilityStatus"];
  fetchedAt?: string;
  syncRunIds?: readonly string[];
  periodContext?: {
    baseline: OfflineAnalysisSnapshotContext;
    current: OfflineAnalysisSnapshotContext;
  };
}

const OFFLINE_ID = /^[a-z0-9][a-z0-9_-]{2,63}$/;
const ACCOUNT_KEYS = [
  "id",
  "externalAccountRef",
  "currency",
  "timezoneName",
  "sourceKind",
  "dataThrough",
  "insightRowCount"
] as const;
const METRIC_CONTEXT_KEYS = [
  "currency",
  "timezoneName",
  "clickMetricKind",
  "conversionEventRef",
  "attributionSpecHash",
  "apiVersion"
] as const;
const STABILITY_STATUSES = ["PROVISIONAL", "RECONCILING", "STABLE"] as const;

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

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function expectedDayCount(request: OfflineTrendRequest): number | null {
  const start = Date.parse(`${request.dateStart}T00:00:00Z`);
  const stop = Date.parse(`${request.dateStop}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(request.dateStart) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(request.dateStop) ||
    !Number.isFinite(start) ||
    !Number.isFinite(stop) ||
    new Date(start).toISOString().slice(0, 10) !== request.dateStart ||
    new Date(stop).toISOString().slice(0, 10) !== request.dateStop
  ) {
    return null;
  }
  const dayCount = (stop - start) / 86_400_000 + 1;
  return Number.isSafeInteger(dayCount) && dayCount >= 3 && dayCount <= 31
    ? dayCount
    : null;
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

function isSortedUniqueStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.length > 0) &&
    new Set(value).size === value.length &&
    value.every((item, index) => index === 0 || value[index - 1]! < item)
  );
}

function isSortedUniqueOfflineIds(value: unknown): value is string[] {
  return (
    isSortedUniqueStringArray(value) &&
    value.every((item) => OFFLINE_ID.test(item))
  );
}

function isExpectedWarnings(
  value: unknown,
  stabilityStatus: string
): value is string[] {
  const expected = ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"];
  if (stabilityStatus !== "STABLE") {
    expected.push(`DATA_${stabilityStatus}`);
  }
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every((warning, index) => warning === expected[index])
  );
}

function arraysEqual(
  left: readonly unknown[],
  right: readonly unknown[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function metricContextsEqual(
  left: OfflineDataQualityAttestation["metricContext"],
  right: OfflineAnalysisContextForAttestation["metricContext"]
): boolean {
  return METRIC_CONTEXT_KEYS.every((key) => left[key] === right[key]);
}

function snapshotMatchesAttestation(
  attestation: OfflineDataQualityAttestation,
  snapshot: OfflineAnalysisSnapshotContext
): boolean {
  return (
    snapshot.stabilityStatus === attestation.stabilityStatus &&
    snapshot.fetchedAt === attestation.fetchedAt &&
    arraysEqual(snapshot.syncRunIds, attestation.syncRunIds)
  );
}

export function createOfflineDataQualityAttestation(
  response: OfflineDataQualityResponse
): OfflineDataQualityAttestation {
  return {
    workspaceId: FIXTURE_WORKSPACE_ID,
    accountId: response.data.account.id,
    dateStart: response.data.requestedRange.dateStart,
    dateStop: response.data.requestedRange.dateStop,
    objectIds: [...response.data.hierarchy.objectIds],
    metricContext: { ...response.context.metricContext },
    stabilityStatus: response.context.stabilityStatus,
    fetchedAt: response.context.fetchedAt,
    syncRunIds: [...response.context.syncRunIds],
    requestId: response.context.requestId,
    sourceKind: "FIXTURE"
  };
}

export function offlineDataQualityAttestsRanges(
  attestation: OfflineDataQualityAttestation | null | undefined,
  account: OfflineAdAccount,
  ranges: readonly OfflineTrendRequest[],
  objectId?: string
): boolean {
  return (
    attestation !== null &&
    attestation !== undefined &&
    attestation.workspaceId === FIXTURE_WORKSPACE_ID &&
    attestation.accountId === account.id &&
    attestation.sourceKind === "FIXTURE" &&
    attestation.metricContext.currency === account.currency &&
    attestation.metricContext.timezoneName === account.timezoneName &&
    ISO_DATE.test(attestation.dateStart) &&
    ISO_DATE.test(attestation.dateStop) &&
    attestation.dateStart <= attestation.dateStop &&
    ranges.length > 0 &&
    ranges.every(
      ({ dateStart, dateStop }) =>
        ISO_DATE.test(dateStart) &&
        ISO_DATE.test(dateStop) &&
        dateStart <= dateStop &&
        attestation.dateStart <= dateStart &&
        attestation.dateStop >= dateStop
    ) &&
    (objectId === undefined || attestation.objectIds.includes(objectId))
  );
}

export function offlineAnalysisContextMatchesAttestation(
  attestation: OfflineDataQualityAttestation,
  context: OfflineAnalysisContextForAttestation
): boolean {
  if (
    context.workspaceId !== attestation.workspaceId ||
    context.adAccountId !== attestation.accountId ||
    context.sourceKind !== "FIXTURE" ||
    !metricContextsEqual(attestation.metricContext, context.metricContext)
  ) {
    return false;
  }

  if (context.periodContext !== undefined) {
    return (
      snapshotMatchesAttestation(attestation, context.periodContext.baseline) &&
      snapshotMatchesAttestation(attestation, context.periodContext.current)
    );
  }

  return (
    context.stabilityStatus !== undefined &&
    context.fetchedAt !== undefined &&
    context.syncRunIds !== undefined &&
    snapshotMatchesAttestation(attestation, {
      stabilityStatus: context.stabilityStatus,
      fetchedAt: context.fetchedAt,
      syncRunIds: context.syncRunIds
    })
  );
}

function isQualityResponse(
  value: unknown,
  account: OfflineAdAccount,
  request: OfflineTrendRequest,
  dayCount: number
): value is OfflineDataQualityResponse {
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
      "requestedRange",
      "dataset",
      "hierarchy",
      "checks"
    ]) ||
    !isRecord(value.context)
  ) {
    return false;
  }

  const { data, context } = value;
  const range = data.requestedRange;
  const dataset = data.dataset;
  const hierarchy = data.hierarchy;
  const checks = data.checks;
  const metricContext = context.metricContext;
  const policy = context.qualityPolicy;
  if (
    !isRecord(range) ||
    !isRecord(dataset) ||
    !isRecord(hierarchy) ||
    !Array.isArray(checks) ||
    !isRecord(metricContext) ||
    !isRecord(policy)
  ) {
    return false;
  }
  const objectIds = hierarchy.objectIds;
  if (
    !isExpectedAccount(data.account, account) ||
    !hasExactKeys(range, ["dateStart", "dateStop"]) ||
    range.dateStart !== request.dateStart ||
    range.dateStop !== request.dateStop ||
    !hasExactKeys(dataset, [
      "grain",
      "subjectCount",
      "observedRows",
      "expectedRows"
    ]) ||
    dataset.grain !== "SUBJECT_DAY" ||
    !isNonNegativeInteger(dataset.subjectCount) ||
    !isNonNegativeInteger(dataset.observedRows) ||
    !isNonNegativeInteger(dataset.expectedRows) ||
    !hasExactKeys(hierarchy, [
      "campaigns",
      "adSets",
      "ads",
      "objectCount",
      "objectIds"
    ]) ||
    !isNonNegativeInteger(hierarchy.campaigns) ||
    !isNonNegativeInteger(hierarchy.adSets) ||
    !isNonNegativeInteger(hierarchy.ads) ||
    !isNonNegativeInteger(hierarchy.objectCount) ||
    !isSortedUniqueOfflineIds(objectIds)
  ) {
    return false;
  }

  const objectCount =
    hierarchy.campaigns + hierarchy.adSets + hierarchy.ads;
  const expectedRows = (objectCount + 1) * dayCount;
  if (
    hierarchy.campaigns < 1 ||
    hierarchy.adSets < 1 ||
    hierarchy.ads < 1 ||
    hierarchy.objectCount !== objectCount ||
    objectIds.length !== objectCount ||
    dataset.subjectCount !== objectCount + 1 ||
    dataset.observedRows !== expectedRows ||
    dataset.expectedRows !== expectedRows
  ) {
    return false;
  }

  const expectedChecks: Array<{
    code: OfflineDataQualityCheckCode;
    unit: OfflineDataQualityCheckUnit;
    checkedUnits: number;
  }> = [
    { code: "PRIMARY_GRAIN_UNIQUE", unit: "ROWS", checkedUnits: expectedRows },
    {
      code: "DAILY_COVERAGE_COMPLETE",
      unit: "SUBJECT_DAYS",
      checkedUnits: expectedRows
    },
    {
      code: "REPORTING_CONTEXT_CONSISTENT",
      unit: "ROWS",
      checkedUnits: expectedRows
    },
    {
      code: "OBJECT_HIERARCHY_COMPLETE",
      unit: "OBJECTS",
      checkedUnits: objectCount
    },
    {
      code: "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP",
      unit: "PARENT_DAYS",
      checkedUnits: dayCount
    },
    {
      code: "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
      unit: "PARENT_DAYS",
      checkedUnits: hierarchy.campaigns * dayCount
    },
    {
      code: "AD_SET_TO_AD_DAILY_ROLLUP",
      unit: "PARENT_DAYS",
      checkedUnits: hierarchy.adSets * dayCount
    }
  ];
  if (
    checks.length !== expectedChecks.length ||
    checks.some((item, index) => {
      const expected = expectedChecks[index];
      return (
        expected === undefined ||
        !isRecord(item) ||
        !hasExactKeys(item, [
          "code",
          "status",
          "unit",
          "checkedUnits",
          "failedUnits"
        ]) ||
        item.code !== expected.code ||
        item.status !== "PASS" ||
        item.unit !== expected.unit ||
        item.checkedUnits !== expected.checkedUnits ||
        item.failedUnits !== 0
      );
    })
  ) {
    return false;
  }

  const syncRunIds = context.syncRunIds;
  const validStability =
    typeof context.stabilityStatus === "string" &&
    STABILITY_STATUSES.includes(
      context.stabilityStatus as (typeof STABILITY_STATUSES)[number]
    );
  return (
    value.ok === true &&
    typeof context.requestId === "string" &&
    context.requestId.length > 0 &&
    context.workspaceId === FIXTURE_WORKSPACE_ID &&
    context.adAccountId === account.id &&
    hasExactKeys(metricContext, METRIC_CONTEXT_KEYS) &&
    isMetricContext(metricContext) &&
    metricContext.currency === account.currency &&
    metricContext.timezoneName === account.timezoneName &&
    validStability &&
    typeof context.fetchedAt === "string" &&
    Number.isFinite(Date.parse(context.fetchedAt)) &&
    isSortedUniqueStringArray(syncRunIds) &&
    hasExactKeys(policy, [
      "minimumDays",
      "maximumDays",
      "requiredChecks",
      "allChecksRequired",
      "performanceEvaluationApplied",
      "businessThresholdsApplied",
      "causalClaims",
      "gateEvidence"
    ]) &&
    policy.minimumDays === 3 &&
    policy.maximumDays === 31 &&
    Array.isArray(policy.requiredChecks) &&
    arraysEqual(policy.requiredChecks, OFFLINE_DATA_QUALITY_CHECK_CODES) &&
    policy.allChecksRequired === true &&
    policy.performanceEvaluationApplied === false &&
    policy.businessThresholdsApplied === false &&
    policy.causalClaims === false &&
    policy.gateEvidence === false &&
    context.sourceKind === "FIXTURE" &&
    isExpectedWarnings(value.warnings, String(context.stabilityStatus)) &&
    value.nextCursor === null &&
    value.truncated === false
  );
}

function errorFromEnvelope(value: unknown, status: number) {
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
    "离线 Worker 返回了无法识别的数据质量错误响应。"
  );
}

export async function loadOfflineDataQuality(
  account: OfflineAdAccount,
  request: OfflineTrendRequest,
  signal: AbortSignal
): Promise<OfflineDataQualityResponse> {
  if (!isFixtureAccount(account)) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "必须先从本地 fixture 账户列表选择有效账户。"
    );
  }
  const dayCount = expectedDayCount(request);
  if (dayCount === null) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "数据质量日期必须是连续 3 至 31 个有效 UTC 自然日。"
    );
  }

  const parameters = new URLSearchParams({
    date_start: request.dateStart,
    date_stop: request.dateStop
  });
  const path =
    `/offline-api/v1/workspaces/${FIXTURE_WORKSPACE_ID}` +
    `/ad-accounts/${encodeURIComponent(account.id)}` +
    `/data-quality?${parameters.toString()}`;
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
      "离线 Worker 没有返回有效的数据质量 JSON。"
    );
  }
  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isQualityResponse(body, account, request, dayCount)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "数据质量响应缺少账户、日期、检查证据或只读边界，已拒绝展示。"
    );
  }
  return body;
}
