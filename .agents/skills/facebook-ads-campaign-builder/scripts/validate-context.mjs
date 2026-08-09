import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const INPUT_SCHEMA_VERSION = "facebook-ads-campaign-context/v1";
export const PREFLIGHT_SCHEMA_VERSION =
  "facebook-ads-campaign-preflight/v1";

const TOP_LEVEL_KEYS = [
  "schema_version", "artifact_type", "source_kind", "scenario_id", "scope",
  "campaign", "ad_set", "ad", "asset", "landing_page", "supported_fields",
  "known_constraints", "unknowns", "guardrails", "codex_handoff",
];
const SCOPE_KEYS = ["workspace_ref", "account_ref"];
const CAMPAIGN_KEYS = ["name", "objective", "buying_type", "special_ad_categories"];
const AD_SET_KEYS = [
  "name", "conversion_location", "optimization_event", "billing_event",
  "budget", "schedule", "audience", "placements",
];
const BUDGET_KEYS = ["amount_minor", "currency", "period"];
const SCHEDULE_KEYS = ["start_date", "end_date"];
const AUDIENCE_KEYS = ["locations", "age_min", "age_max", "notes"];
const AD_KEYS = [
  "name", "creative_ref", "primary_text", "headline", "description",
  "call_to_action",
];
const ASSET_KEYS = ["asset_ref", "source_type", "commercial_rights", "review_state"];
const LANDING_KEYS = ["destination_ref", "domain_review_state"];
const UNKNOWN_KEYS = ["claim_type", "code", "statement"];
const GUARDRAIL_KEYS = [
  "fixture_data_only", "meta_connection_allowed", "publish_allowed",
  "policy_approval_guaranteed", "external_write", "persisted",
  "approvals_bypassed",
];
const HANDOFF_KEYS = ["intended_skill", "mode", "context_only", "target_web_area"];

const OBJECTIVES = new Set(["OUTCOME_SALES", "OUTCOME_TRAFFIC", "UNRESOLVED"]);
const BUYING_TYPES = new Set(["AUCTION", "UNRESOLVED"]);
const SPECIAL_CATEGORIES = new Set([
  "NONE", "CREDIT", "EMPLOYMENT", "HOUSING",
  "SOCIAL_ISSUES_ELECTIONS_POLITICS", "UNRESOLVED",
]);
const CONVERSION_LOCATIONS = new Set(["WEBSITE", "APP", "MESSAGING", "UNRESOLVED"]);
const OPTIMIZATION_EVENTS = new Set([
  "PURCHASE", "ADD_TO_CART", "LANDING_PAGE_VIEW", "LINK_CLICKS", "UNRESOLVED",
]);
const BILLING_EVENTS = new Set(["IMPRESSIONS", "LINK_CLICKS", "UNRESOLVED"]);
const CURRENCIES = new Set(["CNY", "USD", "UNRESOLVED"]);
const BUDGET_PERIODS = new Set(["DAILY", "LIFETIME", "UNRESOLVED"]);
const PLACEMENTS = new Set(["FEED", "STORY", "REELS"]);
const CTA_TYPES = new Set(["LEARN_MORE", "SHOP_NOW", "SIGN_UP", "CONTACT_US"]);
const SOURCE_TYPES = new Set(["OWNED", "LICENSED", "GENERATED", "UNKNOWN"]);
const RIGHTS = new Set(["CONFIRMED", "UNCONFIRMED", "PROHIBITED"]);
const REVIEW_STATES = new Set(["REVIEWED", "PENDING", "REJECTED"]);
const SUPPORTED_FIELD_ALLOWLIST = new Set([
  "campaign.objective", "ad_set.conversion_location", "ad_set.optimization_event",
  "ad_set.billing_event", "ad_set.budget", "ad_set.schedule", "ad_set.audience",
  "ad_set.placements", "ad.creative_ref", "ad.primary_text", "ad.headline",
  "ad.call_to_action", "landing_page.destination_ref",
]);
const REQUIRED_SUPPORTED_FIELDS = [...SUPPORTED_FIELD_ALLOWLIST];
const FORBIDDEN_NORMALIZED_KEYS = new Set([
  "authorization", "authorizationheader", "accesstoken", "refreshtoken",
  "clientsecret", "token", "secret", "password", "cookie", "requestid",
  "customerid", "accountid", "adaccountid", "metaaccountid", "userid",
  "pixelid", "datasetid", "toolcall", "mcpcall", "writeparameters",
  "publishparameters", "endpoint", "url",
]);
const FORBIDDEN_STRING_PATTERNS = [
  /https?:\/\//iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/iu,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/u,
];

export class InvalidCampaignContext extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidCampaignContext";
    this.code = "INVALID_CAMPAIGN_CONTEXT";
    this.path = path;
  }
}

function fail(path, reason) {
  throw new InvalidCampaignContext(path, reason);
}

function normalizeKey(key) {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");
}

function assertNoSensitiveContent(value, path = "$", keyName = null) {
  if (keyName && FORBIDDEN_NORMALIZED_KEYS.has(normalizeKey(keyName))) {
    fail(path, "包含敏感、真实账户、请求追踪或外部操作字段");
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
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "必须是 object");
  }
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

function enumValue(value, allowed, path) {
  if (!allowed.has(value)) fail(path, `不支持的值 ${JSON.stringify(value)}`);
  return value;
}

function integer(value, path, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(path, `必须是 ${min}-${max} 的 integer`);
  }
  return value;
}

function uniqueStringArray(value, path, { min = 0, max = 30, allowed = null } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(path, `必须是长度 ${min}-${max} 的 array`);
  }
  value.forEach((item, index) => {
    stringValue(item, `${path}[${index}]`, { max: 160 });
    if (allowed && !allowed.has(item)) fail(`${path}[${index}]`, "值不在允许集合中");
  });
  if (new Set(value).size !== value.length) fail(path, "不得包含重复项");
  return value;
}

function isoDate(value, path) {
  stringValue(value, path, { min: 10, max: 10 });
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) fail(path, "必须为 YYYY-MM-DD");
  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) fail(path, "必须是真实存在的日期");
  return value;
}

function fact(path, value) {
  return { claim_type: "FACT", path, value: structuredClone(value) };
}

function issue(code, path, statement) {
  return { code, path, statement };
}

export function validateCampaignContext(value) {
  assertNoSensitiveContent(value);
  const context = exactRecord(value, TOP_LEVEL_KEYS, "$input");
  literal(context.schema_version, INPUT_SCHEMA_VERSION, "$.schema_version");
  literal(context.artifact_type, "CODEX_CAMPAIGN_DRAFT_INPUT", "$.artifact_type");
  literal(context.source_kind, "FIXTURE", "$.source_kind");
  literal(context.scenario_id, "SC-01", "$.scenario_id");

  const scope = exactRecord(context.scope, SCOPE_KEYS, "$.scope");
  fixtureRef(scope.workspace_ref, "$.scope.workspace_ref", ["ws_fixture_"]);
  fixtureRef(scope.account_ref, "$.scope.account_ref");

  const campaign = exactRecord(context.campaign, CAMPAIGN_KEYS, "$.campaign");
  stringValue(campaign.name, "$.campaign.name", { max: 120 });
  enumValue(campaign.objective, OBJECTIVES, "$.campaign.objective");
  enumValue(campaign.buying_type, BUYING_TYPES, "$.campaign.buying_type");
  uniqueStringArray(campaign.special_ad_categories, "$.campaign.special_ad_categories", {
    min: 1, max: 3, allowed: SPECIAL_CATEGORIES,
  });
  if (campaign.special_ad_categories.includes("NONE") && campaign.special_ad_categories.length > 1) {
    fail("$.campaign.special_ad_categories", "NONE 不得与其他类别并存");
  }

  const adSet = exactRecord(context.ad_set, AD_SET_KEYS, "$.ad_set");
  stringValue(adSet.name, "$.ad_set.name", { max: 120 });
  enumValue(adSet.conversion_location, CONVERSION_LOCATIONS, "$.ad_set.conversion_location");
  enumValue(adSet.optimization_event, OPTIMIZATION_EVENTS, "$.ad_set.optimization_event");
  enumValue(adSet.billing_event, BILLING_EVENTS, "$.ad_set.billing_event");
  const budget = exactRecord(adSet.budget, BUDGET_KEYS, "$.ad_set.budget");
  integer(budget.amount_minor, "$.ad_set.budget.amount_minor", 1, Number.MAX_SAFE_INTEGER);
  enumValue(budget.currency, CURRENCIES, "$.ad_set.budget.currency");
  enumValue(budget.period, BUDGET_PERIODS, "$.ad_set.budget.period");
  const schedule = exactRecord(adSet.schedule, SCHEDULE_KEYS, "$.ad_set.schedule");
  isoDate(schedule.start_date, "$.ad_set.schedule.start_date");
  isoDate(schedule.end_date, "$.ad_set.schedule.end_date");
  if (schedule.end_date <= schedule.start_date) {
    fail("$.ad_set.schedule", "end_date 必须晚于 start_date");
  }
  const audience = exactRecord(adSet.audience, AUDIENCE_KEYS, "$.ad_set.audience");
  uniqueStringArray(audience.locations, "$.ad_set.audience.locations", { min: 1, max: 10 });
  integer(audience.age_min, "$.ad_set.audience.age_min", 18, 65);
  integer(audience.age_max, "$.ad_set.audience.age_max", 18, 65);
  if (audience.age_min > audience.age_max) fail("$.ad_set.audience", "age_min 不得大于 age_max");
  uniqueStringArray(audience.notes, "$.ad_set.audience.notes", { max: 20 });
  uniqueStringArray(adSet.placements, "$.ad_set.placements", { min: 1, max: 3, allowed: PLACEMENTS });

  const ad = exactRecord(context.ad, AD_KEYS, "$.ad");
  stringValue(ad.name, "$.ad.name", { max: 120 });
  fixtureRef(ad.creative_ref, "$.ad.creative_ref");
  stringValue(ad.primary_text, "$.ad.primary_text", { max: 1000 });
  stringValue(ad.headline, "$.ad.headline", { max: 240 });
  stringValue(ad.description, "$.ad.description", { max: 300 });
  enumValue(ad.call_to_action, CTA_TYPES, "$.ad.call_to_action");

  const asset = exactRecord(context.asset, ASSET_KEYS, "$.asset");
  fixtureRef(asset.asset_ref, "$.asset.asset_ref");
  enumValue(asset.source_type, SOURCE_TYPES, "$.asset.source_type");
  enumValue(asset.commercial_rights, RIGHTS, "$.asset.commercial_rights");
  enumValue(asset.review_state, REVIEW_STATES, "$.asset.review_state");

  const landing = exactRecord(context.landing_page, LANDING_KEYS, "$.landing_page");
  fixtureRef(landing.destination_ref, "$.landing_page.destination_ref");
  enumValue(landing.domain_review_state, REVIEW_STATES, "$.landing_page.domain_review_state");

  uniqueStringArray(context.supported_fields, "$.supported_fields", {
    min: 1, max: SUPPORTED_FIELD_ALLOWLIST.size, allowed: SUPPORTED_FIELD_ALLOWLIST,
  });
  uniqueStringArray(context.known_constraints, "$.known_constraints", { max: 30 });

  if (!Array.isArray(context.unknowns) || context.unknowns.length > 30) {
    fail("$.unknowns", "必须是长度 0-30 的 array");
  }
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
  literal(guardrails.publish_allowed, false, "$.guardrails.publish_allowed");
  literal(guardrails.policy_approval_guaranteed, false, "$.guardrails.policy_approval_guaranteed");
  literal(guardrails.external_write, false, "$.guardrails.external_write");
  literal(guardrails.persisted, false, "$.guardrails.persisted");
  literal(guardrails.approvals_bypassed, false, "$.guardrails.approvals_bypassed");

  const handoff = exactRecord(context.codex_handoff, HANDOFF_KEYS, "$.codex_handoff");
  literal(handoff.intended_skill, "facebook-ads-campaign-builder", "$.codex_handoff.intended_skill");
  literal(handoff.mode, "MANUAL_CONTEXT", "$.codex_handoff.mode");
  literal(handoff.context_only, true, "$.codex_handoff.context_only");
  literal(handoff.target_web_area, "CAMPAIGN_DRAFTS", "$.codex_handoff.target_web_area");

  const blockers = [];
  const warnings = context.unknowns.map((item, index) =>
    issue(item.code, `$.unknowns[${index}]`, item.statement));
  const unresolvedChecks = [
    [campaign.objective, "$.campaign.objective", "CAMPAIGN_OBJECTIVE_UNRESOLVED"],
    [campaign.buying_type, "$.campaign.buying_type", "BUYING_TYPE_UNRESOLVED"],
    [adSet.conversion_location, "$.ad_set.conversion_location", "CONVERSION_LOCATION_UNRESOLVED"],
    [adSet.optimization_event, "$.ad_set.optimization_event", "OPTIMIZATION_EVENT_UNRESOLVED"],
    [adSet.billing_event, "$.ad_set.billing_event", "BILLING_EVENT_UNRESOLVED"],
    [budget.currency, "$.ad_set.budget.currency", "CURRENCY_UNRESOLVED"],
    [budget.period, "$.ad_set.budget.period", "BUDGET_PERIOD_UNRESOLVED"],
  ];
  unresolvedChecks.forEach(([valueItem, path, code]) => {
    if (valueItem === "UNRESOLVED") blockers.push(issue(code, path, "关键草稿字段尚未确认"));
  });
  if (campaign.special_ad_categories.includes("UNRESOLVED")) {
    blockers.push(issue("SPECIAL_AD_CATEGORY_UNRESOLVED", "$.campaign.special_ad_categories", "特殊广告类别尚未确认"));
  }
  if (asset.source_type === "UNKNOWN") blockers.push(issue("ASSET_SOURCE_UNKNOWN", "$.asset.source_type", "素材来源未知"));
  if (asset.commercial_rights !== "CONFIRMED") blockers.push(issue("ASSET_RIGHTS_NOT_CONFIRMED", "$.asset.commercial_rights", "素材商业权利未确认"));
  if (asset.review_state !== "REVIEWED") blockers.push(issue("ASSET_NOT_REVIEWED", "$.asset.review_state", "素材尚未通过人工审查"));
  if (landing.domain_review_state !== "REVIEWED") blockers.push(issue("DESTINATION_NOT_REVIEWED", "$.landing_page.domain_review_state", "落地页域名尚未通过人工审查"));
  for (const field of REQUIRED_SUPPORTED_FIELDS) {
    if (!context.supported_fields.includes(field)) {
      blockers.push(issue("REQUIRED_FIELD_NOT_SUPPORTED", "$.supported_fields", `缺少必需支持字段 ${field}`));
    }
  }

  return {
    status: blockers.length === 0 ? "READY" : "BLOCKED",
    facts: [
      fact("$.scope", scope), fact("$.campaign", campaign), fact("$.ad_set", adSet),
      fact("$.ad", ad), fact("$.asset", asset), fact("$.landing_page", landing),
      fact("$.supported_fields", context.supported_fields),
    ],
    blockers,
    warnings,
    objects_created: false,
    recommendations_generated: false,
    external_write: false,
  };
}

const MAX_BYTES = 2 * 1024 * 1024;
const REPOSITORY_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

async function readInput(argument) {
  if (!argument || argument === "-") {
    const chunks = [];
    let total = 0;
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
  if (pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === ".." || isAbsolute(pathFromRoot)) {
    fail("$input", "文件必须位于当前仓库内");
  }
  const stat = await lstat(candidate);
  if (stat.isSymbolicLink() || !stat.isFile()) fail("$input", "必须是仓库内的普通非符号链接文件");
  if (stat.size > MAX_BYTES) fail("$input", "文件超过 2 MiB 限制");
  return readFile(candidate, "utf8");
}

async function main() {
  try {
    const text = await readInput(process.argv[2]);
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      fail("$input", "必须是有效 JSON");
    }
    const preflight = validateCampaignContext(value);
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight }, null, 2)}\n`);
    process.exitCode = preflight.status === "READY" ? 0 : 2;
  } catch (error) {
    const safeError = error instanceof InvalidCampaignContext
      ? { code: error.code, path: error.path, statement: error.message }
      : { code: "CAMPAIGN_VALIDATION_FAILED", path: "$input", statement: "无法安全校验输入" };
    process.stdout.write(`${JSON.stringify({ schema_version: PREFLIGHT_SCHEMA_VERSION, preflight: { status: "REJECTED", blockers: [safeError], external_write: false } }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
