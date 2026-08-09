import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const INPUT_SCHEMA_VERSION = "facebook-ads-creative-context/v1";
export const PREFLIGHT_SCHEMA_VERSION =
  "facebook-ads-creative-preflight/v1";

const TOP_LEVEL_KEYS = [
  "schema_version",
  "artifact_type",
  "source_kind",
  "scenario_id",
  "scope",
  "product",
  "communication_goal",
  "audience",
  "placements",
  "brand",
  "source_assets",
  "variant_request",
  "known_constraints",
  "unknowns",
  "guardrails",
  "codex_handoff",
];
const SCOPE_KEYS = ["workspace_ref", "account_ref", "product_ref"];
const PRODUCT_KEYS = [
  "name",
  "category",
  "offer",
  "approved_messages",
  "prohibited_claims",
];
const APPROVED_MESSAGE_KEYS = ["message", "evidence_ref"];
const AUDIENCE_KEYS = ["locations", "age_min", "age_max", "notes"];
const BRAND_KEYS = ["tone", "required_terms", "prohibited_terms"];
const ASSET_KEYS = [
  "asset_ref",
  "media_type",
  "source_type",
  "commercial_rights",
  "ai_generated",
  "generation_disclosure_required",
  "notes",
];
const VARIANT_KEYS = ["count", "controlled_variable", "fixed_elements"];
const UNKNOWN_KEYS = ["claim_type", "code", "statement"];
const GUARDRAIL_KEYS = [
  "fixture_data_only",
  "external_search_allowed",
  "image_generation_allowed",
  "policy_approval_guaranteed",
  "performance_guaranteed",
  "external_write",
  "persisted",
];
const HANDOFF_KEYS = [
  "intended_skill",
  "mode",
  "context_only",
  "target_web_area",
];
const MEDIA_TYPES = new Set(["IMAGE", "VIDEO", "CAROUSEL", "TEXT_ONLY"]);
const SOURCE_TYPES = new Set(["OWNED", "LICENSED", "GENERATED", "UNKNOWN"]);
const RIGHTS = new Set(["CONFIRMED", "UNCONFIRMED", "PROHIBITED"]);
const CONTROLLED_VARIABLES = new Set([
  "COPY_HOOK",
  "VISUAL_HOOK",
  "FORMAT",
  "CTA",
  "OFFER_PRESENTATION",
]);
const FORBIDDEN_NORMALIZED_KEYS = new Set([
  "authorization",
  "authorizationheader",
  "accesstoken",
  "refreshtoken",
  "clientsecret",
  "token",
  "secret",
  "password",
  "cookie",
  "requestid",
  "customerid",
  "accountid",
  "adaccountid",
  "metaaccountid",
  "userid",
  "toolcall",
  "mcpcall",
  "writeparameters",
]);
const FORBIDDEN_STRING_PATTERNS = [
  /https?:\/\//iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/iu,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/u,
];

export class InvalidCreativeContext extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidCreativeContext";
    this.code = "INVALID_CREATIVE_CONTEXT";
    this.path = path;
  }
}

function fail(path, reason) {
  throw new InvalidCreativeContext(path, reason);
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
    value.forEach((item, index) =>
      assertNoSensitiveContent(item, `${path}[${index}]`),
    );
    return;
  }
  if (typeof value !== "object" || value === null) {
    return;
  }
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
  const actualKeys = Object.keys(record);
  if (
    actualKeys.length !== keys.length ||
    actualKeys.some((key) => !keys.includes(key))
  ) {
    fail(path, `字段必须且只能为 ${keys.join(", ")}`);
  }
  return record;
}

function literal(value, expected, path) {
  if (value !== expected) {
    fail(path, `必须为 ${JSON.stringify(expected)}`);
  }
}

function string(value, path, { min = 1, max = 240 } = {}) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.length > max ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    fail(path, `必须是 ${min}-${max} 个字符的 string`);
  }
  return value;
}

function fixtureRef(value, path, prefixes = ["fixture-"]) {
  string(value, path, { max: 100 });
  if (!prefixes.some((prefix) => value.startsWith(prefix))) {
    fail(path, `必须使用 fixture ref 前缀: ${prefixes.join(", ")}`);
  }
  return value;
}

function integer(value, path, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(path, `必须是 ${min}-${max} 的 integer`);
  }
  return value;
}

function stringArray(value, path, { min = 0, max = 20 } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(path, `必须是长度 ${min}-${max} 的 array`);
  }
  value.forEach((item, index) => string(item, `${path}[${index}]`, { max: 160 }));
  if (new Set(value).size !== value.length) {
    fail(path, "不得包含重复项");
  }
  return value;
}

function enumValue(value, allowed, path) {
  if (!allowed.has(value)) {
    fail(path, `不支持的值 ${JSON.stringify(value)}`);
  }
  return value;
}

function conflict(left, right) {
  const normalizedRight = new Set(right.map((item) => item.trim().toLowerCase()));
  return left.find((item) => normalizedRight.has(item.trim().toLowerCase()));
}

function fact(path, value) {
  return { claim_type: "FACT", path, value: structuredClone(value) };
}

function issue(code, path, statement) {
  return { code, path, statement };
}

export function validateCreativeContext(value) {
  assertNoSensitiveContent(value);
  const context = exactRecord(value, TOP_LEVEL_KEYS, "$input");
  literal(context.schema_version, INPUT_SCHEMA_VERSION, "$.schema_version");
  literal(context.artifact_type, "CODEX_CREATIVE_INPUT", "$.artifact_type");
  literal(context.source_kind, "FIXTURE", "$.source_kind");
  literal(context.scenario_id, "SC-01", "$.scenario_id");

  const scope = exactRecord(context.scope, SCOPE_KEYS, "$.scope");
  fixtureRef(scope.workspace_ref, "$.scope.workspace_ref", ["ws_fixture_"]);
  fixtureRef(scope.account_ref, "$.scope.account_ref");
  fixtureRef(scope.product_ref, "$.scope.product_ref");

  const product = exactRecord(context.product, PRODUCT_KEYS, "$.product");
  string(product.name, "$.product.name", { max: 120 });
  string(product.category, "$.product.category", { max: 120 });
  string(product.offer, "$.product.offer", { max: 300 });
  if (!Array.isArray(product.approved_messages) || product.approved_messages.length > 10) {
    fail("$.product.approved_messages", "必须是长度 0-10 的 array");
  }
  product.approved_messages.forEach((valueItem, index) => {
    const path = `$.product.approved_messages[${index}]`;
    const item = exactRecord(valueItem, APPROVED_MESSAGE_KEYS, path);
    string(item.message, `${path}.message`, { max: 240 });
    fixtureRef(item.evidence_ref, `${path}.evidence_ref`);
  });
  stringArray(product.prohibited_claims, "$.product.prohibited_claims");
  string(context.communication_goal, "$.communication_goal", { max: 80 });

  const audience = exactRecord(context.audience, AUDIENCE_KEYS, "$.audience");
  stringArray(audience.locations, "$.audience.locations", { min: 1, max: 10 });
  integer(audience.age_min, "$.audience.age_min", 18, 65);
  integer(audience.age_max, "$.audience.age_max", 18, 65);
  if (audience.age_min > audience.age_max) {
    fail("$.audience", "age_min 不得大于 age_max");
  }
  stringArray(audience.notes, "$.audience.notes");
  stringArray(context.placements, "$.placements", { min: 1, max: 10 });

  const brand = exactRecord(context.brand, BRAND_KEYS, "$.brand");
  stringArray(brand.tone, "$.brand.tone", { min: 1, max: 10 });
  stringArray(brand.required_terms, "$.brand.required_terms");
  stringArray(brand.prohibited_terms, "$.brand.prohibited_terms");

  if (!Array.isArray(context.source_assets) || context.source_assets.length < 1 || context.source_assets.length > 10) {
    fail("$.source_assets", "必须是长度 1-10 的 array");
  }
  const assetRefs = new Set();
  context.source_assets.forEach((valueItem, index) => {
    const path = `$.source_assets[${index}]`;
    const item = exactRecord(valueItem, ASSET_KEYS, path);
    fixtureRef(item.asset_ref, `${path}.asset_ref`);
    if (assetRefs.has(item.asset_ref)) {
      fail(`${path}.asset_ref`, "素材引用不得重复");
    }
    assetRefs.add(item.asset_ref);
    enumValue(item.media_type, MEDIA_TYPES, `${path}.media_type`);
    enumValue(item.source_type, SOURCE_TYPES, `${path}.source_type`);
    enumValue(item.commercial_rights, RIGHTS, `${path}.commercial_rights`);
    if (typeof item.ai_generated !== "boolean") {
      fail(`${path}.ai_generated`, "必须是 boolean");
    }
    if (typeof item.generation_disclosure_required !== "boolean") {
      fail(`${path}.generation_disclosure_required`, "必须是 boolean");
    }
    if (item.ai_generated && !item.generation_disclosure_required) {
      fail(
        `${path}.generation_disclosure_required`,
        "AI 生成素材必须保留披露要求",
      );
    }
    stringArray(item.notes, `${path}.notes`);
  });

  const variant = exactRecord(
    context.variant_request,
    VARIANT_KEYS,
    "$.variant_request",
  );
  integer(variant.count, "$.variant_request.count", 1, 5);
  enumValue(
    variant.controlled_variable,
    CONTROLLED_VARIABLES,
    "$.variant_request.controlled_variable",
  );
  stringArray(variant.fixed_elements, "$.variant_request.fixed_elements", {
    max: 20,
  });
  stringArray(context.known_constraints, "$.known_constraints", { max: 20 });

  if (!Array.isArray(context.unknowns) || context.unknowns.length > 20) {
    fail("$.unknowns", "必须是长度 0-20 的 array");
  }
  const unknownCodes = new Set();
  context.unknowns.forEach((valueItem, index) => {
    const path = `$.unknowns[${index}]`;
    const item = exactRecord(valueItem, UNKNOWN_KEYS, path);
    literal(item.claim_type, "UNKNOWN", `${path}.claim_type`);
    string(item.code, `${path}.code`, { max: 80 });
    if (!/^[A-Z][A-Z0-9_]+$/u.test(item.code)) {
      fail(`${path}.code`, "必须是大写稳定 code");
    }
    if (unknownCodes.has(item.code)) {
      fail(`${path}.code`, "UNKNOWN code 不得重复");
    }
    unknownCodes.add(item.code);
    string(item.statement, `${path}.statement`, { max: 300 });
  });

  const guardrails = exactRecord(
    context.guardrails,
    GUARDRAIL_KEYS,
    "$.guardrails",
  );
  for (const [key, expected] of Object.entries({
    fixture_data_only: true,
    external_search_allowed: false,
    image_generation_allowed: false,
    policy_approval_guaranteed: false,
    performance_guaranteed: false,
    external_write: false,
    persisted: false,
  })) {
    literal(guardrails[key], expected, `$.guardrails.${key}`);
  }

  const handoff = exactRecord(
    context.codex_handoff,
    HANDOFF_KEYS,
    "$.codex_handoff",
  );
  literal(handoff.intended_skill, "facebook-ads-creative", "$.codex_handoff.intended_skill");
  literal(handoff.mode, "MANUAL_CONTEXT", "$.codex_handoff.mode");
  literal(handoff.context_only, true, "$.codex_handoff.context_only");
  literal(handoff.target_web_area, "ASSET_CENTER", "$.codex_handoff.target_web_area");

  const blockers = [];
  if (product.approved_messages.length === 0) {
    blockers.push(
      issue(
        "APPROVED_MESSAGES_MISSING",
        "$.product.approved_messages",
        "没有可用于素材草稿的已批准商品信息点。",
      ),
    );
  }
  if (variant.fixed_elements.length === 0) {
    blockers.push(
      issue(
        "FIXED_ELEMENTS_MISSING",
        "$.variant_request.fixed_elements",
        "变体测试没有固定项，无法保持单变量。",
      ),
    );
  }
  const termConflict = conflict(brand.required_terms, brand.prohibited_terms);
  if (termConflict) {
    blockers.push(
      issue(
        "BRAND_TERM_CONFLICT",
        "$.brand",
        `品牌必需词与禁用词冲突: ${termConflict}`,
      ),
    );
  }
  context.source_assets.forEach((item, index) => {
    if (item.source_type === "UNKNOWN") {
      blockers.push(
        issue(
          "ASSET_SOURCE_UNKNOWN",
          `$.source_assets[${index}].source_type`,
          "素材来源未知，不能生成变体草稿。",
        ),
      );
    }
    if (item.commercial_rights === "UNCONFIRMED") {
      blockers.push(
        issue(
          "ASSET_RIGHTS_UNCONFIRMED",
          `$.source_assets[${index}].commercial_rights`,
          "素材商业使用权未确认。",
        ),
      );
    }
    if (item.commercial_rights === "PROHIBITED") {
      blockers.push(
        issue(
          "ASSET_RIGHTS_PROHIBITED",
          `$.source_assets[${index}].commercial_rights`,
          "素材明确禁止商业使用。",
        ),
      );
    }
  });

  return {
    preflight_schema_version: PREFLIGHT_SCHEMA_VERSION,
    status: blockers.length === 0 ? "READY" : "BLOCKED",
    facts: [
      fact("$.scope", scope),
      fact("$.product", product),
      fact("$.communication_goal", context.communication_goal),
      fact("$.audience", audience),
      fact("$.placements", context.placements),
      fact("$.brand", brand),
      fact("$.source_assets", context.source_assets),
      fact("$.variant_request", variant),
    ],
    blockers,
    warnings: [
      issue(
        "FIXTURE_DATA_ONLY",
        "$.source_kind",
        "结果只适用于固定虚构数据。",
      ),
      issue(
        "META_POLICY_REVIEW_NOT_RUN",
        "$.guardrails.policy_approval_guaranteed",
        "当前没有执行 Meta 政策审核。",
      ),
      issue(
        "IMAGE_GENERATION_DISABLED",
        "$.guardrails.image_generation_allowed",
        "当前只生成文本和视觉方向，不生成素材文件。",
      ),
    ],
    unknowns: structuredClone(context.unknowns),
    requested_variant_count: variant.count,
    controlled_variable: variant.controlled_variable,
    assets_generated: false,
    recommendations_generated: false,
    external_write: false,
  };
}

async function readStdin() {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of process.stdin) {
    totalBytes += chunk.length;
    if (totalBytes > 2_000_000) {
      fail("$", "输入超过 2 MB 上限");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function isWithinRoot(rootPath, candidatePath) {
  const relativePath = relative(rootPath, candidatePath);
  return (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
}

async function readRepositoryFile(inputPath) {
  const lexicalPath = resolve(inputPath);
  if (!isWithinRoot(process.cwd(), lexicalPath)) {
    fail("$", "输入文件必须位于当前仓库目录内");
  }
  const fileInfo = await lstat(lexicalPath);
  if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) {
    fail("$", "输入必须是普通 JSON 文件且不能是符号链接");
  }
  if (fileInfo.size > 2_000_000) {
    fail("$", "输入超过 2 MB 上限");
  }
  const [rootRealPath, fileRealPath] = await Promise.all([
    realpath(process.cwd()),
    realpath(lexicalPath),
  ]);
  if (!isWithinRoot(rootRealPath, fileRealPath)) {
    fail("$", "输入文件解析后超出当前仓库目录");
  }
  return readFile(fileRealPath, "utf8");
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || process.argv.length !== 3) {
    process.stderr.write("usage: node validate-context.mjs <context.json|->\n");
    process.exitCode = 2;
    return;
  }
  try {
    const raw =
      inputPath === "-"
        ? await readStdin()
        : await readRepositoryFile(inputPath);
    if (Buffer.byteLength(raw, "utf8") > 2_000_000) {
      fail("$", "输入超过 2 MB 上限");
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      fail("$", "不是有效 JSON");
    }
    const preflight = validateCreativeContext(parsed);
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    process.exitCode = preflight.status === "READY" ? 0 : 2;
  } catch (error) {
    if (error instanceof InvalidCreativeContext) {
      process.stderr.write(
        `${JSON.stringify(
          {
            status: "REJECTED",
            code: error.code,
            path: error.path,
            reason: error.message,
            assets_generated: false,
            external_write: false,
          },
          null,
          2,
        )}\n`,
      );
      process.exitCode = 1;
      return;
    }
    process.stderr.write(
      `${JSON.stringify(
        {
          status: "REJECTED",
          code: "CREATIVE_CONTEXT_READ_FAILED",
          path: "$",
          reason: "无法安全读取素材上下文",
          assets_generated: false,
          external_write: false,
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
