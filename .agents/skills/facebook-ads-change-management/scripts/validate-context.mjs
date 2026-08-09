import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const INPUT_SCHEMA_VERSION = "facebook-ads-change-context/v1";
export const PREFLIGHT_SCHEMA_VERSION = "facebook-ads-change-preflight/v1";

const TOP_LEVEL_KEYS = [
  "schema_version", "artifact_type", "source_kind", "scenario_id", "scope",
  "source_action", "target", "proposed_patch", "evidence", "policy_context",
  "approval_context", "known_constraints", "unknowns", "guardrails", "codex_handoff",
];
const SCOPE_KEYS = ["workspace_ref", "account_ref"];
const SOURCE_ACTION_KEYS = ["draft_ref", "action_ref", "source_skill", "action_type", "statement", "state"];
const TARGET_KEYS = ["object_ref", "object_type", "current_state"];
const PATCH_KEYS = ["field", "operation", "before", "after"];
const EVIDENCE_KEYS = ["evidence_ref", "claim_type", "statement", "source_paths"];
const POLICY_KEYS = ["policy_state", "emergency_stop", "write_authorized"];
const APPROVAL_KEYS = ["web_approval_state", "approver_ref", "expires_at"];
const UNKNOWN_KEYS = ["claim_type", "code", "statement"];
const GUARDRAIL_KEYS = [
  "fixture_data_only", "meta_connection_allowed", "submission_allowed",
  "approval_execution_allowed", "natural_language_execution_allowed",
  "external_write", "persisted",
];
const HANDOFF_KEYS = ["intended_skill", "mode", "context_only", "target_web_area"];

const SCENARIOS = new Set(["SC-02", "SC-03"]);
const ACTION_TYPES = new Set([
  "REQUEST_HUMAN_REVIEW", "PROPOSE_PAUSE", "PROPOSE_ENABLE", "PROPOSE_BUDGET_CHANGE",
  "PROPOSE_SCHEDULE_CHANGE", "PROPOSE_CREATIVE_CHANGE",
]);
const OBJECT_TYPES = new Set(["CAMPAIGN", "AD_SET", "AD"]);
const OBJECT_STATES = new Set(["ACTIVE", "PAUSED", "DRAFT", "UNKNOWN"]);
const PATCH_FIELDS = new Set(["delivery_status", "daily_budget_minor", "schedule_end_date", "creative_ref"]);
const EVIDENCE_ROOTS = ["$.source_action", "$.target", "$.proposed_patch", "$.policy_context", "$.approval_context"];
const ACTION_FIELD = new Map([
  ["PROPOSE_PAUSE", "delivery_status"], ["PROPOSE_ENABLE", "delivery_status"],
  ["PROPOSE_BUDGET_CHANGE", "daily_budget_minor"],
  ["PROPOSE_SCHEDULE_CHANGE", "schedule_end_date"],
  ["PROPOSE_CREATIVE_CHANGE", "creative_ref"],
]);
const FORBIDDEN_NORMALIZED_KEYS = new Set([
  "authorization", "authorizationheader", "accesstoken", "refreshtoken",
  "clientsecret", "token", "secret", "password", "cookie", "requestid",
  "customerid", "accountid", "adaccountid", "metaaccountid", "userid",
  "changerequestid", "approvaltoken", "idempotencykey", "endpoint", "url",
  "toolcall", "mcpcall", "writeparameters", "metapayload", "executionresult",
]);
const FORBIDDEN_STRING_PATTERNS = [
  /https?:\/\//iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/iu,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/u,
];

export class InvalidChangeContext extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidChangeContext";
    this.code = "INVALID_CHANGE_CONTEXT";
    this.path = path;
  }
}

function fail(path, reason) { throw new InvalidChangeContext(path, reason); }
function normalizeKey(key) { return key.toLowerCase().replaceAll(/[^a-z0-9]/gu, ""); }

function assertNoSensitiveContent(value, path = "$", keyName = null) {
  if (keyName && FORBIDDEN_NORMALIZED_KEYS.has(normalizeKey(keyName))) {
    fail(path, "包含敏感、真实账户、change request 或外部执行字段");
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
function integer(value, path, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) fail(path, `必须是 ${min}-${max} 的 integer`);
  return value;
}

function uniqueStringArray(value, path, { min = 0, max = 30 } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(path, `必须是长度 ${min}-${max} 的 array`);
  value.forEach((item, index) => stringValue(item, `${path}[${index}]`, { max: 180 }));
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

function validatePatchValue(field, value, path) {
  if (field === "delivery_status") return enumValue(value, new Set(["ACTIVE", "PAUSED"]), path);
  if (field === "daily_budget_minor") return integer(value, path);
  if (field === "schedule_end_date") return isoDate(value, path);
  if (field === "creative_ref") return fixtureRef(value, path);
  fail(path, "不支持的 patch field");
}

function fact(path, value) { return { claim_type: "FACT", path, value: structuredClone(value) }; }
function issue(code, path, statement) { return { code, path, statement }; }

export function validateChangeContext(value) {
  assertNoSensitiveContent(value);
  const context = exactRecord(value, TOP_LEVEL_KEYS, "$input");
  literal(context.schema_version, INPUT_SCHEMA_VERSION, "$.schema_version");
  literal(context.artifact_type, "CODEX_CHANGE_DRAFT_INPUT", "$.artifact_type");
  literal(context.source_kind, "FIXTURE", "$.source_kind");
  enumValue(context.scenario_id, SCENARIOS, "$.scenario_id");

  const scope = exactRecord(context.scope, SCOPE_KEYS, "$.scope");
  fixtureRef(scope.workspace_ref, "$.scope.workspace_ref", ["ws_fixture_"]);
  fixtureRef(scope.account_ref, "$.scope.account_ref");
  const source = exactRecord(context.source_action, SOURCE_ACTION_KEYS, "$.source_action");
  fixtureRef(source.draft_ref, "$.source_action.draft_ref");
  fixtureRef(source.action_ref, "$.source_action.action_ref");
  literal(source.source_skill, "facebook-ads-optimization", "$.source_action.source_skill");
  enumValue(source.action_type, ACTION_TYPES, "$.source_action.action_type");
  stringValue(source.statement, "$.source_action.statement", { max: 500 });
  literal(source.state, "PENDING_CONFIRMATION", "$.source_action.state");

  const target = exactRecord(context.target, TARGET_KEYS, "$.target");
  fixtureRef(target.object_ref, "$.target.object_ref");
  enumValue(target.object_type, OBJECT_TYPES, "$.target.object_type");
  enumValue(target.current_state, OBJECT_STATES, "$.target.current_state");

  if (!Array.isArray(context.proposed_patch) || context.proposed_patch.length > 1) fail("$.proposed_patch", "必须是长度 0-1 的 array");
  context.proposed_patch.forEach((entry, index) => {
    const path = `$.proposed_patch[${index}]`; const item = exactRecord(entry, PATCH_KEYS, path);
    enumValue(item.field, PATCH_FIELDS, `${path}.field`);
    literal(item.operation, "REPLACE", `${path}.operation`);
    validatePatchValue(item.field, item.before, `${path}.before`);
    validatePatchValue(item.field, item.after, `${path}.after`);
    if (JSON.stringify(item.before) === JSON.stringify(item.after)) fail(path, "before 与 after 必须不同");
  });

  if (source.action_type === "REQUEST_HUMAN_REVIEW" && context.proposed_patch.length !== 0) fail("$.proposed_patch", "REQUEST_HUMAN_REVIEW 不得包含 patch");
  if (source.action_type !== "REQUEST_HUMAN_REVIEW") {
    if (context.proposed_patch.length !== 1) fail("$.proposed_patch", "变更建议必须恰有一个 patch");
    const expectedField = ACTION_FIELD.get(source.action_type);
    if (context.proposed_patch[0].field !== expectedField) fail("$.proposed_patch[0].field", `必须与 ${source.action_type} 对应为 ${expectedField}`);
    if (source.action_type === "PROPOSE_PAUSE" && (context.proposed_patch[0].before !== "ACTIVE" || context.proposed_patch[0].after !== "PAUSED")) fail("$.proposed_patch[0]", "PROPOSE_PAUSE 必须为 ACTIVE -> PAUSED");
    if (source.action_type === "PROPOSE_ENABLE" && (context.proposed_patch[0].before !== "PAUSED" || context.proposed_patch[0].after !== "ACTIVE")) fail("$.proposed_patch[0]", "PROPOSE_ENABLE 必须为 PAUSED -> ACTIVE");
  }

  if (!Array.isArray(context.evidence) || context.evidence.length < 1 || context.evidence.length > 20) fail("$.evidence", "必须是长度 1-20 的 array");
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

  const policy = exactRecord(context.policy_context, POLICY_KEYS, "$.policy_context");
  literal(policy.policy_state, "NOT_EVALUATED", "$.policy_context.policy_state");
  literal(policy.emergency_stop, false, "$.policy_context.emergency_stop");
  literal(policy.write_authorized, false, "$.policy_context.write_authorized");
  const approval = exactRecord(context.approval_context, APPROVAL_KEYS, "$.approval_context");
  literal(approval.web_approval_state, "NOT_REQUESTED", "$.approval_context.web_approval_state");
  literal(approval.approver_ref, null, "$.approval_context.approver_ref");
  literal(approval.expires_at, null, "$.approval_context.expires_at");
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
  literal(guardrails.submission_allowed, false, "$.guardrails.submission_allowed");
  literal(guardrails.approval_execution_allowed, false, "$.guardrails.approval_execution_allowed");
  literal(guardrails.natural_language_execution_allowed, false, "$.guardrails.natural_language_execution_allowed");
  literal(guardrails.external_write, false, "$.guardrails.external_write");
  literal(guardrails.persisted, false, "$.guardrails.persisted");
  const handoff = exactRecord(context.codex_handoff, HANDOFF_KEYS, "$.codex_handoff");
  literal(handoff.intended_skill, "facebook-ads-change-management", "$.codex_handoff.intended_skill");
  literal(handoff.mode, "MANUAL_CONTEXT", "$.codex_handoff.mode");
  literal(handoff.context_only, true, "$.codex_handoff.context_only");
  literal(handoff.target_web_area, "CHANGE_DRAFTS", "$.codex_handoff.target_web_area");

  const blockers = [];
  if (target.current_state === "UNKNOWN") blockers.push(issue("TARGET_STATE_UNKNOWN", "$.target.current_state", "目标当前状态未知，不能形成明确草稿"));
  const warnings = [
    issue("POLICY_NOT_EVALUATED", "$.policy_context.policy_state", "政策尚未评估，禁止执行"),
    issue("META_WRITE_NOT_AUTHORIZED", "$.policy_context.write_authorized", "Meta 写入未授权"),
    issue("WEB_APPROVAL_NOT_REQUESTED", "$.approval_context.web_approval_state", "Web 审批尚未请求"),
    ...context.unknowns.map((item, index) => issue(item.code, `$.unknowns[${index}]`, item.statement)),
  ];

  return {
    status: blockers.length === 0 ? "DRAFTABLE" : "BLOCKED",
    facts: [
      fact("$.scope", scope), fact("$.source_action", source), fact("$.target", target),
      fact("$.proposed_patch", context.proposed_patch), fact("$.evidence", context.evidence),
      fact("$.policy_context", policy), fact("$.approval_context", approval),
    ],
    blockers,
    warnings,
    submission_allowed: false,
    approval_execution_allowed: false,
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
    const preflight = validateChangeContext(value);
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight }, null, 2)}\n`);
    process.exitCode = preflight.status === "DRAFTABLE" ? 0 : 2;
  } catch (error) {
    const safeError = error instanceof InvalidChangeContext
      ? { code: error.code, path: error.path, statement: error.message }
      : { code: "CHANGE_VALIDATION_FAILED", path: "$input", statement: "无法安全校验输入" };
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight: { status: "REJECTED", blockers: [safeError], external_write: false } }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
