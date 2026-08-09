import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const INPUT_SCHEMA_VERSION = "facebook-ads-optimization-context/v1";
export const PREFLIGHT_SCHEMA_VERSION = "facebook-ads-optimization-preflight/v1";

const TOP_LEVEL_KEYS = [
  "schema_version", "artifact_type", "source_kind", "scenario_id", "scope",
  "evidence", "test_plan", "validity", "variants", "allowed_action_types",
  "review_window", "known_constraints", "unknowns", "guardrails", "codex_handoff",
];
const SCOPE_KEYS = ["workspace_ref", "account_ref", "object_ref", "object_type"];
const EVIDENCE_KEYS = ["evidence_ref", "claim_type", "statement", "source_paths"];
const TEST_PLAN_KEYS = [
  "test_ref", "hypothesis", "primary_variable", "primary_metric",
  "guardrail_metrics", "allocation_rule", "rule_evaluation",
];
const RULE_EVALUATION_KEYS = ["state", "statement", "evidence_refs"];
const VALIDITY_KEYS = [
  "tracking_state", "mid_test_configuration_change", "allocation_state",
  "sample_state", "comparison_window_complete",
];
const VARIANT_KEYS = ["variant_ref", "label", "metrics"];
const METRIC_KEYS = [
  "spend_minor", "impressions", "clicks", "conversions",
  "conversion_value_minor", "currency",
];
const REVIEW_WINDOW_KEYS = ["start_date", "end_date", "next_review_date"];
const UNKNOWN_KEYS = ["claim_type", "code", "statement"];
const GUARDRAIL_KEYS = [
  "fixture_data_only", "meta_connection_allowed", "causal_claims_allowed",
  "automatic_actions_allowed", "change_request_allowed", "external_write", "persisted",
];
const HANDOFF_KEYS = ["intended_skill", "mode", "context_only", "target_web_area"];

const SCENARIOS = new Set(["SC-02", "SC-03"]);
const OBJECT_TYPES = new Set(["ACCOUNT", "CAMPAIGN", "AD_SET", "AD"]);
const PRIMARY_VARIABLES = new Set(["CREATIVE", "AUDIENCE", "PLACEMENT", "OFFER"]);
const METRICS = new Set([
  "SPEND", "IMPRESSIONS", "CLICKS", "CONVERSIONS", "CONVERSION_VALUE",
  "CTR", "COST_PER_CONVERSION", "ROAS",
]);
const RULE_STATES = new Set([
  "SUPPORTS_KEEP", "SUPPORTS_STOP", "SUPPORTS_ITERATE", "INCONCLUSIVE",
]);
const TRACKING_STATES = new Set(["STABLE", "DEGRADED", "FAILED"]);
const ALLOCATION_STATES = new Set(["AS_PLANNED", "DEVIATED", "UNKNOWN"]);
const SAMPLE_STATES = new Set(["SUFFICIENT", "INSUFFICIENT", "UNKNOWN"]);
const CURRENCIES = new Set(["CNY", "USD"]);
const ALLOWED_ACTIONS = new Set([
  "CONTINUE_OBSERVATION", "COLLECT_DATA", "DRAFT_NEXT_TEST", "REQUEST_HUMAN_REVIEW",
  "PROPOSE_PAUSE", "PROPOSE_ENABLE", "PROPOSE_BUDGET_CHANGE",
  "PROPOSE_SCHEDULE_CHANGE", "PROPOSE_CREATIVE_CHANGE",
]);
const INCONCLUSIVE_ACTIONS = new Set([
  "CONTINUE_OBSERVATION", "COLLECT_DATA", "DRAFT_NEXT_TEST", "REQUEST_HUMAN_REVIEW",
]);
const EVIDENCE_ROOTS = ["$.test_plan", "$.validity", "$.variants", "$.review_window"];
const FORBIDDEN_NORMALIZED_KEYS = new Set([
  "authorization", "authorizationheader", "accesstoken", "refreshtoken",
  "clientsecret", "token", "secret", "password", "cookie", "requestid",
  "customerid", "accountid", "adaccountid", "metaaccountid", "userid",
  "changerequestid", "toolcall", "mcpcall", "writeparameters", "endpoint", "url",
  "publish", "pause", "enable", "budgetchange", "bidchange", "statuschange",
]);
const FORBIDDEN_STRING_PATTERNS = [
  /https?:\/\//iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/iu,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/u,
];

export class InvalidOptimizationContext extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidOptimizationContext";
    this.code = "INVALID_OPTIMIZATION_CONTEXT";
    this.path = path;
  }
}

function fail(path, reason) { throw new InvalidOptimizationContext(path, reason); }
function normalizeKey(key) { return key.toLowerCase().replaceAll(/[^a-z0-9]/gu, ""); }

function assertNoSensitiveContent(value, path = "$", keyName = null) {
  if (keyName && FORBIDDEN_NORMALIZED_KEYS.has(normalizeKey(keyName))) {
    fail(path, "包含敏感、真实账户、可执行广告动作或外部操作字段");
  }
  if (typeof value === "string") {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) fail(path, "包含 URL、凭据或私钥样式内容");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveContent(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, nested] of Object.entries(value)) assertNoSensitiveContent(nested, `${path}.${key}`, key);
}

function asRecord(value, path) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "必须是 object");
  return value;
}

function exactRecord(value, keys, path) {
  const record = asRecord(value, path); const actual = Object.keys(record);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) fail(path, `字段必须且只能为 ${keys.join(", ")}`);
  return record;
}

function literal(value, expected, path) { if (value !== expected) fail(path, `必须为 ${JSON.stringify(expected)}`); }
function stringValue(value, path, { min = 1, max = 400 } = {}) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) fail(path, `必须是 ${min}-${max} 个字符的 string`);
  return value;
}

function fixtureRef(value, path, prefixes = ["fixture-"]) {
  stringValue(value, path, { max: 100 });
  if (!prefixes.some((prefix) => value.startsWith(prefix))) fail(path, `必须使用 fixture ref 前缀: ${prefixes.join(", ")}`);
  return value;
}

function enumValue(value, allowed, path) { if (!allowed.has(value)) fail(path, `不支持的值 ${JSON.stringify(value)}`); return value; }
function integer(value, path, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) fail(path, `必须是 ${min}-${max} 的 integer`);
  return value;
}

function uniqueStringArray(value, path, { min = 0, max = 30, allowed = null } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(path, `必须是长度 ${min}-${max} 的 array`);
  value.forEach((item, index) => {
    stringValue(item, `${path}[${index}]`, { max: 180 });
    if (allowed && !allowed.has(item)) fail(`${path}[${index}]`, "值不在允许集合中");
  });
  if (new Set(value).size !== value.length) fail(path, "不得包含重复项");
  return value;
}

function isoDate(value, path) {
  stringValue(value, path, { min: 10, max: 10 });
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) fail(path, "必须为 YYYY-MM-DD");
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) fail(path, "必须是真实存在的日期");
  return value;
}

function sourcePaths(value, path) {
  uniqueStringArray(value, path, { min: 1, max: 12 });
  value.forEach((entry, index) => {
    if (!EVIDENCE_ROOTS.some((root) => entry === root || entry.startsWith(`${root}.`) || entry.startsWith(`${root}[`))) fail(`${path}[${index}]`, "必须引用允许的输入事实路径");
    if (entry.includes("..") || /[^A-Za-z0-9_$.[\]-]/u.test(entry)) fail(`${path}[${index}]`, "不是稳定的 JSON path");
  });
  return value;
}

function fact(path, value) { return { claim_type: "FACT", path, value: structuredClone(value) }; }
function issue(code, path, statement) { return { code, path, statement }; }

export function validateOptimizationContext(value) {
  assertNoSensitiveContent(value);
  const context = exactRecord(value, TOP_LEVEL_KEYS, "$input");
  literal(context.schema_version, INPUT_SCHEMA_VERSION, "$.schema_version");
  literal(context.artifact_type, "CODEX_OPTIMIZATION_INPUT", "$.artifact_type");
  literal(context.source_kind, "FIXTURE", "$.source_kind");
  enumValue(context.scenario_id, SCENARIOS, "$.scenario_id");

  const scope = exactRecord(context.scope, SCOPE_KEYS, "$.scope");
  fixtureRef(scope.workspace_ref, "$.scope.workspace_ref", ["ws_fixture_"]);
  fixtureRef(scope.account_ref, "$.scope.account_ref");
  fixtureRef(scope.object_ref, "$.scope.object_ref");
  enumValue(scope.object_type, OBJECT_TYPES, "$.scope.object_type");

  if (!Array.isArray(context.evidence) || context.evidence.length < 1 || context.evidence.length > 30) fail("$.evidence", "必须是长度 1-30 的 array");
  const evidenceRefs = new Set();
  context.evidence.forEach((entry, index) => {
    const path = `$.evidence[${index}]`; const item = exactRecord(entry, EVIDENCE_KEYS, path);
    fixtureRef(item.evidence_ref, `${path}.evidence_ref`);
    if (evidenceRefs.has(item.evidence_ref)) fail(`${path}.evidence_ref`, "evidence_ref 不得重复");
    evidenceRefs.add(item.evidence_ref);
    literal(item.claim_type, "FACT", `${path}.claim_type`);
    stringValue(item.statement, `${path}.statement`, { max: 500 });
    sourcePaths(item.source_paths, `${path}.source_paths`);
  });

  const testPlan = exactRecord(context.test_plan, TEST_PLAN_KEYS, "$.test_plan");
  fixtureRef(testPlan.test_ref, "$.test_plan.test_ref");
  stringValue(testPlan.hypothesis, "$.test_plan.hypothesis", { max: 500 });
  enumValue(testPlan.primary_variable, PRIMARY_VARIABLES, "$.test_plan.primary_variable");
  enumValue(testPlan.primary_metric, METRICS, "$.test_plan.primary_metric");
  uniqueStringArray(testPlan.guardrail_metrics, "$.test_plan.guardrail_metrics", { min: 1, max: 5, allowed: METRICS });
  if (testPlan.guardrail_metrics.includes(testPlan.primary_metric)) fail("$.test_plan.guardrail_metrics", "不得与 primary_metric 重复");
  stringValue(testPlan.allocation_rule, "$.test_plan.allocation_rule", { max: 400 });
  const rule = exactRecord(testPlan.rule_evaluation, RULE_EVALUATION_KEYS, "$.test_plan.rule_evaluation");
  enumValue(rule.state, RULE_STATES, "$.test_plan.rule_evaluation.state");
  stringValue(rule.statement, "$.test_plan.rule_evaluation.statement", { max: 500 });
  uniqueStringArray(rule.evidence_refs, "$.test_plan.rule_evaluation.evidence_refs", { min: 1, max: 20 });
  rule.evidence_refs.forEach((ref, index) => {
    fixtureRef(ref, `$.test_plan.rule_evaluation.evidence_refs[${index}]`);
    if (!evidenceRefs.has(ref)) fail(`$.test_plan.rule_evaluation.evidence_refs[${index}]`, "必须引用已声明 evidence_ref");
  });

  const validity = exactRecord(context.validity, VALIDITY_KEYS, "$.validity");
  enumValue(validity.tracking_state, TRACKING_STATES, "$.validity.tracking_state");
  if (typeof validity.mid_test_configuration_change !== "boolean") fail("$.validity.mid_test_configuration_change", "必须是 boolean");
  enumValue(validity.allocation_state, ALLOCATION_STATES, "$.validity.allocation_state");
  enumValue(validity.sample_state, SAMPLE_STATES, "$.validity.sample_state");
  if (typeof validity.comparison_window_complete !== "boolean") fail("$.validity.comparison_window_complete", "必须是 boolean");

  if (!Array.isArray(context.variants) || context.variants.length < 2 || context.variants.length > 5) fail("$.variants", "必须是长度 2-5 的 array");
  const variantRefs = new Set(); const currencies = new Set();
  context.variants.forEach((entry, index) => {
    const path = `$.variants[${index}]`; const item = exactRecord(entry, VARIANT_KEYS, path);
    fixtureRef(item.variant_ref, `${path}.variant_ref`);
    if (variantRefs.has(item.variant_ref)) fail(`${path}.variant_ref`, "variant_ref 不得重复");
    variantRefs.add(item.variant_ref);
    stringValue(item.label, `${path}.label`, { max: 100 });
    const metrics = exactRecord(item.metrics, METRIC_KEYS, `${path}.metrics`);
    integer(metrics.spend_minor, `${path}.metrics.spend_minor`);
    integer(metrics.impressions, `${path}.metrics.impressions`);
    integer(metrics.clicks, `${path}.metrics.clicks`);
    integer(metrics.conversions, `${path}.metrics.conversions`);
    integer(metrics.conversion_value_minor, `${path}.metrics.conversion_value_minor`);
    enumValue(metrics.currency, CURRENCIES, `${path}.metrics.currency`);
    currencies.add(metrics.currency);
  });
  if (currencies.size !== 1) fail("$.variants", "全部变体 currency 必须一致");

  uniqueStringArray(context.allowed_action_types, "$.allowed_action_types", { min: 1, max: ALLOWED_ACTIONS.size, allowed: ALLOWED_ACTIONS });
  const window = exactRecord(context.review_window, REVIEW_WINDOW_KEYS, "$.review_window");
  isoDate(window.start_date, "$.review_window.start_date");
  isoDate(window.end_date, "$.review_window.end_date");
  isoDate(window.next_review_date, "$.review_window.next_review_date");
  if (window.end_date < window.start_date) fail("$.review_window", "end_date 不得早于 start_date");
  if (window.next_review_date <= window.end_date) fail("$.review_window.next_review_date", "必须晚于 end_date");
  uniqueStringArray(context.known_constraints, "$.known_constraints", { max: 30 });

  if (!Array.isArray(context.unknowns) || context.unknowns.length > 30) fail("$.unknowns", "必须是长度 0-30 的 array");
  const unknownCodes = new Set();
  context.unknowns.forEach((entry, index) => {
    const path = `$.unknowns[${index}]`; const item = exactRecord(entry, UNKNOWN_KEYS, path);
    literal(item.claim_type, "UNKNOWN", `${path}.claim_type`);
    stringValue(item.code, `${path}.code`, { max: 80 });
    if (!/^[A-Z][A-Z0-9_]*$/u.test(item.code)) fail(`${path}.code`, "必须使用大写下划线 code");
    if (unknownCodes.has(item.code)) fail(`${path}.code`, "code 不得重复");
    unknownCodes.add(item.code);
    stringValue(item.statement, `${path}.statement`, { max: 300 });
  });

  const guardrails = exactRecord(context.guardrails, GUARDRAIL_KEYS, "$.guardrails");
  literal(guardrails.fixture_data_only, true, "$.guardrails.fixture_data_only");
  literal(guardrails.meta_connection_allowed, false, "$.guardrails.meta_connection_allowed");
  literal(guardrails.causal_claims_allowed, false, "$.guardrails.causal_claims_allowed");
  literal(guardrails.automatic_actions_allowed, false, "$.guardrails.automatic_actions_allowed");
  literal(guardrails.change_request_allowed, false, "$.guardrails.change_request_allowed");
  literal(guardrails.external_write, false, "$.guardrails.external_write");
  literal(guardrails.persisted, false, "$.guardrails.persisted");
  const handoff = exactRecord(context.codex_handoff, HANDOFF_KEYS, "$.codex_handoff");
  literal(handoff.intended_skill, "facebook-ads-optimization", "$.codex_handoff.intended_skill");
  literal(handoff.mode, "MANUAL_CONTEXT", "$.codex_handoff.mode");
  literal(handoff.context_only, true, "$.codex_handoff.context_only");
  literal(handoff.target_web_area, "OPTIMIZATION_REVIEW", "$.codex_handoff.target_web_area");

  const blockers = [];
  if (validity.tracking_state !== "STABLE") blockers.push(issue("TRACKING_NOT_STABLE", "$.validity.tracking_state", "跟踪状态不足以支持结论"));
  if (validity.mid_test_configuration_change) blockers.push(issue("MID_TEST_CONFIGURATION_CHANGE", "$.validity.mid_test_configuration_change", "测试期间发生配置变化"));
  if (validity.allocation_state !== "AS_PLANNED") blockers.push(issue("ALLOCATION_NOT_AS_PLANNED", "$.validity.allocation_state", "分配状态不足以支持结论"));
  if (validity.sample_state !== "SUFFICIENT") blockers.push(issue("SAMPLE_NOT_SUFFICIENT", "$.validity.sample_state", "样本状态不足以支持结论"));
  if (!validity.comparison_window_complete) blockers.push(issue("COMPARISON_WINDOW_INCOMPLETE", "$.validity.comparison_window_complete", "对比窗口尚未完成"));
  const warnings = context.unknowns.map((item, index) => issue(item.code, `$.unknowns[${index}]`, item.statement));
  const conclusionAllowed = blockers.length === 0;

  return {
    status: conclusionAllowed ? "READY" : "INCONCLUSIVE",
    facts: [
      fact("$.scope", scope), fact("$.evidence", context.evidence),
      fact("$.test_plan", testPlan), fact("$.validity", validity),
      fact("$.variants", context.variants), fact("$.allowed_action_types", context.allowed_action_types),
      fact("$.review_window", window),
    ],
    blockers,
    warnings,
    conclusion_allowed: conclusionAllowed,
    permitted_action_types: conclusionAllowed
      ? structuredClone(context.allowed_action_types)
      : context.allowed_action_types.filter((action) => INCONCLUSIVE_ACTIONS.has(action)),
    automatic_action: false,
    change_request_generated: false,
    external_write: false,
  };
}

const MAX_BYTES = 2 * 1024 * 1024;
const REPOSITORY_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

async function readInput(argument) {
  if (!argument || argument === "-") {
    const chunks = []; let total = 0;
    for await (const chunk of process.stdin) {
      total += chunk.length;
      if (total > MAX_BYTES) fail("$input", "输入超过 2 MiB 限制");
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  const candidate = resolve(REPOSITORY_ROOT, argument);
  const rootReal = await realpath(REPOSITORY_ROOT); const candidateReal = await realpath(candidate);
  const pathFromRoot = relative(rootReal, candidateReal);
  if (pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === ".." || isAbsolute(pathFromRoot)) fail("$input", "文件必须位于当前仓库内");
  const stat = await lstat(candidate);
  if (stat.isSymbolicLink() || !stat.isFile()) fail("$input", "必须是仓库内的普通非符号链接文件");
  if (stat.size > MAX_BYTES) fail("$input", "文件超过 2 MiB 限制");
  return readFile(candidate, "utf8");
}

async function main() {
  try {
    const text = await readInput(process.argv[2]); let value;
    try { value = JSON.parse(text); } catch { fail("$input", "必须是有效 JSON"); }
    const preflight = validateOptimizationContext(value);
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight }, null, 2)}\n`);
    process.exitCode = preflight.status === "READY" ? 0 : 2;
  } catch (error) {
    const safeError = error instanceof InvalidOptimizationContext
      ? { code: error.code, path: error.path, statement: error.message }
      : { code: "OPTIMIZATION_VALIDATION_FAILED", path: "$input", statement: "无法安全校验输入" };
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight: { status: "REJECTED", blockers: [safeError], external_write: false } }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
