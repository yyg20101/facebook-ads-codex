import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  InvalidWorkflowDraft,
  evaluateWorkflowDraft,
} from "../facebook-ads-workflow-skills/evaluate-drafts.mjs";
import {
  CROSS_SKILL_WORKFLOW_ARTIFACT_TYPE,
  CROSS_SKILL_WORKFLOW_CONTRACTS,
  CROSS_SKILL_WORKFLOW_GUARDRAILS,
  CROSS_SKILL_WORKFLOW_SCHEMA_VERSION,
} from "./workflow-contracts.mjs";

export const CROSS_SKILL_WORKFLOW_EVALUATION_SCHEMA_VERSION =
  "facebook-ads-cross-skill-workflow-evaluation/v1";

const MAX_BYTES = 4 * 1024 * 1024;
const TOP_LEVEL_KEYS = [
  "schema_version",
  "artifact_type",
  "source_kind",
  "workflow_id",
  "workflow_type",
  "scenario_id",
  "scope",
  "stages",
  "handoffs",
  "guardrails",
];
const SCOPE_KEYS = [
  "workspace_ref",
  "account_ref",
  "object_ref",
  "object_type",
];
const STAGE_KEYS = ["stage_id", "skill", "context", "draft"];
const HANDOFF_KEYS = [
  "handoff_id",
  "mode",
  "from_stage",
  "to_stage",
  "from_state",
  "to_state",
  "mappings",
  "manual_inputs",
  "human_review_required",
  "automatic_handoff",
  "target_persisted",
  "external_write",
];
const MAPPING_KEYS = ["from_path", "to_path"];
const GUARDRAIL_KEYS = Object.keys(CROSS_SKILL_WORKFLOW_GUARDRAILS);
const FORBIDDEN_NORMALIZED_KEYS = new Set([
  "accesstoken",
  "approvaltoken",
  "authorization",
  "bearertoken",
  "clientsecret",
  "cookie",
  "customerdata",
  "endpoint",
  "idempotencykey",
  "metapayload",
  "password",
  "publishpayload",
  "realaccountid",
  "requestid",
  "toolcall",
  "url",
]);
const URL_OR_CREDENTIAL_PATTERN =
  /(?:https?:\/\/|www\.|authorization\s*:|bearer\s+[A-Za-z0-9._-]+|access[_ -]?token\s*[:=]|client[_ -]?secret\s*[:=])/iu;

export class InvalidCrossSkillWorkflow extends Error {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = "InvalidCrossSkillWorkflow";
    this.code = "INVALID_CROSS_SKILL_WORKFLOW";
    this.path = path;
  }
}

function fail(path, message) {
  throw new InvalidCrossSkillWorkflow(path, message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactRecord(value, keys, path) {
  if (!isRecord(value)) fail(path, "必须是 object");
  const actual = Object.keys(value);
  if (
    actual.length !== keys.length ||
    actual.some((key, index) => key !== keys[index])
  ) {
    fail(path, `字段或顺序必须精确为 ${keys.join(", ")}`);
  }
  return value;
}

function exactArray(value, expected, path) {
  if (!Array.isArray(value)) fail(path, "必须是 array");
  if (JSON.stringify(value) !== JSON.stringify(expected)) {
    fail(path, "必须原样匹配固定跨 Skill 契约");
  }
}

function literal(value, expected, path) {
  if (value !== expected) fail(path, `必须为 ${JSON.stringify(expected)}`);
}

function deepEqual(actual, expected, path) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(path, "交接两端必须保留完全一致的 fixture 值");
  }
}

function normalizedKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/gu, "");
}

function assertSafeContent(value, path = "$bundle") {
  if (typeof value === "string") {
    if (URL_OR_CREDENTIAL_PATTERN.test(value)) {
      fail(path, "不得包含 URL、凭据或 Authorization 内容");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeContent(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_NORMALIZED_KEYS.has(normalizedKey(key))) {
      fail(`${path}.${key}`, "包含禁止的敏感、外部调用或请求追踪字段");
    }
    if (["external_write", "persisted", "target_persisted"].includes(key)) {
      literal(nested, false, `${path}.${key}`);
    }
    assertSafeContent(nested, `${path}.${key}`);
  }
}

function resolvePath(root, path, errorPath) {
  if (typeof path !== "string" || !path.startsWith("$.")) {
    fail(errorPath, "必须是以 $. 开始的受限 JSON path");
  }
  const tokenPattern = /\.([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]/gu;
  let cursor = root;
  let position = 1;
  let match;
  while ((match = tokenPattern.exec(path)) !== null) {
    if (match.index !== position) fail(errorPath, "包含不支持的 JSON path 语法");
    const token = match[1] ?? Number(match[2]);
    if (
      cursor === null ||
      typeof cursor !== "object" ||
      !Object.prototype.hasOwnProperty.call(cursor, token)
    ) {
      fail(errorPath, "引用的 fixture 路径不存在");
    }
    cursor = cursor[token];
    position = tokenPattern.lastIndex;
  }
  if (position !== path.length) fail(errorPath, "包含不支持的 JSON path 语法");
  return cursor;
}

function validateScope(bundle, stages, contract) {
  exactRecord(bundle.scope, SCOPE_KEYS, "$bundle.scope");
  for (const [index, stage] of stages.entries()) {
    literal(
      stage.context.scope.workspace_ref,
      bundle.scope.workspace_ref,
      `$bundle.stages[${index}].context.scope.workspace_ref`,
    );
    literal(
      stage.context.scope.account_ref,
      bundle.scope.account_ref,
      `$bundle.stages[${index}].context.scope.account_ref`,
    );
  }
  if (contract === CROSS_SKILL_WORKFLOW_CONTRACTS.CREATIVE_TO_CAMPAIGN_DRAFT) {
    literal(bundle.scope.object_ref, null, "$bundle.scope.object_ref");
    literal(bundle.scope.object_type, null, "$bundle.scope.object_type");
    return;
  }
  literal(
    stages[0].context.scope.object_ref,
    bundle.scope.object_ref,
    "$bundle.scope.object_ref",
  );
  literal(
    stages[0].context.scope.object_type,
    bundle.scope.object_type,
    "$bundle.scope.object_type",
  );
  literal(
    stages[1].context.target.object_ref,
    bundle.scope.object_ref,
    "$bundle.stages[1].context.target.object_ref",
  );
  literal(
    stages[1].context.target.object_type,
    bundle.scope.object_type,
    "$bundle.stages[1].context.target.object_type",
  );
}

function validateStages(bundle, contract) {
  if (!Array.isArray(bundle.stages) || bundle.stages.length !== contract.stages.length) {
    fail("$bundle.stages", `必须恰好包含 ${contract.stages.length} 个阶段`);
  }
  return bundle.stages.map((stage, index) => {
    exactRecord(stage, STAGE_KEYS, `$bundle.stages[${index}]`);
    const expected = contract.stages[index];
    literal(stage.stage_id, expected.stage_id, `$bundle.stages[${index}].stage_id`);
    literal(stage.skill, expected.skill, `$bundle.stages[${index}].skill`);
    let evaluation;
    try {
      evaluation = evaluateWorkflowDraft(stage.skill, stage.context, stage.draft);
    } catch (error) {
      if (
        error instanceof InvalidWorkflowDraft ||
        (error &&
          typeof error === "object" &&
          typeof error.code === "string" &&
          error.code.startsWith("INVALID_") &&
          typeof error.path === "string")
      ) {
        fail(
          `$bundle.stages[${index}]${error.path.slice(1)}`,
          `阶段输入或草稿契约失败：${error.message}`,
        );
      }
      throw error;
    }
    literal(
      evaluation.preflight_status,
      expected.preflight_status,
      `$bundle.stages[${index}].draft.preflight.status`,
    );
    return evaluation;
  });
}

function validateHandoff(bundle, stages, contract) {
  if (!Array.isArray(bundle.handoffs) || bundle.handoffs.length !== 1) {
    fail("$bundle.handoffs", "当前固定工作流必须恰有一个人工交接");
  }
  const value = exactRecord(bundle.handoffs[0], HANDOFF_KEYS, "$bundle.handoffs[0]");
  const expected = contract.handoff;
  [
    "handoff_id",
    "mode",
    "from_stage",
    "to_stage",
    "from_state",
    "to_state",
  ].forEach((key) => literal(value[key], expected[key], `$bundle.handoffs[0].${key}`));
  exactArray(value.mappings, expected.mappings, "$bundle.handoffs[0].mappings");
  exactArray(
    value.manual_inputs,
    expected.manual_inputs,
    "$bundle.handoffs[0].manual_inputs",
  );
  literal(value.human_review_required, true, "$bundle.handoffs[0].human_review_required");
  literal(value.automatic_handoff, false, "$bundle.handoffs[0].automatic_handoff");
  literal(value.target_persisted, false, "$bundle.handoffs[0].target_persisted");
  literal(value.external_write, false, "$bundle.handoffs[0].external_write");

  const sourceStage = stages.find((stage) => stage.stage_id === value.from_stage);
  const targetStage = stages.find((stage) => stage.stage_id === value.to_stage);
  if (!sourceStage || !targetStage) fail("$bundle.handoffs[0]", "交接阶段不存在");
  value.mappings.forEach((mapping, index) => {
    exactRecord(mapping, MAPPING_KEYS, `$bundle.handoffs[0].mappings[${index}]`);
    const sourceValue = resolvePath(
      sourceStage,
      mapping.from_path,
      `$bundle.handoffs[0].mappings[${index}].from_path`,
    );
    const targetValue = resolvePath(
      targetStage,
      mapping.to_path,
      `$bundle.handoffs[0].mappings[${index}].to_path`,
    );
    deepEqual(
      targetValue,
      sourceValue,
      `$bundle.handoffs[0].mappings[${index}]`,
    );
  });
}

export function evaluateCrossSkillWorkflow(bundle) {
  exactRecord(bundle, TOP_LEVEL_KEYS, "$bundle");
  literal(
    bundle.schema_version,
    CROSS_SKILL_WORKFLOW_SCHEMA_VERSION,
    "$bundle.schema_version",
  );
  literal(
    bundle.artifact_type,
    CROSS_SKILL_WORKFLOW_ARTIFACT_TYPE,
    "$bundle.artifact_type",
  );
  literal(bundle.source_kind, "FIXTURE", "$bundle.source_kind");
  const contract = CROSS_SKILL_WORKFLOW_CONTRACTS[bundle.workflow_type];
  if (!contract) fail("$bundle.workflow_type", "不是允许的固定跨 Skill 工作流");
  literal(bundle.workflow_id, contract.workflow_id, "$bundle.workflow_id");
  literal(bundle.scenario_id, contract.scenario_id, "$bundle.scenario_id");
  const stageEvaluations = validateStages(bundle, contract);
  validateScope(bundle, bundle.stages, contract);
  validateHandoff(bundle, bundle.stages, contract);
  exactRecord(bundle.guardrails, GUARDRAIL_KEYS, "$bundle.guardrails");
  deepEqual(bundle.guardrails, CROSS_SKILL_WORKFLOW_GUARDRAILS, "$bundle.guardrails");
  assertSafeContent(bundle);

  const checks = [
    "BUNDLE_CONTRACT",
    "FIXTURE_SOURCE",
    "STAGE_SEQUENCE",
    "STAGE_DRAFT_CONTRACTS",
    "SCOPE_CONTINUITY",
    "HANDOFF_CONTRACT",
    "MAPPING_INTEGRITY",
    "MANUAL_INPUT_BOUNDARY",
    "HUMAN_REVIEW_BOUNDARY",
    "SAFETY_INVARIANTS",
  ];
  return {
    evaluation_schema_version: CROSS_SKILL_WORKFLOW_EVALUATION_SCHEMA_VERSION,
    evaluation_status: "PASS",
    workflow_id: bundle.workflow_id,
    workflow_type: bundle.workflow_type,
    stages: stageEvaluations.map((evaluation, index) => ({
      stage_id: bundle.stages[index].stage_id,
      skill: evaluation.skill,
      evaluation_status: evaluation.evaluation_status,
      preflight_status: evaluation.preflight_status,
    })),
    handoff_count: bundle.handoffs.length,
    score: { passed: checks.length, total: checks.length, ratio: 1 },
    checks,
    model_invoked: false,
    persisted: false,
    external_write: false,
  };
}

async function readStdin(argument) {
  if (argument && argument !== "-") {
    fail("$input", "只接受标准输入，不读取或持久化工作流结果文件");
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of process.stdin) {
    total += chunk.length;
    if (total > MAX_BYTES) fail("$input", "输入超过 4 MiB 限制");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  try {
    const raw = await readStdin(process.argv[2]);
    let bundle;
    try {
      bundle = JSON.parse(raw);
    } catch {
      fail("$input", "必须是有效 JSON");
    }
    const result = evaluateCrossSkillWorkflow(bundle);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    const safeError =
      error instanceof InvalidCrossSkillWorkflow
        ? { code: error.code, path: error.path, statement: error.message }
        : {
            code: "CROSS_SKILL_WORKFLOW_EVALUATION_FAILED",
            path: "$input",
            statement: "无法安全评估跨 Skill 工作流",
          };
    process.stderr.write(
      `${JSON.stringify(
        {
          evaluation_schema_version:
            CROSS_SKILL_WORKFLOW_EVALUATION_SCHEMA_VERSION,
          evaluation_status: "REJECTED",
          ...safeError,
          model_invoked: false,
          persisted: false,
          external_write: false,
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
