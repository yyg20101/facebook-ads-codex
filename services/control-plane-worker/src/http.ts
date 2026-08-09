import {
  buildDirectChildBreakdown,
  buildDirectChildTrend,
  buildPeriodComparison,
  type PeriodComparison
} from "./comparison";
import {
  buildFixtureDataQualityReport,
  OFFLINE_DATA_QUALITY_CHECK_CODES
} from "./quality";
import {
  getFixtureAccountTrend,
  getFixtureAdObjectTrend,
  getFixtureAccountSummary,
  getFixtureAdObjectSummary,
  listFixtureAdAccounts,
  listFixtureAdObjects,
  type AdObjectTrendResult,
  type AccountSummaryResult,
  type FixtureAdObject
} from "./read-model";

export interface OfflineServices {
  readonly DB: D1Database;
  readonly OFFLINE_FIXTURES_ENABLED: string;
}

type ErrorCode =
  | "CAPACITY_EXCEEDED"
  | "DATA_UNAVAILABLE"
  | "INCOMPLETE_PERIOD_COVERAGE"
  | "INCOMPATIBLE_OBJECT_HIERARCHY"
  | "INCOMPATIBLE_OBJECT_ROLLUP"
  | "INCOMPATIBLE_METRIC_CONTEXT"
  | "INTERNAL_ERROR"
  | "INVALID_ARGUMENT"
  | "METHOD_NOT_ALLOWED"
  | "NO_CHILD_OBJECTS"
  | "NOT_FOUND"
  | "OFFLINE_MODE_DISABLED"
  | "OFFLINE_ONLY";

type Route =
  | { kind: "health" }
  | { kind: "account_list"; workspaceId: string }
  | { kind: "account_objects"; workspaceId: string; adAccountId: string }
  | { kind: "account_data_quality"; workspaceId: string; adAccountId: string }
  | {
      kind: "ad_object_trend";
      workspaceId: string;
      adAccountId: string;
      objectId: string;
    }
  | {
      kind: "direct_child_daily_trend";
      workspaceId: string;
      adAccountId: string;
      objectId: string;
    }
  | {
      kind: "ad_object_comparison";
      workspaceId: string;
      adAccountId: string;
      objectId: string;
    }
  | {
      kind: "direct_child_breakdown";
      workspaceId: string;
      adAccountId: string;
      objectId: string;
    }
  | { kind: "account_summary"; workspaceId: string; adAccountId: string }
  | { kind: "account_comparison"; workspaceId: string; adAccountId: string }
  | { kind: "not_found" };

const JSON_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff"
} as const;

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { ...JSON_HEADERS, ...headers }
  });
}

function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  requestId: string,
  headers?: HeadersInit
) {
  return jsonResponse(
    {
      ok: false,
      error: { code, message, retryable: status >= 500 },
      context: { requestId }
    },
    status,
    headers
  );
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "offline.invalid"
  );
}

function parseRoute(pathname: string): Route {
  if (pathname === "/healthz") {
    return { kind: "health" };
  }

  const segments = pathname.split("/");
  if (
    segments.length === 6 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts"
  ) {
    return { kind: "account_list", workspaceId: segments[4] ?? "" };
  }
  if (
    segments.length === 10 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "objects" &&
    segments[9] === "children-trend"
  ) {
    return {
      kind: "direct_child_daily_trend",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? "",
      objectId: segments[8] ?? ""
    };
  }
  if (
    segments.length === 10 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "objects" &&
    segments[9] === "trend"
  ) {
    return {
      kind: "ad_object_trend",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? "",
      objectId: segments[8] ?? ""
    };
  }
  if (
    segments.length === 10 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "objects" &&
    segments[9] === "children-comparison"
  ) {
    return {
      kind: "direct_child_breakdown",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? "",
      objectId: segments[8] ?? ""
    };
  }
  if (
    segments.length === 10 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "objects" &&
    segments[9] === "comparison"
  ) {
    return {
      kind: "ad_object_comparison",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? "",
      objectId: segments[8] ?? ""
    };
  }
  if (
    segments.length === 8 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "objects"
  ) {
    return {
      kind: "account_objects",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? ""
    };
  }
  if (
    segments.length === 8 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "data-quality"
  ) {
    return {
      kind: "account_data_quality",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? ""
    };
  }
  if (
    segments.length === 8 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "summary"
  ) {
    return {
      kind: "account_summary",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? ""
    };
  }
  if (
    segments.length === 8 &&
    segments[1] === "offline" &&
    segments[2] === "v1" &&
    segments[3] === "workspaces" &&
    segments[5] === "ad-accounts" &&
    segments[7] === "comparison"
  ) {
    return {
      kind: "account_comparison",
      workspaceId: segments[4] ?? "",
      adAccountId: segments[6] ?? ""
    };
  }

  return { kind: "not_found" };
}

function isValidId(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,63}$/.test(value);
}

function parseIsoDate(value: string | null): number | null {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

function inclusiveDays(startTimestamp: number, stopTimestamp: number): number {
  return (stopTimestamp - startTimestamp) / 86_400_000 + 1;
}

interface ParsedComparisonRequest {
  baselineStart: string;
  baselineStop: string;
  currentStart: string;
  currentStop: string;
  periodLengthDays: number;
}

const COMPARISON_PARAMETERS = [
  "baseline_start",
  "baseline_stop",
  "current_start",
  "current_stop"
] as const;

const TREND_PARAMETERS = ["date_start", "date_stop"] as const;

interface ParsedTrendRequest {
  dateStart: string;
  dateStop: string;
  dayCount: number;
}

const MAX_OFFLINE_DIRECT_CHILDREN = 10;

function hasOnlyExpectedParameters(
  searchParams: URLSearchParams,
  expected: readonly string[]
): boolean {
  for (const key of searchParams.keys()) {
    if (!expected.includes(key) || searchParams.getAll(key).length !== 1) {
      return false;
    }
  }
  return expected.every((key) => searchParams.getAll(key).length === 1);
}

function parseComparisonRequest(
  searchParams: URLSearchParams
): ParsedComparisonRequest | null {
  if (!hasOnlyExpectedParameters(searchParams, COMPARISON_PARAMETERS)) {
    return null;
  }

  const baselineStart = searchParams.get("baseline_start");
  const baselineStop = searchParams.get("baseline_stop");
  const currentStart = searchParams.get("current_start");
  const currentStop = searchParams.get("current_stop");
  const baselineStartTimestamp = parseIsoDate(baselineStart);
  const baselineStopTimestamp = parseIsoDate(baselineStop);
  const currentStartTimestamp = parseIsoDate(currentStart);
  const currentStopTimestamp = parseIsoDate(currentStop);

  if (
    baselineStart === null ||
    baselineStop === null ||
    currentStart === null ||
    currentStop === null ||
    baselineStartTimestamp === null ||
    baselineStopTimestamp === null ||
    currentStartTimestamp === null ||
    currentStopTimestamp === null
  ) {
    return null;
  }

  const baselineDays = inclusiveDays(
    baselineStartTimestamp,
    baselineStopTimestamp
  );
  const currentDays = inclusiveDays(currentStartTimestamp, currentStopTimestamp);
  if (
    baselineDays < 1 ||
    currentDays < 1 ||
    baselineDays > 31 ||
    currentDays > 31 ||
    baselineDays !== currentDays ||
    baselineStopTimestamp >= currentStartTimestamp
  ) {
    return null;
  }

  return {
    baselineStart,
    baselineStop,
    currentStart,
    currentStop,
    periodLengthDays: baselineDays
  };
}

function parseTrendRequest(
  searchParams: URLSearchParams
): ParsedTrendRequest | null {
  if (!hasOnlyExpectedParameters(searchParams, TREND_PARAMETERS)) {
    return null;
  }

  const dateStart = searchParams.get("date_start");
  const dateStop = searchParams.get("date_stop");
  const startTimestamp = parseIsoDate(dateStart);
  const stopTimestamp = parseIsoDate(dateStop);
  if (
    dateStart === null ||
    dateStop === null ||
    startTimestamp === null ||
    stopTimestamp === null
  ) {
    return null;
  }

  const dayCount = inclusiveDays(startTimestamp, stopTimestamp);
  if (dayCount < 3 || dayCount > 31 || !Number.isSafeInteger(dayCount)) {
    return null;
  }

  return { dateStart, dateStop, dayCount };
}

function fixtureWarnings(stabilityStatus?: string): string[] {
  const warnings = ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"];
  if (stabilityStatus !== undefined && stabilityStatus !== "STABLE") {
    warnings.push(`DATA_${stabilityStatus}`);
  }
  return warnings;
}

function fixtureComparisonWarnings(
  baselineStability: string,
  currentStability: string
): string[] {
  const warnings = ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"];
  if (baselineStability !== "STABLE") {
    warnings.push(`BASELINE_DATA_${baselineStability}`);
  }
  if (currentStability !== "STABLE") {
    warnings.push(`CURRENT_DATA_${currentStability}`);
  }
  return warnings;
}

type FixtureComparisonBuildResult =
  | { kind: "ok"; comparison: PeriodComparison }
  | { kind: "not_found" }
  | { kind: "data_unavailable" }
  | { kind: "incomplete_coverage" }
  | { kind: "incompatible_context" };

function buildFixtureComparison(
  baselineResult: AccountSummaryResult,
  currentResult: AccountSummaryResult
): FixtureComparisonBuildResult {
  if (
    baselineResult.kind === "not_found" ||
    currentResult.kind === "not_found"
  ) {
    return { kind: "not_found" };
  }
  if (
    baselineResult.kind === "data_unavailable" ||
    currentResult.kind === "data_unavailable"
  ) {
    return { kind: "data_unavailable" };
  }
  if (
    baselineResult.kind === "incompatible_context" ||
    currentResult.kind === "incompatible_context"
  ) {
    return { kind: "incompatible_context" };
  }

  return buildPeriodComparison(
    baselineResult.summary,
    currentResult.summary
  );
}

function fixtureComparisonErrorResponse(
  result: Exclude<FixtureComparisonBuildResult, { kind: "ok" }>,
  requestId: string
): Response {
  if (result.kind === "not_found") {
    return errorResponse(
      "NOT_FOUND",
      "Fixture resource not found",
      404,
      requestId
    );
  }
  if (result.kind === "data_unavailable") {
    return errorResponse(
      "DATA_UNAVAILABLE",
      "Both comparison periods require fixture data",
      404,
      requestId
    );
  }
  if (result.kind === "incomplete_coverage") {
    return errorResponse(
      "INCOMPLETE_PERIOD_COVERAGE",
      "Both comparison periods require complete daily coverage",
      409,
      requestId
    );
  }
  return errorResponse(
    "INCOMPATIBLE_METRIC_CONTEXT",
    "Comparison periods have incompatible reporting context",
    409,
    requestId
  );
}

function fixtureTrendErrorResponse(
  result: Exclude<AdObjectTrendResult, { kind: "ok" }>,
  requestId: string
): Response {
  if (result.kind === "data_unavailable") {
    return errorResponse(
      "DATA_UNAVAILABLE",
      "Every selected fixture object requires trend data",
      404,
      requestId
    );
  }
  if (result.kind === "incomplete_coverage") {
    return errorResponse(
      "INCOMPLETE_PERIOD_COVERAGE",
      "Every selected fixture object requires complete daily coverage",
      409,
      requestId
    );
  }
  return errorResponse(
    "INCOMPATIBLE_METRIC_CONTEXT",
    "Selected fixture object trends have incompatible reporting context",
    409,
    requestId
  );
}

function comparisonResponse(
  baselineResult: AccountSummaryResult,
  currentResult: AccountSummaryResult,
  comparisonRequest: ParsedComparisonRequest,
  requestId: string,
  workspaceId: string,
  adAccountId: string,
  object?: FixtureAdObject
): Response {
  const comparisonResult = buildFixtureComparison(
    baselineResult,
    currentResult
  );
  if (comparisonResult.kind !== "ok") {
    return fixtureComparisonErrorResponse(comparisonResult, requestId);
  }

  const comparison = comparisonResult.comparison;
  return jsonResponse({
    ok: true,
    data: {
      account: comparison.account,
      ...(object === undefined ? {} : { object }),
      baseline: comparison.baseline,
      current: comparison.current,
      changes: comparison.changes,
      diagnostics: comparison.diagnostics
    },
    context: {
      requestId,
      workspaceId,
      adAccountId,
      ...(object === undefined
        ? {}
        : {
            objectId: object.id,
            objectLevel: object.objectLevel,
            parentObjectId: object.parentObjectId
          }),
      metricContext: comparison.metricContext,
      periodContext: comparison.periodContext,
      comparisonPolicy: {
        periodLengthDays: comparisonRequest.periodLengthDays,
        periodsOverlap: false,
        thresholdsApplied: false,
        causalClaims: false
      },
      sourceKind: "FIXTURE"
    },
    warnings: fixtureComparisonWarnings(
      comparison.periodContext.baseline.stabilityStatus,
      comparison.periodContext.current.stabilityStatus
    ),
    nextCursor: null,
    truncated: false
  });
}

async function healthResponse(services: OfflineServices, requestId: string) {
  const storage = await services.DB.prepare("SELECT 1 AS ready").first<{
    ready: number;
  }>();
  if (storage?.ready !== 1) {
    throw new Error("D1 readiness query failed");
  }

  return jsonResponse({
    ok: true,
    data: {
      service: "control-plane-worker",
      mode: "OFFLINE_FIXTURE",
      storage: "ready"
    },
    context: { requestId },
    warnings: ["No Meta or Cloudflare account connection is configured"]
  });
}

export async function handleOfflineRequest(
  request: Request,
  services: OfflineServices
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);
  const route = parseRoute(url.pathname);

  if (services.OFFLINE_FIXTURES_ENABLED !== "true") {
    return errorResponse(
      "OFFLINE_MODE_DISABLED",
      "Offline fixture mode is disabled",
      503,
      requestId
    );
  }
  if (!isLocalHostname(url.hostname)) {
    return errorResponse(
      "OFFLINE_ONLY",
      "This fixture service is restricted to local hosts",
      403,
      requestId
    );
  }
  if (request.method !== "GET") {
    return errorResponse(
      "METHOD_NOT_ALLOWED",
      "Only GET is allowed",
      405,
      requestId,
      { allow: "GET" }
    );
  }

  try {
    if (route.kind === "health") {
      if ([...url.searchParams.keys()].length !== 0) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Health check does not accept query parameters",
          400,
          requestId
        );
      }
      return await healthResponse(services, requestId);
    }

    if (route.kind === "account_list") {
      if (
        !isValidId(route.workspaceId) ||
        [...url.searchParams.keys()].length !== 0
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid account list request",
          400,
          requestId
        );
      }
      const result = await listFixtureAdAccounts(services.DB, route.workspaceId);
      if (result.kind === "capacity_exceeded") {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline account capacity exceeded",
          409,
          requestId
        );
      }
      return jsonResponse({
        ok: true,
        data: { items: result.accounts },
        context: {
          requestId,
          workspaceId: route.workspaceId,
          sourceKind: "FIXTURE"
        },
        warnings: fixtureWarnings(),
        nextCursor: null,
        truncated: false
      });
    }

    if (route.kind === "account_objects") {
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        [...url.searchParams.keys()].length !== 0
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid ad object hierarchy request",
          400,
          requestId
        );
      }

      const result = await listFixtureAdObjects(
        services.DB,
        route.workspaceId,
        route.adAccountId
      );
      if (result.kind === "not_found") {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }
      if (result.kind === "capacity_exceeded") {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline ad object capacity exceeded",
          409,
          requestId
        );
      }
      if (result.kind === "invalid_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture ad object hierarchy is incomplete or incompatible",
          409,
          requestId
        );
      }

      return jsonResponse({
        ok: true,
        data: {
          account: result.account,
          items: result.objects,
          counts: result.counts
        },
        context: {
          requestId,
          workspaceId: route.workspaceId,
          adAccountId: route.adAccountId,
          sourceKind: "FIXTURE"
        },
        warnings: fixtureWarnings(),
        nextCursor: null,
        truncated: false
      });
    }

    if (route.kind === "account_data_quality") {
      const trendRequest = parseTrendRequest(url.searchParams);
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        trendRequest === null
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid offline data quality request",
          400,
          requestId
        );
      }

      const hierarchy = await listFixtureAdObjects(
        services.DB,
        route.workspaceId,
        route.adAccountId
      );
      if (hierarchy.kind === "not_found") {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }
      if (hierarchy.kind === "capacity_exceeded") {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline ad object capacity exceeded",
          409,
          requestId
        );
      }
      if (hierarchy.kind === "invalid_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture ad object hierarchy is incomplete or incompatible",
          409,
          requestId
        );
      }

      const [accountTrendResult, objectTrendResults] = await Promise.all([
        getFixtureAccountTrend(
          services.DB,
          route.workspaceId,
          hierarchy.account,
          trendRequest.dateStart,
          trendRequest.dateStop
        ),
        Promise.all(
          hierarchy.objects.map(async (object) => ({
            object,
            result: await getFixtureAdObjectTrend(
              services.DB,
              route.workspaceId,
              hierarchy.account,
              object,
              trendRequest.dateStart,
              trendRequest.dateStop
            )
          }))
        )
      ]);
      if (accountTrendResult.kind !== "ok") {
        return fixtureTrendErrorResponse(accountTrendResult, requestId);
      }
      for (const objectTrendResult of objectTrendResults) {
        if (objectTrendResult.result.kind !== "ok") {
          return fixtureTrendErrorResponse(
            objectTrendResult.result,
            requestId
          );
        }
      }

      const objectTrends = objectTrendResults.flatMap((entry) =>
        entry.result.kind === "ok" ? [entry.result.trend] : []
      );
      const qualityResult = buildFixtureDataQualityReport(
        accountTrendResult.trend,
        hierarchy.objects,
        objectTrends
      );
      if (qualityResult.kind === "incompatible_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture data quality requires a complete object hierarchy",
          409,
          requestId
        );
      }
      if (qualityResult.kind === "incompatible_context") {
        return errorResponse(
          "INCOMPATIBLE_METRIC_CONTEXT",
          "Fixture data quality requires one reporting snapshot",
          409,
          requestId
        );
      }
      if (qualityResult.kind === "incompatible_rollup") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_ROLLUP",
          "Fixture daily metrics do not reconcile across the hierarchy",
          409,
          requestId
        );
      }

      const report = qualityResult.report;
      return jsonResponse({
        ok: true,
        data: {
          account: report.account,
          requestedRange: report.requestedRange,
          dataset: report.dataset,
          hierarchy: report.hierarchy,
          checks: report.checks
        },
        context: {
          requestId,
          workspaceId: route.workspaceId,
          adAccountId: route.adAccountId,
          metricContext: {
            currency: report.context.currency,
            timezoneName: report.context.timezoneName,
            clickMetricKind: report.context.clickMetricKind,
            conversionEventRef: report.context.conversionEventRef,
            attributionSpecHash: report.context.attributionSpecHash,
            apiVersion: report.context.apiVersion
          },
          stabilityStatus: report.context.stabilityStatus,
          fetchedAt: report.context.fetchedAt,
          syncRunIds: report.context.syncRunIds,
          qualityPolicy: {
            minimumDays: 3,
            maximumDays: 31,
            requiredChecks: OFFLINE_DATA_QUALITY_CHECK_CODES,
            allChecksRequired: true,
            performanceEvaluationApplied: false,
            businessThresholdsApplied: false,
            causalClaims: false,
            gateEvidence: false
          },
          sourceKind: "FIXTURE"
        },
        warnings: fixtureWarnings(report.context.stabilityStatus),
        nextCursor: null,
        truncated: false
      });
    }

    if (route.kind === "account_summary") {
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        !hasOnlyExpectedParameters(url.searchParams, ["date_start", "date_stop"])
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid account summary request",
          400,
          requestId
        );
      }

      const dateStart = url.searchParams.get("date_start");
      const dateStop = url.searchParams.get("date_stop");
      const startTimestamp = parseIsoDate(dateStart);
      const stopTimestamp = parseIsoDate(dateStop);
      if (
        dateStart === null ||
        dateStop === null ||
        startTimestamp === null ||
        stopTimestamp === null ||
        stopTimestamp < startTimestamp ||
        (stopTimestamp - startTimestamp) / 86_400_000 + 1 > 31
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Date range must contain 1 to 31 valid UTC calendar days",
          400,
          requestId
        );
      }

      const result = await getFixtureAccountSummary(
        services.DB,
        route.workspaceId,
        route.adAccountId,
        dateStart,
        dateStop
      );
      if (result.kind === "not_found") {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }
      if (result.kind === "data_unavailable") {
        return errorResponse(
          "DATA_UNAVAILABLE",
          "No fixture data is available for the requested range",
          404,
          requestId
        );
      }
      if (result.kind === "incompatible_context") {
        return errorResponse(
          "INCOMPATIBLE_METRIC_CONTEXT",
          "Fixture metrics have incompatible reporting context",
          409,
          requestId
        );
      }

      const summary = result.summary;
      return jsonResponse({
        ok: true,
        data: {
          account: summary.account,
          requestedRange: summary.requestedRange,
          actualRange: summary.actualRange,
          coverage: summary.coverage,
          totals: summary.totals,
          derived: summary.derived
        },
        context: {
          requestId,
          workspaceId: route.workspaceId,
          adAccountId: route.adAccountId,
          ...summary.context,
          sourceKind: "FIXTURE"
        },
        warnings: fixtureWarnings(summary.context.stabilityStatus),
        nextCursor: null,
        truncated: false
      });
    }

    if (route.kind === "direct_child_daily_trend") {
      const trendRequest = parseTrendRequest(url.searchParams);
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        !isValidId(route.objectId) ||
        trendRequest === null
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid direct child daily trend request",
          400,
          requestId
        );
      }

      const hierarchy = await listFixtureAdObjects(
        services.DB,
        route.workspaceId,
        route.adAccountId
      );
      if (hierarchy.kind === "not_found") {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }
      if (hierarchy.kind === "capacity_exceeded") {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline ad object capacity exceeded",
          409,
          requestId
        );
      }
      if (hierarchy.kind === "invalid_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture ad object hierarchy is incomplete or incompatible",
          409,
          requestId
        );
      }

      const parentObject = hierarchy.objects.find(
        (candidate) => candidate.id === route.objectId
      );
      if (parentObject === undefined) {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }

      const childObjects = hierarchy.objects
        .filter((candidate) => candidate.parentObjectId === parentObject.id)
        .sort((left, right) => left.id.localeCompare(right.id));
      if (parentObject.objectLevel === "AD" || childObjects.length === 0) {
        return errorResponse(
          "NO_CHILD_OBJECTS",
          "The selected fixture object has no direct child objects",
          409,
          requestId
        );
      }
      if (childObjects.length > MAX_OFFLINE_DIRECT_CHILDREN) {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline direct child capacity exceeded",
          409,
          requestId
        );
      }

      const [parentTrendResult, childTrendResults] = await Promise.all([
        getFixtureAdObjectTrend(
          services.DB,
          route.workspaceId,
          hierarchy.account,
          parentObject,
          trendRequest.dateStart,
          trendRequest.dateStop
        ),
        Promise.all(
          childObjects.map(async (object) => ({
            object,
            result: await getFixtureAdObjectTrend(
              services.DB,
              route.workspaceId,
              hierarchy.account,
              object,
              trendRequest.dateStart,
              trendRequest.dateStop
            )
          }))
        )
      ]);
      if (parentTrendResult.kind !== "ok") {
        return fixtureTrendErrorResponse(parentTrendResult, requestId);
      }
      for (const childTrendResult of childTrendResults) {
        if (childTrendResult.result.kind !== "ok") {
          return fixtureTrendErrorResponse(childTrendResult.result, requestId);
        }
      }

      const childTrends = childTrendResults.flatMap((childTrendResult) =>
        childTrendResult.result.kind === "ok"
          ? [
              {
                object: childTrendResult.object,
                trend: childTrendResult.result.trend
              }
            ]
          : []
      );
      const result = buildDirectChildTrend(
        parentObject,
        parentTrendResult.trend,
        childTrends
      );
      if (result.kind === "no_children") {
        return errorResponse(
          "NO_CHILD_OBJECTS",
          "The selected fixture object has no direct child objects",
          409,
          requestId
        );
      }
      if (result.kind === "incompatible_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture direct child trend hierarchy is incompatible",
          409,
          requestId
        );
      }
      if (result.kind === "incompatible_context") {
        return errorResponse(
          "INCOMPATIBLE_METRIC_CONTEXT",
          "Direct child trends have incompatible reporting context",
          409,
          requestId
        );
      }
      if (result.kind === "incompatible_rollup") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_ROLLUP",
          "Direct child daily metrics do not reconcile to the parent object",
          409,
          requestId
        );
      }

      const trend = result.trend;
      const parentTrend = trend.parent.trend;
      const childObjectLevel = trend.items[0]?.object.objectLevel;
      if (childObjectLevel === undefined) {
        throw new Error("Direct child daily trend returned no items");
      }
      return jsonResponse({
        ok: true,
        data: {
          account: parentTrend.account,
          parent: trend.parent.object,
          requestedRange: parentTrend.requestedRange,
          parentItems: parentTrend.items,
          items: trend.items.map((item) => ({
            object: item.object,
            items: item.trend.items
          })),
          reconciliation: trend.reconciliation
        },
        context: {
          requestId,
          workspaceId: route.workspaceId,
          adAccountId: route.adAccountId,
          parentObjectId: trend.parent.object.id,
          parentObjectLevel: trend.parent.object.objectLevel,
          childObjectLevel,
          childCount: trend.items.length,
          pointCount: parentTrend.items.length,
          metricContext: {
            currency: parentTrend.context.currency,
            timezoneName: parentTrend.context.timezoneName,
            clickMetricKind: parentTrend.context.clickMetricKind,
            conversionEventRef: parentTrend.context.conversionEventRef,
            attributionSpecHash: parentTrend.context.attributionSpecHash,
            apiVersion: parentTrend.context.apiVersion
          },
          stabilityStatus: parentTrend.context.stabilityStatus,
          fetchedAt: parentTrend.context.fetchedAt,
          syncRunIds: parentTrend.context.syncRunIds,
          trendPolicy: {
            minimumDays: 3,
            maximumDays: 31,
            metricSelection: "SINGLE",
            seriesOrder: "STABLE_OBJECT_ID",
            thresholdsApplied: false,
            causalClaims: false,
            rankingApplied: false,
            trendInterpretationApplied: false
          },
          sourceKind: "FIXTURE"
        },
        warnings: fixtureWarnings(parentTrend.context.stabilityStatus),
        nextCursor: null,
        truncated: false
      });
    }

    if (route.kind === "ad_object_trend") {
      const trendRequest = parseTrendRequest(url.searchParams);
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        !isValidId(route.objectId) ||
        trendRequest === null
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid ad object trend request",
          400,
          requestId
        );
      }

      const hierarchy = await listFixtureAdObjects(
        services.DB,
        route.workspaceId,
        route.adAccountId
      );
      if (hierarchy.kind === "not_found") {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }
      if (hierarchy.kind === "capacity_exceeded") {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline ad object capacity exceeded",
          409,
          requestId
        );
      }
      if (hierarchy.kind === "invalid_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture ad object hierarchy is incomplete or incompatible",
          409,
          requestId
        );
      }

      const object = hierarchy.objects.find(
        (candidate) => candidate.id === route.objectId
      );
      if (object === undefined) {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }

      const result = await getFixtureAdObjectTrend(
        services.DB,
        route.workspaceId,
        hierarchy.account,
        object,
        trendRequest.dateStart,
        trendRequest.dateStop
      );
      if (result.kind === "data_unavailable") {
        return errorResponse(
          "DATA_UNAVAILABLE",
          "No fixture trend data is available for the requested range",
          404,
          requestId
        );
      }
      if (result.kind === "incomplete_coverage") {
        return errorResponse(
          "INCOMPLETE_PERIOD_COVERAGE",
          "Fixture trend requires complete daily coverage",
          409,
          requestId
        );
      }
      if (result.kind === "incompatible_context") {
        return errorResponse(
          "INCOMPATIBLE_METRIC_CONTEXT",
          "Fixture trend has incompatible reporting context",
          409,
          requestId
        );
      }

      const trend = result.trend;
      return jsonResponse({
        ok: true,
        data: {
          account: trend.account,
          object: trend.object,
          requestedRange: trend.requestedRange,
          items: trend.items
        },
        context: {
          requestId,
          workspaceId: route.workspaceId,
          adAccountId: route.adAccountId,
          objectId: trend.object.id,
          objectLevel: trend.object.objectLevel,
          parentObjectId: trend.object.parentObjectId,
          metricContext: {
            currency: trend.context.currency,
            timezoneName: trend.context.timezoneName,
            clickMetricKind: trend.context.clickMetricKind,
            conversionEventRef: trend.context.conversionEventRef,
            attributionSpecHash: trend.context.attributionSpecHash,
            apiVersion: trend.context.apiVersion
          },
          stabilityStatus: trend.context.stabilityStatus,
          fetchedAt: trend.context.fetchedAt,
          syncRunIds: trend.context.syncRunIds,
          pointCount: trend.items.length,
          trendPolicy: {
            minimumDays: 3,
            maximumDays: 31,
            metricSelection: "SINGLE",
            thresholdsApplied: false,
            causalClaims: false,
            trendInterpretationApplied: false
          },
          sourceKind: "FIXTURE"
        },
        warnings: fixtureWarnings(trend.context.stabilityStatus),
        nextCursor: null,
        truncated: false
      });
    }

    if (route.kind === "direct_child_breakdown") {
      const comparisonRequest = parseComparisonRequest(url.searchParams);
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        !isValidId(route.objectId) ||
        comparisonRequest === null
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid direct child breakdown request",
          400,
          requestId
        );
      }

      const hierarchy = await listFixtureAdObjects(
        services.DB,
        route.workspaceId,
        route.adAccountId
      );
      if (hierarchy.kind === "not_found") {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }
      if (hierarchy.kind === "capacity_exceeded") {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline ad object capacity exceeded",
          409,
          requestId
        );
      }
      if (hierarchy.kind === "invalid_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture ad object hierarchy is incomplete or incompatible",
          409,
          requestId
        );
      }

      const parentObject = hierarchy.objects.find(
        (candidate) => candidate.id === route.objectId
      );
      if (parentObject === undefined) {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }

      const childObjects = hierarchy.objects
        .filter((candidate) => candidate.parentObjectId === parentObject.id)
        .sort((left, right) => left.id.localeCompare(right.id));
      if (parentObject.objectLevel === "AD" || childObjects.length === 0) {
        return errorResponse(
          "NO_CHILD_OBJECTS",
          "The selected fixture object has no direct child objects",
          409,
          requestId
        );
      }
      if (childObjects.length > MAX_OFFLINE_DIRECT_CHILDREN) {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline direct child capacity exceeded",
          409,
          requestId
        );
      }

      const [parentPeriods, childPeriods] = await Promise.all([
        Promise.all([
          getFixtureAdObjectSummary(
            services.DB,
            route.workspaceId,
            hierarchy.account,
            parentObject,
            comparisonRequest.baselineStart,
            comparisonRequest.baselineStop
          ),
          getFixtureAdObjectSummary(
            services.DB,
            route.workspaceId,
            hierarchy.account,
            parentObject,
            comparisonRequest.currentStart,
            comparisonRequest.currentStop
          )
        ]),
        Promise.all(
          childObjects.map(async (object) => {
            const [baselineResult, currentResult] = await Promise.all([
              getFixtureAdObjectSummary(
                services.DB,
                route.workspaceId,
                hierarchy.account,
                object,
                comparisonRequest.baselineStart,
                comparisonRequest.baselineStop
              ),
              getFixtureAdObjectSummary(
                services.DB,
                route.workspaceId,
                hierarchy.account,
                object,
                comparisonRequest.currentStart,
                comparisonRequest.currentStop
              )
            ]);
            return {
              object,
              comparisonResult: buildFixtureComparison(
                baselineResult,
                currentResult
              )
            };
          })
        )
      ]);

      const parentComparisonResult = buildFixtureComparison(
        parentPeriods[0],
        parentPeriods[1]
      );
      if (parentComparisonResult.kind !== "ok") {
        return fixtureComparisonErrorResponse(
          parentComparisonResult,
          requestId
        );
      }
      for (const childPeriod of childPeriods) {
        if (childPeriod.comparisonResult.kind !== "ok") {
          return fixtureComparisonErrorResponse(
            childPeriod.comparisonResult,
            requestId
          );
        }
      }

      const childComparisons = childPeriods.flatMap((childPeriod) =>
        childPeriod.comparisonResult.kind === "ok"
          ? [
              {
                object: childPeriod.object,
                comparison: childPeriod.comparisonResult.comparison
              }
            ]
          : []
      );
      const breakdownResult = buildDirectChildBreakdown(
        parentObject,
        parentComparisonResult.comparison,
        childComparisons
      );
      if (breakdownResult.kind === "no_children") {
        return errorResponse(
          "NO_CHILD_OBJECTS",
          "The selected fixture object has no direct child objects",
          409,
          requestId
        );
      }
      if (breakdownResult.kind === "incompatible_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture direct child hierarchy is incompatible",
          409,
          requestId
        );
      }
      if (breakdownResult.kind === "incompatible_context") {
        return errorResponse(
          "INCOMPATIBLE_METRIC_CONTEXT",
          "Direct child periods have incompatible reporting context",
          409,
          requestId
        );
      }
      if (breakdownResult.kind === "incompatible_rollup") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_ROLLUP",
          "Direct child metrics do not reconcile to the parent object",
          409,
          requestId
        );
      }

      const breakdown = breakdownResult.breakdown;
      const parentComparison = breakdown.parent.comparison;
      const childObjectLevel = breakdown.items[0]?.object.objectLevel;
      if (childObjectLevel === undefined) {
        throw new Error("Direct child breakdown returned no items");
      }
      return jsonResponse({
        ok: true,
        data: {
          account: parentComparison.account,
          parent: breakdown.parent.object,
          baseline: parentComparison.baseline,
          current: parentComparison.current,
          changes: parentComparison.changes,
          items: breakdown.items.map((item) => ({
            object: item.object,
            baseline: item.comparison.baseline,
            current: item.comparison.current,
            changes: item.comparison.changes
          })),
          reconciliation: breakdown.reconciliation
        },
        context: {
          requestId,
          workspaceId: route.workspaceId,
          adAccountId: route.adAccountId,
          parentObjectId: breakdown.parent.object.id,
          parentObjectLevel: breakdown.parent.object.objectLevel,
          childObjectLevel,
          childCount: breakdown.items.length,
          metricContext: parentComparison.metricContext,
          periodContext: parentComparison.periodContext,
          comparisonPolicy: {
            periodLengthDays: comparisonRequest.periodLengthDays,
            periodsOverlap: false,
            thresholdsApplied: false,
            causalClaims: false,
            rankingApplied: false
          },
          sourceKind: "FIXTURE"
        },
        warnings: fixtureComparisonWarnings(
          parentComparison.periodContext.baseline.stabilityStatus,
          parentComparison.periodContext.current.stabilityStatus
        ),
        nextCursor: null,
        truncated: false
      });
    }

    if (route.kind === "ad_object_comparison") {
      const comparisonRequest = parseComparisonRequest(url.searchParams);
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        !isValidId(route.objectId) ||
        comparisonRequest === null
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid ad object comparison request",
          400,
          requestId
        );
      }

      const hierarchy = await listFixtureAdObjects(
        services.DB,
        route.workspaceId,
        route.adAccountId
      );
      if (hierarchy.kind === "not_found") {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }
      if (hierarchy.kind === "capacity_exceeded") {
        return errorResponse(
          "CAPACITY_EXCEEDED",
          "Offline ad object capacity exceeded",
          409,
          requestId
        );
      }
      if (hierarchy.kind === "invalid_hierarchy") {
        return errorResponse(
          "INCOMPATIBLE_OBJECT_HIERARCHY",
          "Fixture ad object hierarchy is incomplete or incompatible",
          409,
          requestId
        );
      }

      const object = hierarchy.objects.find(
        (candidate) => candidate.id === route.objectId
      );
      if (object === undefined) {
        return errorResponse(
          "NOT_FOUND",
          "Fixture resource not found",
          404,
          requestId
        );
      }

      const [baselineResult, currentResult] = await Promise.all([
        getFixtureAdObjectSummary(
          services.DB,
          route.workspaceId,
          hierarchy.account,
          object,
          comparisonRequest.baselineStart,
          comparisonRequest.baselineStop
        ),
        getFixtureAdObjectSummary(
          services.DB,
          route.workspaceId,
          hierarchy.account,
          object,
          comparisonRequest.currentStart,
          comparisonRequest.currentStop
        )
      ]);

      return comparisonResponse(
        baselineResult,
        currentResult,
        comparisonRequest,
        requestId,
        route.workspaceId,
        route.adAccountId,
        object
      );
    }

    if (route.kind === "account_comparison") {
      const comparisonRequest = parseComparisonRequest(url.searchParams);
      if (
        !isValidId(route.workspaceId) ||
        !isValidId(route.adAccountId) ||
        comparisonRequest === null
      ) {
        return errorResponse(
          "INVALID_ARGUMENT",
          "Invalid account comparison request",
          400,
          requestId
        );
      }

      const [baselineResult, currentResult] = await Promise.all([
        getFixtureAccountSummary(
          services.DB,
          route.workspaceId,
          route.adAccountId,
          comparisonRequest.baselineStart,
          comparisonRequest.baselineStop
        ),
        getFixtureAccountSummary(
          services.DB,
          route.workspaceId,
          route.adAccountId,
          comparisonRequest.currentStart,
          comparisonRequest.currentStop
        )
      ]);

      return comparisonResponse(
        baselineResult,
        currentResult,
        comparisonRequest,
        requestId,
        route.workspaceId,
        route.adAccountId
      );
    }

    return errorResponse("NOT_FOUND", "Route not found", 404, requestId);
  } catch {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        service: "control-plane-worker",
        environment: "offline-fixture",
        request_id: requestId,
        operation: route.kind,
        result: "failure",
        error_code: "INTERNAL_ERROR"
      })
    );
    return errorResponse(
      "INTERNAL_ERROR",
      "Internal service error",
      500,
      requestId
    );
  }
}
