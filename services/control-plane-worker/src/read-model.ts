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

export type FixtureAdObjectLevel = "CAMPAIGN" | "AD_SET" | "AD";

export interface FixtureAdObject {
  id: string;
  externalObjectRef: string;
  objectLevel: FixtureAdObjectLevel;
  parentObjectId: string | null;
  displayName: string;
  sourceKind: "FIXTURE";
  syncRunId: string;
  fetchedAt: string;
}

export interface FixtureAdObjectCounts {
  campaigns: number;
  adSets: number;
  ads: number;
}

export type AdObjectHierarchyResult =
  | {
      kind: "ok";
      account: FixtureAdAccount;
      objects: FixtureAdObject[];
      counts: FixtureAdObjectCounts;
    }
  | { kind: "not_found" }
  | { kind: "capacity_exceeded" }
  | { kind: "invalid_hierarchy" };

const MAX_OFFLINE_AD_OBJECTS = 50;

export interface SummaryContext {
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

interface SummaryCoverage {
  expectedDays: number;
  observedDays: number;
  complete: boolean;
}

export interface AccountSummary {
  account: FixtureAdAccount;
  requestedRange: { dateStart: string; dateStop: string };
  actualRange: { dateStart: string; dateStop: string };
  coverage: SummaryCoverage;
  totals: MetricTotals;
  derived: DerivedMetrics;
  context: SummaryContext;
}

export type AccountSummaryResult =
  | { kind: "ok"; summary: AccountSummary }
  | { kind: "not_found" }
  | { kind: "data_unavailable" }
  | { kind: "incompatible_context" };

export interface FixtureDailyTrendItem {
  date: string;
  totals: MetricTotals;
  derived: DerivedMetrics;
}

export interface FixtureSubjectTrend {
  account: FixtureAdAccount;
  requestedRange: { dateStart: string; dateStop: string };
  items: FixtureDailyTrendItem[];
  context: SummaryContext;
}

export interface FixtureAdObjectTrend extends FixtureSubjectTrend {
  object: FixtureAdObject;
}

export type SubjectTrendResult =
  | { kind: "ok"; trend: FixtureSubjectTrend }
  | { kind: "data_unavailable" }
  | { kind: "incomplete_coverage" }
  | { kind: "incompatible_context" };

export type AdObjectTrendResult =
  | { kind: "ok"; trend: FixtureAdObjectTrend }
  | { kind: "data_unavailable" }
  | { kind: "incomplete_coverage" }
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

function inclusiveUtcDays(dateStart: string, dateStop: string): number {
  const start = Date.parse(`${dateStart}T00:00:00Z`);
  const stop = Date.parse(`${dateStop}T00:00:00Z`);
  const days = (stop - start) / 86_400_000 + 1;
  if (!Number.isSafeInteger(days) || days < 1) {
    throw new Error("Invalid summary date range");
  }
  return days;
}

function isoDateAtOffset(dateStart: string, offset: number): string {
  const timestamp =
    Date.parse(`${dateStart}T00:00:00Z`) + offset * 86_400_000;
  return new Date(timestamp).toISOString().slice(0, 10);
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

function parseAdObject(row: Record<string, unknown>): FixtureAdObject {
  const sourceKind = requireString(row, "source_kind");
  if (sourceKind !== "FIXTURE") {
    throw new Error("Offline read model encountered a non-fixture ad object");
  }

  const objectLevel = requireString(row, "object_level");
  if (
    objectLevel !== "CAMPAIGN" &&
    objectLevel !== "AD_SET" &&
    objectLevel !== "AD"
  ) {
    throw new Error("Offline read model encountered an invalid object level");
  }

  return {
    id: requireString(row, "id"),
    externalObjectRef: requireString(row, "external_object_ref"),
    objectLevel,
    parentObjectId: nullableString(row, "parent_object_id"),
    displayName: requireString(row, "display_name"),
    sourceKind,
    syncRunId: requireString(row, "sync_run_id"),
    fetchedAt: requireString(row, "fetched_at")
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
        AND i.object_level = 'ACCOUNT'
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
        AND i.object_level = 'ACCOUNT'
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

export async function listFixtureAdObjects(
  db: D1Database,
  workspaceId: string,
  adAccountId: string
): Promise<AdObjectHierarchyResult> {
  const account = await findAccount(db, workspaceId, adAccountId);
  if (account === null) {
    return { kind: "not_found" };
  }

  const result = await db
    .prepare(
      `SELECT
         id,
         parent_object_id,
         external_object_ref,
         object_level,
         display_name,
         source_kind,
         sync_run_id,
         fetched_at
       FROM meta_ad_objects
       WHERE workspace_id = ?1
         AND ad_account_id = ?2
         AND source_kind = 'FIXTURE'
       ORDER BY
         CASE object_level
           WHEN 'CAMPAIGN' THEN 1
           WHEN 'AD_SET' THEN 2
           WHEN 'AD' THEN 3
           ELSE 4
         END,
         id
       LIMIT 51`
    )
    .bind(workspaceId, adAccountId)
    .all();

  if (result.results.length > MAX_OFFLINE_AD_OBJECTS) {
    return { kind: "capacity_exceeded" };
  }

  const objects = result.results.map(parseAdObject);
  const objectsById = new Map(objects.map((object) => [object.id, object]));
  const counts: FixtureAdObjectCounts = {
    campaigns: 0,
    adSets: 0,
    ads: 0
  };

  for (const object of objects) {
    if (object.objectLevel === "CAMPAIGN") {
      counts.campaigns += 1;
      if (object.parentObjectId !== null) {
        return { kind: "invalid_hierarchy" };
      }
      continue;
    }

    const parent =
      object.parentObjectId === null
        ? undefined
        : objectsById.get(object.parentObjectId);
    const expectedParentLevel =
      object.objectLevel === "AD_SET" ? "CAMPAIGN" : "AD_SET";
    if (parent?.objectLevel !== expectedParentLevel) {
      return { kind: "invalid_hierarchy" };
    }

    if (object.objectLevel === "AD_SET") {
      counts.adSets += 1;
    } else {
      counts.ads += 1;
    }
  }

  return { kind: "ok", account, objects, counts };
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

async function getFixtureSubjectSummary(
  db: D1Database,
  workspaceId: string,
  account: FixtureAdAccount,
  objectLevel: "ACCOUNT" | FixtureAdObjectLevel,
  objectRef: string,
  dateStart: string,
  dateStop: string
): Promise<AccountSummaryResult> {
  const row = await db
    .prepare(
      `SELECT
         COUNT(*) AS row_count,
         COUNT(DISTINCT date_start) AS distinct_dates,
         SUM(CASE WHEN date_start = date_stop THEN 1 ELSE 0 END)
           AS daily_rows,
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
         AND object_level = ?3
         AND object_ref = ?4
         AND date_start >= ?5
         AND date_stop <= ?6`
    )
    .bind(
      workspaceId,
      account.id,
      objectLevel,
      objectRef,
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
  const actualStart = requireString(row, "actual_start");
  const actualStop = requireString(row, "actual_stop");
  const expectedDays = inclusiveUtcDays(dateStart, dateStop);
  const distinctDates = requireNonNegativeInteger(row, "distinct_dates");
  const dailyRows = requireNonNegativeInteger(row, "daily_rows");

  const syncResult = await db
    .prepare(
      `SELECT DISTINCT sync_run_id
       FROM insights_daily
       WHERE workspace_id = ?1
         AND ad_account_id = ?2
         AND object_level = ?3
         AND object_ref = ?4
         AND date_start >= ?5
         AND date_stop <= ?6
       ORDER BY sync_run_id
       LIMIT 32`
    )
    .bind(
      workspaceId,
      account.id,
      objectLevel,
      objectRef,
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
        dateStart: actualStart,
        dateStop: actualStop
      },
      coverage: {
        expectedDays,
        observedDays: rowCount,
        complete:
          rowCount === expectedDays &&
          distinctDates === rowCount &&
          dailyRows === rowCount &&
          actualStart === dateStart &&
          actualStop === dateStop
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

  return getFixtureSubjectSummary(
    db,
    workspaceId,
    account,
    "ACCOUNT",
    account.externalAccountRef,
    dateStart,
    dateStop
  );
}

export async function getFixtureAdObjectSummary(
  db: D1Database,
  workspaceId: string,
  account: FixtureAdAccount,
  object: FixtureAdObject,
  dateStart: string,
  dateStop: string
): Promise<AccountSummaryResult> {
  return getFixtureSubjectSummary(
    db,
    workspaceId,
    account,
    object.objectLevel,
    object.externalObjectRef,
    dateStart,
    dateStop
  );
}

async function getFixtureSubjectTrend(
  db: D1Database,
  workspaceId: string,
  account: FixtureAdAccount,
  objectLevel: "ACCOUNT" | FixtureAdObjectLevel,
  objectRef: string,
  dateStart: string,
  dateStop: string
): Promise<SubjectTrendResult> {
  const result = await db
    .prepare(
      `SELECT
         date_start,
         date_stop,
         object_level,
         object_ref,
         currency,
         timezone_name,
         click_metric_kind,
         conversion_event_ref,
         attribution_spec_hash,
         api_version,
         sync_run_id,
         spend_minor_units,
         impressions,
         clicks,
         conversions,
         stability_status,
         fetched_at
       FROM insights_daily
       WHERE workspace_id = ?1
         AND ad_account_id = ?2
         AND object_level = ?3
         AND object_ref = ?4
         AND date_start >= ?5
         AND date_stop <= ?6
       ORDER BY date_start ASC
       LIMIT 32`
    )
    .bind(
      workspaceId,
      account.id,
      objectLevel,
      objectRef,
      dateStart,
      dateStop
    )
    .all<Record<string, unknown>>();

  const rows = result.results;
  if (rows.length === 0) {
    return { kind: "data_unavailable" };
  }

  const expectedDays = inclusiveUtcDays(dateStart, dateStop);
  if (rows.length !== expectedDays) {
    return { kind: "incomplete_coverage" };
  }

  for (const [index, row] of rows.entries()) {
    const rowStart = requireString(row, "date_start");
    const rowStop = requireString(row, "date_stop");
    if (
      rowStart !== rowStop ||
      rowStart !== isoDateAtOffset(dateStart, index)
    ) {
      return { kind: "incomplete_coverage" };
    }
  }

  const firstRow = rows[0];
  if (firstRow === undefined) {
    return { kind: "data_unavailable" };
  }
  const currency = requireString(firstRow, "currency");
  const timezoneName = requireString(firstRow, "timezone_name");
  const clickMetricKind = requireString(firstRow, "click_metric_kind");
  const conversionEventRef = requireString(firstRow, "conversion_event_ref");
  const attributionSpecHash = requireString(firstRow, "attribution_spec_hash");
  const apiVersion = requireString(firstRow, "api_version");

  if (
    currency !== account.currency ||
    timezoneName !== account.timezoneName ||
    (clickMetricKind !== "ALL_CLICKS" && clickMetricKind !== "LINK_CLICKS")
  ) {
    return { kind: "incompatible_context" };
  }

  const items: FixtureDailyTrendItem[] = [];
  const syncRunIds = new Set<string>();
  let provisionalRows = 0;
  let reconcilingRows = 0;
  let stableRows = 0;
  let fetchedAt = "";
  let fetchedAtTimestamp = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    if (
      requireString(row, "object_level") !== objectLevel ||
      requireString(row, "object_ref") !== objectRef ||
      requireString(row, "currency") !== currency ||
      requireString(row, "timezone_name") !== timezoneName ||
      requireString(row, "click_metric_kind") !== clickMetricKind ||
      requireString(row, "conversion_event_ref") !== conversionEventRef ||
      requireString(row, "attribution_spec_hash") !== attributionSpecHash ||
      requireString(row, "api_version") !== apiVersion
    ) {
      return { kind: "incompatible_context" };
    }

    const stabilityStatus = requireString(row, "stability_status");
    if (stabilityStatus === "PROVISIONAL") {
      provisionalRows += 1;
    } else if (stabilityStatus === "RECONCILING") {
      reconcilingRows += 1;
    } else if (stabilityStatus === "STABLE") {
      stableRows += 1;
    } else {
      throw new Error("Invalid D1 stability status");
    }

    const rowFetchedAt = requireString(row, "fetched_at");
    const rowFetchedAtTimestamp = Date.parse(rowFetchedAt);
    if (!Number.isFinite(rowFetchedAtTimestamp)) {
      throw new Error("Invalid D1 fetched_at timestamp");
    }
    if (rowFetchedAtTimestamp > fetchedAtTimestamp) {
      fetchedAt = rowFetchedAt;
      fetchedAtTimestamp = rowFetchedAtTimestamp;
    }

    syncRunIds.add(requireString(row, "sync_run_id"));
    const totals: MetricTotals = {
      spendMinorUnits: nullableNonNegativeInteger(row, "spend_minor_units"),
      impressions: nullableNonNegativeInteger(row, "impressions"),
      clicks: nullableNonNegativeInteger(row, "clicks"),
      conversions: nullableNonNegativeInteger(row, "conversions")
    };
    items.push({
      date: requireString(row, "date_start"),
      totals,
      derived: deriveMetrics(totals)
    });
  }

  return {
    kind: "ok",
    trend: {
      account,
      requestedRange: { dateStart, dateStop },
      items,
      context: {
        currency,
        timezoneName,
        clickMetricKind,
        conversionEventRef,
        attributionSpecHash,
        apiVersion,
        stabilityStatus: resolveStabilityStatus(
          provisionalRows,
          reconcilingRows,
          stableRows,
          rows.length
        ),
        fetchedAt,
        syncRunIds: [...syncRunIds].sort()
      }
    }
  };
}

export async function getFixtureAccountTrend(
  db: D1Database,
  workspaceId: string,
  account: FixtureAdAccount,
  dateStart: string,
  dateStop: string
): Promise<SubjectTrendResult> {
  return getFixtureSubjectTrend(
    db,
    workspaceId,
    account,
    "ACCOUNT",
    account.externalAccountRef,
    dateStart,
    dateStop
  );
}

export async function getFixtureAdObjectTrend(
  db: D1Database,
  workspaceId: string,
  account: FixtureAdAccount,
  object: FixtureAdObject,
  dateStart: string,
  dateStop: string
): Promise<AdObjectTrendResult> {
  const result = await getFixtureSubjectTrend(
    db,
    workspaceId,
    account,
    object.objectLevel,
    object.externalObjectRef,
    dateStart,
    dateStop
  );
  if (result.kind !== "ok") {
    return result;
  }
  return {
    kind: "ok",
    trend: { ...result.trend, object }
  };
}
