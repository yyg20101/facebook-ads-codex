import { env } from "cloudflare:workers";
import {
  createExecutionContext,
  waitOnExecutionContext
} from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";

import worker from "../src/index";
import { buildFixtureDataQualityReport } from "../src/quality";
import {
  getFixtureAccountTrend,
  getFixtureAdObjectTrend,
  listFixtureAdObjects
} from "../src/read-model";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;
const WORKSPACE_ID = "ws_fixture_01";
const ACCOUNT_ID = "aa_fixture_01";
const DATE_START = "2026-08-02";
const DATE_STOP = "2026-08-04";
const QUALITY_PATH =
  `/offline/v1/workspaces/${WORKSPACE_ID}/ad-accounts/${ACCOUNT_ID}` +
  "/data-quality";
const QUALITY_QUERY = `?date_start=${DATE_START}&date_stop=${DATE_STOP}`;

async function dispatch(path: string) {
  const request = new IncomingRequest(`https://offline.invalid${path}`);
  const context = createExecutionContext();
  const response = await worker.fetch(request, env, context);
  await waitOnExecutionContext(context);
  return response;
}

async function qualityInputs() {
  const hierarchy = await listFixtureAdObjects(
    env.DB,
    WORKSPACE_ID,
    ACCOUNT_ID
  );
  if (hierarchy.kind !== "ok") {
    throw new Error("Fixture hierarchy is unavailable");
  }
  const [accountTrend, objectTrendResults] = await Promise.all([
    getFixtureAccountTrend(
      env.DB,
      WORKSPACE_ID,
      hierarchy.account,
      DATE_START,
      DATE_STOP
    ),
    Promise.all(
      hierarchy.objects.map((object) =>
        getFixtureAdObjectTrend(
          env.DB,
          WORKSPACE_ID,
          hierarchy.account,
          object,
          DATE_START,
          DATE_STOP
        )
      )
    )
  ]);
  if (
    accountTrend.kind !== "ok" ||
    objectTrendResults.some((result) => result.kind !== "ok")
  ) {
    throw new Error("Fixture quality inputs are unavailable");
  }
  return {
    hierarchy,
    accountTrend: accountTrend.trend,
    objectTrends: objectTrendResults.flatMap((result) =>
      result.kind === "ok" ? [result.trend] : []
    )
  };
}

afterEach(async () => {
  await env.DB.batch([
    env.DB.prepare(
      `DELETE FROM insights_daily
       WHERE id = 'insight_ad_01_duplicate_quality'`
    ),
    env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-03',
           date_stop = '2026-08-03',
           currency = 'USD',
           spend_minor_units = 3800
       WHERE id = 'insight_ad_01_20260803'`
    ),
    env.DB.prepare(
      `UPDATE insights_daily
       SET spend_minor_units = 11000
       WHERE id = 'insight_campaign_01_20260803'`
    )
  ]);
});

describe("offline fixture data quality report", () => {
  it("returns seven passing checks for the complete subject-day dataset", async () => {
    const response = await dispatch(`${QUALITY_PATH}${QUALITY_QUERY}`);
    expect(response.status).toBe(200);
    const body = await response.json<{
      data: {
        checks: Array<{ code: string; checkedUnits: number }>;
        hierarchy: { objectIds: string[] };
      };
    }>();

    expect(body).toMatchObject({
      ok: true,
      data: {
        account: { id: ACCOUNT_ID, sourceKind: "FIXTURE" },
        requestedRange: { dateStart: DATE_START, dateStop: DATE_STOP },
        dataset: {
          grain: "SUBJECT_DAY",
          subjectCount: 8,
          observedRows: 24,
          expectedRows: 24
        },
        hierarchy: {
          campaigns: 1,
          adSets: 2,
          ads: 4,
          objectCount: 7
        }
      },
      context: {
        workspaceId: WORKSPACE_ID,
        adAccountId: ACCOUNT_ID,
        stabilityStatus: "STABLE",
        qualityPolicy: {
          minimumDays: 3,
          maximumDays: 31,
          allChecksRequired: true,
          performanceEvaluationApplied: false,
          businessThresholdsApplied: false,
          causalClaims: false,
          gateEvidence: false
        },
        sourceKind: "FIXTURE"
      },
      warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
      nextCursor: null,
      truncated: false
    });
    expect(body.data.hierarchy.objectIds).toEqual([
      "ad_fixture_01",
      "ad_fixture_02",
      "ad_fixture_03",
      "ad_fixture_04",
      "adset_fixture_01",
      "adset_fixture_02",
      "campaign_fixture_01"
    ]);
    expect(body.data.checks.map((item) => item.code)).toEqual([
      "PRIMARY_GRAIN_UNIQUE",
      "DAILY_COVERAGE_COMPLETE",
      "REPORTING_CONTEXT_CONSISTENT",
      "OBJECT_HIERARCHY_COMPLETE",
      "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP",
      "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
      "AD_SET_TO_AD_DAILY_ROLLUP"
    ]);
    expect(body.data.checks.map((item) => item.checkedUnits)).toEqual([
      24, 24, 24, 7, 3, 3, 6
    ]);
  });

  it("rejects invalid ranges, extra parameters, and unknown scope", async () => {
    for (const query of [
      "?date_start=2026-08-02&date_stop=2026-08-03",
      "?date_start=2026-08-04&date_stop=2026-08-02",
      `${QUALITY_QUERY}&threshold=0.05`,
      "?date_start=2026-08-02&date_start=2026-08-03&date_stop=2026-08-04"
    ]) {
      const response = await dispatch(`${QUALITY_PATH}${query}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "INVALID_ARGUMENT" }
      });
    }

    for (const path of [
      QUALITY_PATH.replace(ACCOUNT_ID, "aa_fixture_missing"),
      QUALITY_PATH.replace(WORKSPACE_ID, "ws_fixture_missing")
    ]) {
      const response = await dispatch(`${path}${QUALITY_QUERY}`);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: "NOT_FOUND" }
      });
    }
  });

  it("rejects incomplete or duplicate subject-day grain atomically", async () => {
    await env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-05', date_stop = '2026-08-05'
       WHERE id = 'insight_ad_01_20260803'`
    ).run();
    let response = await dispatch(`${QUALITY_PATH}${QUALITY_QUERY}`);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPLETE_PERIOD_COVERAGE" }
    });

    await env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-03', date_stop = '2026-08-03'
       WHERE id = 'insight_ad_01_20260803'`
    ).run();
    await env.DB.prepare(
      `INSERT INTO insights_daily (
         id, workspace_id, ad_account_id, object_level, object_ref,
         date_start, date_stop, currency, timezone_name,
         attribution_spec_hash, api_version, sync_run_id,
         spend_minor_units, impressions, clicks, click_metric_kind,
         conversions, conversion_event_ref, stability_status, fetched_at
       ) VALUES (
         'insight_ad_01_duplicate_quality', ?1, ?2, 'AD', 'fixture-ad-01',
         '2026-08-03', '2026-08-03', 'USD', 'Etc/UTC',
         'fixture-duplicate-quality', 'v25.0', 'sync_fixture_01',
         0, 0, 0, 'ALL_CLICKS', 0, 'fixture-purchase', 'STABLE',
         '2026-08-05T00:00:01Z'
       )`
    )
      .bind(WORKSPACE_ID, ACCOUNT_ID)
      .run();
    response = await dispatch(`${QUALITY_PATH}${QUALITY_QUERY}`);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPLETE_PERIOD_COVERAGE" }
    });
  });

  it("rejects incompatible reporting context atomically", async () => {
    await env.DB.prepare(
      `UPDATE insights_daily SET currency = 'EUR'
       WHERE id = 'insight_ad_01_20260803'`
    ).run();

    const response = await dispatch(`${QUALITY_PATH}${QUALITY_QUERY}`);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_METRIC_CONTEXT" }
    });
  });

  it("rejects daily hierarchy rollup mismatches atomically", async () => {
    await env.DB.prepare(
      `UPDATE insights_daily
       SET spend_minor_units = spend_minor_units + 1
       WHERE id = 'insight_ad_01_20260803'`
    ).run();

    const response = await dispatch(`${QUALITY_PATH}${QUALITY_QUERY}`);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_OBJECT_ROLLUP" }
    });
  });

  it("rejects an incompatible hierarchy before reporting passing checks", async () => {
    const inputs = await qualityInputs();
    const firstAd = inputs.hierarchy.objects.find(
      (object) => object.objectLevel === "AD"
    );
    if (firstAd === undefined) {
      throw new Error("Fixture Ad is unavailable");
    }
    const incompatibleObjects = inputs.hierarchy.objects.map((object) =>
      object.id === firstAd.id
        ? { ...object, parentObjectId: "campaign_fixture_01" }
        : object
    );

    expect(
      buildFixtureDataQualityReport(
        inputs.accountTrend,
        incompatibleObjects,
        inputs.objectTrends
      )
    ).toEqual({ kind: "incompatible_hierarchy" });
  });
});
