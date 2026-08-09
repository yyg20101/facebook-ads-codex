import {
  createAccountComparisonContext,
  createDirectChildBreakdownContext,
  createDirectChildDailyTrendContext,
  createObjectComparisonContext,
  createObjectDailyTrendContext,
} from "./fixture-contexts.mjs";

export const FORWARD_TEST_CASE_SCHEMA_VERSION =
  "facebook-ads-analysis-forward-test-case/v1";

const CASE_DEFINITIONS = [
  {
    case_id: "FWD-FBA-001",
    analysis_kind: "ACCOUNT_COMPARISON",
    prompt:
      "使用 $facebook-ads-analysis 分析下面的离线 fixture 账户周期上下文，说明当前周期与基线有哪些可以从证据直接确认的变化。",
    createContext: createAccountComparisonContext,
  },
  {
    case_id: "FWD-FBA-002",
    analysis_kind: "OBJECT_COMPARISON",
    prompt:
      "使用 $facebook-ads-analysis 分析下面的离线 fixture Campaign 周期上下文，说明该对象发生了哪些可核验变化。",
    createContext: createObjectComparisonContext,
  },
  {
    case_id: "FWD-FBA-003",
    analysis_kind: "DIRECT_CHILD_BREAKDOWN",
    prompt:
      "使用 $facebook-ads-analysis 分析下面的离线 fixture Campaign 直接子对象上下文，说明父对象与各 Ad Set 之间可以确认的事实。",
    createContext: createDirectChildBreakdownContext,
  },
  {
    case_id: "FWD-FBA-004",
    analysis_kind: "OBJECT_DAILY_TREND",
    prompt:
      "使用 $facebook-ads-analysis 分析下面的离线 fixture Campaign 日级上下文，说明这段日期范围内可以直接确认的事实。",
    createContext: createObjectDailyTrendContext,
  },
  {
    case_id: "FWD-FBA-005",
    analysis_kind: "DIRECT_CHILD_DAILY_TREND",
    prompt:
      "使用 $facebook-ads-analysis 分析下面的离线 fixture Campaign 直接子对象日级上下文，说明逐日数据与父子汇总能够支持哪些事实。",
    createContext: createDirectChildDailyTrendContext,
  },
];

const FORBIDDEN_EVALUATION_ASSETS = [
  "evals/facebook-ads-analysis/golden-cases.mjs",
  "tests/facebook-ads-analysis-evals.test.mjs",
  "tests/facebook-ads-analysis-forward-test.test.mjs",
  "scripts/score-facebook-ads-analysis-forward-test.mjs",
];

export function listForwardTestCases() {
  return CASE_DEFINITIONS.map(({ case_id, analysis_kind, prompt }) => ({
    case_id,
    analysis_kind,
    prompt,
  }));
}

export function createForwardTestCase(caseId) {
  const definition = CASE_DEFINITIONS.find((item) => item.case_id === caseId);
  if (!definition) {
    throw new Error(`未知 forward-test case: ${String(caseId)}`);
  }

  const context = definition.createContext();
  if (context.analysis_kind !== definition.analysis_kind) {
    throw new Error(`${definition.case_id}: analysis_kind 与 fixture 不一致`);
  }

  return {
    schema_version: FORWARD_TEST_CASE_SCHEMA_VERSION,
    case_id: definition.case_id,
    prompt: definition.prompt,
    context,
    protocol: {
      execution_mode: "FRESH_CODEX_SESSION",
      fresh_session_required: true,
      explicit_skill_invocation_required: true,
      expected_output_withheld: true,
      local_skill_validator_allowed: true,
      external_connections_allowed: false,
      repository_result_persistence_allowed: false,
      forbidden_evaluation_assets: [...FORBIDDEN_EVALUATION_ASSETS],
    },
  };
}
