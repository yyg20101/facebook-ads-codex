import { afterEach, describe, expect, it, vi } from "vitest";

import type { OfflineAdAccount } from "./offlineComparison";
import type { OfflineAdObject } from "./offlineHierarchy";
import {
  DEFAULT_OFFLINE_TREND_REQUEST,
  loadOfflineAdObjectTrend
} from "./offlineTrend";

const ACCOUNT: OfflineAdAccount = {
  id: "aa_fixture_01",
  externalAccountRef: "fixture-ad-account-01",
  currency: "USD",
  timezoneName: "Etc/UTC",
  sourceKind: "FIXTURE",
  dataThrough: "2026-08-05T00:00:01Z",
  insightRowCount: 3
};

const OBJECT: OfflineAdObject = {
  id: "ad_fixture_01",
  externalObjectRef: "fixture-ad-01",
  objectLevel: "AD",
  parentObjectId: "adset_fixture_01",
  displayName: "虚构短视频素材 Ad",
  sourceKind: "FIXTURE",
  syncRunId: "sync_fixture_01",
  fetchedAt: "2026-08-05T00:00:01Z"
};

const TREND_RESPONSE = {
  ok: true,
  data: {
    account: ACCOUNT,
    object: OBJECT,
    requestedRange: {
      dateStart: "2026-08-02",
      dateStop: "2026-08-04"
    },
    items: [
      {
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
      },
      {
        date: "2026-08-03",
        totals: {
          spendMinorUnits: 3800,
          impressions: 3000,
          clicks: 72,
          conversions: 2
        },
        derived: {
          clickThroughRate: 0.024,
          conversionRate: 0.027778,
          costPerClickMinorUnits: 52.777778,
          costPerThousandImpressionsMinorUnits: 1266.666667,
          costPerConversionMinorUnits: 1900
        }
      },
      {
        date: "2026-08-04",
        totals: {
          spendMinorUnits: 4200,
          impressions: 3300,
          clicks: 95,
          conversions: 3
        },
        derived: {
          clickThroughRate: 0.028788,
          conversionRate: 0.031579,
          costPerClickMinorUnits: 44.210526,
          costPerThousandImpressionsMinorUnits: 1272.727273,
          costPerConversionMinorUnits: 1400
        }
      }
    ]
  },
  context: {
    requestId: "fixture-trend-request-01",
    workspaceId: "ws_fixture_01",
    adAccountId: "aa_fixture_01",
    objectId: "ad_fixture_01",
    objectLevel: "AD",
    parentObjectId: "adset_fixture_01",
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
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function successfulFetch(body: unknown = TREND_RESPONSE) {
  const fetchMock = vi.fn(async () => jsonResponse(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("offline object trend client", () => {
  it("loads one fixed relative route with no credentials", async () => {
    const fetchMock = successfulFetch();
    const controller = new AbortController();
    const response = await loadOfflineAdObjectTrend(
      ACCOUNT,
      OBJECT,
      DEFAULT_OFFLINE_TREND_REQUEST,
      controller.signal
    );

    expect(response.data.items).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects/ad_fixture_01/trend?date_start=2026-08-02&date_stop=2026-08-04",
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
      "different account",
      {
        ...TREND_RESPONSE,
        data: {
          ...TREND_RESPONSE.data,
          account: { ...ACCOUNT, id: "aa_fixture_02" }
        }
      }
    ],
    [
      "different object",
      {
        ...TREND_RESPONSE,
        context: { ...TREND_RESPONSE.context, objectId: "ad_fixture_02" }
      }
    ],
    [
      "different requested range",
      {
        ...TREND_RESPONSE,
        data: {
          ...TREND_RESPONSE.data,
          requestedRange: {
            dateStart: "2026-08-01",
            dateStop: "2026-08-04"
          }
        }
      }
    ],
    [
      "non-contiguous dates",
      {
        ...TREND_RESPONSE,
        data: {
          ...TREND_RESPONSE.data,
          items: TREND_RESPONSE.data.items.map((item, index) =>
            index === 1 ? { ...item, date: "2026-08-04" } : item
          )
        }
      }
    ],
    [
      "wrong point count",
      {
        ...TREND_RESPONSE,
        context: { ...TREND_RESPONSE.context, pointCount: 2 }
      }
    ],
    [
      "wrong metric context",
      {
        ...TREND_RESPONSE,
        context: {
          ...TREND_RESPONSE.context,
          metricContext: {
            ...TREND_RESPONSE.context.metricContext,
            currency: "EUR"
          }
        }
      }
    ],
    [
      "missing trust warning",
      { ...TREND_RESPONSE, warnings: ["FIXTURE_DATA_ONLY"] }
    ],
    [
      "unsafe trend policy",
      {
        ...TREND_RESPONSE,
        context: {
          ...TREND_RESPONSE.context,
          trendPolicy: {
            ...TREND_RESPONSE.context.trendPolicy,
            trendInterpretationApplied: true
          }
        }
      }
    ]
  ])("rejects a response with %s", async (_caseName, body) => {
    successfulFetch(body);
    await expect(
      loadOfflineAdObjectTrend(
        ACCOUNT,
        OBJECT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects extra metric keys and a derived formula mismatch", async () => {
    const firstItem = TREND_RESPONSE.data.items[0];
    successfulFetch({
      ...TREND_RESPONSE,
      data: {
        ...TREND_RESPONSE.data,
        items: [
          {
            ...firstItem,
            totals: { ...firstItem.totals, reach: 2500 }
          },
          ...TREND_RESPONSE.data.items.slice(1)
        ]
      }
    });
    await expect(
      loadOfflineAdObjectTrend(
        ACCOUNT,
        OBJECT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });

    vi.unstubAllGlobals();
    successfulFetch({
      ...TREND_RESPONSE,
      data: {
        ...TREND_RESPONSE.data,
        items: TREND_RESPONSE.data.items.map((item, index) =>
          index === 0
            ? {
                ...item,
                derived: { ...item.derived, clickThroughRate: 0.5 }
              }
            : item
        )
      }
    });
    await expect(
      loadOfflineAdObjectTrend(
        ACCOUNT,
        OBJECT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("requires null derived values for zero denominators", async () => {
    const zeroItem = {
      date: "2026-08-02",
      totals: {
        spendMinorUnits: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0
      },
      derived: {
        clickThroughRate: null,
        conversionRate: null,
        costPerClickMinorUnits: null,
        costPerThousandImpressionsMinorUnits: null,
        costPerConversionMinorUnits: null
      }
    };
    successfulFetch({
      ...TREND_RESPONSE,
      data: {
        ...TREND_RESPONSE.data,
        items: [
          { ...zeroItem, derived: { ...zeroItem.derived, clickThroughRate: 0 } },
          { ...zeroItem, date: "2026-08-03" },
          { ...zeroItem, date: "2026-08-04" }
        ]
      }
    });

    await expect(
      loadOfflineAdObjectTrend(
        ACCOUNT,
        OBJECT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("maps a safe HTTP error and rejects non-JSON success bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "INCOMPLETE_PERIOD_COVERAGE",
              message: "Fixture trend requires complete daily coverage"
            }
          },
          409
        )
      )
    );
    await expect(
      loadOfflineAdObjectTrend(
        ACCOUNT,
        OBJECT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INCOMPLETE_PERIOD_COVERAGE" });

    vi.unstubAllGlobals();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not-json", { status: 200 }))
    );
    await expect(
      loadOfflineAdObjectTrend(
        ACCOUNT,
        OBJECT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects invalid input dates before fetching", async () => {
    const fetchMock = successfulFetch();
    await expect(
      loadOfflineAdObjectTrend(
        ACCOUNT,
        OBJECT,
        { dateStart: "2026-08-02", dateStop: "2026-08-03" },
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
