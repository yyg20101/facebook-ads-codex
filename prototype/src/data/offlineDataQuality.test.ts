import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createOfflineDataQualityAttestation,
  loadOfflineDataQuality,
  offlineAnalysisContextMatchesAttestation,
  offlineDataQualityAttestsRanges,
  type OfflineDataQualityResponse
} from "./offlineDataQuality";
import type { OfflineAdAccount } from "./offlineComparison";
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

const RESPONSE: OfflineDataQualityResponse = {
  ok: true,
  data: {
    account: ACCOUNT,
    requestedRange: DEFAULT_OFFLINE_TREND_REQUEST,
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
      objectCount: 7,
      objectIds: [
        "ad_fixture_01",
        "ad_fixture_02",
        "ad_fixture_03",
        "ad_fixture_04",
        "adset_fixture_01",
        "adset_fixture_02",
        "campaign_fixture_01"
      ]
    },
    checks: [
      {
        code: "PRIMARY_GRAIN_UNIQUE",
        status: "PASS",
        unit: "ROWS",
        checkedUnits: 24,
        failedUnits: 0
      },
      {
        code: "DAILY_COVERAGE_COMPLETE",
        status: "PASS",
        unit: "SUBJECT_DAYS",
        checkedUnits: 24,
        failedUnits: 0
      },
      {
        code: "REPORTING_CONTEXT_CONSISTENT",
        status: "PASS",
        unit: "ROWS",
        checkedUnits: 24,
        failedUnits: 0
      },
      {
        code: "OBJECT_HIERARCHY_COMPLETE",
        status: "PASS",
        unit: "OBJECTS",
        checkedUnits: 7,
        failedUnits: 0
      },
      {
        code: "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP",
        status: "PASS",
        unit: "PARENT_DAYS",
        checkedUnits: 3,
        failedUnits: 0
      },
      {
        code: "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
        status: "PASS",
        unit: "PARENT_DAYS",
        checkedUnits: 3,
        failedUnits: 0
      },
      {
        code: "AD_SET_TO_AD_DAILY_ROLLUP",
        status: "PASS",
        unit: "PARENT_DAYS",
        checkedUnits: 6,
        failedUnits: 0
      }
    ]
  },
  context: {
    requestId: "fixture-quality-request-01",
    workspaceId: "ws_fixture_01",
    adAccountId: ACCOUNT.id,
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
    qualityPolicy: {
      minimumDays: 3,
      maximumDays: 31,
      requiredChecks: [
        "PRIMARY_GRAIN_UNIQUE",
        "DAILY_COVERAGE_COMPLETE",
        "REPORTING_CONTEXT_CONSISTENT",
        "OBJECT_HIERARCHY_COMPLETE",
        "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP",
        "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
        "AD_SET_TO_AD_DAILY_ROLLUP"
      ],
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

describe("offline data quality client", () => {
  it("binds an attestation to account, object, dates, metric context and snapshot", () => {
    const attestation = createOfflineDataQualityAttestation(RESPONSE);
    expect(
      offlineDataQualityAttestsRanges(
        attestation,
        ACCOUNT,
        [{ dateStart: "2026-08-02", dateStop: "2026-08-04" }],
        "ad_fixture_01"
      )
    ).toBe(true);
    expect(
      offlineDataQualityAttestsRanges(
        attestation,
        ACCOUNT,
        [{ dateStart: "2026-08-04", dateStop: "2026-08-05" }]
      )
    ).toBe(false);
    expect(
      offlineDataQualityAttestsRanges(
        attestation,
        ACCOUNT,
        [{ dateStart: "2026-08-02", dateStop: "2026-08-04" }],
        "ad_fixture_missing"
      )
    ).toBe(false);
    expect(
      offlineDataQualityAttestsRanges(
        { ...attestation, dateStart: "not-a-date" },
        ACCOUNT,
        [{ dateStart: "2026-08-02", dateStop: "2026-08-04" }]
      )
    ).toBe(false);

    expect(
      offlineAnalysisContextMatchesAttestation(attestation, RESPONSE.context)
    ).toBe(true);
    expect(
      offlineAnalysisContextMatchesAttestation(attestation, {
        ...RESPONSE.context,
        fetchedAt: "2026-08-05T00:00:02Z"
      })
    ).toBe(false);

    const snapshot = {
      stabilityStatus: RESPONSE.context.stabilityStatus,
      fetchedAt: RESPONSE.context.fetchedAt,
      syncRunIds: RESPONSE.context.syncRunIds
    };
    expect(
      offlineAnalysisContextMatchesAttestation(attestation, {
        workspaceId: RESPONSE.context.workspaceId,
        adAccountId: RESPONSE.context.adAccountId,
        metricContext: RESPONSE.context.metricContext,
        periodContext: { baseline: snapshot, current: snapshot },
        sourceKind: "FIXTURE"
      })
    ).toBe(true);
  });

  it("loads one fixed same-origin route without credentials", async () => {
    const fetchMock = successfulFetch();
    const controller = new AbortController();
    const response = await loadOfflineDataQuality(
      ACCOUNT,
      DEFAULT_OFFLINE_TREND_REQUEST,
      controller.signal
    );

    expect(response.data.checks).toHaveLength(7);
    expect(fetchMock).toHaveBeenCalledWith(
      "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/data-quality?date_start=2026-08-02&date_stop=2026-08-04",
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
        ...RESPONSE,
        context: { ...RESPONSE.context, adAccountId: "aa_fixture_02" }
      }
    ],
    [
      "incomplete row evidence",
      {
        ...RESPONSE,
        data: {
          ...RESPONSE.data,
          dataset: { ...RESPONSE.data.dataset, observedRows: 23 }
        }
      }
    ],
    [
      "unstable object order",
      {
        ...RESPONSE,
        data: {
          ...RESPONSE.data,
          hierarchy: {
            ...RESPONSE.data.hierarchy,
            objectIds: [...RESPONSE.data.hierarchy.objectIds].reverse()
          }
        }
      }
    ],
    [
      "missing required check",
      {
        ...RESPONSE,
        data: { ...RESPONSE.data, checks: RESPONSE.data.checks.slice(0, -1) }
      }
    ],
    [
      "unsafe performance policy",
      {
        ...RESPONSE,
        context: {
          ...RESPONSE.context,
          qualityPolicy: {
            ...RESPONSE.context.qualityPolicy,
            performanceEvaluationApplied: true
          }
        }
      }
    ],
    ["missing trust warning", { ...RESPONSE, warnings: ["FIXTURE_DATA_ONLY"] }]
  ])("rejects %s", async (_caseName, body) => {
    successfulFetch(body);
    await expect(
      loadOfflineDataQuality(
        ACCOUNT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("preserves a stable Worker failure and rejects short dates locally", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "INCOMPATIBLE_OBJECT_ROLLUP",
              message: "Fixture daily metrics do not reconcile",
              retryable: false
            }
          },
          409
        )
      )
    );
    await expect(
      loadOfflineDataQuality(
        ACCOUNT,
        DEFAULT_OFFLINE_TREND_REQUEST,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INCOMPATIBLE_OBJECT_ROLLUP" });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      loadOfflineDataQuality(
        ACCOUNT,
        { dateStart: "2026-08-02", dateStop: "2026-08-03" },
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
