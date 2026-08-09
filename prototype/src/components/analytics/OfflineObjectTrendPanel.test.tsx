import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OfflineAdAccount } from "../../data/offlineComparison";
import type { OfflineDataQualityAttestation } from "../../data/offlineDataQuality";
import type { OfflineAdObject } from "../../data/offlineHierarchy";
import { OfflineObjectTrendPanel } from "./OfflineObjectTrendPanel";

const ACCOUNT: OfflineAdAccount = {
  id: "aa_fixture_01",
  externalAccountRef: "fixture-ad-account-01",
  currency: "USD",
  timezoneName: "Etc/UTC",
  sourceKind: "FIXTURE",
  dataThrough: "2026-08-05T00:00:01Z",
  insightRowCount: 3
};

const AD_OBJECT: OfflineAdObject = {
  id: "ad_fixture_01",
  externalObjectRef: "fixture-ad-01",
  objectLevel: "AD",
  parentObjectId: "adset_fixture_01",
  displayName: "虚构短视频素材 Ad",
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
    "ad_fixture_01",
    "ad_fixture_02",
    "adset_fixture_01",
    "campaign_fixture_01"
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

const TREND_RESPONSE = {
  ok: true,
  data: {
    account: ACCOUNT,
    object: AD_OBJECT,
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OfflineObjectTrendPanel", () => {
  it("requires a verified object and exposes fixed default controls", () => {
    render(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={null}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );

    expect(
      screen.getByRole("button", { name: "加载所选对象趋势" })
    ).toBeDisabled();
    expect(screen.getByText(/先读取对象层级并选择/)).toBeInTheDocument();
    expect(screen.getByLabelText("趋势开始日期")).toHaveValue("2026-08-02");
    expect(screen.getByLabelText("趋势结束日期")).toHaveValue("2026-08-04");
    expect(screen.getByRole("combobox", { name: "趋势指标" })).toHaveValue(
      "spendMinorUnits"
    );
    expect(screen.getByText(/只是 fixture 初始视图/)).toBeInTheDocument();
  });

  it("keeps a verified object locked without a covering quality attestation", () => {
    render(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={AD_OBJECT}
        qualityAttestation={null}
      />
    );

    expect(
      screen.getByRole("button", { name: "加载所选对象趋势" })
    ).toBeDisabled();
    expect(screen.getByText(/趋势日期必须位于已核验范围/)).toBeInTheDocument();
  });

  it.each([
    ["CAMPAIGN", "campaign_fixture_01", null, "虚构 Campaign"],
    ["AD_SET", "adset_fixture_01", "campaign_fixture_01", "虚构 Ad Set"],
    ["AD", "ad_fixture_01", "adset_fixture_01", "虚构短视频素材 Ad"]
  ] as const)(
    "binds a %s request to the selected object",
    async (objectLevel, id, parentObjectId, displayName) => {
      const user = userEvent.setup();
      const object: OfflineAdObject = {
        ...AD_OBJECT,
        id,
        externalObjectRef: `fixture-${id}`,
        objectLevel,
        parentObjectId,
        displayName
      };
      const response = {
        ...TREND_RESPONSE,
        data: { ...TREND_RESPONSE.data, object },
        context: {
          ...TREND_RESPONSE.context,
          objectId: id,
          objectLevel,
          parentObjectId
        }
      };
      const fetchMock = vi.fn(async () => jsonResponse(response));
      vi.stubGlobal("fetch", fetchMock);

      render(
        <OfflineObjectTrendPanel
          account={ACCOUNT}
          object={object}
          qualityAttestation={QUALITY_ATTESTATION}
        />
      );
      await user.click(
        screen.getByRole("button", { name: "加载所选对象趋势" })
      );

      expect(await screen.findByText("对象趋势已响应")).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/objects/${id}/trend?`),
        expect.objectContaining({ method: "GET", credentials: "omit" })
      );
    }
  );

  it("renders one accessible chart and exact table and does not refetch on metric changes", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => jsonResponse(TREND_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={AD_OBJECT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "加载所选对象趋势" })
    );
    expect(await screen.findByText("对象趋势已响应")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /虚构短视频素材 Ad.*花费.*2026-08-02/ })
    ).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "对象日级趋势精确值" });
    expect(within(table).getByText("2026-08-02")).toBeInTheDocument();
    expect(within(table).getByText("2026-08-04")).toBeInTheDocument();
    const codexContext = screen.getByRole("textbox", {
      name: "Codex 分析上下文 JSON"
    });
    const serializedBeforeMetricChange = (codexContext as HTMLTextAreaElement).value;
    expect(serializedBeforeMetricChange).toContain("OBJECT_DAILY_TREND");
    expect(serializedBeforeMetricChange).toContain(
      "facebook-ads-offline-analysis-context/v2"
    );
    expect(serializedBeforeMetricChange).not.toContain(
      "fixture-trend-request-01"
    );

    const metricSelect = screen.getByRole("combobox", { name: "趋势指标" });
    const metricLabels = [
      ["impressions", "展示"],
      ["clicks", "点击"],
      ["conversions", "报告转化"],
      ["clickThroughRate", "CTR"],
      ["conversionRate", "CVR"],
      ["costPerClickMinorUnits", "CPC"],
      ["costPerThousandImpressionsMinorUnits", "CPM"],
      ["costPerConversionMinorUnits", "CPA"],
      ["spendMinorUnits", "花费"]
    ];
    for (const [value, label] of metricLabels) {
      await user.selectOptions(metricSelect, value);
      expect(screen.getByRole("heading", { name: `${label}日趋势` })).toBeInTheDocument();
    }
    expect(codexContext).toHaveValue(serializedBeforeMetricChange);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows null as unavailable and does not draw a fabricated point", async () => {
    const user = userEvent.setup();
    const zeroConversionItems = TREND_RESPONSE.data.items.map((item, index) =>
      index === 1
        ? {
            ...item,
            totals: { ...item.totals, conversions: 0 },
            derived: {
              ...item.derived,
              conversionRate: 0,
              costPerConversionMinorUnits: null
            }
          }
        : item
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ...TREND_RESPONSE,
          data: { ...TREND_RESPONSE.data, items: zeroConversionItems }
        })
      )
    );
    render(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={AD_OBJECT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    await user.click(
      screen.getByRole("button", { name: "加载所选对象趋势" })
    );
    await screen.findByText("对象趋势已响应");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "趋势指标" }),
      "costPerConversionMinorUnits"
    );

    const table = screen.getByRole("table", { name: "对象日级趋势精确值" });
    expect(within(table).getByText("不可用")).toBeInTheDocument();
    expect(screen.getAllByTestId("offline-trend-point")).toHaveLength(2);
  });

  it("clears and aborts stale results when object context changes", async () => {
    const user = userEvent.setup();
    let resolveRequest!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, _init?: RequestInit) => pending
    );
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={AD_OBJECT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "加载所选对象趋势" })
    );
    const signal = fetchMock.mock.calls[0]?.[1]?.signal;
    expect(signal?.aborted).toBe(false);

    rerender(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={{ ...AD_OBJECT, id: "ad_fixture_02", externalObjectRef: "fixture-ad-02" }}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    expect(signal?.aborted).toBe(true);
    resolveRequest(jsonResponse(TREND_RESPONSE));
    expect(screen.queryByText("对象趋势已响应")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Codex 分析上下文 JSON" })
    ).not.toBeInTheDocument();
  });

  it("clears a successful trend when the requested dates change", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(TREND_RESPONSE))
    );
    render(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={AD_OBJECT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "加载所选对象趋势" })
    );
    expect(await screen.findByText("对象趋势已响应")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("趋势结束日期"), {
      target: { value: "2026-08-03" }
    });

    expect(screen.queryByText("对象趋势已响应")).not.toBeInTheDocument();
    expect(
      screen.getByText(/日期或对象变化会清除旧趋势/)
    ).toBeInTheDocument();
  });

  it("shows a safe error without static trend fallback", async () => {
    const user = userEvent.setup();
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
    render(
      <OfflineObjectTrendPanel
        account={ACCOUNT}
        object={AD_OBJECT}
        qualityAttestation={QUALITY_ATTESTATION}
      />
    );
    await user.click(
      screen.getByRole("button", { name: "加载所选对象趋势" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INCOMPLETE_PERIOD_COVERAGE"
    );
    expect(screen.queryByText("对象趋势已响应")).not.toBeInTheDocument();
    expect(screen.getByText(/没有使用静态趋势回退/)).toBeInTheDocument();
  });
});
