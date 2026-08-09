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

export interface MetricTotals {
  spendMinorUnits: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
}

export interface DerivedMetrics {
  clickThroughRate: number | null;
  conversionRate: number | null;
  costPerClickMinorUnits: number | null;
  costPerThousandImpressionsMinorUnits: number | null;
  costPerConversionMinorUnits: number | null;
}

export interface ComparisonPeriod {
  requestedRange: DateRange;
  actualRange: DateRange;
  coverage: {
    expectedDays: number;
    observedDays: number;
    complete: boolean;
  };
  totals: MetricTotals;
  derived: DerivedMetrics;
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

export interface OfflineAdAccount {
  id: string;
  externalAccountRef: string;
  currency: string;
  timezoneName: string;
  sourceKind: "FIXTURE";
  dataThrough: string | null;
  insightRowCount: number;
}

export interface OfflineAccountListResponse {
  ok: true;
  data: {
    items: OfflineAdAccount[];
  };
  context: {
    requestId: string;
    workspaceId: string;
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}

export interface OfflineComparisonResponse {
  ok: true;
  data: {
    account: OfflineAdAccount;
    baseline: ComparisonPeriod;
    current: ComparisonPeriod;
    changes: PeriodMetricChanges;
    diagnostics: DiagnosticSignal[];
  };
  context: {
    requestId: string;
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
    periodContext: {
      baseline: PeriodContext;
      current: PeriodContext;
    };
    comparisonPolicy: {
      periodLengthDays: number;
      periodsOverlap: false;
      thresholdsApplied: false;
      causalClaims: false;
    };
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}

export interface DateRange {
  dateStart: string;
  dateStop: string;
}

export interface PeriodContext {
  stabilityStatus: "PROVISIONAL" | "RECONCILING" | "STABLE";
  fetchedAt: string;
  syncRunIds: string[];
}

export interface OfflineComparisonRequest {
  baselineStart: string;
  baselineStop: string;
  currentStart: string;
  currentStop: string;
}

export const DEFAULT_OFFLINE_COMPARISON_REQUEST: OfflineComparisonRequest = {
  baselineStart: "2026-08-02",
  baselineStop: "2026-08-02",
  currentStart: "2026-08-04",
  currentStop: "2026-08-04",
};

export const FIXTURE_WORKSPACE_ID = "ws_fixture_01";
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OFFLINE_ID = /^[a-z0-9][a-z0-9_-]{2,63}$/;
const CHANGE_DIRECTIONS: readonly string[] = [
  "DECREASED",
  "INCREASED",
  "NOT_COMPARABLE",
  "UNCHANGED",
];
const UNAVAILABLE_REASONS: readonly unknown[] = [
  "BASELINE_ZERO",
  "MISSING_VALUE",
  null,
];
const DIAGNOSTIC_CODES: readonly string[] = [
  "CLICKS_UP_CONVERSIONS_NOT_UP",
  "CONVERSION_VOLUME_UP_COST_DOWN",
  "CTR_UP_CONVERSION_RATE_DOWN",
  "SPEND_UP_CONVERSIONS_DOWN",
  "SPEND_WITH_ZERO_CONVERSIONS",
];
const DIAGNOSTIC_SEVERITIES: readonly string[] = [
  "INFO",
  "WARNING",
  "WATCH",
];
const STABILITY_STATUSES: readonly string[] = [
  "PROVISIONAL",
  "RECONCILING",
  "STABLE",
];

export class OfflineComparisonError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OfflineComparisonError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isNonNegativeNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isDateRange(value: unknown): value is DateRange {
  return (
    isRecord(value) &&
    typeof value.dateStart === "string" &&
    ISO_DATE.test(value.dateStart) &&
    typeof value.dateStop === "string" &&
    ISO_DATE.test(value.dateStop)
  );
}

function isMetricTotals(value: unknown): value is MetricTotals {
  return (
    isRecord(value) &&
    isNonNegativeNumberOrNull(value.spendMinorUnits) &&
    isNonNegativeNumberOrNull(value.impressions) &&
    isNonNegativeNumberOrNull(value.clicks) &&
    isNonNegativeNumberOrNull(value.conversions)
  );
}

function isDerivedMetrics(value: unknown): value is DerivedMetrics {
  return (
    isRecord(value) &&
    isNonNegativeNumberOrNull(value.clickThroughRate) &&
    isNonNegativeNumberOrNull(value.conversionRate) &&
    isNonNegativeNumberOrNull(value.costPerClickMinorUnits) &&
    isNonNegativeNumberOrNull(value.costPerThousandImpressionsMinorUnits) &&
    isNonNegativeNumberOrNull(value.costPerConversionMinorUnits)
  );
}

export function isComparisonPeriod(value: unknown): value is ComparisonPeriod {
  if (!isRecord(value) || !isRecord(value.coverage)) {
    return false;
  }

  return (
    isDateRange(value.requestedRange) &&
    isDateRange(value.actualRange) &&
    isNonNegativeInteger(value.coverage.expectedDays) &&
    value.coverage.expectedDays > 0 &&
    value.coverage.observedDays === value.coverage.expectedDays &&
    value.coverage.complete === true &&
    isMetricTotals(value.totals) &&
    isDerivedMetrics(value.derived)
  );
}

function isMetricChange(value: unknown): value is MetricChange {
  return (
    isRecord(value) &&
    isFiniteNumberOrNull(value.baseline) &&
    isFiniteNumberOrNull(value.current) &&
    isFiniteNumberOrNull(value.absoluteChange) &&
    isFiniteNumberOrNull(value.relativeChange) &&
    typeof value.direction === "string" &&
    CHANGE_DIRECTIONS.includes(value.direction) &&
    UNAVAILABLE_REASONS.includes(value.relativeChangeUnavailableReason)
  );
}

export function isMetricChanges(value: unknown): value is PeriodMetricChanges {
  if (!isRecord(value) || !isRecord(value.totals) || !isRecord(value.derived)) {
    return false;
  }

  return (
    isMetricChange(value.totals.spendMinorUnits) &&
    isMetricChange(value.totals.impressions) &&
    isMetricChange(value.totals.clicks) &&
    isMetricChange(value.totals.conversions) &&
    isMetricChange(value.derived.clickThroughRate) &&
    isMetricChange(value.derived.conversionRate) &&
    isMetricChange(value.derived.costPerClickMinorUnits) &&
    isMetricChange(value.derived.costPerThousandImpressionsMinorUnits) &&
    isMetricChange(value.derived.costPerConversionMinorUnits)
  );
}

function isDiagnosticSignal(value: unknown): value is DiagnosticSignal {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    DIAGNOSTIC_CODES.includes(value.code) &&
    typeof value.severity === "string" &&
    DIAGNOSTIC_SEVERITIES.includes(value.severity) &&
    value.findingConfidence === "CONFIRMED_PATTERN" &&
    value.causalClaim === false &&
    typeof value.summary === "string" &&
    isStringArray(value.evidenceMetrics) &&
    isStringArray(value.nextChecks)
  );
}

export function isFixtureAccount(value: unknown): value is OfflineAdAccount {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    OFFLINE_ID.test(value.id) &&
    typeof value.externalAccountRef === "string" &&
    value.externalAccountRef.length > 0 &&
    typeof value.currency === "string" &&
    value.currency.length > 0 &&
    typeof value.timezoneName === "string" &&
    value.timezoneName.length > 0 &&
    value.sourceKind === "FIXTURE" &&
    (value.dataThrough === null || typeof value.dataThrough === "string") &&
    isNonNegativeInteger(value.insightRowCount)
  );
}

export function isPeriodContext(value: unknown): value is PeriodContext {
  return (
    isRecord(value) &&
    typeof value.stabilityStatus === "string" &&
    STABILITY_STATUSES.includes(value.stabilityStatus) &&
    typeof value.fetchedAt === "string" &&
    isStringArray(value.syncRunIds)
  );
}

export function isMetricContext(value: unknown): value is OfflineComparisonResponse["context"]["metricContext"] {
  return (
    isRecord(value) &&
    typeof value.currency === "string" &&
    typeof value.timezoneName === "string" &&
    typeof value.clickMetricKind === "string" &&
    typeof value.conversionEventRef === "string" &&
    typeof value.attributionSpecHash === "string" &&
    typeof value.apiVersion === "string"
  );
}

export function hasRequiredFixtureWarnings(value: unknown): value is string[] {
  return (
    isStringArray(value) &&
    value.includes("FIXTURE_DATA_ONLY") &&
    value.includes("NO_EXTERNAL_CONNECTION")
  );
}

function isOfflineAccountListResponse(
  value: unknown,
): value is OfflineAccountListResponse {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.context)) {
    return false;
  }

  const items = value.data.items;
  if (
    !Array.isArray(items) ||
    items.length > 10 ||
    !items.every(isFixtureAccount)
  ) {
    return false;
  }

  const uniqueIds = new Set(items.map((account) => account.id));
  return (
    uniqueIds.size === items.length &&
    value.ok === true &&
    typeof value.context.requestId === "string" &&
    value.context.workspaceId === FIXTURE_WORKSPACE_ID &&
    value.context.sourceKind === "FIXTURE" &&
    hasRequiredFixtureWarnings(value.warnings) &&
    value.nextCursor === null &&
    value.truncated === false
  );
}

export function isOfflineComparisonResponse(
  value: unknown,
  expectedAccount: OfflineAdAccount,
  expectedRequest: OfflineComparisonRequest,
): value is OfflineComparisonResponse {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    !isRecord(value.context) ||
    !isRecord(value.context.periodContext) ||
    !isRecord(value.context.comparisonPolicy)
  ) {
    return false;
  }

  const { data, context } = value;
  const periodContext = context.periodContext;
  const comparisonPolicy = context.comparisonPolicy;
  if (
    !isRecord(periodContext) ||
    !isRecord(comparisonPolicy) ||
    !isFixtureAccount(data.account) ||
    !isComparisonPeriod(data.baseline) ||
    !isComparisonPeriod(data.current) ||
    !isMetricChanges(data.changes) ||
    !Array.isArray(data.diagnostics) ||
    !data.diagnostics.every(isDiagnosticSignal) ||
    !isMetricContext(context.metricContext) ||
    !isPeriodContext(periodContext.baseline) ||
    !isPeriodContext(periodContext.current)
  ) {
    return false;
  }

  return (
    value.ok === true &&
    data.account.id === expectedAccount.id &&
    data.account.externalAccountRef === expectedAccount.externalAccountRef &&
    data.account.currency === expectedAccount.currency &&
    data.account.timezoneName === expectedAccount.timezoneName &&
    data.baseline.requestedRange.dateStart === expectedRequest.baselineStart &&
    data.baseline.requestedRange.dateStop === expectedRequest.baselineStop &&
    data.current.requestedRange.dateStart === expectedRequest.currentStart &&
    data.current.requestedRange.dateStop === expectedRequest.currentStop &&
    typeof context.requestId === "string" &&
    context.workspaceId === FIXTURE_WORKSPACE_ID &&
    context.adAccountId === expectedAccount.id &&
    context.metricContext.currency === expectedAccount.currency &&
    context.metricContext.timezoneName === expectedAccount.timezoneName &&
    isNonNegativeInteger(comparisonPolicy.periodLengthDays) &&
    comparisonPolicy.periodLengthDays > 0 &&
    comparisonPolicy.periodLengthDays ===
      data.baseline.coverage.expectedDays &&
    comparisonPolicy.periodLengthDays ===
      data.current.coverage.expectedDays &&
    comparisonPolicy.periodsOverlap === false &&
    comparisonPolicy.thresholdsApplied === false &&
    comparisonPolicy.causalClaims === false &&
    context.sourceKind === "FIXTURE" &&
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
    "离线 Worker 返回了无法识别的错误响应。",
  );
}

export async function loadOfflineComparison(
  account: OfflineAdAccount,
  request: OfflineComparisonRequest,
  signal: AbortSignal,
): Promise<OfflineComparisonResponse> {
  if (!isFixtureAccount(account)) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "必须先从本地 fixture 账户列表选择有效账户。",
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
    `/ad-accounts/${encodeURIComponent(account.id)}/comparison?${parameters.toString()}`;

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
      "离线 Worker 没有返回有效 JSON。",
    );
  }

  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isOfflineComparisonResponse(body, account, request)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "响应缺少 fixture、口径或非因果信任标记，已拒绝展示。",
    );
  }

  return body;
}

export async function loadOfflineAdAccounts(
  signal: AbortSignal,
): Promise<OfflineAccountListResponse> {
  const path =
    `/offline-api/v1/workspaces/${FIXTURE_WORKSPACE_ID}/ad-accounts`;
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
      "离线 Worker 没有返回有效 JSON。",
    );
  }

  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isOfflineAccountListResponse(body)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "账户响应缺少 fixture、容量或本地连接信任标记，已拒绝使用。",
    );
  }

  return body;
}
