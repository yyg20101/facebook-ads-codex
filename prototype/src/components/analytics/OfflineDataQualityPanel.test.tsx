import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OfflineComparisonError,
  type OfflineAdAccount
} from "../../data/offlineComparison";
import type { OfflineDataQualityResponse } from "../../data/offlineDataQuality";
import { OfflineDataQualityPanel } from "./OfflineDataQualityPanel";

const loadOfflineDataQuality = vi.hoisted(() => vi.fn());
vi.mock("../../data/offlineDataQuality", async () => {
  const actual = await vi.importActual<typeof import("../../data/offlineDataQuality")>(
    "../../data/offlineDataQuality"
  );
  return { ...actual, loadOfflineDataQuality };
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

const RESPONSE: OfflineDataQualityResponse = {
  ok: true,
  data: {
    account: ACCOUNT,
    requestedRange: { dateStart: "2026-08-02", dateStop: "2026-08-04" },
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
      { code: "PRIMARY_GRAIN_UNIQUE", status: "PASS", unit: "ROWS", checkedUnits: 24, failedUnits: 0 },
      { code: "DAILY_COVERAGE_COMPLETE", status: "PASS", unit: "SUBJECT_DAYS", checkedUnits: 24, failedUnits: 0 },
      { code: "REPORTING_CONTEXT_CONSISTENT", status: "PASS", unit: "ROWS", checkedUnits: 24, failedUnits: 0 },
      { code: "OBJECT_HIERARCHY_COMPLETE", status: "PASS", unit: "OBJECTS", checkedUnits: 7, failedUnits: 0 },
      { code: "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP", status: "PASS", unit: "PARENT_DAYS", checkedUnits: 3, failedUnits: 0 },
      { code: "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP", status: "PASS", unit: "PARENT_DAYS", checkedUnits: 3, failedUnits: 0 },
      { code: "AD_SET_TO_AD_DAILY_ROLLUP", status: "PASS", unit: "PARENT_DAYS", checkedUnits: 6, failedUnits: 0 }
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

afterEach(() => {
  loadOfflineDataQuality.mockReset();
});

describe("OfflineDataQualityPanel", () => {
  it("loads explicitly and clears stale evidence when the date changes", async () => {
    const user = userEvent.setup();
    const onAttestationChange = vi.fn();
    loadOfflineDataQuality.mockResolvedValue(RESPONSE);
    render(
      <OfflineDataQualityPanel
        account={ACCOUNT}
        onAttestationChange={onAttestationChange}
      />
    );

    expect(loadOfflineDataQuality).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "运行离线数据质量核验" })
    );

    expect(
      await screen.findByText("离线数据质量核验通过")
    ).toBeInTheDocument();
    expect(screen.getByText("主粒度唯一")).toBeInTheDocument();
    expect(screen.getByText("Ad Set → Ad 逐日对账")).toBeInTheDocument();
    expect(screen.getByText(/不作为 Gate 证据/)).toBeInTheDocument();
    expect(loadOfflineDataQuality).toHaveBeenCalledTimes(1);
    expect(loadOfflineDataQuality).toHaveBeenCalledWith(
      ACCOUNT,
      { dateStart: "2026-08-02", dateStop: "2026-08-04" },
      expect.any(AbortSignal)
    );
    expect(onAttestationChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        accountId: ACCOUNT.id,
        dateStart: "2026-08-02",
        dateStop: "2026-08-04",
        requestId: "fixture-quality-request-01"
      })
    );

    const stopInput = screen.getByLabelText("数据质量结束日期");
    fireEvent.change(stopInput, { target: { value: "2026-08-05" } });
    expect(
      screen.queryByText("离线数据质量核验通过")
    ).not.toBeInTheDocument();
    expect(loadOfflineDataQuality).toHaveBeenCalledTimes(1);
    expect(onAttestationChange).toHaveBeenLastCalledWith(null);
  });

  it("shows a stable failure without partial fallback", async () => {
    const user = userEvent.setup();
    const onAttestationChange = vi.fn();
    loadOfflineDataQuality.mockRejectedValue(
      new OfflineComparisonError(
        "INCOMPATIBLE_OBJECT_ROLLUP",
        "Fixture daily metrics do not reconcile"
      )
    );
    render(
      <OfflineDataQualityPanel
        account={ACCOUNT}
        onAttestationChange={onAttestationChange}
      />
    );

    await user.click(
      screen.getByRole("button", { name: "运行离线数据质量核验" })
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("INCOMPATIBLE_OBJECT_ROLLUP");
    expect(alert).toHaveTextContent("没有部分通过、补零或静态回退");
    expect(screen.queryByText("离线数据质量核验通过")).not.toBeInTheDocument();
    expect(onAttestationChange).toHaveBeenLastCalledWith(null);
  });
});
