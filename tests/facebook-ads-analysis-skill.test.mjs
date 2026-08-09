import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  InvalidOfflineAnalysisContext,
  buildOfflineAnalysisPreflight,
  validateOfflineAnalysisContext,
} from "../.agents/skills/facebook-ads-analysis/scripts/validate-context.mjs";
import {
  createAccountComparisonContext,
  createAllFixtureContexts,
  createDirectChildDailyTrendContext,
  dailyItem,
} from "../evals/facebook-ads-analysis/fixture-contexts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = resolve(
  ROOT,
  ".agents/skills/facebook-ads-analysis/scripts/validate-context.mjs",
);

describe("facebook-ads-analysis Skill", () => {
  it("validates a schema v2 comparison and emits facts without inventing inference", () => {
    const context = createAccountComparisonContext();

    expect(validateOfflineAnalysisContext(context)).toBe(context);
    const preflight = buildOfflineAnalysisPreflight(context);

    expect(preflight.validation_status).toBe("PASS");
    expect(preflight.facts.map((fact) => fact.code)).toContain(
      "CONVERSION_VOLUME_UP_COST_DOWN",
    );
    expect(preflight.inference.status).toBe("NOT_GENERATED");
    expect(preflight.guardrails).toMatchObject({
      causal_claims: false,
      ranking_applied: false,
      recommendations_generated: false,
      external_write: false,
    });
  });

  it("validates a complete direct-child daily trend and its daily reconciliation", () => {
    const context = createDirectChildDailyTrendContext();
    const preflight = buildOfflineAnalysisPreflight(context);

    expect(preflight.analysis_kind).toBe("DIRECT_CHILD_DAILY_TREND");
    expect(preflight.facts.map((fact) => fact.code)).toContain(
      "DIRECT_CHILDREN_RECONCILED",
    );
  });

  it("accepts all five schema v2 analysis kinds with their required subject and driver shapes", () => {
    expect(
      createAllFixtureContexts().map(
        (context) => validateOfflineAnalysisContext(context).analysis_kind,
      ),
    ).toEqual([
      "ACCOUNT_COMPARISON",
      "OBJECT_COMPARISON",
      "DIRECT_CHILD_BREAKDOWN",
      "OBJECT_DAILY_TREND",
      "DIRECT_CHILD_DAILY_TREND",
    ]);
  });

  it("rejects any attempt to enable a real data connection", () => {
    const context = createAccountComparisonContext();
    context.guardrails.real_data_connected = true;

    expect(() => validateOfflineAnalysisContext(context)).toThrow(
      /real_data_connected/,
    );
  });

  it("rejects a derived metric that cannot be recomputed", () => {
    const context = createDirectChildDailyTrendContext();
    context.fact_evidence.daily_items[0].derived.clickThroughRate += 0.1;

    expect(() => validateOfflineAnalysisContext(context)).toThrow(
      /重新计算结果不一致/,
    );
  });

  it("rejects a deterministic pattern set that does not match the comparison facts", () => {
    const context = createAccountComparisonContext();
    context.observed_patterns = context.observed_patterns.slice(1);

    expect(() => validateOfflineAnalysisContext(context)).toThrow(
      /pattern 集合与 comparison 事实不一致/,
    );
  });

  it("rejects a direct-child daily rollup mismatch", () => {
    const context = createDirectChildDailyTrendContext();
    context.driver_inputs.items[0].daily_items[0] = dailyItem(
      "2026-08-02",
      6_001,
      4_800,
      100,
      3,
    );

    expect(() => validateOfflineAnalysisContext(context)).toThrow(
      /汇总与父对象不一致/,
    );
  });

  it("rejects request tracking or sensitive keys at any depth", () => {
    const context = createAccountComparisonContext();
    context.scope_and_freshness.request_id = "fixture-request";

    expect(() => validateOfflineAnalysisContext(context)).toThrowError(
      InvalidOfflineAnalysisContext,
    );
    expect(() => validateOfflineAnalysisContext(context)).toThrow(
      /禁止的敏感或请求追踪字段/,
    );
  });

  it("rejects superseded schema versions", () => {
    const context = createAccountComparisonContext();
    context.schema_version = "facebook-ads-offline-analysis-context/v1";

    expect(() => validateOfflineAnalysisContext(context)).toThrow(
      /schema_version/,
    );
  });

  it("supports stdin without writing files and returns a safe preflight", () => {
    const result = spawnSync(process.execPath, [SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify(createAccountComparisonContext()),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      validation_status: "PASS",
      guardrails: {
        external_write: false,
        recommendations_generated: false,
      },
    });
  });

  it("keeps discovery metadata explicit-only and free of external dependencies", () => {
    const skill = readFileSync(
      resolve(ROOT, ".agents/skills/facebook-ads-analysis/SKILL.md"),
      "utf8",
    );
    const metadata = readFileSync(
      resolve(
        ROOT,
        ".agents/skills/facebook-ads-analysis/agents/openai.yaml",
      ),
      "utf8",
    );

    expect(skill).toContain("name: facebook-ads-analysis");
    expect(skill).toContain("FACT / INFERENCE / UNKNOWN");
    expect(skill).not.toContain("[TODO:");
    expect(metadata).toContain("allow_implicit_invocation: false");
    expect(metadata).not.toContain("dependencies:");
  });
});
