import { env } from "cloudflare:workers";
import {
  applyD1Migrations,
  createExecutionContext,
  waitOnExecutionContext
} from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { handleOfflineRequest } from "../src/http";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function dispatch(
  path: string,
  init?: RequestInit<IncomingRequestCfProperties>,
  origin = "https://offline.invalid"
) {
  const request = new IncomingRequest(`${origin}${path}`, init);
  const context = createExecutionContext();
  const response = await worker.fetch(request, env, context);
  await waitOnExecutionContext(context);
  return response;
}

describe("offline control-plane Worker", () => {
  it("applies migrations idempotently and loads only fictional data", async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
    await applyD1Migrations(env.DB, env.TEST_FIXTURES, "fixture_migrations");

    const account = await env.DB.prepare(
      `SELECT workspace_id, external_account_ref, source_kind
       FROM meta_ad_accounts
       WHERE id = ?1`
    )
      .bind("aa_fixture_01")
      .first<{
        workspace_id: string;
        external_account_ref: string;
        source_kind: string;
      }>();
    const insightCount = await env.DB.prepare(
      `SELECT COUNT(*) AS row_count
       FROM insights_daily
       WHERE ad_account_id = ?1`
    )
      .bind("aa_fixture_01")
      .first<number>("row_count");

    expect(account).toEqual({
      workspace_id: "ws_fixture_01",
      external_account_ref: "fixture-ad-account-01",
      source_kind: "FIXTURE"
    });
    expect(insightCount).toBe(3);
  });

  it("reports local D1 readiness without claiming external connectivity", async () => {
    const response = await dispatch("/healthz");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.json()).toEqual({
      ok: true,
      data: {
        service: "control-plane-worker",
        mode: "OFFLINE_FIXTURE",
        storage: "ready"
      },
      context: { requestId: expect.any(String) },
      warnings: ["No Meta or Cloudflare account connection is configured"]
    });
  });

  it("fails closed when fixture mode is disabled or the host is non-local", async () => {
    const disabledRequest = new IncomingRequest(
      "https://offline.invalid/healthz"
    );
    const disabledResponse = await handleOfflineRequest(disabledRequest, {
      DB: env.DB,
      OFFLINE_FIXTURES_ENABLED: "false"
    });
    expect(disabledResponse.status).toBe(503);
    expect(await disabledResponse.json()).toMatchObject({
      ok: false,
      error: { code: "OFFLINE_MODE_DISABLED", retryable: true }
    });

    const remoteResponse = await dispatch(
      "/healthz",
      undefined,
      "https://example.workers.dev"
    );
    expect(remoteResponse.status).toBe(403);
    expect(await remoteResponse.json()).toMatchObject({
      ok: false,
      error: { code: "OFFLINE_ONLY", retryable: false }
    });
  });

  it("rejects unsupported methods and unknown routes with stable errors", async () => {
    const methodResponse = await dispatch("/healthz", { method: "POST" });
    expect(methodResponse.status).toBe(405);
    expect(methodResponse.headers.get("allow")).toBe("GET");
    expect(await methodResponse.json()).toMatchObject({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", retryable: false }
    });

    const missingResponse = await dispatch("/v1/workspaces");
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND", retryable: false }
    });
  });

  it("lists only fixture accounts in the requested Workspace", async () => {
    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts"
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: {
        items: [
          {
            id: "aa_fixture_01",
            externalAccountRef: "fixture-ad-account-01",
            currency: "USD",
            timezoneName: "Etc/UTC",
            sourceKind: "FIXTURE",
            dataThrough: "2026-08-05T00:00:01Z",
            insightRowCount: 3
          }
        ]
      },
      context: {
        requestId: expect.any(String),
        workspaceId: "ws_fixture_01",
        sourceKind: "FIXTURE"
      },
      warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
      nextCursor: null,
      truncated: false
    });
  });

  it("summarizes compatible daily metrics with complete context", async () => {
    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-08-02&date_stop=2026-08-04"
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
        requestedRange: {
          dateStart: "2026-08-02",
          dateStop: "2026-08-04"
        },
        actualRange: {
          dateStart: "2026-08-02",
          dateStop: "2026-08-04"
        },
        totals: {
          spendMinorUnits: 33345,
          impressions: 27000,
          clicks: 608,
          conversions: 16
        },
        derived: {
          clickThroughRate: 0.022519,
          costPerClickMinorUnits: 54.84375,
          costPerThousandImpressionsMinorUnits: 1235,
          costPerConversionMinorUnits: 2084.0625
        }
      },
      context: {
        requestId: expect.any(String),
        workspaceId: "ws_fixture_01",
        adAccountId: "aa_fixture_01",
        currency: "USD",
        timezoneName: "Etc/UTC",
        clickMetricKind: "ALL_CLICKS",
        conversionEventRef: "fixture-purchase",
        attributionSpecHash: "fixture-attribution-context",
        apiVersion: "v25.0",
        stabilityStatus: "STABLE",
        fetchedAt: "2026-08-05T00:00:01Z",
        syncRunIds: ["sync_fixture_01"],
        sourceKind: "FIXTURE"
      },
      warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
      nextCursor: null,
      truncated: false
    });
  });

  it("rejects malformed, duplicate, unknown, and oversized query input", async () => {
    const paths = [
      "/offline/v1/workspaces/ws_fixture_01%27/ad-accounts",
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-02-30&date_stop=2026-03-01",
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-08-02&date_start=2026-08-03&date_stop=2026-08-04",
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-08-02&date_stop=2026-08-04&metric=spend",
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-07-01&date_stop=2026-08-01"
    ];

    for (const path of paths) {
      const response = await dispatch(path);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        ok: false,
        error: { code: "INVALID_ARGUMENT", retryable: false }
      });
    }
  });

  it("does not reveal accounts across Workspace boundaries", async () => {
    await env.DB.prepare(
      `INSERT INTO workspaces (id, slug, display_name, created_at)
       VALUES (?1, ?2, ?3, ?4)`
    )
      .bind(
        "ws_fixture_scope",
        "fixture-workspace-scope",
        "虚构隔离查询工作区",
        "2026-08-05T00:00:00Z"
      )
      .run();

    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_scope/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-08-02&date_stop=2026-08-04"
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND", retryable: false }
    });
  });

  it("returns data unavailable for an empty but valid range", async () => {
    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-07-30&date_stop=2026-07-30"
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "DATA_UNAVAILABLE", retryable: false }
    });
  });

  it("returns null derived values for zero denominators", async () => {
    await env.DB.prepare(
      `INSERT INTO insights_daily (
        id, workspace_id, ad_account_id, object_level, object_ref,
        date_start, date_stop, currency, timezone_name,
        attribution_spec_hash, api_version, sync_run_id,
        spend_minor_units, impressions, clicks, click_metric_kind,
        conversions, conversion_event_ref, stability_status, fetched_at
      ) VALUES (
        ?1, ?2, ?3, 'ACCOUNT', ?4, ?5, ?5, 'USD', 'Etc/UTC',
        'fixture-attribution-context', 'v25.0', 'sync_fixture_01',
        0, 0, 0, 'ALL_CLICKS', 0, 'fixture-purchase', 'STABLE', ?6
      )`
    )
      .bind(
        "insight_fixture_zero",
        "ws_fixture_01",
        "aa_fixture_01",
        "fixture-ad-account-01",
        "2026-08-01",
        "2026-08-05T00:00:01Z"
      )
      .run();

    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-08-01&date_stop=2026-08-01"
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        totals: {
          spendMinorUnits: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0
        },
        derived: {
          clickThroughRate: null,
          costPerClickMinorUnits: null,
          costPerThousandImpressionsMinorUnits: null,
          costPerConversionMinorUnits: null
        }
      }
    });
  });

  it("refuses to aggregate incompatible reporting context", async () => {
    await env.DB.prepare(
      `INSERT INTO insights_daily (
        id, workspace_id, ad_account_id, object_level, object_ref,
        date_start, date_stop, currency, timezone_name,
        attribution_spec_hash, api_version, sync_run_id,
        spend_minor_units, impressions, clicks, click_metric_kind,
        conversions, conversion_event_ref, stability_status, fetched_at
      ) VALUES (
        ?1, ?2, ?3, 'ACCOUNT', ?4, ?5, ?5, 'EUR', 'Etc/UTC',
        'fixture-attribution-context', 'v25.0', 'sync_fixture_01',
        100, 100, 10, 'ALL_CLICKS', 1, 'fixture-purchase', 'STABLE', ?6
      )`
    )
      .bind(
        "insight_fixture_context_conflict",
        "ws_fixture_01",
        "aa_fixture_01",
        "fixture-ad-account-01",
        "2026-07-31",
        "2026-08-05T00:00:01Z"
      )
      .run();

    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/summary" +
        "?date_start=2026-07-31&date_stop=2026-08-02"
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: {
        code: "INCOMPATIBLE_METRIC_CONTEXT",
        retryable: false
      }
    });
  });

  it("enforces Workspace isolation, uniqueness, and metric constraints", async () => {
    await expect(
      env.DB.prepare(
        `INSERT INTO meta_ad_accounts (
          id, workspace_id, external_account_ref, currency,
          timezone_name, source_kind, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
        .bind(
          "aa_fixture_duplicate",
          "ws_fixture_01",
          "fixture-ad-account-01",
          "USD",
          "Etc/UTC",
          "FIXTURE",
          "2026-08-05T00:00:00Z"
        )
        .run()
    ).rejects.toThrow();

    await env.DB.prepare(
      `INSERT INTO workspaces (id, slug, display_name, created_at)
       VALUES (?1, ?2, ?3, ?4)`
    )
      .bind(
        "ws_fixture_constraints",
        "fixture-workspace-constraints",
        "虚构约束工作区",
        "2026-08-05T00:00:00Z"
      )
      .run();

    await expect(
      env.DB.prepare(
        `INSERT INTO sync_runs (
          id, workspace_id, ad_account_id, api_version,
          requested_start, requested_end, status, started_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
        .bind(
          "sync_cross_workspace",
          "ws_fixture_constraints",
          "aa_fixture_01",
          "v25.0",
          "2026-08-04",
          "2026-08-04",
          "PENDING",
          "2026-08-05T00:00:00Z"
        )
        .run()
    ).rejects.toThrow();

    await expect(
      env.DB.prepare(
        `UPDATE insights_daily
         SET spend_minor_units = -1
         WHERE id = ?1`
      )
        .bind("insight_fixture_01")
        .run()
    ).rejects.toThrow();
  });

  it("fails instead of silently truncating more than 10 offline accounts", async () => {
    const inserts = Array.from({ length: 10 }, (_, index) => {
      const suffix = String(index).padStart(2, "0");
      return env.DB.prepare(
        `INSERT INTO meta_ad_accounts (
          id, workspace_id, external_account_ref, currency,
          timezone_name, source_kind, created_at
        ) VALUES (?1, ?2, ?3, 'USD', 'Etc/UTC', 'FIXTURE', ?4)`
      ).bind(
        `aa_fixture_extra_${suffix}`,
        "ws_fixture_01",
        `fixture-ad-account-extra-${suffix}`,
        "2026-08-05T00:00:00Z"
      );
    });
    await env.DB.batch(inserts);

    const response = await dispatch(
      "/offline/v1/workspaces/ws_fixture_01/ad-accounts"
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "CAPACITY_EXCEEDED", retryable: false }
    });
  });
});
