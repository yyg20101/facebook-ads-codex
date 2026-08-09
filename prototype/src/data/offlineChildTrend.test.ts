import { afterEach, describe, expect, it, vi } from "vitest";

import type { MetricTotals, OfflineAdAccount } from "./offlineComparison";
import type { OfflineAdObject } from "./offlineHierarchy";
import {
  loadOfflineDirectChildTrend,
  type OfflineDirectChildTrendResponse
} from "./offlineChildTrend";
import { DEFAULT_OFFLINE_TREND_REQUEST } from "./offlineTrend";

const ACCOUNT: OfflineAdAccount = {
  id: "aa_fixture_01",
  externalAccountRef: "fixture-ad-account-01",
  currency: "USD",
  timezoneName: "Etc/UTC",
  sourceKind: "FIXTURE",
  dataThrough: "2026-08-05T00:00:01Z",
  insightRowCount: 3
};

const PARENT: OfflineAdObject = {
  id: "campaign_fixture_01",
  externalObjectRef: "fixture-campaign-01",
  objectLevel: "CAMPAIGN",
  parentObjectId: null,
  displayName: "虚构转化 Campaign",
  sourceKind: "FIXTURE",
  syncRunId: "sync_fixture_01",
  fetchedAt: "2026-08-05T00:00:01Z"
};

const CHILDREN: OfflineAdObject[] = [
  {
    id: "adset_fixture_01",
    externalObjectRef: "fixture-ad-set-01",
    objectLevel: "AD_SET",
    parentObjectId: PARENT.id,
    displayName: "虚构宽泛受众 Ad Set",
    sourceKind: "FIXTURE",
    syncRunId: "sync_fixture_01",
    fetchedAt: "2026-08-05T00:00:01Z"
  },
  {
    id: "adset_fixture_02",
    externalObjectRef: "fixture-ad-set-02",
    objectLevel: "AD_SET",
    parentObjectId: PARENT.id,
    displayName: "虚构再营销 Ad Set",
    sourceKind: "FIXTURE",
    syncRunId: "sync_fixture_01",
    fetchedAt: "2026-08-05T00:00:01Z"
  }
];

function roundSix(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function ratio(
  numerator: number | null,
  denominator: number | null,
  scale = 1
): number | null {
  return numerator === null || denominator === null || denominator === 0
    ? null
    : roundSix((numerator / denominator) * scale);
}

function item(date: string, totals: MetricTotals) {
  return {
    date,
    totals,
    derived: {
      clickThroughRate: ratio(totals.clicks, totals.impressions),
      conversionRate: ratio(totals.conversions, totals.clicks),
      costPerClickMinorUnits: ratio(totals.spendMinorUnits, totals.clicks),
      costPerThousandImpressionsMinorUnits: ratio(
        totals.spendMinorUnits,
        totals.impressions,
        1000
      ),
      costPerConversionMinorUnits: ratio(
        totals.spendMinorUnits,
        totals.conversions
      )
    }
  };
}

const DATES = ["2026-08-02", "2026-08-03", "2026-08-04"];
const FIRST_TOTALS: MetricTotals[] = [
  { spendMinorUnits: 6000, impressions: 4800, clicks: 100, conversions: 3 },
  { spendMinorUnits: 6500, impressions: 5200, clicks: 120, conversions: 3 },
  { spendMinorUnits: 7000, impressions: 5600, clicks: 150, conversions: 5 }
];
const SECOND_TOTALS: MetricTotals[] = [
  { spendMinorUnits: 4000, impressions: 3200, clicks: 60, conversions: 1 },
  { spendMinorUnits: 4500, impressions: 3800, clicks: 78, conversions: 2 },
  { spendMinorUnits: 5345, impressions: 4400, clicks: 100, conversions: 2 }
];
const parentItems = DATES.map((date, index) => {
  const first = FIRST_TOTALS[index]!;
  const second = SECOND_TOTALS[index]!;
  return item(date, {
    spendMinorUnits: first.spendMinorUnits! + second.spendMinorUnits!,
    impressions: first.impressions! + second.impressions!,
    clicks: first.clicks! + second.clicks!,
    conversions: first.conversions! + second.conversions!
  });
});
const childItems = [FIRST_TOTALS, SECOND_TOTALS].map((totals) =>
  DATES.map((date, index) => item(date, totals[index]!))
);

const RESPONSE: OfflineDirectChildTrendResponse = {
  ok: true,
  data: {
    account: ACCOUNT,
    parent: PARENT,
    requestedRange: DEFAULT_OFFLINE_TREND_REQUEST,
    parentItems,
    items: CHILDREN.map((object, index) => ({
      object,
      items: childItems[index]!
    })),
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
    requestId: "fixture-child-trend-request-01",
    workspaceId: "ws_fixture_01",
    adAccountId: ACCOUNT.id,
    parentObjectId: PARENT.id,
    parentObjectLevel: "CAMPAIGN",
    childObjectLevel: "AD_SET",
    childCount: 2,
    pointCount: 3,
    metricContext: {
      currency: "USD",
      timezoneName: "Etc/UTC",
      clickMetricKind: "ALL_CLICKS",
      conversionEventRef: "fixture-purchase",
      attributionSpecHash: "fixture-attribution-context",
      apiVersion: "v25.0"
    },
    stabilityStatus: "STABLE",
    fetchedAt: "2026-08-05T00:00:01Z",
    syncRunIds: ["sync_fixture_01"],
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
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function successfulFetch(body: unknown = RESPONSE) {
  const fetchMock = vi.fn(async () => jsonResponse(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("offline direct child trend client", () => {
  it("loads one fixed same-origin route without credentials", async () => {
    const fetchMock = successfulFetch();
    const controller = new AbortController();
    const result = await loadOfflineDirectChildTrend(
      ACCOUNT,
      PARENT,
      DEFAULT_OFFLINE_TREND_REQUEST,
      controller.signal
    );

    expect(result.data.items.map((entry) => entry.object.id)).toEqual([
      "adset_fixture_01",
      "adset_fixture_02"
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects/campaign_fixture_01/children-trend?date_start=2026-08-02&date_stop=2026-08-04",
      {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal
      }
    );
  });

  it.each([
    [
      "different parent",
      { ...RESPONSE, context: { ...RESPONSE.context, parentObjectId: "campaign_fixture_02" } }
    ],
    [
      "unstable child order",
      { ...RESPONSE, data: { ...RESPONSE.data, items: [...RESPONSE.data.items].reverse() } }
    ],
    [
      "wrong direct child level",
      {
        ...RESPONSE,
        data: {
          ...RESPONSE.data,
          items: RESPONSE.data.items.map((entry, index) =>
            index === 0
              ? { ...entry, object: { ...entry.object, objectLevel: "AD" as const } }
              : entry
          )
        }
      }
    ],
    [
      "unsafe ranking policy",
      {
        ...RESPONSE,
        context: {
          ...RESPONSE.context,
          trendPolicy: { ...RESPONSE.context.trendPolicy, rankingApplied: true }
        }
      }
    ],
    ["missing trust warning", { ...RESPONSE, warnings: ["FIXTURE_DATA_ONLY"] }]
  ])("rejects %s", async (_caseName, body) => {
    successfulFetch(body);
    await expect(
      loadOfflineDirectChildTrend(
        ACCOUNT,
        PARENT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects derived values and daily rollups that do not reconcile", async () => {
    const badDerived = {
      ...RESPONSE,
      data: {
        ...RESPONSE.data,
        parentItems: RESPONSE.data.parentItems.map((point, index) =>
          index === 0
            ? {
                ...point,
                derived: { ...point.derived, clickThroughRate: 0.5 }
              }
            : point
        )
      }
    };
    successfulFetch(badDerived);
    await expect(
      loadOfflineDirectChildTrend(
        ACCOUNT,
        PARENT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });

    vi.unstubAllGlobals();
    const firstEntry = RESPONSE.data.items[0]!;
    const firstPoint = firstEntry.items[0]!;
    successfulFetch({
      ...RESPONSE,
      data: {
        ...RESPONSE.data,
        items: [
          {
            ...firstEntry,
            items: [
              item(firstPoint.date, {
                ...firstPoint.totals,
                spendMinorUnits: firstPoint.totals.spendMinorUnits! + 1
              }),
              ...firstEntry.items.slice(1)
            ]
          },
          ...RESPONSE.data.items.slice(1)
        ]
      }
    });
    await expect(
      loadOfflineDirectChildTrend(
        ACCOUNT,
        PARENT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects Ad parents, invalid dates, and maps safe HTTP failures", async () => {
    await expect(
      loadOfflineDirectChildTrend(
        ACCOUNT,
        { ...PARENT, objectLevel: "AD", parentObjectId: "adset_fixture_01" },
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "NO_CHILD_OBJECTS" });

    await expect(
      loadOfflineDirectChildTrend(
        ACCOUNT,
        PARENT,
        { dateStart: "2026-08-02", dateStop: "2026-08-03" },
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            error: {
              code: "INCOMPATIBLE_OBJECT_ROLLUP",
              message: "Daily rollup mismatch"
            }
          },
          409
        )
      )
    );
    await expect(
      loadOfflineDirectChildTrend(
        ACCOUNT,
        PARENT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INCOMPATIBLE_OBJECT_ROLLUP" });
  });
});
