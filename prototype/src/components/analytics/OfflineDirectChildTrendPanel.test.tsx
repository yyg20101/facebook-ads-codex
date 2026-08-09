import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OfflineDirectChildTrendResponse } from "../../data/offlineChildTrend";
import type { OfflineAdAccount } from "../../data/offlineComparison";
import type { OfflineDataQualityAttestation } from "../../data/offlineDataQuality";
import type { OfflineAdObject } from "../../data/offlineHierarchy";
import { OfflineDirectChildTrendPanel } from "./OfflineDirectChildTrendPanel";

const loadMock = vi.hoisted(() => vi.fn());
vi.mock("../../data/offlineChildTrend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../data/offlineChildTrend")>();
  return { ...actual, loadOfflineDirectChildTrend: loadMock };
});

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

const QUALITY_ATTESTATION: OfflineDataQualityAttestation = {
  workspaceId: "ws_fixture_01",
  accountId: ACCOUNT.id,
  dateStart: "2026-08-02",
  dateStop: "2026-08-04",
  objectIds: [
    "adset_fixture_01",
    "adset_fixture_02",
    "campaign_fixture_01",
    "campaign_fixture_02"
  ],
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
  requestId: "fixture-quality-request-01",
  sourceKind: "FIXTURE"
};

const CHILDREN: OfflineAdObject[] = [
  {
    ...PARENT,
    id: "adset_fixture_01",
    externalObjectRef: "fixture-ad-set-01",
    objectLevel: "AD_SET",
    parentObjectId: PARENT.id,
    displayName: "虚构宽泛受众 Ad Set"
  },
  {
    ...PARENT,
    id: "adset_fixture_02",
    externalObjectRef: "fixture-ad-set-02",
    objectLevel: "AD_SET",
    parentObjectId: PARENT.id,
    displayName: "虚构再营销 Ad Set"
  }
];

function item(date: string, spend: number, impressions: number, clicks: number, conversions: number) {
  return {
    date,
    totals: { spendMinorUnits: spend, impressions, clicks, conversions },
    derived: {
      clickThroughRate: Math.round((clicks / impressions) * 1_000_000) / 1_000_000,
      conversionRate: Math.round((conversions / clicks) * 1_000_000) / 1_000_000,
      costPerClickMinorUnits: Math.round((spend / clicks) * 1_000_000) / 1_000_000,
      costPerThousandImpressionsMinorUnits:
        Math.round(((spend / impressions) * 1000) * 1_000_000) / 1_000_000,
      costPerConversionMinorUnits:
        Math.round((spend / conversions) * 1_000_000) / 1_000_000
    }
  };
}

const FIRST_ITEMS = [
  item("2026-08-02", 6000, 4800, 100, 3),
  item("2026-08-03", 6500, 5200, 120, 3),
  item("2026-08-04", 7000, 5600, 150, 5)
];
const SECOND_ITEMS = [
  item("2026-08-02", 4000, 3200, 60, 1),
  item("2026-08-03", 4500, 3800, 78, 2),
  item("2026-08-04", 5345, 4400, 100, 2)
];
const PARENT_ITEMS = FIRST_ITEMS.map((point, index) => {
  const second = SECOND_ITEMS[index]!;
  return item(
    point.date,
    point.totals.spendMinorUnits + second.totals.spendMinorUnits,
    point.totals.impressions + second.totals.impressions,
    point.totals.clicks + second.totals.clicks,
    point.totals.conversions + second.totals.conversions
  );
});

const RESPONSE: OfflineDirectChildTrendResponse = {
  ok: true,
  data: {
    account: ACCOUNT,
    parent: PARENT,
    requestedRange: { dateStart: "2026-08-02", dateStop: "2026-08-04" },
    parentItems: PARENT_ITEMS,
    items: [
      { object: CHILDREN[0]!, items: FIRST_ITEMS },
      { object: CHILDREN[1]!, items: SECOND_ITEMS }
    ],
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
    requestId: "request-child-trend-01",
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

afterEach(() => {
  loadMock.mockReset();
});

describe("OfflineDirectChildTrendPanel", () => {
  it("keeps the action disabled until a supported parent is selected", () => {
    const { rerender } = render(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={null}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    expect(screen.getByRole("button", { name: "加载直接子对象趋势" })).toBeDisabled();
    expect(screen.getByText(/请先选择 Campaign 或 Ad Set/)).toBeInTheDocument();

    rerender(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={{ ...PARENT, objectLevel: "AD", parentObjectId: "adset_fixture_01" }}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    expect(screen.getByRole("button", { name: "加载直接子对象趋势" })).toBeDisabled();
    expect(screen.getByText(/Ad 是叶子对象/)).toBeInTheDocument();
  });

  it("keeps a supported parent locked without a covering quality attestation", () => {
    render(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={PARENT}
        qualityAttestation={null}
      />
    );

    expect(
      screen.getByRole("button", { name: "加载直接子对象趋势" })
    ).toBeDisabled();
    expect(screen.getByText(/趋势日期必须位于已核验范围/)).toBeInTheDocument();
  });

  it("renders stable parent and child series with exact values", async () => {
    loadMock.mockResolvedValue(RESPONSE);
    const user = userEvent.setup();
    render(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={PARENT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );

    await user.click(screen.getByRole("button", { name: "加载直接子对象趋势" }));
    expect(await screen.findByText("逐日父子对账通过")).toBeInTheDocument();
    expect(screen.getAllByText("虚构宽泛受众 Ad Set")).not.toHaveLength(0);
    expect(screen.getAllByText("虚构再营销 Ad Set")).not.toHaveLength(0);
    expect(screen.getByRole("img", { name: /直接子对象花费日趋势/ })).toBeInTheDocument();
    expect(screen.getAllByText(/无排名/)).not.toHaveLength(0);
    expect(screen.getAllByText(/不解释趋势/)).not.toHaveLength(0);
    expect(screen.getByRole("table", { name: "父子对象日级趋势精确值" })).toBeInTheDocument();
    const codexContext = screen.getByRole("textbox", {
      name: "Codex 分析上下文 JSON"
    }) as HTMLTextAreaElement;
    expect(codexContext.value).toContain("DIRECT_CHILD_DAILY_TREND");
    expect(codexContext.value).toContain("DIRECT_CHILDREN_DAILY");
    expect(codexContext.value).toContain('"daily_matches_parent": true');
    expect(codexContext.value.indexOf("fixture-ad-set-01")).toBeLessThan(
      codexContext.value.indexOf("fixture-ad-set-02")
    );
    expect(codexContext.value).not.toContain("request-child-trend-01");
  });

  it("does not refetch when switching the displayed metric", async () => {
    loadMock.mockResolvedValue(RESPONSE);
    const user = userEvent.setup();
    render(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={PARENT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    await user.click(screen.getByRole("button", { name: "加载直接子对象趋势" }));
    await screen.findByText("逐日父子对账通过");

    await user.selectOptions(screen.getByLabelText("直接子对象趋势指标"), "clicks");
    expect(screen.getByRole("img", { name: /直接子对象点击日趋势/ })).toBeInTheDocument();
    expect(loadMock).toHaveBeenCalledTimes(1);
  });

  it("clears stale results when the parent or dates change", async () => {
    loadMock.mockResolvedValue(RESPONSE);
    const user = userEvent.setup();
    const { rerender } = render(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={PARENT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    await user.click(screen.getByRole("button", { name: "加载直接子对象趋势" }));
    await screen.findByText("逐日父子对账通过");

    rerender(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={{ ...PARENT, id: "campaign_fixture_02", displayName: "另一个 Campaign" }}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    await waitFor(() => {
      expect(screen.queryByText("逐日父子对账通过")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: "Codex 分析上下文 JSON" })
      ).not.toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText("直接子对象趋势开始日期"));
    await user.type(screen.getByLabelText("直接子对象趋势开始日期"), "2026-08-01");
    expect(screen.queryByText("逐日父子对账通过")).not.toBeInTheDocument();
  });

  it("shows a safe local error without fallback data", async () => {
    loadMock.mockRejectedValue(new Error("connection failed"));
    const user = userEvent.setup();
    render(
      <OfflineDirectChildTrendPanel
        account={ACCOUNT}
        parent={PARENT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    await user.click(screen.getByRole("button", { name: "加载直接子对象趋势" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "LOCAL_CONNECTION_FAILED"
    );
    expect(screen.queryByText("逐日父子对账通过")).not.toBeInTheDocument();
  });
});
