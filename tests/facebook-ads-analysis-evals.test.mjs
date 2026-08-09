import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  InvalidOfflineAnalysisDraft,
  evaluateOfflineAnalysisDraft,
} from "../.agents/skills/facebook-ads-analysis/scripts/evaluate-draft.mjs";
import { createGoldenCases } from "../evals/facebook-ads-analysis/golden-cases.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = resolve(
  ROOT,
  ".agents/skills/facebook-ads-analysis/scripts/evaluate-draft.mjs",
);

describe("facebook-ads-analysis deterministic draft evals", () => {
  it("passes fixed golden drafts for all five analysis kinds", () => {
    const results = createGoldenCases().map(({ context, draft }) =>
      evaluateOfflineAnalysisDraft(context, draft),
    );

    expect(results.map((result) => result.analysis_kind)).toEqual([
      "ACCOUNT_COMPARISON",
      "OBJECT_COMPARISON",
      "DIRECT_CHILD_BREAKDOWN",
      "OBJECT_DAILY_TREND",
      "DIRECT_CHILD_DAILY_TREND",
    ]);
    expect(results.every((result) => result.evaluation_status === "PASS")).toBe(
      true,
    );
    expect(results.every((result) => result.score.ratio === 1)).toBe(true);
  });

  it("rejects source schema, analysis kind, or scope drift", () => {
    const schemaCase = createGoldenCases()[0];
    schemaCase.draft.source_schema_version =
      "facebook-ads-offline-analysis-context/v1";
    expect(() =>
      evaluateOfflineAnalysisDraft(schemaCase.context, schemaCase.draft),
    ).toThrow(/source_schema_version/);

    const kindCase = createGoldenCases()[0];
    kindCase.draft.analysis_kind = "OBJECT_COMPARISON";
    expect(() =>
      evaluateOfflineAnalysisDraft(kindCase.context, kindCase.draft),
    ).toThrow(/analysis_kind/);

    const scopeCase = createGoldenCases()[0];
    scopeCase.draft.scope_and_freshness.account_ref =
      "fixture-ad-account-02";
    expect(() =>
      evaluateOfflineAnalysisDraft(scopeCase.context, scopeCase.draft),
    ).toThrow(/scope_and_freshness/);
  });

  it("rejects a fabricated evidence path", () => {
    const evalCase = createGoldenCases()[0];
    const path = "$.fact_evidence.changes.totals.missingMetric";
    evalCase.draft.evidence[0].evidence_paths[0] = path;
    evalCase.draft.evidence[0].evidence_values[0].path = path;

    expect(() =>
      evaluateOfflineAnalysisDraft(evalCase.context, evalCase.draft),
    ).toThrowError(InvalidOfflineAnalysisDraft);
    expect(() =>
      evaluateOfflineAnalysisDraft(evalCase.context, evalCase.draft),
    ).toThrow(/evidence path 不存在/);

    const inheritedCase = createGoldenCases()[0];
    inheritedCase.draft.evidence[0].evidence_paths[0] =
      "$.fact_evidence.constructor";
    inheritedCase.draft.evidence[0].evidence_values[0].path =
      "$.fact_evidence.constructor";
    expect(() =>
      evaluateOfflineAnalysisDraft(inheritedCase.context, inheritedCase.draft),
    ).toThrow(/evidence path 不存在/);
  });

  it("rejects an evidence value that differs from its source path", () => {
    const evalCase = createGoldenCases()[0];
    evalCase.draft.evidence[0].evidence_values[0].value.current = 99_999;

    expect(() =>
      evaluateOfflineAnalysisDraft(evalCase.context, evalCase.draft),
    ).toThrow(/与输入 evidence path 的值不一致/);
  });

  it("rejects an executive evidence path not represented in evidence", () => {
    const evalCase = createGoldenCases()[0];
    evalCase.draft.executive_answer.supporting_evidence_paths = [
      "$.fact_evidence.baseline",
    ];

    expect(() =>
      evaluateOfflineAnalysisDraft(evalCase.context, evalCase.draft),
    ).toThrow(/executive path 未在 evidence 中落地/);
  });

  it("rejects deleted or rewritten source UNKNOWN items", () => {
    const deletedCase = createGoldenCases()[0];
    deletedCase.draft.missing_data.pop();
    expect(() =>
      evaluateOfflineAnalysisDraft(deletedCase.context, deletedCase.draft),
    ).toThrow(/不得删除输入中的 UNKNOWN/);

    const rewrittenCase = createGoldenCases()[0];
    rewrittenCase.draft.missing_data[0].statement = "已确认没有因果因素。";
    expect(() =>
      evaluateOfflineAnalysisDraft(rewrittenCase.context, rewrittenCase.draft),
    ).toThrow(/必须原样、按原顺序保留/);
  });

  it("accepts only TASK_* additions after every source UNKNOWN", () => {
    const evalCase = createGoldenCases()[0];
    evalCase.draft.missing_data.push({
      claim_type: "UNKNOWN",
      code: "TASK_PRIMARY_KPI_NOT_PROVIDED",
      statement: "当前问题没有提供业务主 KPI。",
    });

    expect(
      evaluateOfflineAnalysisDraft(evalCase.context, evalCase.draft)
        .evaluation_status,
    ).toBe("PASS");

    evalCase.draft.missing_data.at(-1).code = "PRIMARY_KPI_NOT_PROVIDED";
    expect(() =>
      evaluateOfflineAnalysisDraft(evalCase.context, evalCase.draft),
    ).toThrow(/TASK_\*/);
  });

  it("rejects an incomplete direct-child decomposition", () => {
    const evalCase = createGoldenCases()[2];
    evalCase.draft.driver_decomposition.items.pop();

    expect(() =>
      evaluateOfflineAnalysisDraft(evalCase.context, evalCase.draft),
    ).toThrow(/完整覆盖全部直接子对象/);
  });

  it("rejects ranking or forbidden recommendation fields", () => {
    const rankedCase = createGoldenCases()[2];
    rankedCase.draft.driver_decomposition.ranking_applied = true;
    expect(() =>
      evaluateOfflineAnalysisDraft(rankedCase.context, rankedCase.draft),
    ).toThrow(/ranking_applied/);

    const actionCase = createGoldenCases()[0];
    actionCase.draft.recommended_actions = [];
    expect(() =>
      evaluateOfflineAnalysisDraft(actionCase.context, actionCase.draft),
    ).toThrow(/禁止的敏感、排名、建议/);
  });

  it("rejects causal, ranking, or executable optimization language", () => {
    const causalCase = createGoldenCases()[0];
    causalCase.draft.executive_answer.statement =
      "点击率变化导致报告转化变化。";
    expect(() =>
      evaluateOfflineAnalysisDraft(causalCase.context, causalCase.draft),
    ).toThrow(/因果、排名或可执行优化措辞/);

    const writeCase = createGoldenCases()[0];
    writeCase.draft.evidence[0].statement = "应提高预算并暂停广告。";
    expect(() =>
      evaluateOfflineAnalysisDraft(writeCase.context, writeCase.draft),
    ).toThrow(/因果、排名或可执行优化措辞/);

    const negatedRankingCase = createGoldenCases()[2];
    negatedRankingCase.draft.executive_answer.statement =
      "两个直接子对象按输入顺序列出，未应用排名。";
    expect(() =>
      evaluateOfflineAnalysisDraft(
        negatedRankingCase.context,
        negatedRankingCase.draft,
      ),
    ).toThrow(/因果、排名或可执行优化措辞/);
  });

  it("evaluates a stdin envelope without writing files or calling external tools", () => {
    const evalCase = createGoldenCases()[4];
    const result = spawnSync(process.execPath, [SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify({ context: evalCase.context, draft: evalCase.draft }),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      evaluation_status: "PASS",
      analysis_kind: "DIRECT_CHILD_DAILY_TREND",
      score: { passed: 8, total: 8, ratio: 1 },
      external_write: false,
    });
  });

  it("returns a safe rejected CLI envelope for an invalid draft", () => {
    const evalCase = createGoldenCases()[0];
    evalCase.draft.external_write = true;
    const result = spawnSync(process.execPath, [SCRIPT, "-"], {
      cwd: ROOT,
      input: JSON.stringify({ context: evalCase.context, draft: evalCase.draft }),
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      evaluation_status: "REJECTED",
      code: "INVALID_OFFLINE_ANALYSIS_DRAFT",
      path: "$.external_write",
      external_write: false,
    });
  });
});
