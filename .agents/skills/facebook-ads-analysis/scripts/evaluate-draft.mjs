import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  InvalidOfflineAnalysisContext,
  validateOfflineAnalysisContext,
} from "./validate-context.mjs";

export const DRAFT_EVALUATION_SCHEMA_VERSION =
  "facebook-ads-analysis-draft-evaluation/v1";

export const REQUIRED_LIMITATIONS = [
  "FIXTURE_DATA_ONLY",
  "NO_EXTERNAL_CONNECTION",
  "NON_CAUSAL_ANALYSIS",
  "NO_OPTIMIZATION_ACTIONS",
];

const TOP_LEVEL_KEYS = [
  "analysis_mode",
  "source_schema_version",
  "analysis_kind",
  "scope_and_freshness",
  "executive_answer",
  "evidence",
  "counter_evidence",
  "driver_decomposition",
  "missing_data",
  "confidence",
  "limitations",
  "external_write",
];

const EXECUTIVE_KEYS = [
  "claim_type",
  "statement",
  "supporting_evidence_paths",
  "confidence",
  "alternative_explanations",
];

const EVIDENCE_KEYS = [
  "claim_type",
  "code",
  "statement",
  "evidence_paths",
  "evidence_values",
];

const DRIVER_KEYS = ["kind", "ranking_applied", "items"];
const DRIVER_ITEM_KEYS = [
  "object_ref",
  "statement",
  "evidence_paths",
  "evidence_values",
];
const UNKNOWN_KEYS = ["claim_type", "code", "statement"];
const EVIDENCE_VALUE_KEYS = ["path", "value"];
const CONFIDENCE_VALUES = new Set([
  "CONFIRMED",
  "LIKELY",
  "HYPOTHESIS",
  "NOT_ASSESSED",
]);
const ALLOWED_EVIDENCE_ROOTS = new Set([
  "scope_and_freshness",
  "quality_evidence",
  "fact_evidence",
  "observed_patterns",
  "driver_inputs",
  "unknowns",
  "warnings",
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
  "recommendedactions",
  "recommendation",
  "recommendations",
  "writeparameters",
  "winner",
  "winningobject",
  "ranking",
  "rank",
  "businessthreshold",
  "optimizationactions",
  "budgetaction",
  "statusaction",
  "toolcall",
  "mcpcall",
  "metawrite",
  "externalhandoff",
]);
const UNSAFE_NARRATIVE_PATTERNS = [
  /导致|造成|归因于|原因是/u,
  /提高预算|降低预算|增加预算|减少预算|调整预算|暂停广告|关闭广告|开启广告|修改出价|调整受众/u,
  /赢家|最佳|排名|优于/u,
  /\b(?:caused by|due to|drives?|driver of|increase budget|decrease budget|pause (?:the )?ad|winner|ranking|ranked|outperform(?:s|ed)?)\b/iu,
];
const EVALUATION_CHECKS = [
  "INPUT_CONTEXT_VALID",
  "OUTPUT_SCHEMA_EXACT",
  "SCOPE_BOUND",
  "FACTS_GROUNDED",
  "UNKNOWN_COVERAGE",
  "DRIVER_COVERAGE",
  "CLAIM_BOUNDARIES",
  "SIDE_EFFECTS_DISABLED",
];

export class InvalidOfflineAnalysisDraft extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidOfflineAnalysisDraft";
    this.code = "INVALID_OFFLINE_ANALYSIS_DRAFT";
    this.path = path;
  }
}

function fail(path, reason) {
  throw new InvalidOfflineAnalysisDraft(path, reason);
}

function asRecord(value, path) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "必须是 object");
  }
  return value;
}

function exactRecord(value, keys, path, { ordered = false } = {}) {
  const record = asRecord(value, path);
  const actualKeys = Object.keys(record);
  if (
    actualKeys.length !== keys.length ||
    actualKeys.some((key) => !keys.includes(key))
  ) {
    fail(path, `字段必须且只能为 ${keys.join(", ")}`);
  }
  if (ordered && actualKeys.some((key, index) => key !== keys[index])) {
    fail(path, `字段顺序必须为 ${keys.join(", ")}`);
  }
  return record;
}

function expectLiteral(value, expected, path) {
  if (!isDeepStrictEqual(value, expected)) {
    fail(path, `必须为 ${JSON.stringify(expected)}`);
  }
}

function expectString(value, path, { max = 600 } = {}) {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) {
    fail(path, `必须是 1-${max} 个字符的非空 string`);
  }
  return value;
}

function expectCode(value, path, { taskOnly = false } = {}) {
  expectString(value, path, { max: 80 });
  const pattern = taskOnly ? /^TASK_[A-Z0-9_]+$/u : /^[A-Z][A-Z0-9_]+$/u;
  if (!pattern.test(value)) {
    fail(path, taskOnly ? "新增未知项 code 必须使用 TASK_*" : "必须是大写稳定 code");
  }
  return value;
}

function expectArray(value, path) {
  if (!Array.isArray(value)) {
    fail(path, "必须是 array");
  }
  return value;
}

function expectConfidence(value, path) {
  if (!CONFIDENCE_VALUES.has(value)) {
    fail(path, "不是支持的 confidence");
  }
  return value;
}

function assertUnique(values, path) {
  if (new Set(values).size !== values.length) {
    fail(path, "不得包含重复项");
  }
}

function normalizeKey(key) {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");
}

function assertNoForbiddenKeys(value, path = "$", keyName = null) {
  if (keyName && FORBIDDEN_NORMALIZED_KEYS.has(normalizeKey(keyName))) {
    fail(path, "包含禁止的敏感、排名、建议、请求追踪或外部操作字段");
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoForbiddenKeys(item, `${path}[${index}]`),
    );
    return;
  }
  if (typeof value !== "object" || value === null) {
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    assertNoForbiddenKeys(nested, `${path}.${key}`, key);
  }
}

function assertSafeNarrative(value, path) {
  const statement = expectString(value, path);
  if (UNSAFE_NARRATIVE_PATTERNS.some((pattern) => pattern.test(statement))) {
    fail(path, "包含因果、排名或可执行优化措辞");
  }
}

function parseEvidencePath(path) {
  expectString(path, "$.evidence_path", { max: 240 });
  if (!path.startsWith("$.") || path.length === 2) {
    fail("$.evidence_path", "必须以 $. 开头");
  }
  const tokens = [];
  let cursor = 2;
  while (cursor < path.length) {
    const keyMatch = /^[A-Za-z_][A-Za-z0-9_]*/u.exec(path.slice(cursor));
    if (!keyMatch) {
      fail("$.evidence_path", `不支持的 JSON path: ${path}`);
    }
    tokens.push(keyMatch[0]);
    cursor += keyMatch[0].length;
    while (path[cursor] === "[") {
      const indexMatch = /^\[(0|[1-9][0-9]*)\]/u.exec(path.slice(cursor));
      if (!indexMatch) {
        fail("$.evidence_path", `不支持的 array index: ${path}`);
      }
      tokens.push(Number(indexMatch[1]));
      cursor += indexMatch[0].length;
    }
    if (cursor === path.length) {
      break;
    }
    if (path[cursor] !== ".") {
      fail("$.evidence_path", `不支持的 JSON path: ${path}`);
    }
    cursor += 1;
  }
  if (!ALLOWED_EVIDENCE_ROOTS.has(tokens[0])) {
    fail("$.evidence_path", `不允许引用 ${String(tokens[0])}`);
  }
  return tokens;
}

export function resolveOfflineAnalysisEvidencePath(context, path) {
  const tokens = parseEvidencePath(path);
  let current = context;
  for (const token of tokens) {
    if (
      current === null ||
      typeof current !== "object" ||
      !Object.hasOwn(current, token)
    ) {
      fail(path, "evidence path 不存在于输入上下文");
    }
    current = current[token];
  }
  return current;
}

function validatePathArray(value, path, context, { required = true } = {}) {
  const paths = expectArray(value, path);
  if (required && paths.length === 0) {
    fail(path, "至少需要一个 evidence path");
  }
  paths.forEach((item, index) => {
    expectString(item, `${path}[${index}]`, { max: 240 });
    resolveOfflineAnalysisEvidencePath(context, item);
  });
  assertUnique(paths, path);
  return paths;
}

function validateEvidenceValues(value, path, paths, context) {
  const values = expectArray(value, path);
  if (values.length !== paths.length) {
    fail(path, "必须与 evidence_paths 一一对应");
  }
  values.forEach((item, index) => {
    const entry = exactRecord(item, EVIDENCE_VALUE_KEYS, `${path}[${index}]`);
    expectLiteral(entry.path, paths[index], `${path}[${index}].path`);
    const expected = resolveOfflineAnalysisEvidencePath(context, entry.path);
    if (!isDeepStrictEqual(entry.value, expected)) {
      fail(`${path}[${index}].value`, "与输入 evidence path 的值不一致");
    }
  });
}

function validateExecutive(value, context) {
  const executive = exactRecord(value, EXECUTIVE_KEYS, "$.executive_answer");
  if (!["FACT", "INFERENCE", "UNKNOWN"].includes(executive.claim_type)) {
    fail("$.executive_answer.claim_type", "不是支持的 claim_type");
  }
  assertSafeNarrative(executive.statement, "$.executive_answer.statement");
  const paths = validatePathArray(
    executive.supporting_evidence_paths,
    "$.executive_answer.supporting_evidence_paths",
    context,
    { required: executive.claim_type !== "UNKNOWN" },
  );
  const confidence = expectConfidence(
    executive.confidence,
    "$.executive_answer.confidence",
  );
  const alternatives = expectArray(
    executive.alternative_explanations,
    "$.executive_answer.alternative_explanations",
  );
  alternatives.forEach((item, index) =>
    assertSafeNarrative(
      item,
      `$.executive_answer.alternative_explanations[${index}]`,
    ),
  );
  assertUnique(alternatives, "$.executive_answer.alternative_explanations");

  if (executive.claim_type === "FACT") {
    expectLiteral(confidence, "CONFIRMED", "$.executive_answer.confidence");
    expectLiteral(alternatives, [], "$.executive_answer.alternative_explanations");
  } else if (executive.claim_type === "INFERENCE") {
    if (!["LIKELY", "HYPOTHESIS"].includes(confidence)) {
      fail("$.executive_answer.confidence", "INFERENCE 只能是 LIKELY 或 HYPOTHESIS");
    }
    if (alternatives.length === 0) {
      fail(
        "$.executive_answer.alternative_explanations",
        "INFERENCE 必须提供替代解释",
      );
    }
  } else {
    expectLiteral(paths, [], "$.executive_answer.supporting_evidence_paths");
    expectLiteral(confidence, "NOT_ASSESSED", "$.executive_answer.confidence");
    expectLiteral(alternatives, [], "$.executive_answer.alternative_explanations");
  }
  return { executive, paths };
}

function validateEvidenceItem(value, path, context, { allowUnknown = false } = {}) {
  const item = exactRecord(value, EVIDENCE_KEYS, path);
  const allowedClaims = allowUnknown ? ["FACT", "UNKNOWN"] : ["FACT"];
  if (!allowedClaims.includes(item.claim_type)) {
    fail(`${path}.claim_type`, "不是该集合支持的 claim_type");
  }
  expectCode(item.code, `${path}.code`);
  assertSafeNarrative(item.statement, `${path}.statement`);
  const paths = validatePathArray(item.evidence_paths, `${path}.evidence_paths`, context, {
    required: item.claim_type === "FACT",
  });
  if (item.claim_type === "UNKNOWN") {
    expectLiteral(paths, [], `${path}.evidence_paths`);
    expectLiteral(item.evidence_values, [], `${path}.evidence_values`);
  } else {
    validateEvidenceValues(item.evidence_values, `${path}.evidence_values`, paths, context);
  }
  return paths;
}

function validateEvidenceCollections(draft, context) {
  const evidence = expectArray(draft.evidence, "$.evidence");
  if (evidence.length === 0) {
    fail("$.evidence", "至少需要一条 FACT evidence");
  }
  const evidenceCodes = [];
  const groundedPaths = new Set();
  evidence.forEach((item, index) => {
    const path = `$.evidence[${index}]`;
    const record = asRecord(item, path);
    evidenceCodes.push(record.code);
    validateEvidenceItem(item, path, context).forEach((itemPath) =>
      groundedPaths.add(itemPath),
    );
  });
  assertUnique(evidenceCodes, "$.evidence[*].code");

  const counter = expectArray(draft.counter_evidence, "$.counter_evidence");
  const counterCodes = [];
  counter.forEach((item, index) => {
    const path = `$.counter_evidence[${index}]`;
    const record = asRecord(item, path);
    counterCodes.push(record.code);
    validateEvidenceItem(item, path, context, { allowUnknown: true });
  });
  assertUnique(counterCodes, "$.counter_evidence[*].code");
  assertUnique([...evidenceCodes, ...counterCodes], "$.evidence code");
  return groundedPaths;
}

function validateDriver(value, context) {
  const driver = exactRecord(value, DRIVER_KEYS, "$.driver_decomposition");
  expectLiteral(driver.kind, context.driver_inputs.kind, "$.driver_decomposition.kind");
  expectLiteral(driver.ranking_applied, false, "$.driver_decomposition.ranking_applied");
  const items = expectArray(driver.items, "$.driver_decomposition.items");

  if (context.driver_inputs.kind === "NONE") {
    expectLiteral(items, [], "$.driver_decomposition.items");
    return;
  }
  if (items.length !== context.driver_inputs.items.length) {
    fail("$.driver_decomposition.items", "必须完整覆盖全部直接子对象");
  }
  const objectRefs = [];
  items.forEach((valueItem, index) => {
    const path = `$.driver_decomposition.items[${index}]`;
    const item = exactRecord(valueItem, DRIVER_ITEM_KEYS, path);
    const sourceItem = context.driver_inputs.items[index];
    expectLiteral(item.object_ref, sourceItem.object.object_ref, `${path}.object_ref`);
    objectRefs.push(item.object_ref);
    assertSafeNarrative(item.statement, `${path}.statement`);
    const paths = validatePathArray(item.evidence_paths, `${path}.evidence_paths`, context);
    const sourcePrefix = `$.driver_inputs.items[${index}]`;
    if (!paths.some((itemPath) => itemPath === sourcePrefix || itemPath.startsWith(`${sourcePrefix}.`))) {
      fail(`${path}.evidence_paths`, "必须引用对应直接子对象的输入路径");
    }
    validateEvidenceValues(item.evidence_values, `${path}.evidence_values`, paths, context);
  });
  assertUnique(objectRefs, "$.driver_decomposition.items[*].object_ref");
}

function validateMissingData(value, context) {
  const items = expectArray(value, "$.missing_data");
  if (items.length < context.unknowns.length) {
    fail("$.missing_data", "不得删除输入中的 UNKNOWN");
  }
  const codes = [];
  items.forEach((valueItem, index) => {
    const path = `$.missing_data[${index}]`;
    const item = exactRecord(valueItem, UNKNOWN_KEYS, path);
    expectLiteral(item.claim_type, "UNKNOWN", `${path}.claim_type`);
    expectCode(item.code, `${path}.code`, {
      taskOnly: index >= context.unknowns.length,
    });
    expectString(item.statement, `${path}.statement`);
    codes.push(item.code);
    if (
      index < context.unknowns.length &&
      !isDeepStrictEqual(item, context.unknowns[index])
    ) {
      fail(path, "输入 UNKNOWN 必须原样、按原顺序保留");
    }
  });
  assertUnique(codes, "$.missing_data[*].code");
}

function validateLimitations(value) {
  const limitations = expectArray(value, "$.limitations");
  expectLiteral(limitations, REQUIRED_LIMITATIONS, "$.limitations");
}

export function evaluateOfflineAnalysisDraft(contextValue, draftValue) {
  const context = validateOfflineAnalysisContext(contextValue);
  assertNoForbiddenKeys(draftValue);
  const draft = exactRecord(draftValue, TOP_LEVEL_KEYS, "$", { ordered: true });
  expectLiteral(draft.analysis_mode, "OFFLINE_FIXTURE_DRAFT", "$.analysis_mode");
  expectLiteral(
    draft.source_schema_version,
    context.schema_version,
    "$.source_schema_version",
  );
  expectLiteral(draft.analysis_kind, context.analysis_kind, "$.analysis_kind");
  if (!isDeepStrictEqual(draft.scope_and_freshness, context.scope_and_freshness)) {
    fail("$.scope_and_freshness", "必须与输入范围和新鲜度完全一致");
  }

  const { executive, paths: executivePaths } = validateExecutive(
    draft.executive_answer,
    context,
  );
  const groundedPaths = validateEvidenceCollections(draft, context);
  for (const path of executivePaths) {
    if (!groundedPaths.has(path)) {
      fail(
        "$.executive_answer.supporting_evidence_paths",
        `executive path 未在 evidence 中落地: ${path}`,
      );
    }
  }
  validateDriver(draft.driver_decomposition, context);
  validateMissingData(draft.missing_data, context);
  expectLiteral(draft.confidence, executive.confidence, "$.confidence");
  validateLimitations(draft.limitations);
  expectLiteral(draft.external_write, false, "$.external_write");

  return {
    evaluation_schema_version: DRAFT_EVALUATION_SCHEMA_VERSION,
    evaluation_status: "PASS",
    analysis_kind: context.analysis_kind,
    score: {
      passed: EVALUATION_CHECKS.length,
      total: EVALUATION_CHECKS.length,
      ratio: 1,
    },
    checks: EVALUATION_CHECKS.map((id) => ({ id, status: "PASS" })),
    external_write: false,
  };
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || process.argv.length !== 3) {
    process.stderr.write("usage: node evaluate-draft.mjs <evaluation-case.json|->\n");
    process.exitCode = 2;
    return;
  }
  try {
    const raw = inputPath === "-" ? await readStdin() : await readFile(resolve(inputPath), "utf8");
    if (Buffer.byteLength(raw, "utf8") > 2_000_000) {
      fail("$", "输入超过 2 MB 上限");
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      fail("$", "不是有效 JSON");
    }
    const envelope = exactRecord(parsed, ["context", "draft"], "$evaluation_case");
    process.stdout.write(
      `${JSON.stringify(evaluateOfflineAnalysisDraft(envelope.context, envelope.draft), null, 2)}\n`,
    );
  } catch (error) {
    if (
      error instanceof InvalidOfflineAnalysisDraft ||
      error instanceof InvalidOfflineAnalysisContext
    ) {
      process.stderr.write(
        `${JSON.stringify(
          {
            evaluation_status: "REJECTED",
            code: error.code,
            path: error.path,
            reason: error.message,
            external_write: false,
          },
          null,
          2,
        )}\n`,
      );
      process.exitCode = 2;
      return;
    }
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
