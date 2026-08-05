import { deriveMetrics, type DerivedMetrics, type MetricTotals } from "./metrics";

export interface FixtureAdAccount {
  id: string;
  externalAccountRef: string;
  currency: string;
  timezoneName: string;
  sourceKind: "FIXTURE";
  dataThrough: string | null;
  insightRowCount: number;
}

export type AccountListResult =
  | { kind: "ok"; accounts: FixtureAdAccount[] }
  | { kind: "capacity_exceeded" };

interface SummaryContext {
  currency: string;
  timezoneName: string;
  clickMetricKind: "ALL_CLICKS" | "LINK_CLICKS";
  conversionEventRef: string;
  attributionSpecHash: string;
  apiVersion: string;
  stabilityStatus: "PROVISIONAL" | "RECONCILING" | "STABLE";
  fetchedAt: string;
  syncRunIds: string[];
}

export interface AccountSummary {
  account: FixtureAdAccount;
  requestedRange: { dateStart: string; dateStop: string };
  actualRange: { dateStart: string; dateStop: string };
  totals: MetricTotals;
  derived: DerivedMetrics;
  context: SummaryContext;
}

export type AccountSummaryResult =
  | { kind: "ok"; summary: AccountSummary }
  | { kind: "not_found" }
  | { kind: "data_unavailable" }
  | { kind: "incompatible_context" };

function requireString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid D1 string field: ${key}`);
  }
  return value;
}

function nullableString(
  row: Record<string, unknown>,
  key: string
): string | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid nullable D1 string field: ${key}`);
  }
  return value;
}

function requireNonNegativeInteger(
  row: Record<string, unknown>,
  key: string
): number {
  const value = row[key];
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(`Invalid D1 integer field: ${key}`);
  }
  return value;
}

function nullableNonNegativeInteger(
  row: Record<string, unknown>,
  key: string
): number | null {
  const value = row[key];
  if (value === null) {
    return null;
  }
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(`Invalid nullable D1 integer field: ${key}`);
  }
  return value;
}

function parseAccount(row: Record<string, unknown>): FixtureAdAccount {
  const sourceKind = requireString(row, "source_kind");
  if (sourceKind !== "FIXTURE") {
    throw new Error("Offline read model encountered a non-fixture account");
  }

  return {
    id: requireString(row, "id"),
    externalAccountRef: requireString(row, "external_account_ref"),
    currency: requireString(row, "currency"),
    timezoneName: requireString(row, "timezone_name"),
    sourceKind,
    dataThrough: nullableString(row, "data_through"),
    insightRowCount: requireNonNegativeInteger(row, "insight_row_count")
  };
}

async function findAccount(
  db: D1Database,
  workspaceId: string,
  adAccountId: string
): Promise<FixtureAdAccount | null> {
  const row = await db
    .prepare(
      `SELECT
         a.id,
         a.external_account_ref,
         a.currency,
         a.timezone_name,
         a.source_kind,
         MAX(i.fetched_at) AS data_through,
         COUNT(i.id) AS insight_row_count
       FROM meta_ad_accounts AS a
       LEFT JOIN insights_daily AS i
         ON i.workspace_id = a.workspace_id
        AND i.ad_account_id = a.id
       WHERE a.workspace_id = ?1
         AND a.id = ?2
         AND a.source_kind = 'FIXTURE'
       GROUP BY
         a.id,
         a.external_account_ref,
         a.currency,
         a.timezone_name,
         a.source_kind`
    )
    .bind(workspaceId, adAccountId)
    .first();

  return row === null ? null : parseAccount(row);
}

export async function listFixtureAdAccounts(
  db: D1Database,
  workspaceId: string
): Promise<AccountListResult> {
  const result = await db
    .prepare(
      `SELECT
         a.id,
         a.external_account_ref,
         a.currency,
         a.timezone_name,
         a.source_kind,
         MAX(i.fetched_at) AS data_through,
         COUNT(i.id) AS insight_row_count
       FROM meta_ad_accounts AS a
       LEFT JOIN insights_daily AS i
         ON i.workspace_id = a.workspace_id
        AND i.ad_account_id = a.id
       WHERE a.workspace_id = ?1
         AND a.source_kind = 'FIXTURE'
       GROUP BY
         a.id,
         a.external_account_ref,
         a.currency,
         a.timezone_name,
         a.source_kind
       ORDER BY a.id
       LIMIT 11`
    )
    .bind(workspaceId)
    .all();

  if (result.results.length > 10) {
    return { kind: "capacity_exceeded" };
  }

  return { kind: "ok", accounts: result.results.map(parseAccount) };
}

function resolveStabilityStatus(
  provisionalRows: number,
  reconcilingRows: number,
  stableRows: number,
  rowCount: number
): SummaryContext["stabilityStatus"] {
  if (provisionalRows + reconcilingRows + stableRows !== rowCount) {
    throw new Error("Invalid D1 stability row counts");
  }
  if (provisionalRows > 0) {
    return "PROVISIONAL";
  }
  if (reconcilingRows > 0) {
    return "RECONCILING";
  }
  return "STABLE";
}

export async function getFixtureAccountSummary(
  db: D1Database,
  workspaceId: string,
  adAccountId: string,
  dateStart: string,
  dateStop: string
): Promise<AccountSummaryResult> {
  const account = await findAccount(db, workspaceId, adAccountId);
  if (account === null) {
    return { kind: "not_found" };
  }

  const row = await db
    .prepare(
      `SELECT
         COUNT(*) AS row_count,
         SUM(spend_minor_units) AS spend_minor_units,
         SUM(impressions) AS impressions,
         SUM(clicks) AS clicks,
         SUM(conversions) AS conversions,
         COUNT(DISTINCT currency) AS currency_count,
         MIN(currency) AS currency,
         COUNT(DISTINCT timezone_name) AS timezone_count,
         MIN(timezone_name) AS timezone_name,
         COUNT(DISTINCT click_metric_kind) AS click_kind_count,
         MIN(click_metric_kind) AS click_metric_kind,
         COUNT(DISTINCT conversion_event_ref) AS conversion_event_count,
         MIN(conversion_event_ref) AS conversion_event_ref,
         COUNT(DISTINCT attribution_spec_hash) AS attribution_count,
         MIN(attribution_spec_hash) AS attribution_spec_hash,
         COUNT(DISTINCT api_version) AS api_version_count,
         MIN(api_version) AS api_version,
         SUM(CASE WHEN stability_status = 'PROVISIONAL' THEN 1 ELSE 0 END)
           AS provisional_rows,
         SUM(CASE WHEN stability_status = 'RECONCILING' THEN 1 ELSE 0 END)
           AS reconciling_rows,
         SUM(CASE WHEN stability_status = 'STABLE' THEN 1 ELSE 0 END)
           AS stable_rows,
         MIN(date_start) AS actual_start,
         MAX(date_stop) AS actual_stop,
         MAX(fetched_at) AS fetched_at
       FROM insights_daily
       WHERE workspace_id = ?1
         AND ad_account_id = ?2
         AND object_ref = ?3
         AND object_level = 'ACCOUNT'
         AND date_start >= ?4
         AND date_stop <= ?5`
    )
    .bind(
      workspaceId,
      adAccountId,
      account.externalAccountRef,
      dateStart,
      dateStop
    )
    .first();

  if (row === null) {
    throw new Error("D1 aggregate did not return a row");
  }

  const rowCount = requireNonNegativeInteger(row, "row_count");
  if (rowCount === 0) {
    return { kind: "data_unavailable" };
  }

  const contextCounts = [
    "currency_count",
    "timezone_count",
    "click_kind_count",
    "conversion_event_count",
    "attribution_count",
    "api_version_count"
  ].map((key) => requireNonNegativeInteger(row, key));
  if (contextCounts.some((count) => count !== 1)) {
    return { kind: "incompatible_context" };
  }

  const currency = requireString(row, "currency");
  const timezoneName = requireString(row, "timezone_name");
  if (currency !== account.currency || timezoneName !== account.timezoneName) {
    return { kind: "incompatible_context" };
  }

  const clickMetricKind = requireString(row, "click_metric_kind");
  if (clickMetricKind !== "ALL_CLICKS" && clickMetricKind !== "LINK_CLICKS") {
    throw new Error("Invalid D1 click metric kind");
  }

  const totals: MetricTotals = {
    spendMinorUnits: nullableNonNegativeInteger(row, "spend_minor_units"),
    impressions: nullableNonNegativeInteger(row, "impressions"),
    clicks: nullableNonNegativeInteger(row, "clicks"),
    conversions: nullableNonNegativeInteger(row, "conversions")
  };

  const syncResult = await db
    .prepare(
      `SELECT DISTINCT sync_run_id
       FROM insights_daily
       WHERE workspace_id = ?1
         AND ad_account_id = ?2
         AND object_ref = ?3
         AND object_level = 'ACCOUNT'
         AND date_start >= ?4
         AND date_stop <= ?5
       ORDER BY sync_run_id
       LIMIT 32`
    )
    .bind(
      workspaceId,
      adAccountId,
      account.externalAccountRef,
      dateStart,
      dateStop
    )
    .all();
  const syncRunIds = syncResult.results.map((syncRow) =>
    requireString(syncRow, "sync_run_id")
  );

  return {
    kind: "ok",
    summary: {
      account,
      requestedRange: { dateStart, dateStop },
      actualRange: {
        dateStart: requireString(row, "actual_start"),
        dateStop: requireString(row, "actual_stop")
      },
      totals,
      derived: deriveMetrics(totals),
      context: {
        currency,
        timezoneName,
        clickMetricKind,
        conversionEventRef: requireString(row, "conversion_event_ref"),
        attributionSpecHash: requireString(row, "attribution_spec_hash"),
        apiVersion: requireString(row, "api_version"),
        stabilityStatus: resolveStabilityStatus(
          requireNonNegativeInteger(row, "provisional_rows"),
          requireNonNegativeInteger(row, "reconciling_rows"),
          requireNonNegativeInteger(row, "stable_rows"),
          rowCount
        ),
        fetchedAt: requireString(row, "fetched_at"),
        syncRunIds
      }
    }
  };
}
