import { REQUIRED_LIMITATIONS } from "../../.agents/skills/facebook-ads-analysis/scripts/evaluate-draft.mjs";
import {
  createAccountComparisonContext,
  createDirectChildBreakdownContext,
  createDirectChildDailyTrendContext,
  createObjectComparisonContext,
  createObjectDailyTrendContext,
} from "./fixture-contexts.mjs";

function evidenceValue(path, value) {
  return { path, value: structuredClone(value) };
}

function fact(code, statement, references) {
  return {
    claim_type: "FACT",
    code,
    statement,
    evidence_paths: references.map((reference) => reference.path),
    evidence_values: references,
  };
}

function unknownCounter() {
  return {
    claim_type: "UNKNOWN",
    code: "CAUSAL_COUNTER_EVIDENCE_UNAVAILABLE",
    statement: "当前 fixture 不包含实验或外部转化反证，因果关系保持未知。",
    evidence_paths: [],
    evidence_values: [],
  };
}

function driverDecomposition(context) {
  if (context.driver_inputs.kind === "NONE") {
    return { kind: "NONE", ranking_applied: false, items: [] };
  }
  return {
    kind: context.driver_inputs.kind,
    ranking_applied: false,
    items: context.driver_inputs.items.map((item, index) => {
      const path = `$.driver_inputs.items[${index}]`;
      return {
        object_ref: item.object.object_ref,
        statement: "该 fixture 子对象已完整纳入父对象对账。",
        evidence_paths: [path],
        evidence_values: [evidenceValue(path, item)],
      };
    }),
  };
}

function draft(context, executiveAnswer, evidence) {
  return {
    analysis_mode: "OFFLINE_FIXTURE_DRAFT",
    source_schema_version: context.schema_version,
    analysis_kind: context.analysis_kind,
    scope_and_freshness: structuredClone(context.scope_and_freshness),
    executive_answer: executiveAnswer,
    evidence,
    counter_evidence: [unknownCounter()],
    driver_decomposition: driverDecomposition(context),
    missing_data: structuredClone(context.unknowns),
    confidence: executiveAnswer.confidence,
    limitations: [...REQUIRED_LIMITATIONS],
    external_write: false,
  };
}

function accountComparisonCase() {
  const context = createAccountComparisonContext();
  const spendPath = "$.fact_evidence.changes.totals.spendMinorUnits";
  const conversionPath = "$.fact_evidence.changes.totals.conversions";
  const evidence = [
    fact("ACCOUNT_PERIOD_FACTS", "当前 fixture 周期的花费和报告转化均高于基线。", [
      evidenceValue(spendPath, context.fact_evidence.changes.totals.spendMinorUnits),
      evidenceValue(conversionPath, context.fact_evidence.changes.totals.conversions),
    ]),
  ];
  return {
    case_id: "EVAL-FBA-001",
    prompt: "比较 fixture 广告账户的当前周期与基线，只报告可核验事实。",
    context,
    draft: draft(
      context,
      {
        claim_type: "FACT",
        statement: "当前 fixture 周期的花费和报告转化均高于基线。",
        supporting_evidence_paths: [spendPath, conversionPath],
        confidence: "CONFIRMED",
        alternative_explanations: [],
      },
      evidence,
    ),
  };
}

function objectComparisonCase() {
  const context = createObjectComparisonContext();
  const subjectPath = "$.scope_and_freshness.subject.object.object_ref";
  const ctrPath = "$.fact_evidence.changes.derived.clickThroughRate";
  const evidence = [
    fact("OBJECT_PERIOD_FACTS", "该 fixture Campaign 的点击率在当前周期高于基线。", [
      evidenceValue(subjectPath, context.scope_and_freshness.subject.object.object_ref),
      evidenceValue(ctrPath, context.fact_evidence.changes.derived.clickThroughRate),
    ]),
  ];
  return {
    case_id: "EVAL-FBA-002",
    prompt: "说明 fixture Campaign 的周期变化，不使用业务阈值。",
    context,
    draft: draft(
      context,
      {
        claim_type: "FACT",
        statement: "该 fixture Campaign 的点击率在当前周期高于基线。",
        supporting_evidence_paths: [subjectPath, ctrPath],
        confidence: "CONFIRMED",
        alternative_explanations: [],
      },
      evidence,
    ),
  };
}

function directChildBreakdownCase() {
  const context = createDirectChildBreakdownContext();
  const reconciliationPath = "$.driver_inputs.reconciliation";
  const itemCountPath = "$.driver_inputs.items";
  const evidence = [
    fact("DIRECT_CHILD_PERIOD_RECONCILIATION", "两个直接子对象均已纳入两期父对象对账。", [
      evidenceValue(reconciliationPath, context.driver_inputs.reconciliation),
      evidenceValue(itemCountPath, context.driver_inputs.items),
    ]),
  ];
  return {
    case_id: "EVAL-FBA-003",
    prompt: "拆解 fixture Campaign 的直接 Ad Set，并保持稳定 ID 顺序。",
    context,
    draft: draft(
      context,
      {
        claim_type: "FACT",
        statement: "两个直接子对象均已纳入两期父对象对账。",
        supporting_evidence_paths: [reconciliationPath, itemCountPath],
        confidence: "CONFIRMED",
        alternative_explanations: [],
      },
      evidence,
    ),
  };
}

function objectDailyTrendCase() {
  const context = createObjectDailyTrendContext();
  const countPath = "$.fact_evidence.point_count";
  const dailyPath = "$.fact_evidence.daily_items";
  const evidence = [
    fact("OBJECT_DAILY_COVERAGE", "当前对象包含连续三日的完整 fixture 日值。", [
      evidenceValue(countPath, context.fact_evidence.point_count),
      evidenceValue(dailyPath, context.fact_evidence.daily_items),
    ]),
  ];
  return {
    case_id: "EVAL-FBA-004",
    prompt: "核对 fixture Campaign 的三日日值完整性，不解释趋势原因。",
    context,
    draft: draft(
      context,
      {
        claim_type: "FACT",
        statement: "当前对象包含连续三日的完整 fixture 日值。",
        supporting_evidence_paths: [countPath, dailyPath],
        confidence: "CONFIRMED",
        alternative_explanations: [],
      },
      evidence,
    ),
  };
}

function directChildDailyTrendCase() {
  const context = createDirectChildDailyTrendContext();
  const countPath = "$.fact_evidence.point_count";
  const reconciliationPath = "$.driver_inputs.reconciliation";
  const evidence = [
    fact("DIRECT_CHILD_DAILY_RECONCILIATION", "两个直接子对象的三日日值均与父对象完成对账。", [
      evidenceValue(countPath, context.fact_evidence.point_count),
      evidenceValue(reconciliationPath, context.driver_inputs.reconciliation),
    ]),
  ];
  return {
    case_id: "EVAL-FBA-005",
    prompt: "核对 fixture Campaign 直接 Ad Set 的逐日父子汇总。",
    context,
    draft: draft(
      context,
      {
        claim_type: "FACT",
        statement: "两个直接子对象的三日日值均与父对象完成对账。",
        supporting_evidence_paths: [countPath, reconciliationPath],
        confidence: "CONFIRMED",
        alternative_explanations: [],
      },
      evidence,
    ),
  };
}

export function createGoldenCases() {
  return [
    accountComparisonCase(),
    objectComparisonCase(),
    directChildBreakdownCase(),
    objectDailyTrendCase(),
    directChildDailyTrendCase(),
  ];
}
