import { env } from "cloudflare:workers";
import {
  createExecutionContext,
  waitOnExecutionContext
} from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";

import worker from "../src/index";
import {
  getFixtureAdObjectTrend,
  listFixtureAdObjects,
  type FixtureAdObject
} from "../src/read-model";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;
const WORKSPACE_ID = "ws_fixture_01";
const ACCOUNT_ID = "aa_fixture_01";
const DATE_START = "2026-08-02";
const DATE_STOP = "2026-08-04";
const TREND_QUERY = `?date_start=${DATE_START}&date_stop=${DATE_STOP}`;

async function dispatch(path: string) {
  const request = new IncomingRequest(`https://offline.invalid${path}`);
  const context = createExecutionContext();
  const response = await worker.fetch(request, env, context);
  await waitOnExecutionContext(context);
  return response;
}

function trendPath(objectId: string) {
  return (
    `/offline/v1/workspaces/${WORKSPACE_ID}/ad-accounts/${ACCOUNT_ID}` +
    `/objects/${objectId}/trend`
  );
}

async function hierarchy() {
  const result = await listFixtureAdObjects(env.DB, WORKSPACE_ID, ACCOUNT_ID);
  expect(result.kind).toBe("ok");
  if (result.kind !== "ok") {
    throw new Error("Fixture hierarchy is unavailable");
  }
  return result;
}

function requireObject(
  objects: FixtureAdObject[],
  objectLevel: FixtureAdObject["objectLevel"]
) {
  const object = objects.find((item) => item.objectLevel === objectLevel);
  if (object === undefined) {
    throw new Error(`Missing fixture object at level ${objectLevel}`);
  }
  return object;
}

async function insertAdTrendRow({
  id,
  date,
  attribution = "fixture-attribution-context",
  currency = "USD",
  timezone = "Etc/UTC",
  clickKind = "ALL_CLICKS",
  conversionEvent = "fixture-purchase",
  apiVersion = "v25.0",
  spend = 0,
  impressions = 0,
  clicks = 0,
  conversions = 0
}: {
  id: string;
  date: string;
  attribution?: string;
  currency?: string;
  timezone?: string;
  clickKind?: "ALL_CLICKS" | "LINK_CLICKS";
  conversionEvent?: string;
  apiVersion?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}) {
  await env.DB.prepare(
    `INSERT INTO insights_daily (
       id, workspace_id, ad_account_id, object_level, object_ref,
       date_start, date_stop, currency, timezone_name,
       attribution_spec_hash, api_version, sync_run_id,
       spend_minor_units, impressions, clicks, click_metric_kind,
       conversions, conversion_event_ref, stability_status, fetched_at
     ) VALUES (
       ?1, ?2, ?3, 'AD', 'fixture-ad-01', ?4, ?4, ?5, ?6,
       ?7, ?8, 'sync_fixture_01', ?9, ?10, ?11, ?12, ?13, ?14,
       'STABLE', '2026-08-07T00:00:01Z'
     )`
  )
    .bind(
      id,
      WORKSPACE_ID,
      ACCOUNT_ID,
      date,
      currency,
      timezone,
      attribution,
      apiVersion,
      spend,
      impressions,
      clicks,
      clickKind,
      conversions,
      conversionEvent
    )
    .run();
}

afterEach(async () => {
  await env.DB.batch([
    env.DB.prepare(
      `DELETE FROM insights_daily
       WHERE id = 'insight_ad_01_duplicate_trend'
          OR id LIKE 'insight_ad_zero_%'`
    ),
    env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-03',
           date_stop = '2026-08-03',
           currency = 'USD',
           timezone_name = 'Etc/UTC',
           click_metric_kind = 'ALL_CLICKS',
           conversion_event_ref = 'fixture-purchase',
           attribution_spec_hash = 'fixture-attribution-context',
           api_version = 'v25.0'
       WHERE id = 'insight_ad_01_20260803'`
    ),
    env.DB.prepare(
      `UPDATE insights_daily
       SET currency = 'USD'
       WHERE id = 'insight_ad_02_20260803'`
    )
  ]);
});

describe("offline fixture ad object daily trend", () => {
  it.each(["CAMPAIGN", "AD_SET", "AD"] as const)(
    "reads complete ordered daily points for %s",
    async (objectLevel) => {
      const result = await hierarchy();
      const object = requireObject(result.objects, objectLevel);
      const trend = await getFixtureAdObjectTrend(
        env.DB,
        WORKSPACE_ID,
        result.account,
        object,
        DATE_START,
        DATE_STOP
      );

      expect(trend).toMatchObject({
        kind: "ok",
        trend: {
          account: { id: ACCOUNT_ID, sourceKind: "FIXTURE" },
          object: { id: object.id, objectLevel },
          requestedRange: { dateStart: DATE_START, dateStop: DATE_STOP },
          items: [
            { date: "2026-08-02" },
            { date: "2026-08-03" },
            { date: "2026-08-04" }
          ],
          context: {
            currency: "USD",
            timezoneName: "Etc/UTC",
            clickMetricKind: "ALL_CLICKS",
            conversionEventRef: "fixture-purchase",
            attributionSpecHash: "fixture-attribution-context",
            apiVersion: "v25.0",
            stabilityStatus: "STABLE",
            syncRunIds: ["sync_fixture_01"]
          }
        }
      });

      if (objectLevel === "AD") {
        if (trend.kind !== "ok") {
          throw new Error("Expected a complete Ad trend");
        }
        expect(trend.trend.items[0]).toEqual({
          date: "2026-08-02",
          totals: {
            spendMinorUnits: 3500,
            impressions: 2800,
            clicks: 60,
            conversions: 2
          },
          derived: {
            clickThroughRate: 0.021429,
            conversionRate: 0.033333,
            costPerClickMinorUnits: 58.333333,
            costPerThousandImpressionsMinorUnits: 1250,
            costPerConversionMinorUnits: 1750
          }
        });
      }
    }
  );

  it("distinguishes unavailable and incomplete trend data", async () => {
    const result = await hierarchy();
    const object = requireObject(result.objects, "AD");

    await expect(
      getFixtureAdObjectTrend(
        env.DB,
        WORKSPACE_ID,
        result.account,
        object,
        "2026-07-28",
        "2026-07-30"
      )
    ).resolves.toEqual({ kind: "data_unavailable" });

    await env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-05', date_stop = '2026-08-05'
       WHERE id = ?1`
    )
      .bind("insight_ad_01_20260803")
      .run();
    await expect(
      getFixtureAdObjectTrend(
        env.DB,
        WORKSPACE_ID,
        result.account,
        object,
        DATE_START,
        DATE_STOP
      )
    ).resolves.toEqual({ kind: "incomplete_coverage" });
  });

  it("rejects duplicate dates before evaluating reporting context", async () => {
    const result = await hierarchy();
    const object = requireObject(result.objects, "AD");
    await insertAdTrendRow({
      id: "insight_ad_01_duplicate_trend",
      date: "2026-08-03",
      attribution: "fixture-duplicate-attribution"
    });

    await expect(
      getFixtureAdObjectTrend(
        env.DB,
        WORKSPACE_ID,
        result.account,
        object,
        DATE_START,
        DATE_STOP
      )
    ).resolves.toEqual({ kind: "incomplete_coverage" });
  });

  it.each([
    ["currency", "EUR"],
    ["timezone_name", "Asia/Shanghai"],
    ["click_metric_kind", "LINK_CLICKS"],
    ["conversion_event_ref", "fixture-lead"],
    ["attribution_spec_hash", "fixture-other-attribution"],
    ["api_version", "v26.0"]
  ])("rejects incompatible %s context", async (column, value) => {
    const result = await hierarchy();
    const object = requireObject(result.objects, "AD");
    await env.DB.prepare(
      `UPDATE insights_daily SET ${column} = ?1 WHERE id = ?2`
    )
      .bind(value, "insight_ad_01_20260803")
      .run();

    await expect(
      getFixtureAdObjectTrend(
        env.DB,
        WORKSPACE_ID,
        result.account,
        object,
        DATE_START,
        DATE_STOP
      )
    ).resolves.toEqual({ kind: "incompatible_context" });
  });

  it("returns null rather than non-finite derived values for zero denominators", async () => {
    const result = await hierarchy();
    const object = requireObject(result.objects, "AD");
    for (const [offset, date] of [
      [1, "2026-08-08"],
      [2, "2026-08-09"],
      [3, "2026-08-10"]
    ] as const) {
      await insertAdTrendRow({ id: `insight_ad_zero_${offset}`, date });
    }

    const trend = await getFixtureAdObjectTrend(
      env.DB,
      WORKSPACE_ID,
      result.account,
      object,
      "2026-08-08",
      "2026-08-10"
    );
    if (trend.kind !== "ok") {
      throw new Error("Expected a complete zero-denominator trend");
    }
    for (const item of trend.trend.items) {
      expect(item.totals).toEqual({
        spendMinorUnits: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0
      });
      expect(item.derived).toEqual({
        clickThroughRate: null,
        conversionRate: null,
        costPerClickMinorUnits: null,
        costPerThousandImpressionsMinorUnits: null,
        costPerConversionMinorUnits: null
      });
    }
    expect(JSON.stringify(trend)).not.toMatch(/Infinity|NaN/);
  });

  it.each([
    "campaign_fixture_01",
    "adset_fixture_01",
    "ad_fixture_01"
  ])("returns the fixed HTTP envelope for %s", async (objectId) => {
    const response = await dispatch(`${trendPath(objectId)}${TREND_QUERY}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        account: { id: ACCOUNT_ID, sourceKind: "FIXTURE" },
        object: { id: objectId, sourceKind: "FIXTURE" },
        requestedRange: { dateStart: DATE_START, dateStop: DATE_STOP },
        items: [
          { date: "2026-08-02" },
          { date: "2026-08-03" },
          { date: "2026-08-04" }
        ]
      },
      context: {
        workspaceId: WORKSPACE_ID,
        adAccountId: ACCOUNT_ID,
        objectId,
        pointCount: 3,
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
      warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
      nextCursor: null,
      truncated: false
    });
  });

  it("rejects invalid input and accepts a 31-day range for coverage validation", async () => {
    const base = trendPath("ad_fixture_01");
    const queries = [
      "?date_start=2026-08-02&date_stop=2026-08-02",
      "?date_start=2026-08-02&date_stop=2026-08-03",
      "?date_start=2026-08-04&date_stop=2026-08-02",
      "?date_start=2026-02-30&date_stop=2026-03-02",
      "?date_start=2026-08-02&date_start=2026-08-03&date_stop=2026-08-04",
      "?date_start=2026-08-02&date_stop=2026-08-04&metric=spend",
      "?date_start=2026-07-01&date_stop=2026-08-01"
    ];

    for (const query of queries) {
      const response = await dispatch(`${base}${query}`);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "INVALID_ARGUMENT" }
      });
    }

    const valid31DayResponse = await dispatch(
      `${base}?date_start=2026-07-05&date_stop=2026-08-04`
    );
    expect(valid31DayResponse.status).not.toBe(400);
    expect(await valid31DayResponse.json()).toMatchObject({
      error: { code: "INCOMPLETE_PERIOD_COVERAGE" }
    });
  });

  it("does not reveal unknown objects or cross-scope identifiers", async () => {
    const paths = [
      trendPath("ad_fixture_missing"),
      trendPath("ad_fixture_01").replace(ACCOUNT_ID, "aa_fixture_missing"),
      trendPath("ad_fixture_01").replace(WORKSPACE_ID, "ws_fixture_missing")
    ];
    for (const path of paths) {
      const response = await dispatch(`${path}${TREND_QUERY}`);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: "NOT_FOUND" }
      });
    }
  });

  it("maps incomplete and incompatible trend data to stable HTTP errors", async () => {
    await env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-05', date_stop = '2026-08-05'
       WHERE id = ?1`
    )
      .bind("insight_ad_01_20260803")
      .run();
    const incompleteResponse = await dispatch(
      `${trendPath("ad_fixture_01")}${TREND_QUERY}`
    );
    expect(incompleteResponse.status).toBe(409);
    expect(await incompleteResponse.json()).toMatchObject({
      error: { code: "INCOMPLETE_PERIOD_COVERAGE" }
    });

    await env.DB.prepare(
      `UPDATE insights_daily SET currency = 'EUR' WHERE id = ?1`
    )
      .bind("insight_ad_02_20260803")
      .run();
    const incompatibleResponse = await dispatch(
      `${trendPath("ad_fixture_02")}${TREND_QUERY}`
    );
    expect(incompatibleResponse.status).toBe(409);
    expect(await incompatibleResponse.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_METRIC_CONTEXT" }
    });
  });
});
