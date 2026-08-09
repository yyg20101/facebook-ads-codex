import { env } from "cloudflare:workers";
import {
  createExecutionContext,
  waitOnExecutionContext
} from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";

import worker from "../src/index";
import { buildDirectChildTrend } from "../src/comparison";
import {
  getFixtureAdObjectTrend,
  listFixtureAdObjects,
  type FixtureAdObject,
  type FixtureAdObjectTrend
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

function childTrendPath(objectId: string) {
  return (
    `/offline/v1/workspaces/${WORKSPACE_ID}/ad-accounts/${ACCOUNT_ID}` +
    `/objects/${objectId}/children-trend`
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
  objectId: string
): FixtureAdObject {
  const object = objects.find((candidate) => candidate.id === objectId);
  if (object === undefined) {
    throw new Error(`Missing fixture object ${objectId}`);
  }
  return object;
}

async function requireTrend(
  account: Awaited<ReturnType<typeof hierarchy>>["account"],
  object: FixtureAdObject
): Promise<FixtureAdObjectTrend> {
  const result = await getFixtureAdObjectTrend(
    env.DB,
    WORKSPACE_ID,
    account,
    object,
    DATE_START,
    DATE_STOP
  );
  if (result.kind !== "ok") {
    throw new Error(`Fixture trend unavailable for ${object.id}`);
  }
  return result.trend;
}

afterEach(async () => {
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-03',
           date_stop = '2026-08-03',
           currency = 'USD',
           spend_minor_units = 6500
       WHERE id = 'insight_adset_01_20260803'`
    ),
    env.DB.prepare(
      `UPDATE insights_daily
       SET currency = 'USD',
           spend_minor_units = 3800
       WHERE id = 'insight_ad_01_20260803'`
    )
  ]);
});

describe("offline direct child daily trend", () => {
  it.each([
    ["campaign_fixture_01", "CAMPAIGN", "AD_SET", ["adset_fixture_01", "adset_fixture_02"]],
    ["adset_fixture_01", "AD_SET", "AD", ["ad_fixture_01", "ad_fixture_02"]]
  ] as const)(
    "returns stable, reconciled child series for %s",
    async (parentId, parentLevel, childLevel, expectedChildIds) => {
      const response = await dispatch(`${childTrendPath(parentId)}${TREND_QUERY}`);
      expect(response.status).toBe(200);
      const body = await response.json<{
        data: {
          parentItems: Array<{ date: string }>;
          items: Array<{ object: { id: string }; items: Array<{ date: string }> }>;
        };
      }>();

      expect(body).toMatchObject({
        ok: true,
        data: {
          account: { id: ACCOUNT_ID, sourceKind: "FIXTURE" },
          parent: { id: parentId, objectLevel: parentLevel },
          requestedRange: { dateStart: DATE_START, dateStop: DATE_STOP },
          reconciliation: {
            additiveMetricKeys: [
              "spendMinorUnits",
              "impressions",
              "clicks",
              "conversions"
            ],
            dailyMatchesParent: true
          }
        },
        context: {
          workspaceId: WORKSPACE_ID,
          adAccountId: ACCOUNT_ID,
          parentObjectId: parentId,
          parentObjectLevel: parentLevel,
          childObjectLevel: childLevel,
          childCount: 2,
          pointCount: 3,
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
        warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
        nextCursor: null,
        truncated: false
      });
      expect(body.data.parentItems.map((item) => item.date)).toEqual([
        "2026-08-02",
        "2026-08-03",
        "2026-08-04"
      ]);
      expect(body.data.items.map((item) => item.object.id)).toEqual(
        expectedChildIds
      );
      for (const item of body.data.items) {
        expect(item.items.map((point) => point.date)).toEqual([
          "2026-08-02",
          "2026-08-03",
          "2026-08-04"
        ]);
      }
    }
  );

  it("rejects Ad leaves and invalid trend inputs", async () => {
    const leafResponse = await dispatch(
      `${childTrendPath("ad_fixture_01")}${TREND_QUERY}`
    );
    expect(leafResponse.status).toBe(409);
    expect(await leafResponse.json()).toMatchObject({
      error: { code: "NO_CHILD_OBJECTS" }
    });

    for (const query of [
      "?date_start=2026-08-02&date_stop=2026-08-03",
      "?date_start=2026-08-04&date_stop=2026-08-02",
      "?date_start=2026-08-02&date_stop=2026-08-04&rank=spend",
      "?date_start=2026-08-02&date_start=2026-08-03&date_stop=2026-08-04"
    ]) {
      const response = await dispatch(
        `${childTrendPath("campaign_fixture_01")}${query}`
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "INVALID_ARGUMENT" }
      });
    }
  });

  it("does not reveal unknown or cross-scope objects", async () => {
    for (const path of [
      childTrendPath("campaign_fixture_missing"),
      childTrendPath("campaign_fixture_01").replace(
        ACCOUNT_ID,
        "aa_fixture_missing"
      ),
      childTrendPath("campaign_fixture_01").replace(
        WORKSPACE_ID,
        "ws_fixture_missing"
      )
    ]) {
      const response = await dispatch(`${path}${TREND_QUERY}`);
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { code: "NOT_FOUND" }
      });
    }
  });

  it("rejects an incomplete child series atomically", async () => {
    await env.DB.prepare(
      `UPDATE insights_daily
       SET date_start = '2026-08-05', date_stop = '2026-08-05'
       WHERE id = 'insight_adset_01_20260803'`
    ).run();

    const response = await dispatch(
      `${childTrendPath("campaign_fixture_01")}${TREND_QUERY}`
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPLETE_PERIOD_COVERAGE" }
    });
  });

  it("rejects incompatible child reporting context atomically", async () => {
    await env.DB.prepare(
      `UPDATE insights_daily
       SET currency = 'EUR'
       WHERE id = 'insight_adset_01_20260803'`
    ).run();

    const response = await dispatch(
      `${childTrendPath("campaign_fixture_01")}${TREND_QUERY}`
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_METRIC_CONTEXT" }
    });
  });

  it("rejects a daily rollup mismatch", async () => {
    const result = await hierarchy();
    const parentObject = requireObject(result.objects, "campaign_fixture_01");
    const childObjects = [
      requireObject(result.objects, "adset_fixture_01"),
      requireObject(result.objects, "adset_fixture_02")
    ];
    const parentTrend = await requireTrend(result.account, parentObject);
    const childTrends = await Promise.all(
      childObjects.map(async (object) => ({
        object,
        trend: await requireTrend(result.account, object)
      }))
    );
    const firstChild = childTrends[0];
    if (firstChild === undefined) {
      throw new Error("Missing child trend");
    }
    const firstDay = firstChild.trend.items[0];
    if (firstDay === undefined) {
      throw new Error("Missing child day");
    }
    const mismatchedChildren = [
      {
        object: firstChild.object,
        trend: {
          ...firstChild.trend,
          items: [
            {
              ...firstDay,
              totals: {
                ...firstDay.totals,
                spendMinorUnits: (firstDay.totals.spendMinorUnits ?? 0) + 1
              }
            },
            ...firstChild.trend.items.slice(1)
          ]
        }
      },
      ...childTrends.slice(1)
    ];

    expect(
      buildDirectChildTrend(parentObject, parentTrend, mismatchedChildren)
    ).toEqual({ kind: "incompatible_rollup" });

    await env.DB.prepare(
      `UPDATE insights_daily
       SET spend_minor_units = spend_minor_units + 1
       WHERE id = 'insight_adset_01_20260803'`
    ).run();
    const response = await dispatch(
      `${childTrendPath("campaign_fixture_01")}${TREND_QUERY}`
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_OBJECT_ROLLUP" }
    });
  });
});
