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

const OBJECT_COMPARISON_PATH =
  "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01" +
  "/objects/ad_fixture_01/comparison";

const CAMPAIGN_CHILDREN_PATH =
  "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01" +
  "/objects/campaign_fixture_01/children-comparison";

const AD_SET_CHILDREN_PATH =
  "/offline/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01" +
  "/objects/adset_fixture_01/children-comparison";

const COMPARISON_QUERY =
  "?baseline_start=2026-08-02&baseline_stop=2026-08-02" +
  "&current_start=2026-08-04&current_stop=2026-08-04";

describe("offline fixture ad object analysis", () => {
  it("keeps every fixture hierarchy level reconciled to the account by day", async () => {
    const result = await env.DB.prepare(
      `SELECT
         date_start,
         SUM(CASE WHEN object_level = 'ACCOUNT' THEN spend_minor_units ELSE 0 END)
           AS account_spend,
         SUM(CASE WHEN object_level = 'CAMPAIGN' THEN spend_minor_units ELSE 0 END)
           AS campaign_spend,
         SUM(CASE WHEN object_level = 'AD_SET' THEN spend_minor_units ELSE 0 END)
           AS ad_set_spend,
         SUM(CASE WHEN object_level = 'AD' THEN spend_minor_units ELSE 0 END)
           AS ad_spend,
         SUM(CASE WHEN object_level = 'ACCOUNT' THEN impressions ELSE 0 END)
           AS account_impressions,
         SUM(CASE WHEN object_level = 'CAMPAIGN' THEN impressions ELSE 0 END)
           AS campaign_impressions,
         SUM(CASE WHEN object_level = 'AD_SET' THEN impressions ELSE 0 END)
           AS ad_set_impressions,
         SUM(CASE WHEN object_level = 'AD' THEN impressions ELSE 0 END)
           AS ad_impressions,
         SUM(CASE WHEN object_level = 'ACCOUNT' THEN clicks ELSE 0 END)
           AS account_clicks,
         SUM(CASE WHEN object_level = 'CAMPAIGN' THEN clicks ELSE 0 END)
           AS campaign_clicks,
         SUM(CASE WHEN object_level = 'AD_SET' THEN clicks ELSE 0 END)
           AS ad_set_clicks,
         SUM(CASE WHEN object_level = 'AD' THEN clicks ELSE 0 END)
           AS ad_clicks,
         SUM(CASE WHEN object_level = 'ACCOUNT' THEN conversions ELSE 0 END)
           AS account_conversions,
         SUM(CASE WHEN object_level = 'CAMPAIGN' THEN conversions ELSE 0 END)
           AS campaign_conversions,
         SUM(CASE WHEN object_level = 'AD_SET' THEN conversions ELSE 0 END)
           AS ad_set_conversions,
         SUM(CASE WHEN object_level = 'AD' THEN conversions ELSE 0 END)
           AS ad_conversions
       FROM insights_daily
       WHERE workspace_id = ?1
         AND ad_account_id = ?2
       GROUP BY date_start
       ORDER BY date_start`
    )
      .bind("ws_fixture_01", "aa_fixture_01")
      .all<Record<string, unknown>>();

    expect(result.results).toHaveLength(3);
    for (const row of result.results) {
      for (const metric of ["spend", "impressions", "clicks", "conversions"]) {
        expect(row[`campaign_${metric}`]).toBe(row[`account_${metric}`]);
        expect(row[`ad_set_${metric}`]).toBe(row[`account_${metric}`]);
        expect(row[`ad_${metric}`]).toBe(row[`account_${metric}`]);
      }
    }

    const counts = await env.DB.prepare(
      `SELECT object_level, COUNT(*) AS row_count
       FROM insights_daily
       WHERE workspace_id = ?1
         AND ad_account_id = ?2
       GROUP BY object_level
       ORDER BY object_level`
    )
      .bind("ws_fixture_01", "aa_fixture_01")
      .all<{ object_level: string; row_count: number }>();
    expect(counts.results).toEqual([
      { object_level: "ACCOUNT", row_count: 3 },
      { object_level: "AD", row_count: 12 },
      { object_level: "AD_SET", row_count: 6 },
      { object_level: "CAMPAIGN", row_count: 3 }
    ]);
  });

  it("compares a selected Ad with exact fixture scope and non-causal diagnostics", async () => {
    const response = await dispatch(
      `${OBJECT_COMPARISON_PATH}` +
        "?baseline_start=2026-08-02&baseline_stop=2026-08-02" +
        "&current_start=2026-08-04&current_stop=2026-08-04"
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        account: {
          id: "aa_fixture_01",
          insightRowCount: 3,
          sourceKind: "FIXTURE"
        },
        object: {
          id: "ad_fixture_01",
          externalObjectRef: "fixture-ad-01",
          objectLevel: "AD",
          parentObjectId: "adset_fixture_01",
          sourceKind: "FIXTURE"
        },
        baseline: {
          coverage: { expectedDays: 1, observedDays: 1, complete: true },
          totals: {
            spendMinorUnits: 3500,
            impressions: 2800,
            clicks: 60,
            conversions: 2
          },
          derived: { costPerConversionMinorUnits: 1750 }
        },
        current: {
          coverage: { expectedDays: 1, observedDays: 1, complete: true },
          totals: {
            spendMinorUnits: 4200,
            impressions: 3300,
            clicks: 95,
            conversions: 3
          },
          derived: { costPerConversionMinorUnits: 1400 }
        },
        changes: {
          totals: {
            conversions: {
              absoluteChange: 1,
              relativeChange: 0.5,
              direction: "INCREASED"
            }
          },
          derived: {
            costPerConversionMinorUnits: {
              absoluteChange: -350,
              relativeChange: -0.2,
              direction: "DECREASED"
            }
          }
        },
        diagnostics: [
          {
            code: "CTR_UP_CONVERSION_RATE_DOWN",
            findingConfidence: "CONFIRMED_PATTERN",
            causalClaim: false
          },
          {
            code: "CONVERSION_VOLUME_UP_COST_DOWN",
            findingConfidence: "CONFIRMED_PATTERN",
            causalClaim: false
          }
        ]
      },
      context: {
        workspaceId: "ws_fixture_01",
        adAccountId: "aa_fixture_01",
        objectId: "ad_fixture_01",
        objectLevel: "AD",
        parentObjectId: "adset_fixture_01",
        comparisonPolicy: {
          periodLengthDays: 1,
          periodsOverlap: false,
          thresholdsApplied: false,
          causalClaims: false
        },
        sourceKind: "FIXTURE"
      },
      warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
      nextCursor: null,
      truncated: false
    });
  });

  it("rejects invalid input, unknown objects, and cross-Workspace access", async () => {
    const invalidResponse = await dispatch(
      `${OBJECT_COMPARISON_PATH}` +
        "?baseline_start=2026-08-02&baseline_stop=2026-08-02" +
        "&current_start=2026-08-04&current_stop=2026-08-04&metric=spend"
    );
    expect(invalidResponse.status).toBe(400);
    expect(await invalidResponse.json()).toMatchObject({
      error: { code: "INVALID_ARGUMENT" }
    });

    const missingResponse = await dispatch(
      OBJECT_COMPARISON_PATH.replace("ad_fixture_01", "ad_fixture_missing") +
        "?baseline_start=2026-08-02&baseline_stop=2026-08-02" +
        "&current_start=2026-08-04&current_stop=2026-08-04"
    );
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toMatchObject({
      error: { code: "NOT_FOUND" }
    });

    await env.DB.prepare(
      `INSERT INTO workspaces (id, slug, display_name, created_at)
       VALUES (?1, ?2, ?3, ?4)`
    )
      .bind(
        "ws_fixture_object_analysis_scope",
        "fixture-object-analysis-scope",
        "虚构对象分析隔离工作区",
        "2026-08-07T00:00:00Z"
      )
      .run();
    const crossWorkspaceResponse = await dispatch(
      OBJECT_COMPARISON_PATH.replace(
        "ws_fixture_01",
        "ws_fixture_object_analysis_scope"
      ) +
        "?baseline_start=2026-08-02&baseline_stop=2026-08-02" +
        "&current_start=2026-08-04&current_stop=2026-08-04"
    );
    expect(crossWorkspaceResponse.status).toBe(404);
    expect(await crossWorkspaceResponse.json()).toMatchObject({
      error: { code: "NOT_FOUND" }
    });
  });

  it("distinguishes missing object data from incomplete daily coverage", async () => {
    const unavailableResponse = await dispatch(
      `${OBJECT_COMPARISON_PATH}` +
        "?baseline_start=2026-07-30&baseline_stop=2026-07-30" +
        "&current_start=2026-08-02&current_stop=2026-08-02"
    );
    expect(unavailableResponse.status).toBe(404);
    expect(await unavailableResponse.json()).toMatchObject({
      error: { code: "DATA_UNAVAILABLE" }
    });

    const incompleteResponse = await dispatch(
      `${OBJECT_COMPARISON_PATH}` +
        "?baseline_start=2026-08-01&baseline_stop=2026-08-02" +
        "&current_start=2026-08-03&current_stop=2026-08-04"
    );
    expect(incompleteResponse.status).toBe(409);
    expect(await incompleteResponse.json()).toMatchObject({
      error: { code: "INCOMPLETE_PERIOD_COVERAGE" }
    });
  });

  it("reconciles direct Ad Set changes to the selected Campaign", async () => {
    const response = await dispatch(`${CAMPAIGN_CHILDREN_PATH}${COMPARISON_QUERY}`);

    expect(response.status).toBe(200);
    const body = await response.json<{
      data: {
        items: Array<{ object: { id: string } }>;
      };
    }>();
    expect(body.data.items.map((item) => item.object.id)).toEqual([
      "adset_fixture_01",
      "adset_fixture_02"
    ]);
    expect(body).toMatchObject({
      ok: true,
      data: {
        account: { id: "aa_fixture_01", sourceKind: "FIXTURE" },
        parent: {
          id: "campaign_fixture_01",
          objectLevel: "CAMPAIGN",
          parentObjectId: null
        },
        baseline: {
          totals: {
            spendMinorUnits: 10000,
            impressions: 8000,
            clicks: 160,
            conversions: 4
          }
        },
        current: {
          totals: {
            spendMinorUnits: 12345,
            impressions: 10000,
            clicks: 250,
            conversions: 7
          }
        },
        items: [
          {
            object: {
              id: "adset_fixture_01",
              objectLevel: "AD_SET",
              parentObjectId: "campaign_fixture_01"
            },
            baseline: {
              totals: {
                spendMinorUnits: 6000,
                impressions: 4800,
                clicks: 100,
                conversions: 3
              }
            },
            current: {
              totals: {
                spendMinorUnits: 7000,
                impressions: 5600,
                clicks: 150,
                conversions: 5
              }
            }
          },
          {
            object: {
              id: "adset_fixture_02",
              objectLevel: "AD_SET",
              parentObjectId: "campaign_fixture_01"
            },
            baseline: { totals: { spendMinorUnits: 4000, conversions: 1 } },
            current: { totals: { spendMinorUnits: 5345, conversions: 2 } }
          }
        ],
        reconciliation: {
          additiveMetricKeys: [
            "spendMinorUnits",
            "impressions",
            "clicks",
            "conversions"
          ],
          baselineMatchesParent: true,
          currentMatchesParent: true
        }
      },
      context: {
        workspaceId: "ws_fixture_01",
        adAccountId: "aa_fixture_01",
        parentObjectId: "campaign_fixture_01",
        parentObjectLevel: "CAMPAIGN",
        childObjectLevel: "AD_SET",
        childCount: 2,
        comparisonPolicy: {
          periodLengthDays: 1,
          periodsOverlap: false,
          thresholdsApplied: false,
          causalClaims: false,
          rankingApplied: false
        },
        sourceKind: "FIXTURE"
      },
      warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
      nextCursor: null,
      truncated: false
    });
  });

  it("reconciles direct Ad changes to the selected Ad Set", async () => {
    const response = await dispatch(`${AD_SET_CHILDREN_PATH}${COMPARISON_QUERY}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: {
        parent: {
          id: "adset_fixture_01",
          objectLevel: "AD_SET",
          parentObjectId: "campaign_fixture_01"
        },
        items: [
          {
            object: {
              id: "ad_fixture_01",
              objectLevel: "AD",
              parentObjectId: "adset_fixture_01"
            }
          },
          {
            object: {
              id: "ad_fixture_02",
              objectLevel: "AD",
              parentObjectId: "adset_fixture_01"
            }
          }
        ],
        reconciliation: {
          baselineMatchesParent: true,
          currentMatchesParent: true
        }
      },
      context: { childObjectLevel: "AD", childCount: 2 }
    });
  });

  it("rejects leaf objects, unknown parents, and unexpected parameters", async () => {
    const leafResponse = await dispatch(
      `${CAMPAIGN_CHILDREN_PATH.replace("campaign_fixture_01", "ad_fixture_01")}` +
        COMPARISON_QUERY
    );
    expect(leafResponse.status).toBe(409);
    expect(await leafResponse.json()).toMatchObject({
      error: { code: "NO_CHILD_OBJECTS" }
    });

    const missingResponse = await dispatch(
      `${CAMPAIGN_CHILDREN_PATH.replace("campaign_fixture_01", "campaign_missing")}` +
        COMPARISON_QUERY
    );
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toMatchObject({
      error: { code: "NOT_FOUND" }
    });

    const invalidResponse = await dispatch(
      `${CAMPAIGN_CHILDREN_PATH}${COMPARISON_QUERY}&metric=spend`
    );
    expect(invalidResponse.status).toBe(400);
    expect(await invalidResponse.json()).toMatchObject({
      error: { code: "INVALID_ARGUMENT" }
    });
  });

  it("fails the whole breakdown when direct child totals no longer reconcile", async () => {
    await env.DB.prepare(
      `UPDATE insights_daily
       SET spend_minor_units = spend_minor_units + 1
       WHERE id = ?1`
    )
      .bind("insight_adset_01_20260804")
      .run();

    const response = await dispatch(`${CAMPAIGN_CHILDREN_PATH}${COMPARISON_QUERY}`);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_OBJECT_ROLLUP" }
    });
  });

  it("fails the whole breakdown for missing, incomplete, or incompatible child data", async () => {
    const unavailableResponse = await dispatch(
      `${CAMPAIGN_CHILDREN_PATH}` +
        "?baseline_start=2026-07-30&baseline_stop=2026-07-30" +
        "&current_start=2026-08-02&current_stop=2026-08-02"
    );
    expect(unavailableResponse.status).toBe(404);
    expect(await unavailableResponse.json()).toMatchObject({
      error: { code: "DATA_UNAVAILABLE" }
    });

    const incompleteResponse = await dispatch(
      `${CAMPAIGN_CHILDREN_PATH}` +
        "?baseline_start=2026-08-01&baseline_stop=2026-08-02" +
        "&current_start=2026-08-03&current_stop=2026-08-04"
    );
    expect(incompleteResponse.status).toBe(409);
    expect(await incompleteResponse.json()).toMatchObject({
      error: { code: "INCOMPLETE_PERIOD_COVERAGE" }
    });

    await env.DB.prepare(
      `UPDATE insights_daily
       SET conversion_event_ref = ?1
       WHERE id = ?2`
    )
      .bind("fixture-other-event", "insight_adset_01_20260804")
      .run();
    const incompatibleResponse = await dispatch(
      `${CAMPAIGN_CHILDREN_PATH}${COMPARISON_QUERY}`
    );
    expect(incompatibleResponse.status).toBe(409);
    expect(await incompatibleResponse.json()).toMatchObject({
      error: { code: "INCOMPATIBLE_METRIC_CONTEXT" }
    });
  });
});
