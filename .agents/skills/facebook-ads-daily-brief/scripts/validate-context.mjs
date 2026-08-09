import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const INPUT_SCHEMA_VERSION = "facebook-ads-daily-brief-context/v1";
export const PREFLIGHT_SCHEMA_VERSION = "facebook-ads-daily-brief-preflight/v1";

const TOP_LEVEL_KEYS = [
  "schema_version", "artifact_type", "source_kind", "scenario_id", "scope",
  "report_date", "freshness", "data_quality", "delivery_summary",
  "review_summary", "material_events", "open_items", "known_constraints",
  "unknowns", "guardrails", "codex_handoff",
];
const SCOPE_KEYS = ["workspace_ref", "account_ref"];
const FRESHNESS_KEYS = ["updated_at", "state"];
const DATA_QUALITY_KEYS = ["status", "checks_failed"];
const DELIVERY_KEYS = ["spend_minor", "impressions", "clicks", "conversions", "currency"];
const REVIEW_KEYS = ["approved", "rejected", "pending"];
const EVENT_KEYS = ["event_ref", "event_type", "severity", "statement", "evidence_paths"];
const OPEN_ITEM_KEYS = ["item_ref", "kind", "state", "statement", "evidence_paths"];
const UNKNOWN_KEYS = ["claim_type", "code", "statement"];
const GUARDRAIL_KEYS = [
  "fixture_data_only", "meta_connection_allowed", "scheduled_delivery_allowed",
  "optimization_recommendations_allowed", "change_request_allowed",
  "external_write", "persisted",
];
const HANDOFF_KEYS = ["intended_skill", "mode", "context_only", "target_web_area"];
const FRESHNESS_STATES = new Set(["STABLE", "STALE", "FAILED"]);
const QUALITY_STATES = new Set(["PASS", "FAIL"]);
const CURRENCIES = new Set(["CNY", "USD"]);
const EVENT_TYPES = new Set(["DATA_QUALITY", "DELIVERY", "REVIEW", "CONFIGURATION"]);
const SEVERITIES = new Set(["INFO", "WARNING", "BLOCKER"]);
const ITEM_KINDS = new Set(["DATA_QUALITY", "REVIEW", "DELIVERY", "FOLLOW_UP"]);
const ITEM_STATES = new Set(["OPEN", "BLOCKED", "WAITING_REVIEW"]);
const EVIDENCE_ROOTS = [
  "$.freshness", "$.data_quality", "$.delivery_summary", "$.review_summary",
  "$.material_events", "$.open_items",
];
const FORBIDDEN_NORMALIZED_KEYS = new Set([
  "authorization", "authorizationheader", "accesstoken", "refreshtoken",
  "clientsecret", "token", "secret", "password", "cookie", "requestid",
  "customerid", "accountid", "adaccountid", "metaaccountid", "userid",
  "recipient", "notificationchannel", "cron", "scheduleexpression", "toolcall",
  "mcpcall", "changerequest", "writeparameters", "endpoint", "url",
]);
const FORBIDDEN_STRING_PATTERNS = [
  /https?:\/\//iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/iu,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/u,
];

export class InvalidDailyBriefContext extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidDailyBriefContext";
    this.code = "INVALID_DAILY_BRIEF_CONTEXT";
    this.path = path;
  }
}

function fail(path, reason) { throw new InvalidDailyBriefContext(path, reason); }
function normalizeKey(key) { return key.toLowerCase().replaceAll(/[^a-z0-9]/gu, ""); }

function assertNoSensitiveContent(value, path = "$", keyName = null) {
  if (keyName && FORBIDDEN_NORMALIZED_KEYS.has(normalizeKey(keyName))) {
    fail(path, "包含敏感、真实账户、定时发送、变更请求或外部操作字段");
  }
  if (typeof value === "string") {
    if (FORBIDDEN_STRING_PATTERNS.some((pattern) => pattern.test(value))) {
      fail(path, "包含 URL、凭据或私钥样式内容");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveContent(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, nested] of Object.entries(value)) {
    assertNoSensitiveContent(nested, `${path}.${key}`, key);
  }
}

function asRecord(value, path) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "必须是 object");
  return value;
}

function exactRecord(value, keys, path) {
  const record = asRecord(value, path);
  const actual = Object.keys(record);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) {
    fail(path, `字段必须且只能为 ${keys.join(", ")}`);
  }
  return record;
}

function literal(value, expected, path) {
  if (value !== expected) fail(path, `必须为 ${JSON.stringify(expected)}`);
}

function stringValue(value, path, { min = 1, max = 300 } = {}) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail(path, `必须是 ${min}-${max} 个字符的 string`);
  }
  return value;
}

function fixtureRef(value, path, prefixes = ["fixture-"]) {
  stringValue(value, path, { max: 100 });
  if (!prefixes.some((prefix) => value.startsWith(prefix))) {
    fail(path, `必须使用 fixture ref 前缀: ${prefixes.join(", ")}`);
  }
  return value;
}

function integer(value, path, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) fail(path, `必须是 ${min}-${max} 的 integer`);
  return value;
}

function enumValue(value, allowed, path) {
  if (!allowed.has(value)) fail(path, `不支持的值 ${JSON.stringify(value)}`);
  return value;
}

function uniqueStringArray(value, path, { min = 0, max = 30, code = false } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(path, `必须是长度 ${min}-${max} 的 array`);
  }
  value.forEach((item, index) => {
    stringValue(item, `${path}[${index}]`, { max: 180 });
    if (code && !/^[A-Z][A-Z0-9_]*$/u.test(item)) fail(`${path}[${index}]`, "必须为大写下划线 code");
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
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    fail(path, "必须是真实存在的日期");
  }
  return value;
}

function utcTimestamp(value, path) {
  stringValue(value, path, { max: 40 });
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(value) || Number.isNaN(Date.parse(value))) {
    fail(path, "必须是带 Z 的 ISO UTC 时间");
  }
  return value;
}

function evidencePaths(value, path) {
  uniqueStringArray(value, path, { min: 1, max: 10 });
  value.forEach((entry, index) => {
    if (!EVIDENCE_ROOTS.some((root) => entry === root || entry.startsWith(`${root}.`) || entry.startsWith(`${root}[`))) {
      fail(`${path}[${index}]`, "必须引用允许的输入事实路径");
    }
    if (entry.includes("..") || /[^A-Za-z0-9_$.[\]-]/u.test(entry)) {
      fail(`${path}[${index}]`, "不是稳定的 JSON path");
    }
  });
  return value;
}

function fact(path, value) { return { claim_type: "FACT", path, value: structuredClone(value) }; }
function issue(code, path, statement) { return { code, path, statement }; }

export function validateDailyBriefContext(value) {
  assertNoSensitiveContent(value);
  const context = exactRecord(value, TOP_LEVEL_KEYS, "$input");
  literal(context.schema_version, INPUT_SCHEMA_VERSION, "$.schema_version");
  literal(context.artifact_type, "CODEX_DAILY_BRIEF_INPUT", "$.artifact_type");
  literal(context.source_kind, "FIXTURE", "$.source_kind");
  literal(context.scenario_id, "SC-02", "$.scenario_id");

  const scope = exactRecord(context.scope, SCOPE_KEYS, "$.scope");
  fixtureRef(scope.workspace_ref, "$.scope.workspace_ref", ["ws_fixture_"]);
  fixtureRef(scope.account_ref, "$.scope.account_ref");
  isoDate(context.report_date, "$.report_date");

  const freshness = exactRecord(context.freshness, FRESHNESS_KEYS, "$.freshness");
  utcTimestamp(freshness.updated_at, "$.freshness.updated_at");
  enumValue(freshness.state, FRESHNESS_STATES, "$.freshness.state");
  const quality = exactRecord(context.data_quality, DATA_QUALITY_KEYS, "$.data_quality");
  enumValue(quality.status, QUALITY_STATES, "$.data_quality.status");
  uniqueStringArray(quality.checks_failed, "$.data_quality.checks_failed", { max: 30, code: true });
  if (quality.status === "PASS" && quality.checks_failed.length > 0) fail("$.data_quality", "PASS 时 checks_failed 必须为空");
  if (quality.status === "FAIL" && quality.checks_failed.length === 0) fail("$.data_quality", "FAIL 时必须提供失败检查");

  const delivery = exactRecord(context.delivery_summary, DELIVERY_KEYS, "$.delivery_summary");
  integer(delivery.spend_minor, "$.delivery_summary.spend_minor");
  integer(delivery.impressions, "$.delivery_summary.impressions");
  integer(delivery.clicks, "$.delivery_summary.clicks");
  integer(delivery.conversions, "$.delivery_summary.conversions");
  enumValue(delivery.currency, CURRENCIES, "$.delivery_summary.currency");
  const review = exactRecord(context.review_summary, REVIEW_KEYS, "$.review_summary");
  integer(review.approved, "$.review_summary.approved");
  integer(review.rejected, "$.review_summary.rejected");
  integer(review.pending, "$.review_summary.pending");

  if (!Array.isArray(context.material_events) || context.material_events.length > 30) {
    fail("$.material_events", "必须是长度 0-30 的 array");
  }
  const eventRefs = new Set();
  context.material_events.forEach((entry, index) => {
    const path = `$.material_events[${index}]`;
    const item = exactRecord(entry, EVENT_KEYS, path);
    fixtureRef(item.event_ref, `${path}.event_ref`);
    if (eventRefs.has(item.event_ref)) fail(`${path}.event_ref`, "event_ref 不得重复");
    eventRefs.add(item.event_ref);
    enumValue(item.event_type, EVENT_TYPES, `${path}.event_type`);
    enumValue(item.severity, SEVERITIES, `${path}.severity`);
    stringValue(item.statement, `${path}.statement`, { max: 400 });
    evidencePaths(item.evidence_paths, `${path}.evidence_paths`);
  });

  if (!Array.isArray(context.open_items) || context.open_items.length > 30) {
    fail("$.open_items", "必须是长度 0-30 的 array");
  }
  const itemRefs = new Set();
  context.open_items.forEach((entry, index) => {
    const path = `$.open_items[${index}]`;
    const item = exactRecord(entry, OPEN_ITEM_KEYS, path);
    fixtureRef(item.item_ref, `${path}.item_ref`);
    if (itemRefs.has(item.item_ref)) fail(`${path}.item_ref`, "item_ref 不得重复");
    itemRefs.add(item.item_ref);
    enumValue(item.kind, ITEM_KINDS, `${path}.kind`);
    enumValue(item.state, ITEM_STATES, `${path}.state`);
    stringValue(item.statement, `${path}.statement`, { max: 400 });
    evidencePaths(item.evidence_paths, `${path}.evidence_paths`);
  });

  uniqueStringArray(context.known_constraints, "$.known_constraints", { max: 30 });
  if (!Array.isArray(context.unknowns) || context.unknowns.length > 30) fail("$.unknowns", "必须是长度 0-30 的 array");
  const unknownCodes = new Set();
  context.unknowns.forEach((entry, index) => {
    const path = `$.unknowns[${index}]`;
    const item = exactRecord(entry, UNKNOWN_KEYS, path);
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
  literal(guardrails.scheduled_delivery_allowed, false, "$.guardrails.scheduled_delivery_allowed");
  literal(guardrails.optimization_recommendations_allowed, false, "$.guardrails.optimization_recommendations_allowed");
  literal(guardrails.change_request_allowed, false, "$.guardrails.change_request_allowed");
  literal(guardrails.external_write, false, "$.guardrails.external_write");
  literal(guardrails.persisted, false, "$.guardrails.persisted");
  const handoff = exactRecord(context.codex_handoff, HANDOFF_KEYS, "$.codex_handoff");
  literal(handoff.intended_skill, "facebook-ads-daily-brief", "$.codex_handoff.intended_skill");
  literal(handoff.mode, "MANUAL_CONTEXT", "$.codex_handoff.mode");
  literal(handoff.context_only, true, "$.codex_handoff.context_only");
  literal(handoff.target_web_area, "DAILY_BRIEF", "$.codex_handoff.target_web_area");

  const dataIssue = freshness.state !== "STABLE" || quality.status === "FAIL";
  const blockers = [];
  if (freshness.state !== "STABLE") blockers.push(issue("DATA_NOT_STABLE", "$.freshness.state", "数据新鲜度不足，禁止表现判断"));
  quality.checks_failed.forEach((code) => blockers.push(issue(code, "$.data_quality.checks_failed", "数据质量检查失败，禁止表现判断")));
  const warnings = context.unknowns.map((item, index) => issue(item.code, `$.unknowns[${index}]`, item.statement));
  const noAction = !dataIssue && context.material_events.length === 0 && context.open_items.length === 0;

  return {
    status: dataIssue ? "DATA_ISSUE" : "READY",
    facts: [
      fact("$.scope", scope), fact("$.report_date", context.report_date),
      fact("$.freshness", freshness), fact("$.data_quality", quality),
      fact("$.delivery_summary", delivery), fact("$.review_summary", review),
      fact("$.material_events", context.material_events), fact("$.open_items", context.open_items),
    ],
    blockers,
    warnings,
    performance_summary_allowed: !dataIssue,
    no_action_required: noAction,
    recommendations_generated: false,
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
  const rootReal = await realpath(REPOSITORY_ROOT);
  const candidateReal = await realpath(candidate);
  const pathFromRoot = relative(rootReal, candidateReal);
  if (pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === ".." || isAbsolute(pathFromRoot)) fail("$input", "文件必须位于当前仓库内");
  const stat = await lstat(candidate);
  if (stat.isSymbolicLink() || !stat.isFile()) fail("$input", "必须是仓库内的普通非符号链接文件");
  if (stat.size > MAX_BYTES) fail("$input", "文件超过 2 MiB 限制");
  return readFile(candidate, "utf8");
}

async function main() {
  try {
    const text = await readInput(process.argv[2]);
    let value;
    try { value = JSON.parse(text); } catch { fail("$input", "必须是有效 JSON"); }
    const preflight = validateDailyBriefContext(value);
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight }, null, 2)}\n`);
    process.exitCode = preflight.status === "READY" ? 0 : 2;
  } catch (error) {
    const safeError = error instanceof InvalidDailyBriefContext
      ? { code: error.code, path: error.path, statement: error.message }
      : { code: "DAILY_BRIEF_VALIDATION_FAILED", path: "$input", statement: "无法安全校验输入" };
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight: { status: "REJECTED", blockers: [safeError], external_write: false } }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
