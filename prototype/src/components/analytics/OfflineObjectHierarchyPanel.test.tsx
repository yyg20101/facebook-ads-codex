import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OfflineAdAccount } from "../../data/offlineComparison";
import { OfflineObjectHierarchyPanel } from "./OfflineObjectHierarchyPanel";

const account: OfflineAdAccount = {
  id: "aa_fixture_01",
  externalAccountRef: "fixture-ad-account-01",
  currency: "USD",
  timezoneName: "Etc/UTC",
  sourceKind: "FIXTURE",
  dataThrough: "2026-08-05T00:00:01Z",
  insightRowCount: 3,
};

const hierarchyResponse = {
  ok: true,
  data: {
    account,
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
    ],
    counts: { campaigns: 1, adSets: 1, ads: 1 },
  },
  context: {
    requestId: "request_fixture_hierarchy",
    workspaceId: "ws_fixture_01",
    adAccountId: "aa_fixture_01",
    sourceKind: "FIXTURE",
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OfflineObjectHierarchyPanel", () => {
  it("loads the fixed account path and navigates Campaign to Ad Set to Ad", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(hierarchyResponse));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <OfflineObjectHierarchyPanel
        account={account}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));

    expect(await screen.findByText("1 Campaign · 1 Ad Set · 1 Ad")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects",
      {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        credentials: "omit",
        signal: expect.any(AbortSignal),
      },
    );

    await user.click(
      screen.getByRole("button", { name: /虚构短视频素材 Ad/ }),
    );
    const detail = screen.getByRole("complementary", {
      name: "当前 fixture 对象",
    });
    expect(within(detail).getByRole("heading", { name: "虚构短视频素材 Ad" })).toBeInTheDocument();
    expect(within(detail).getByText("虚构广泛受众 Ad Set")).toBeInTheDocument();
    expect(
      within(detail).getByText(
        "可加载当前 Ad 的周期对比；Ad 是本切片叶子，没有直接子对象拆解。",
      ),
    ).toBeInTheDocument();
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "ad_fixture_01", objectLevel: "AD" }),
    );
  });

  it("rejects a response without both fixture trust warnings", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...hierarchyResponse,
          warnings: ["FIXTURE_DATA_ONLY"],
        }),
      ),
    );

    render(<OfflineObjectHierarchyPanel account={account} />);
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));

    expect(await screen.findByText("INVALID_RESPONSE")).toBeInTheDocument();
    expect(screen.queryByText("1 Campaign · 1 Ad Set · 1 Ad")).not.toBeInTheDocument();
  });

  it("rejects an orphaned object instead of rendering a partial tree", async () => {
    const user = userEvent.setup();
    const orphanedItems = hierarchyResponse.data.items.map((item) =>
      item.id === "ad_fixture_01"
        ? { ...item, parentObjectId: "adset_fixture_missing" }
        : item,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...hierarchyResponse,
          data: { ...hierarchyResponse.data, items: orphanedItems },
        }),
      ),
    );

    render(<OfflineObjectHierarchyPanel account={account} />);
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));

    expect(await screen.findByText("INVALID_RESPONSE")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Fixture 广告对象层级" })).not.toBeInTheDocument();
  });

  it("rejects a hierarchy bound to a different account", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...hierarchyResponse,
          context: {
            ...hierarchyResponse.context,
            adAccountId: "aa_fixture_02",
          },
        }),
      ),
    );

    render(<OfflineObjectHierarchyPanel account={account} />);
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));

    expect(await screen.findByText("INVALID_RESPONSE")).toBeInTheDocument();
  });

  it("shows a stable Worker error without using a fallback hierarchy", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            ok: false,
            error: {
              code: "NOT_FOUND",
              message: "Fixture resource not found",
              retryable: false,
            },
          },
          404,
        ),
      ),
    );

    render(<OfflineObjectHierarchyPanel account={account} />);
    await user.click(screen.getByRole("button", { name: "读取对象层级" }));

    expect(await screen.findByText("NOT_FOUND")).toBeInTheDocument();
    expect(screen.getByText("Fixture resource not found")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Fixture 广告对象层级" })).not.toBeInTheDocument();
  });
});
