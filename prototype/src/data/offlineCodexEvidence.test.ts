import { describe, expect, it } from "vitest";
import type { OfflineDirectChildBreakdownResponse } from "./offlineBreakdown";
import type { OfflineDirectChildTrendResponse } from "./offlineChildTrend";
import {
  buildOfflineCodexEvidenceBundle,
  serializeOfflineCodexEvidenceBundle,
} from "./offlineCodexEvidence";
import type {
  ComparisonPeriod,
  MetricChange,
  OfflineAdAccount,
  OfflineComparisonResponse,
  PeriodMetricChanges,
} from "./offlineComparison";
import type { OfflineDataQualityAttestation } from "./offlineDataQuality";
import type {
  OfflineAdObject,
  OfflineAdObjectComparisonResponse,
} from "./offlineHierarchy";
import type {
  OfflineDailyTrendItem,
  OfflineObjectTrendResponse,
} from "./offlineTrend";

function metricChange(baseline: number, current: number): MetricChange {
  const absoluteChange = current - baseline;
  return {
    baseline,
    current,
    absoluteChange,
    relativeChange: baseline === 0 ? null : absoluteChange / baseline,
    direction:
      current === baseline
        ? "UNCHANGED"
        : current > baseline
          ? "INCREASED"
          : "DECREASED",
    relativeChangeUnavailableReason: baseline === 0 ? "BASELINE_ZERO" : null,
  };
}

function period(
  date: string,
  spendMinorUnits: number,
  impressions: number,
  clicks: number,
  conversions: number,
): ComparisonPeriod {
  return {
    requestedRange: { dateStart: date, dateStop: date },
    actualRange: { dateStart: date, dateStop: date },
    coverage: { expectedDays: 1, observedDays: 1, complete: true },
    totals: { spendMinorUnits, impressions, clicks, conversions },
    derived: {
      clickThroughRate: clicks / impressions,
      conversionRate: conversions / clicks,
      costPerClickMinorUnits: spendMinorUnits / clicks,
      costPerThousandImpressionsMinorUnits:
        (spendMinorUnits / impressions) * 1_000,
      costPerConversionMinorUnits: spendMinorUnits / conversions,
    },
  };
}

function changes(
  baseline: ComparisonPeriod,
  current: ComparisonPeriod,
): PeriodMetricChanges {
  return {
    totals: {
      spendMinorUnits: metricChange(
        baseline.totals.spendMinorUnits!,
        current.totals.spendMinorUnits!,
      ),
      impressions: metricChange(
        baseline.totals.impressions!,
        current.totals.impressions!,
      ),
      clicks: metricChange(baseline.totals.clicks!, current.totals.clicks!),
      conversions: metricChange(
        baseline.totals.conversions!,
        current.totals.conversions!,
      ),
    },
    derived: {
      clickThroughRate: metricChange(
        baseline.derived.clickThroughRate!,
        current.derived.clickThroughRate!,
      ),
      conversionRate: metricChange(
        baseline.derived.conversionRate!,
        current.derived.conversionRate!,
      ),
      costPerClickMinorUnits: metricChange(
        baseline.derived.costPerClickMinorUnits!,
        current.derived.costPerClickMinorUnits!,
      ),
      costPerThousandImpressionsMinorUnits: metricChange(
        baseline.derived.costPerThousandImpressionsMinorUnits!,
        current.derived.costPerThousandImpressionsMinorUnits!,
      ),
      costPerConversionMinorUnits: metricChange(
        baseline.derived.costPerConversionMinorUnits!,
        current.derived.costPerConversionMinorUnits!,
      ),
    },
  };
}

function dailyItem(
  date: string,
  spendMinorUnits: number,
  impressions: number,
  clicks: number,
  conversions: number,
): OfflineDailyTrendItem {
  const roundSix = (value: number) =>
    Math.round(value * 1_000_000) / 1_000_000;
  return {
    date,
    totals: { spendMinorUnits, impressions, clicks, conversions },
    derived: {
      clickThroughRate: roundSix(clicks / impressions),
      conversionRate: roundSix(conversions / clicks),
      costPerClickMinorUnits: roundSix(spendMinorUnits / clicks),
      costPerThousandImpressionsMinorUnits: roundSix(
        (spendMinorUnits / impressions) * 1_000,
      ),
      costPerConversionMinorUnits: roundSix(
        spendMinorUnits / conversions,
      ),
    },
  };
}

const ACCOUNT: OfflineAdAccount = {
  id: "aa_fixture_01",
  externalAccountRef: "fixture-ad-account-01",
  currency: "USD",
  timezoneName: "Etc/UTC",
  sourceKind: "FIXTURE",
  dataThrough: "2026-08-05T00:00:01Z",
  insightRowCount: 10,
};

const BASELINE = period("2026-08-02", 10_000, 8_000, 160, 4);
const CURRENT = period("2026-08-04", 12_000, 10_000, 250, 6);
const CHANGES = changes(BASELINE, CURRENT);
const METRIC_CONTEXT: OfflineDataQualityAttestation["metricContext"] = {
  currency: "USD",
  timezoneName: "Etc/UTC",
  clickMetricKind: "ALL_CLICKS",
  conversionEventRef: "fixture-purchase",
  attributionSpecHash: "fixture-attribution-context",
  apiVersion: "v25.0",
};
const SNAPSHOT = {
  stabilityStatus: "STABLE" as const,
  fetchedAt: "2026-08-05T00:00:01Z",
  syncRunIds: ["sync_fixture_01"],
};

const ACCOUNT_SOURCE = {
  ok: true,
  data: {
    account: ACCOUNT,
    baseline: BASELINE,
    current: CURRENT,
    changes: CHANGES,
    diagnostics: [
      {
        code: "CONVERSION_VOLUME_UP_COST_DOWN",
        severity: "INFO",
        findingConfidence: "CONFIRMED_PATTERN",
        causalClaim: false,
        summary: "Reported conversions increased while reported cost decreased.",
        evidenceMetrics: [
          "changes.totals.conversions",
          "changes.derived.costPerConversionMinorUnits",
        ],
        nextChecks: ["VERIFY_PATTERN_PERSISTS"],
      },
    ],
  },
  context: {
    requestId: "request-that-must-not-be-exported",
    workspaceId: "ws_fixture_01",
    adAccountId: ACCOUNT.id,
    metricContext: METRIC_CONTEXT,
    periodContext: { baseline: SNAPSHOT, current: SNAPSHOT },
    comparisonPolicy: {
      periodLengthDays: 1,
      periodsOverlap: false,
      thresholdsApplied: false,
      causalClaims: false,
    },
    sourceKind: "FIXTURE",
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
} satisfies OfflineComparisonResponse;

const CAMPAIGN: OfflineAdObject = {
  id: "campaign_fixture_01",
  externalObjectRef: "fixture-campaign-01",
  objectLevel: "CAMPAIGN",
  parentObjectId: null,
  displayName: "虚构 Campaign",
  sourceKind: "FIXTURE",
  syncRunId: "sync_fixture_01",
  fetchedAt: SNAPSHOT.fetchedAt,
};

const AD_SET_01: OfflineAdObject = {
  id: "adset_fixture_01",
  externalObjectRef: "fixture-ad-set-01",
  objectLevel: "AD_SET",
  parentObjectId: CAMPAIGN.id,
  displayName: "虚构 Ad Set 01",
  sourceKind: "FIXTURE",
  syncRunId: "sync_fixture_01",
  fetchedAt: SNAPSHOT.fetchedAt,
};

const AD_SET_02: OfflineAdObject = {
  ...AD_SET_01,
  id: "adset_fixture_02",
  externalObjectRef: "fixture-ad-set-02",
  displayName: "虚构 Ad Set 02",
};

const ATTESTATION: OfflineDataQualityAttestation = {
  workspaceId: "ws_fixture_01",
  accountId: ACCOUNT.id,
  dateStart: "2026-08-01",
  dateStop: "2026-08-05",
  objectIds: [AD_SET_01.id, AD_SET_02.id, CAMPAIGN.id],
  metricContext: METRIC_CONTEXT,
  stabilityStatus: "STABLE",
  fetchedAt: SNAPSHOT.fetchedAt,
  syncRunIds: [...SNAPSHOT.syncRunIds],
  requestId: "quality-request-that-must-not-be-exported",
  sourceKind: "FIXTURE",
};

const OBJECT_SOURCE = {
  ...ACCOUNT_SOURCE,
  data: { ...ACCOUNT_SOURCE.data, object: CAMPAIGN },
  context: {
    ...ACCOUNT_SOURCE.context,
    objectId: CAMPAIGN.id,
    objectLevel: CAMPAIGN.objectLevel,
    parentObjectId: CAMPAIGN.parentObjectId,
  },
} satisfies OfflineAdObjectComparisonResponse;

const CHILD_01_BASELINE = period("2026-08-02", 6_000, 4_800, 100, 3);
const CHILD_01_CURRENT = period("2026-08-04", 7_000, 5_600, 150, 4);
const CHILD_02_BASELINE = period("2026-08-02", 4_000, 3_200, 60, 1);
const CHILD_02_CURRENT = period("2026-08-04", 5_000, 4_400, 100, 2);

const BREAKDOWN_SOURCE = {
  ok: true,
  data: {
    account: ACCOUNT,
    parent: CAMPAIGN,
    baseline: BASELINE,
    current: CURRENT,
    changes: CHANGES,
    items: [
      {
        object: AD_SET_01,
        baseline: CHILD_01_BASELINE,
        current: CHILD_01_CURRENT,
        changes: changes(CHILD_01_BASELINE, CHILD_01_CURRENT),
      },
      {
        object: AD_SET_02,
        baseline: CHILD_02_BASELINE,
        current: CHILD_02_CURRENT,
        changes: changes(CHILD_02_BASELINE, CHILD_02_CURRENT),
      },
    ],
    reconciliation: {
      additiveMetricKeys: [
        "spendMinorUnits",
        "impressions",
        "clicks",
        "conversions",
      ],
      baselineMatchesParent: true,
      currentMatchesParent: true,
    },
  },
  context: {
    ...ACCOUNT_SOURCE.context,
    parentObjectId: CAMPAIGN.id,
    parentObjectLevel: "CAMPAIGN",
    childObjectLevel: "AD_SET",
    childCount: 2,
    comparisonPolicy: {
      ...ACCOUNT_SOURCE.context.comparisonPolicy,
      rankingApplied: false,
    },
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
} satisfies OfflineDirectChildBreakdownResponse;

const CHILD_01_DAILY = [
  dailyItem("2026-08-02", 6_000, 4_800, 100, 3),
  dailyItem("2026-08-03", 6_500, 5_200, 120, 3),
  dailyItem("2026-08-04", 7_000, 5_600, 150, 4),
];
const CHILD_02_DAILY = [
  dailyItem("2026-08-02", 4_000, 3_200, 60, 1),
  dailyItem("2026-08-03", 4_500, 3_800, 80, 2),
  dailyItem("2026-08-04", 5_000, 4_400, 100, 2),
];
const PARENT_DAILY = CHILD_01_DAILY.map((item, index) => {
  const sibling = CHILD_02_DAILY[index]!;
  return dailyItem(
    item.date,
    item.totals.spendMinorUnits! + sibling.totals.spendMinorUnits!,
    item.totals.impressions! + sibling.totals.impressions!,
    item.totals.clicks! + sibling.totals.clicks!,
    item.totals.conversions! + sibling.totals.conversions!,
  );
});

const OBJECT_TREND_SOURCE = {
  ok: true,
  data: {
    account: ACCOUNT,
    object: CAMPAIGN,
    requestedRange: { dateStart: "2026-08-02", dateStop: "2026-08-04" },
    items: PARENT_DAILY,
  },
  context: {
    requestId: "trend-request-that-must-not-be-exported",
    workspaceId: "ws_fixture_01",
    adAccountId: ACCOUNT.id,
    objectId: CAMPAIGN.id,
    objectLevel: CAMPAIGN.objectLevel,
    parentObjectId: CAMPAIGN.parentObjectId,
    metricContext: METRIC_CONTEXT,
    stabilityStatus: SNAPSHOT.stabilityStatus,
    fetchedAt: SNAPSHOT.fetchedAt,
    syncRunIds: [...SNAPSHOT.syncRunIds],
    pointCount: 3,
    trendPolicy: {
      minimumDays: 3,
      maximumDays: 31,
      metricSelection: "SINGLE",
      thresholdsApplied: false,
      causalClaims: false,
      trendInterpretationApplied: false,
    },
    sourceKind: "FIXTURE",
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
} satisfies OfflineObjectTrendResponse;

const CHILD_TREND_SOURCE = {
  ok: true,
  data: {
    account: ACCOUNT,
    parent: CAMPAIGN,
    requestedRange: { dateStart: "2026-08-02", dateStop: "2026-08-04" },
    parentItems: PARENT_DAILY,
    items: [
      { object: AD_SET_01, items: CHILD_01_DAILY },
      { object: AD_SET_02, items: CHILD_02_DAILY },
    ],
    reconciliation: {
      additiveMetricKeys: [
        "spendMinorUnits",
        "impressions",
        "clicks",
        "conversions",
      ],
      dailyMatchesParent: true,
    },
  },
  context: {
    requestId: "child-trend-request-that-must-not-be-exported",
    workspaceId: "ws_fixture_01",
    adAccountId: ACCOUNT.id,
    parentObjectId: CAMPAIGN.id,
    parentObjectLevel: "CAMPAIGN",
    childObjectLevel: "AD_SET",
    childCount: 2,
    pointCount: 3,
    metricContext: METRIC_CONTEXT,
    stabilityStatus: SNAPSHOT.stabilityStatus,
    fetchedAt: SNAPSHOT.fetchedAt,
    syncRunIds: [...SNAPSHOT.syncRunIds],
    trendPolicy: {
      minimumDays: 3,
      maximumDays: 31,
      metricSelection: "SINGLE",
      seriesOrder: "STABLE_OBJECT_ID",
      thresholdsApplied: false,
      causalClaims: false,
      rankingApplied: false,
      trendInterpretationApplied: false,
    },
    sourceKind: "FIXTURE",
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
} satisfies OfflineDirectChildTrendResponse;

describe("offline Codex evidence bundle", () => {
  it("builds a deterministic account comparison context without request IDs", () => {
    const first = buildOfflineCodexEvidenceBundle(ATTESTATION, ACCOUNT_SOURCE);
    const sourceWithDifferentRequestIds = {
      ...ACCOUNT_SOURCE,
      context: { ...ACCOUNT_SOURCE.context, requestId: "another-request" },
    } satisfies OfflineComparisonResponse;
    const attestationWithDifferentRequestId = {
      ...ATTESTATION,
      requestId: "another-quality-request",
    } satisfies OfflineDataQualityAttestation;
    const second = buildOfflineCodexEvidenceBundle(
      attestationWithDifferentRequestId,
      sourceWithDifferentRequestIds,
    );

    expect(serializeOfflineCodexEvidenceBundle(first)).toBe(
      serializeOfflineCodexEvidenceBundle(second),
    );
    expect(first.analysis_kind).toBe("ACCOUNT_COMPARISON");
    expect(first.fact_evidence.claim_type).toBe("FACT");
    expect(first.unknowns.every((item) => item.claim_type === "UNKNOWN")).toBe(
      true,
    );
    expect(first.guardrails).toMatchObject({
      recommendations_generated: false,
      external_write: false,
      persisted: false,
    });
    expect(serializeOfflineCodexEvidenceBundle(first)).not.toContain(
      "request-that-must-not-be-exported",
    );
  });

  it("binds an object comparison to an attested fixture object", () => {
    const bundle = buildOfflineCodexEvidenceBundle(ATTESTATION, OBJECT_SOURCE);

    expect(bundle.analysis_kind).toBe("OBJECT_COMPARISON");
    expect(bundle.scope_and_freshness.subject).toEqual({
      kind: "OBJECT",
      object: {
        display_label: "虚构 Campaign",
        level: "CAMPAIGN",
        object_ref: "fixture-campaign-01",
      },
    });

    expect(() =>
      buildOfflineCodexEvidenceBundle(
        { ...ATTESTATION, objectIds: [AD_SET_01.id, AD_SET_02.id] },
        OBJECT_SOURCE,
      ),
    ).toThrow(/日期、对象或快照覆盖/);
  });

  it("builds a deterministic object daily trend context with all fixed metrics", () => {
    const first = buildOfflineCodexEvidenceBundle(
      ATTESTATION,
      OBJECT_TREND_SOURCE,
    );
    const sourceWithDifferentRequest = {
      ...OBJECT_TREND_SOURCE,
      context: {
        ...OBJECT_TREND_SOURCE.context,
        requestId: "another-object-trend-request",
      },
    } satisfies OfflineObjectTrendResponse;
    const second = buildOfflineCodexEvidenceBundle(
      ATTESTATION,
      sourceWithDifferentRequest,
    );

    expect(first.schema_version).toBe(
      "facebook-ads-offline-analysis-context/v2",
    );
    expect(first.analysis_kind).toBe("OBJECT_DAILY_TREND");
    expect(first.fact_evidence).toMatchObject({
      claim_type: "FACT",
      kind: "DAILY_TREND",
      point_count: 3,
      requested_range: {
        dateStart: "2026-08-02",
        dateStop: "2026-08-04",
      },
    });
    if (first.fact_evidence.kind !== "DAILY_TREND") {
      throw new Error("expected daily trend evidence");
    }
    expect(first.fact_evidence.metric_keys).toHaveLength(9);
    expect(first.fact_evidence.daily_items).toHaveLength(3);
    expect(first.observed_patterns).toEqual([]);
    expect(serializeOfflineCodexEvidenceBundle(first)).toBe(
      serializeOfflineCodexEvidenceBundle(second),
    );
    expect(serializeOfflineCodexEvidenceBundle(first)).not.toContain(
      "trend-request-that-must-not-be-exported",
    );
  });

  it("keeps direct-child daily trend inputs stable and reconciled", () => {
    const bundle = buildOfflineCodexEvidenceBundle(
      ATTESTATION,
      CHILD_TREND_SOURCE,
    );

    expect(bundle.analysis_kind).toBe("DIRECT_CHILD_DAILY_TREND");
    expect(bundle.driver_inputs).toMatchObject({
      kind: "DIRECT_CHILDREN_DAILY",
      ordering: "STABLE_FIXTURE_OBJECT_ID_ASC",
      ranking_applied: false,
      reconciliation: {
        daily_matches_parent: true,
      },
    });
    expect(
      bundle.driver_inputs.items.map((item) => item.object.object_ref),
    ).toEqual(["fixture-ad-set-01", "fixture-ad-set-02"]);

    const reversed = {
      ...CHILD_TREND_SOURCE,
      data: {
        ...CHILD_TREND_SOURCE.data,
        items: [...CHILD_TREND_SOURCE.data.items].reverse(),
      },
    } satisfies OfflineDirectChildTrendResponse;
    expect(() =>
      buildOfflineCodexEvidenceBundle(ATTESTATION, reversed),
    ).toThrow(/稳定顺序/);

    const mismatchedRollup = {
      ...CHILD_TREND_SOURCE,
      data: {
        ...CHILD_TREND_SOURCE.data,
        items: CHILD_TREND_SOURCE.data.items.map((entry, index) =>
          index === 0
            ? {
                ...entry,
                items: entry.items.map((item, dayIndex) =>
                  dayIndex === 0
                    ? dailyItem(
                        item.date,
                        item.totals.spendMinorUnits! + 1,
                        item.totals.impressions!,
                        item.totals.clicks!,
                        item.totals.conversions!,
                      )
                    : item,
                ),
              }
            : entry,
        ),
      },
    } satisfies OfflineDirectChildTrendResponse;
    expect(() =>
      buildOfflineCodexEvidenceBundle(ATTESTATION, mismatchedRollup),
    ).toThrow(/逐日汇总对账/);
  });

  it("rejects a trend snapshot outside the current preflight", () => {
    const mismatched = {
      ...OBJECT_TREND_SOURCE,
      context: {
        ...OBJECT_TREND_SOURCE.context,
        fetchedAt: "2026-08-05T00:00:02Z",
      },
    } satisfies OfflineObjectTrendResponse;

    expect(() =>
      buildOfflineCodexEvidenceBundle(ATTESTATION, mismatched),
    ).toThrow(/日期、对象或快照覆盖/);
  });

  it("keeps direct children in stable non-ranked order with reconciliation", () => {
    const bundle = buildOfflineCodexEvidenceBundle(
      ATTESTATION,
      BREAKDOWN_SOURCE,
    );

    expect(bundle.analysis_kind).toBe("DIRECT_CHILD_BREAKDOWN");
    expect(bundle.driver_inputs).toMatchObject({
      kind: "DIRECT_CHILDREN",
      ordering: "STABLE_FIXTURE_OBJECT_ID_ASC",
      ranking_applied: false,
      reconciliation: {
        baseline_matches_parent: true,
        current_matches_parent: true,
      },
    });
    expect(bundle.driver_inputs.items.map((item) => item.object.object_ref)).toEqual([
      "fixture-ad-set-01",
      "fixture-ad-set-02",
    ]);

    const reversed = {
      ...BREAKDOWN_SOURCE,
      data: {
        ...BREAKDOWN_SOURCE.data,
        items: [...BREAKDOWN_SOURCE.data.items].reverse(),
      },
    } satisfies OfflineDirectChildBreakdownResponse;
    expect(() =>
      buildOfflineCodexEvidenceBundle(ATTESTATION, reversed),
    ).toThrow(/稳定顺序/);

    const mismatchedRollup = {
      ...BREAKDOWN_SOURCE,
      data: {
        ...BREAKDOWN_SOURCE.data,
        items: BREAKDOWN_SOURCE.data.items.map((item, index) =>
          index === 0
            ? {
                ...item,
                current: {
                  ...item.current,
                  totals: {
                    ...item.current.totals,
                    spendMinorUnits: item.current.totals.spendMinorUnits! + 1,
                  },
                },
              }
            : item,
        ),
      },
    } satisfies OfflineDirectChildBreakdownResponse;
    expect(() =>
      buildOfflineCodexEvidenceBundle(ATTESTATION, mismatchedRollup),
    ).toThrow(/汇总对账/);
  });

  it("rejects a comparison snapshot that differs from the quality preflight", () => {
    const mismatched = {
      ...ACCOUNT_SOURCE,
      context: {
        ...ACCOUNT_SOURCE.context,
        periodContext: {
          baseline: SNAPSHOT,
          current: { ...SNAPSHOT, fetchedAt: "2026-08-05T00:00:02Z" },
        },
      },
    } satisfies OfflineComparisonResponse;

    expect(() =>
      buildOfflineCodexEvidenceBundle(ATTESTATION, mismatched),
    ).toThrow(/日期、对象或快照覆盖/);
  });
});
