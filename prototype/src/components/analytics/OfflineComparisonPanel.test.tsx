import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ComparisonPeriod,
  DerivedMetrics,
  MetricChange,
  MetricTotals,
  OfflineAccountListResponse,
  OfflineAdAccount,
  OfflineComparisonResponse,
  PeriodMetricChanges,
} from "../../data/offlineComparison";
import type { OfflineDirectChildBreakdownResponse } from "../../data/offlineBreakdown";
import type {
  OfflineAdObjectComparisonResponse,
  OfflineAdObjectHierarchyResponse,
} from "../../data/offlineHierarchy";
import type { OfflineDataQualityResponse } from "../../data/offlineDataQuality";
import type { OfflineTrendRequest } from "../../data/offlineTrend";
import { OfflineComparisonPanel } from "./OfflineComparisonPanel";

const loadOfflineDataQuality = vi.hoisted(() => vi.fn());
vi.mock("../../data/offlineDataQuality", async () => {
  const actual = await vi.importActual<typeof import("../../data/offlineDataQuality")>(
    "../../data/offlineDataQuality",
  );
  return { ...actual, loadOfflineDataQuality };
});

function metricChange(
  baseline: number | null,
  current: number | null,
  absoluteChange: number | null,
  relativeChange: number | null,
  direction: MetricChange["direction"],
  reason: MetricChange["relativeChangeUnavailableReason"] = null,
): MetricChange {
  return {
    baseline,
    current,
    absoluteChange,
    relativeChange,
    direction,
    relativeChangeUnavailableReason: reason,
  };
}

function comparisonPeriod(
  date: string,
  totals: MetricTotals,
  derived: DerivedMetrics,
): ComparisonPeriod {
  return {
    requestedRange: { dateStart: date, dateStop: date },
    actualRange: { dateStart: date, dateStop: date },
    coverage: { expectedDays: 1, observedDays: 1, complete: true },
    totals,
    derived,
  };
}

function unchangedMetric(value: number | null): MetricChange {
  return metricChange(value, value, value === null ? null : 0, 0, "UNCHANGED");
}

const ACCOUNT_01: OfflineAdAccount = {
  id: "aa_fixture_01",
  externalAccountRef: "fixture-ad-account-01",
  currency: "USD",
  timezoneName: "Etc/UTC",
  sourceKind: "FIXTURE",
  dataThrough: "2026-08-05T00:00:01Z",
  insightRowCount: 3,
};

const ACCOUNT_02: OfflineAdAccount = {
  id: "aa_fixture_02",
  externalAccountRef: "fixture-ad-account-02",
  currency: "EUR",
  timezoneName: "Europe/Berlin",
  sourceKind: "FIXTURE",
  dataThrough: "2026-08-05T00:00:01Z",
  insightRowCount: 3,
};

const ACCOUNT_LIST_RESPONSE = {
  ok: true,
  data: { items: [ACCOUNT_01] },
  context: {
    requestId: "fixture-account-list-01",
    workspaceId: "ws_fixture_01",
    sourceKind: "FIXTURE",
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
} satisfies OfflineAccountListResponse;

const SUCCESS_RESPONSE = {
  ok: true,
  data: {
    account: ACCOUNT_01,
    baseline: {
      requestedRange: { dateStart: "2026-08-02", dateStop: "2026-08-02" },
      actualRange: { dateStart: "2026-08-02", dateStop: "2026-08-02" },
      coverage: { expectedDays: 1, observedDays: 1, complete: true },
      totals: {
        spendMinorUnits: 10_000,
        impressions: 8_000,
        clicks: 160,
        conversions: 4,
      },
      derived: {
        clickThroughRate: 0.02,
        conversionRate: 0.025,
        costPerClickMinorUnits: 62.5,
        costPerThousandImpressionsMinorUnits: 1250,
        costPerConversionMinorUnits: 2500,
      },
    },
    current: {
      requestedRange: { dateStart: "2026-08-04", dateStop: "2026-08-04" },
      actualRange: { dateStart: "2026-08-04", dateStop: "2026-08-04" },
      coverage: { expectedDays: 1, observedDays: 1, complete: true },
      totals: {
        spendMinorUnits: 12_345,
        impressions: 10_000,
        clicks: 250,
        conversions: 7,
      },
      derived: {
        clickThroughRate: 0.025,
        conversionRate: 0.028,
        costPerClickMinorUnits: 49.38,
        costPerThousandImpressionsMinorUnits: 1234.5,
        costPerConversionMinorUnits: 1763.571429,
      },
    },
    changes: {
      totals: {
        spendMinorUnits: metricChange(10_000, 12_345, 2345, 0.2345, "INCREASED"),
        impressions: metricChange(8_000, 10_000, 2_000, 0.25, "INCREASED"),
        clicks: metricChange(160, 250, 90, 0.5625, "INCREASED"),
        conversions: metricChange(4, 7, 3, 0.75, "INCREASED"),
      },
      derived: {
        clickThroughRate: metricChange(0.02, 0.025, 0.005, 0.25, "INCREASED"),
        conversionRate: metricChange(0.025, 0.028, 0.003, 0.12, "INCREASED"),
        costPerClickMinorUnits: metricChange(62.5, 49.38, -13.12, -0.20992, "DECREASED"),
        costPerThousandImpressionsMinorUnits: metricChange(
          1250,
          1234.5,
          -15.5,
          -0.0124,
          "DECREASED",
        ),
        costPerConversionMinorUnits: metricChange(
          2500,
          1763.571429,
          -736.428571,
          -0.294571,
          "DECREASED",
        ),
      },
    },
    diagnostics: [
      {
        code: "CONVERSION_VOLUME_UP_COST_DOWN",
        severity: "INFO",
        findingConfidence: "CONFIRMED_PATTERN",
        causalClaim: false,
        summary:
          "Reported conversions increased while reported cost per conversion decreased.",
        evidenceMetrics: [
          "changes.totals.conversions",
          "changes.derived.costPerConversionMinorUnits",
        ],
        nextChecks: [
          "VERIFY_PATTERN_PERSISTS",
          "REVIEW_DELIVERY_AND_CREATIVE_MIX",
        ],
      },
    ],
  },
  context: {
    requestId: "fixture-request-01",
    workspaceId: "ws_fixture_01",
    adAccountId: "aa_fixture_01",
    metricContext: {
      currency: "USD",
      timezoneName: "Etc/UTC",
      clickMetricKind: "ALL_CLICKS",
      conversionEventRef: "fixture-purchase",
      attributionSpecHash: "fixture-attribution-context",
      apiVersion: "v25.0",
    },
    periodContext: {
      baseline: {
        stabilityStatus: "STABLE",
        fetchedAt: "2026-08-05T00:00:01Z",
        syncRunIds: ["sync_fixture_01"],
      },
      current: {
        stabilityStatus: "STABLE",
        fetchedAt: "2026-08-05T00:00:01Z",
        syncRunIds: ["sync_fixture_01"],
      },
    },
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

const HIERARCHY_RESPONSE = {
  ok: true,
  data: {
    account: ACCOUNT_01,
    items: [
      {
        id: "campaign_fixture_01",
        externalObjectRef: "fixture-campaign-01",
        objectLevel: "CAMPAIGN",
        parentObjectId: null,
        displayName: "虚构转化测试 Campaign",
        sourceKind: "FIXTURE",
        syncRunId: "sync_fixture_01",
        fetchedAt: "2026-08-05T00:00:01Z",
      },
      {
        id: "adset_fixture_01",
        externalObjectRef: "fixture-ad-set-01",
        objectLevel: "AD_SET",
        parentObjectId: "campaign_fixture_01",
        displayName: "虚构广泛受众 Ad Set",
        sourceKind: "FIXTURE",
        syncRunId: "sync_fixture_01",
        fetchedAt: "2026-08-05T00:00:01Z",
      },
      {
        id: "ad_fixture_01",
        externalObjectRef: "fixture-ad-01",
        objectLevel: "AD",
        parentObjectId: "adset_fixture_01",
        displayName: "虚构短视频素材 Ad",
        sourceKind: "FIXTURE",
        syncRunId: "sync_fixture_01",
        fetchedAt: "2026-08-05T00:00:01Z",
      },
      {
        id: "adset_fixture_02",
        externalObjectRef: "fixture-ad-set-02",
        objectLevel: "AD_SET",
        parentObjectId: "campaign_fixture_01",
        displayName: "虚构兴趣受众 Ad Set",
        sourceKind: "FIXTURE",
        syncRunId: "sync_fixture_01",
        fetchedAt: "2026-08-05T00:00:01Z",
      },
    ],
    counts: { campaigns: 1, adSets: 2, ads: 1 },
  },
  context: {
    requestId: "fixture-hierarchy-01",
    workspaceId: "ws_fixture_01",
    adAccountId: "aa_fixture_01",
    sourceKind: "FIXTURE",
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
} satisfies OfflineAdObjectHierarchyResponse;

const OBJECT_COMPARISON_RESPONSE = {
  ...SUCCESS_RESPONSE,
  data: {
    ...SUCCESS_RESPONSE.data,
    object: HIERARCHY_RESPONSE.data.items[2],
  },
  context: {
    ...SUCCESS_RESPONSE.context,
    objectId: "ad_fixture_01",
    objectLevel: "AD",
    parentObjectId: "adset_fixture_01",
  },
} satisfies OfflineAdObjectComparisonResponse;

const AD_SET_01_BASELINE = comparisonPeriod(
  "2026-08-02",
  {
    spendMinorUnits: 6_000,
    impressions: 4_800,
    clicks: 100,
    conversions: 3,
  },
  {
    clickThroughRate: 0.020833,
    conversionRate: 0.03,
    costPerClickMinorUnits: 60,
    costPerThousandImpressionsMinorUnits: 1_250,
    costPerConversionMinorUnits: 2_000,
  },
);

const AD_SET_01_CURRENT = comparisonPeriod(
  "2026-08-04",
  {
    spendMinorUnits: 7_000,
    impressions: 5_600,
    clicks: 150,
    conversions: 5,
  },
  {
    clickThroughRate: 0.026786,
    conversionRate: 0.033333,
    costPerClickMinorUnits: 46.666667,
    costPerThousandImpressionsMinorUnits: 1_250,
    costPerConversionMinorUnits: 1_400,
  },
);

const AD_SET_01_CHANGES = {
  totals: {
    spendMinorUnits: metricChange(6_000, 7_000, 1_000, 0.166667, "INCREASED"),
    impressions: metricChange(4_800, 5_600, 800, 0.166667, "INCREASED"),
    clicks: metricChange(100, 150, 50, 0.5, "INCREASED"),
    conversions: metricChange(3, 5, 2, 0.666667, "INCREASED"),
  },
  derived: {
    clickThroughRate: metricChange(
      0.020833,
      0.026786,
      0.005953,
      0.285744,
      "INCREASED",
    ),
    conversionRate: metricChange(
      0.03,
      0.033333,
      0.003333,
      0.1111,
      "INCREASED",
    ),
    costPerClickMinorUnits: metricChange(
      60,
      46.666667,
      -13.333333,
      -0.222222,
      "DECREASED",
    ),
    costPerThousandImpressionsMinorUnits: unchangedMetric(1_250),
    costPerConversionMinorUnits: metricChange(
      2_000,
      1_400,
      -600,
      -0.3,
      "DECREASED",
    ),
  },
} satisfies PeriodMetricChanges;

const AD_SET_02_BASELINE = comparisonPeriod(
  "2026-08-02",
  {
    spendMinorUnits: 4_000,
    impressions: 3_200,
    clicks: 60,
    conversions: 1,
  },
  {
    clickThroughRate: 0.01875,
    conversionRate: 0.016667,
    costPerClickMinorUnits: 66.666667,
    costPerThousandImpressionsMinorUnits: 1_250,
    costPerConversionMinorUnits: 4_000,
  },
);

const AD_SET_02_CURRENT = comparisonPeriod(
  "2026-08-04",
  {
    spendMinorUnits: 5_345,
    impressions: 4_400,
    clicks: 100,
    conversions: 2,
  },
  {
    clickThroughRate: 0.022727,
    conversionRate: 0.02,
    costPerClickMinorUnits: 53.45,
    costPerThousandImpressionsMinorUnits: 1_214.772727,
    costPerConversionMinorUnits: 2_672.5,
  },
);

const AD_SET_02_CHANGES = {
  totals: {
    spendMinorUnits: metricChange(4_000, 5_345, 1_345, 0.33625, "INCREASED"),
    impressions: metricChange(3_200, 4_400, 1_200, 0.375, "INCREASED"),
    clicks: metricChange(60, 100, 40, 0.666667, "INCREASED"),
    conversions: metricChange(1, 2, 1, 1, "INCREASED"),
  },
  derived: {
    clickThroughRate: metricChange(
      0.01875,
      0.022727,
      0.003977,
      0.212107,
      "INCREASED",
    ),
    conversionRate: metricChange(
      0.016667,
      0.02,
      0.003333,
      0.199976,
      "INCREASED",
    ),
    costPerClickMinorUnits: metricChange(
      66.666667,
      53.45,
      -13.216667,
      -0.19825,
      "DECREASED",
    ),
    costPerThousandImpressionsMinorUnits: metricChange(
      1_250,
      1_214.772727,
      -35.227273,
      -0.028182,
      "DECREASED",
    ),
    costPerConversionMinorUnits: metricChange(
      4_000,
      2_672.5,
      -1_327.5,
      -0.331875,
      "DECREASED",
    ),
  },
} satisfies PeriodMetricChanges;

const DIRECT_CHILD_BREAKDOWN_RESPONSE = {
  ok: true,
  data: {
    account: ACCOUNT_01,
    parent: HIERARCHY_RESPONSE.data.items[0],
    baseline: SUCCESS_RESPONSE.data.baseline,
    current: SUCCESS_RESPONSE.data.current,
    changes: SUCCESS_RESPONSE.data.changes,
    items: [
      {
        object: HIERARCHY_RESPONSE.data.items[1],
        baseline: AD_SET_01_BASELINE,
        current: AD_SET_01_CURRENT,
        changes: AD_SET_01_CHANGES,
      },
      {
        object: HIERARCHY_RESPONSE.data.items[3],
        baseline: AD_SET_02_BASELINE,
        current: AD_SET_02_CURRENT,
        changes: AD_SET_02_CHANGES,
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
    requestId: "fixture-breakdown-01",
    workspaceId: "ws_fixture_01",
    adAccountId: "aa_fixture_01",
    parentObjectId: "campaign_fixture_01",
    parentObjectLevel: "CAMPAIGN",
    childObjectLevel: "AD_SET",
    childCount: 2,
    metricContext: SUCCESS_RESPONSE.context.metricContext,
    periodContext: SUCCESS_RESPONSE.context.periodContext,
    comparisonPolicy: {
      ...SUCCESS_RESPONSE.context.comparisonPolicy,
      rankingApplied: false,
    },
    sourceKind: "FIXTURE",
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
} satisfies OfflineDirectChildBreakdownResponse;

function responseForAccount(account: OfflineAdAccount): OfflineComparisonResponse {
  return {
    ...SUCCESS_RESPONSE,
    data: { ...SUCCESS_RESPONSE.data, account },
    context: {
      ...SUCCESS_RESPONSE.context,
      adAccountId: account.id,
      metricContext: {
        ...SUCCESS_RESPONSE.context.metricContext,
        currency: account.currency,
        timezoneName: account.timezoneName,
      },
    },
  };
}

function qualityResponseForAccount(
  account: OfflineAdAccount,
  request: OfflineTrendRequest,
): OfflineDataQualityResponse {
  const dayCount =
    (Date.parse(`${request.dateStop}T00:00:00Z`) -
      Date.parse(`${request.dateStart}T00:00:00Z`)) /
      86_400_000 +
    1;
  const objectIds = [
    "ad_fixture_01",
    "ad_fixture_02",
    "ad_fixture_03",
    "ad_fixture_04",
    "adset_fixture_01",
    "adset_fixture_02",
    "campaign_fixture_01",
  ];
  const expectedRows = (objectIds.length + 1) * dayCount;
  return {
    ok: true,
    data: {
      account,
      requestedRange: request,
      dataset: {
        grain: "SUBJECT_DAY",
        subjectCount: objectIds.length + 1,
        observedRows: expectedRows,
        expectedRows,
      },
      hierarchy: {
        campaigns: 1,
        adSets: 2,
        ads: 4,
        objectCount: objectIds.length,
        objectIds,
      },
      checks: [
        { code: "PRIMARY_GRAIN_UNIQUE", status: "PASS", unit: "ROWS", checkedUnits: expectedRows, failedUnits: 0 },
        { code: "DAILY_COVERAGE_COMPLETE", status: "PASS", unit: "SUBJECT_DAYS", checkedUnits: expectedRows, failedUnits: 0 },
        { code: "REPORTING_CONTEXT_CONSISTENT", status: "PASS", unit: "ROWS", checkedUnits: expectedRows, failedUnits: 0 },
        { code: "OBJECT_HIERARCHY_COMPLETE", status: "PASS", unit: "OBJECTS", checkedUnits: objectIds.length, failedUnits: 0 },
        { code: "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP", status: "PASS", unit: "PARENT_DAYS", checkedUnits: dayCount, failedUnits: 0 },
        { code: "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP", status: "PASS", unit: "PARENT_DAYS", checkedUnits: dayCount, failedUnits: 0 },
        { code: "AD_SET_TO_AD_DAILY_ROLLUP", status: "PASS", unit: "PARENT_DAYS", checkedUnits: dayCount * 2, failedUnits: 0 },
      ],
    },
    context: {
      requestId: `fixture-quality-${account.id}`,
      workspaceId: "ws_fixture_01",
      adAccountId: account.id,
      metricContext: {
        currency: account.currency,
        timezoneName: account.timezoneName,
        clickMetricKind: "ALL_CLICKS",
        conversionEventRef: "fixture-purchase",
        attributionSpecHash: "fixture-attribution-context",
        apiVersion: "v25.0",
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
          "AD_SET_TO_AD_DAILY_ROLLUP",
        ],
        allChecksRequired: true,
        performanceEvaluationApplied: false,
        businessThresholdsApplied: false,
        causalClaims: false,
        gateEvidence: false,
      },
      sourceKind: "FIXTURE",
    },
    warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
    nextCursor: null,
    truncated: false,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function loadAccountContext(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: "读取 fixture 账户" }));
  await screen.findByRole("combobox", { name: "Fixture 广告账户" });
}

async function passQualityPreflight(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  loadOfflineDataQuality.mockImplementation(
    async (account: OfflineAdAccount, request: OfflineTrendRequest) =>
      qualityResponseForAccount(account, request),
  );
  await user.click(
    screen.getByRole("button", { name: "运行离线数据质量核验" }),
  );
  await screen.findByText("离线数据质量核验通过");
}

afterEach(() => {
  loadOfflineDataQuality.mockReset();
  vi.unstubAllGlobals();
});

describe("OfflineComparisonPanel", () => {
  it("keeps metric analysis locked until preflight covers the requested dates", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => jsonResponse(ACCOUNT_LIST_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);

    const accountButton = screen.getByRole("button", {
      name: "加载所选账户对比",
    });
    expect(accountButton).toBeDisabled();
    expect(screen.getByText(/比较周期必须完全位于已核验日期范围/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await passQualityPreflight(user);
    expect(accountButton).toBeEnabled();
    expect(screen.getByText(/步骤 2 已覆盖 2026-08-02 至 2026-08-04/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("当前结束日期"), {
      target: { value: "2026-08-05" },
    });
    expect(accountButton).toBeDisabled();
    expect(screen.getByText("比较周期超出 preflight 覆盖")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("loads the account list, uses the selected account route, and presents non-causal results", async () => {
    const user = userEvent.setup();
    const listWithTwoAccounts = {
      ...ACCOUNT_LIST_RESPONSE,
      data: { items: [ACCOUNT_01, ACCOUNT_02] },
    } satisfies OfflineAccountListResponse;
    let resolveComparison!: (response: Response) => void;
    const pendingComparison = new Promise<Response>((resolve) => {
      resolveComparison = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(listWithTwoAccounts))
      .mockImplementationOnce(() => pendingComparison);
    vi.stubGlobal("fetch", fetchMock);

    render(<OfflineComparisonPanel />);

    expect(screen.getByText("固定虚构数据")).toBeInTheDocument();
    expect(screen.getByText("未连接 Meta")).toBeInTheDocument();
    await loadAccountContext(user);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      }),
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Fixture 广告账户" }),
      ACCOUNT_02.id,
    );
    await passQualityPreflight(user);
    const loadButton = screen.getByRole("button", {
      name: "加载所选账户对比",
    });
    await user.click(loadButton);
    expect(loadButton).toBeDisabled();
    expect(screen.getByText("正在读取固定 fixture")).toBeInTheDocument();

    resolveComparison(jsonResponse(responseForAccount(ACCOUNT_02)));

    expect(await screen.findByText("离线 Worker 已响应")).toBeInTheDocument();
    expect(screen.getByText("报告转化上升，同时 CPA 下降")).toBeInTheDocument();
    expect(screen.getByText("不包含因果结论")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_02/comparison?",
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      }),
    );
  });

  it("shows a manual Codex context only for the current preflight-backed comparison", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(jsonResponse(SUCCESS_RESPONSE)),
    );

    render(<OfflineComparisonPanel />);
    expect(screen.getByText("Codex 手动上下文")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Codex 分析上下文 JSON" }),
    ).not.toBeInTheDocument();

    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(
      screen.getByRole("button", { name: "加载所选账户对比" }),
    );

    const context = await screen.findByRole("textbox", {
      name: "Codex 分析上下文 JSON",
    });
    const serializedContext = (context as HTMLTextAreaElement).value;
    expect(context).toHaveAttribute("readonly");
    expect(serializedContext).toContain("CODEX_ANALYSIS_INPUT");
    expect(serializedContext).toContain('"external_write": false');
    expect(serializedContext).not.toContain("fixture-request-01");
    expect(screen.getByText(/不是分析结论/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("当前结束日期"), {
      target: { value: "2026-08-05" },
    });
    expect(
      screen.queryByRole("textbox", { name: "Codex 分析上下文 JSON" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("等待可信结果")).toBeInTheDocument();
  });

  it("loads a selected Ad comparison without replacing the account-level path", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(HIERARCHY_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(OBJECT_COMPARISON_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);

    const objectComparisonButton = screen.getByRole("button", {
      name: "加载所选对象对比",
    });
    expect(objectComparisonButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "读取对象层级" }));
    await user.click(
      await screen.findByRole("button", { name: /虚构短视频素材 Ad/ }),
    );
    expect(objectComparisonButton).toBeEnabled();
    await user.click(objectComparisonButton);

    expect(await screen.findByText(/Ad · 虚构短视频素材 Ad/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects/ad_fixture_01/comparison?",
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      }),
    );

    const accountComparisonButton = screen.getByRole("button", {
      name: "加载所选账户对比",
    });
    expect(accountComparisonButton).toBeEnabled();
  });

  it("loads a direct child breakdown without ranking and disables it for an Ad leaf", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(HIERARCHY_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(DIRECT_CHILD_BREAKDOWN_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);

    const breakdownButton = screen.getByRole("button", {
      name: "加载直接子对象拆解",
    });
    expect(breakdownButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "读取对象层级" }));
    expect(breakdownButton).toBeEnabled();
    await user.click(breakdownButton);

    expect(
      await screen.findByText("直接子对象拆解已响应"),
    ).toBeInTheDocument();
    const breakdownTable = screen.getByRole("table", {
      name: "直接子对象周期变化",
    });
    expect(
      within(breakdownTable).getByText("虚构广泛受众 Ad Set"),
    ).toBeInTheDocument();
    expect(
      within(breakdownTable).getByText("虚构兴趣受众 Ad Set"),
    ).toBeInTheDocument();
    expect(screen.getByText("无排名 · 无阈值 · 非因果")).toBeInTheDocument();
    expect(screen.getByText(/顺序不代表表现优先级/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects/campaign_fixture_01/children-comparison?",
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      }),
    );

    expect(
      screen.getByRole("button", { name: "加载所选账户对比" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "加载所选对象对比" }),
    ).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /虚构短视频素材 Ad/ }));
    expect(breakdownButton).toBeDisabled();
    expect(screen.getByText(/Ad 是本切片叶子/)).toBeInTheDocument();
  });

  it("rejects a direct child breakdown bound to a different parent", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(jsonResponse(HIERARCHY_RESPONSE))
        .mockResolvedValueOnce(
          jsonResponse({
            ...DIRECT_CHILD_BREAKDOWN_RESPONSE,
            context: {
              ...DIRECT_CHILD_BREAKDOWN_RESPONSE.context,
              parentObjectId: "adset_fixture_01",
            },
          }),
        ),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));
    await user.click(
      screen.getByRole("button", { name: "加载直接子对象拆解" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("父子绑定");
  });

  it("rejects a direct child breakdown whose child totals do not reconcile", async () => {
    const user = userEvent.setup();
    const mismatchedItems = DIRECT_CHILD_BREAKDOWN_RESPONSE.data.items.map(
      (item, index) =>
        index === 0
          ? {
              ...item,
              current: {
                ...item.current,
                totals: {
                  ...item.current.totals,
                  spendMinorUnits: 7_001,
                },
              },
            }
          : item,
    );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(jsonResponse(HIERARCHY_RESPONSE))
        .mockResolvedValueOnce(
          jsonResponse({
            ...DIRECT_CHILD_BREAKDOWN_RESPONSE,
            data: {
              ...DIRECT_CHILD_BREAKDOWN_RESPONSE.data,
              items: mismatchedItems,
            },
          }),
        ),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));
    await user.click(
      screen.getByRole("button", { name: "加载直接子对象拆解" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("汇总对账");
  });

  it("rejects an object comparison bound to a different object", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(jsonResponse(HIERARCHY_RESPONSE))
        .mockResolvedValueOnce(
          jsonResponse({
            ...OBJECT_COMPARISON_RESPONSE,
            context: {
              ...OBJECT_COMPARISON_RESPONSE.context,
              objectId: "ad_fixture_02",
            },
          }),
        ),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));
    await user.click(
      await screen.findByRole("button", { name: /虚构短视频素材 Ad/ }),
    );
    await user.click(
      screen.getByRole("button", { name: "加载所选对象对比" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("对象绑定");
  });

  it("shows a stable account-list error without exposing a manual account field", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            ok: false,
            error: {
              code: "CAPACITY_EXCEEDED",
              message: "Offline account capacity exceeded",
              retryable: false,
            },
          },
          409,
        ),
      ),
    );

    render(<OfflineComparisonPanel />);
    await user.click(screen.getByRole("button", { name: "读取 fixture 账户" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "CAPACITY_EXCEEDED",
    );
    expect(
      screen.queryByRole("button", { name: "加载所选账户对比" }),
    ).not.toBeInTheDocument();
  });

  it("rejects an account list that omits a trust warning", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ...ACCOUNT_LIST_RESPONSE,
          warnings: ["FIXTURE_DATA_ONLY"],
        }),
      ),
    );

    render(<OfflineComparisonPanel />);
    await user.click(screen.getByRole("button", { name: "读取 fixture 账户" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("已拒绝使用");
  });

  it.each([
    ["duplicate account IDs", [ACCOUNT_01, ACCOUNT_01]],
    [
      "more than 10 accounts",
      Array.from({ length: 11 }, (_, index) => ({
        ...ACCOUNT_01,
        id: `aa_fixture_${String(index + 1).padStart(2, "0")}`,
        externalAccountRef: `fixture-ad-account-${String(index + 1).padStart(2, "0")}`,
      })),
    ],
  ])("rejects an account list with %s", async (_caseName, items) => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ...ACCOUNT_LIST_RESPONSE,
          data: { items },
        }),
      ),
    );

    render(<OfflineComparisonPanel />);
    await user.click(screen.getByRole("button", { name: "读取 fixture 账户" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
  });

  it("shows a stable comparison error without falling back to story data", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(
          jsonResponse(
            {
              ok: false,
              error: {
                code: "INCOMPLETE_PERIOD_COVERAGE",
                message: "Both comparison periods require complete daily coverage",
                retryable: false,
              },
            },
            409,
          ),
        ),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(
      screen.getByRole("button", { name: "加载所选账户对比" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INCOMPLETE_PERIOD_COVERAGE",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "没有使用静态数据冒充 Worker 结果",
    );
  });

  it("rejects an analysis snapshot that differs from the quality attestation", async () => {
    const user = userEvent.setup();
    const mismatchedSnapshot = {
      ...SUCCESS_RESPONSE,
      context: {
        ...SUCCESS_RESPONSE.context,
        periodContext: {
          ...SUCCESS_RESPONSE.context.periodContext,
          current: {
            ...SUCCESS_RESPONSE.context.periodContext.current,
            fetchedAt: "2026-08-05T00:00:02Z",
          },
        },
      },
    } satisfies OfflineComparisonResponse;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(jsonResponse(mismatchedSnapshot)),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(
      screen.getByRole("button", { name: "加载所选账户对比" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("步骤 2");
  });

  it("rejects a comparison response that omits a trust warning", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(
          jsonResponse({
            ...SUCCESS_RESPONSE,
            warnings: ["FIXTURE_DATA_ONLY"],
          }),
        ),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(
      screen.getByRole("button", { name: "加载所选账户对比" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("已拒绝展示");
  });

  it("rejects a comparison response bound to a different account", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(jsonResponse(responseForAccount(ACCOUNT_02))),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(
      screen.getByRole("button", { name: "加载所选账户对比" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "INVALID_RESPONSE",
    );
  });

  it("explains that a relative change cannot be computed from a zero baseline", async () => {
    const user = userEvent.setup();
    const zeroBaselineResponse = {
      ...SUCCESS_RESPONSE,
      data: {
        ...SUCCESS_RESPONSE.data,
        changes: {
          ...SUCCESS_RESPONSE.data.changes,
          totals: {
            ...SUCCESS_RESPONSE.data.changes.totals,
            spendMinorUnits: metricChange(
              0,
              12_345,
              12_345,
              null,
              "INCREASED",
              "BASELINE_ZERO",
            ),
          },
        },
      },
    } satisfies OfflineComparisonResponse;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(ACCOUNT_LIST_RESPONSE))
        .mockResolvedValueOnce(jsonResponse(zeroBaselineResponse)),
    );

    render(<OfflineComparisonPanel />);
    await loadAccountContext(user);
    await passQualityPreflight(user);
    await user.click(
      screen.getByRole("button", { name: "加载所选账户对比" }),
    );

    expect(
      await screen.findByText("基线为 0，百分比不可算"),
    ).toBeInTheDocument();
  });
});
