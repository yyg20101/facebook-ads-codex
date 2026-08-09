import { env } from "cloudflare:workers";
import {
  createExecutionContext,
  waitOnExecutionContext
} from "cloudflare:test";
import { describe, expect, it } from "vitest";

import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function dispatch(path: string) {
  const request = new IncomingRequest(`https://offline.invalid${path}`);
  const context = createExecutionContext();
  const response = await worker.fetch(request, env, context);
  await waitOnExecutionContext(context);
  return response;
}

describe("offline fixture ad object hierarchy", () => {
  it("returns a bounded Campaign to Ad Set to Ad hierarchy", async () => {
    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects"
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: {
        account: {
          id: "aa_fixture_01",
          externalAccountRef: "fixture-ad-account-01",
          currency: "USD",
          timezoneName: "Etc/UTC",
          sourceKind: "FIXTURE",
          dataThrough: "2026-08-05T00:00:01Z",
          insightRowCount: 3
        },
        items: [
          {
            id: "campaign_fixture_01",
            externalObjectRef: "fixture-campaign-01",
            objectLevel: "CAMPAIGN",
            parentObjectId: null,
            displayName: "虚构转化测试 Campaign",
            sourceKind: "FIXTURE",
            syncRunId: "sync_fixture_01",
            fetchedAt: "2026-08-05T00:00:01Z"
          },
          {
            id: "adset_fixture_01",
            externalObjectRef: "fixture-ad-set-01",
            objectLevel: "AD_SET",
            parentObjectId: "campaign_fixture_01",
            displayName: "虚构广泛受众 Ad Set",
            sourceKind: "FIXTURE",
            syncRunId: "sync_fixture_01",
            fetchedAt: "2026-08-05T00:00:01Z"
          },
          {
            id: "adset_fixture_02",
            externalObjectRef: "fixture-ad-set-02",
            objectLevel: "AD_SET",
            parentObjectId: "campaign_fixture_01",
            displayName: "虚构兴趣受众 Ad Set",
            sourceKind: "FIXTURE",
            syncRunId: "sync_fixture_01",
            fetchedAt: "2026-08-05T00:00:01Z"
          },
          {
            id: "ad_fixture_01",
            externalObjectRef: "fixture-ad-01",
            objectLevel: "AD",
            parentObjectId: "adset_fixture_01",
            displayName: "虚构短视频素材 Ad",
            sourceKind: "FIXTURE",
            syncRunId: "sync_fixture_01",
            fetchedAt: "2026-08-05T00:00:01Z"
          },
          {
            id: "ad_fixture_02",
            externalObjectRef: "fixture-ad-02",
            objectLevel: "AD",
            parentObjectId: "adset_fixture_01",
            displayName: "虚构轮播素材 Ad",
            sourceKind: "FIXTURE",
            syncRunId: "sync_fixture_01",
            fetchedAt: "2026-08-05T00:00:01Z"
          },
          {
            id: "ad_fixture_03",
            externalObjectRef: "fixture-ad-03",
            objectLevel: "AD",
            parentObjectId: "adset_fixture_02",
            displayName: "虚构静态素材 Ad",
            sourceKind: "FIXTURE",
            syncRunId: "sync_fixture_01",
            fetchedAt: "2026-08-05T00:00:01Z"
          },
          {
            id: "ad_fixture_04",
            externalObjectRef: "fixture-ad-04",
            objectLevel: "AD",
            parentObjectId: "adset_fixture_02",
            displayName: "虚构对照素材 Ad",
            sourceKind: "FIXTURE",
            syncRunId: "sync_fixture_01",
            fetchedAt: "2026-08-05T00:00:01Z"
          }
        ],
        counts: { campaigns: 1, adSets: 2, ads: 4 }
      },
      context: {
        requestId: expect.any(String),
        workspaceId: "ws_fixture_01",
        adAccountId: "aa_fixture_01",
        sourceKind: "FIXTURE"
      },
      warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
      nextCursor: null,
      truncated: false
    });
  });

  it("rejects query parameters, malformed IDs, and cross-Workspace access", async () => {
    const invalidPaths = [
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects?level=AD",
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/bad%27id/objects"
    ];
    for (const path of invalidPaths) {
      const response = await dispatch(path);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "INVALID_ARGUMENT" }
      });
    }

    await env.DB.prepare(
      `INSERT INTO workspaces (id, slug, display_name, created_at)
       VALUES (?1, ?2, ?3, ?4)`
    )
      .bind(
        "ws_fixture_objects_scope",
        "fixture-objects-scope",
        "虚构对象隔离工作区",
        "2026-08-06T00:00:00Z"
      )
      .run();

    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_objects_scope/ad-accounts/aa_fixture_01/objects"
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { code: "NOT_FOUND" }
    });
  });

  it("fails closed when a child points to the wrong parent level", async () => {
    await env.DB.prepare(
      `INSERT INTO meta_ad_objects (
         id, workspace_id, ad_account_id, parent_object_id,
         external_object_ref, object_level, display_name, source_kind,
         sync_run_id, fetched_at
       ) VALUES (
         ?1, ?2, ?3, ?4, ?5, 'AD_SET', ?6, 'FIXTURE', ?7, ?8
       )`
    )
      .bind(
        "adset_fixture_wrong_parent",
        "ws_fixture_01",
        "aa_fixture_01",
        "adset_fixture_01",
        "fixture-ad-set-wrong-parent",
        "虚构错误父级 Ad Set",
        "sync_fixture_01",
        "2026-08-06T00:00:00Z"
      )
      .run();

    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects"
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_OBJECT_HIERARCHY" }
    });
  });

  it("rejects fixture hierarchies above the local safety cap", async () => {
    const statements = Array.from({ length: 44 }, (_, index) => {
      const suffix = String(index + 1).padStart(2, "0");
      return env.DB.prepare(
        `INSERT INTO meta_ad_objects (
           id, workspace_id, ad_account_id, parent_object_id,
           external_object_ref, object_level, display_name, source_kind,
           sync_run_id, fetched_at
         ) VALUES (
           ?1, 'ws_fixture_01', 'aa_fixture_01', NULL,
           ?2, 'CAMPAIGN', ?3, 'FIXTURE',
           'sync_fixture_01', '2026-08-06T00:00:00Z'
         )`
      ).bind(
        `campaign_capacity_${suffix}`,
        `fixture-campaign-capacity-${suffix}`,
        `虚构容量 Campaign ${suffix}`
      );
    });
    await env.DB.batch(statements);

    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/objects"
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "CAPACITY_EXCEEDED" }
    });
  });
});
