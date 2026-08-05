import {
  getFixtureAccountSummary,
  listFixtureAdAccounts
} from "./read-model";

export interface OfflineServices {
  readonly DB: D1Database;
  readonly OFFLINE_FIXTURES_ENABLED: string;
}

type ErrorCode =
  | "CAPACITY_EXCEEDED"
  | "DATA_UNAVAILABLE"
  | "INCOMPATIBLE_METRIC_CONTEXT"
  | "INTERNAL_ERROR"
  | "INVALID_ARGUMENT"
  | "METHOD_NOT_ALLOWED"
  | "NOT_FOUND"
  | "OFFLINE_MODE_DISABLED"
  | "OFFLINE_ONLY";

type Route =
  | { kind: "health" }
  | { kind: "account_list"; workspaceId: string }
  | { kind: "account_summary"; workspaceId: string; adAccountId: string }
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

function fixtureWarnings(stabilityStatus?: string): string[] {
  const warnings = ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"];
  if (stabilityStatus !== undefined && stabilityStatus !== "STABLE") {
    warnings.push(`DATA_${stabilityStatus}`);
  }
  return warnings;
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
