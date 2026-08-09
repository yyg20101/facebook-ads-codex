import {
  createCampaignContext,
  createChangeContext,
  createCreativeContext,
  createDailyBriefContext,
  createInconclusiveOptimizationContext,
} from "./fixture-contexts.mjs";

export const WORKFLOW_FORWARD_TEST_CASE_SCHEMA_VERSION =
  "facebook-ads-workflow-forward-test-case/v1";

const CASE_DEFINITIONS = [
  {
    case_id: "FWD-FBW-001",
    skill: "facebook-ads-creative",
    prompt:
      "使用 $facebook-ads-creative 处理下面的离线 fixture 素材上下文，生成严格符合 Skill 输出契约、可人工评审且不执行任何外部操作的最终 JSON 草稿。",
    createContext: createCreativeContext,
    allowedSkillAssets: [
      ".agents/skills/facebook-ads-creative/SKILL.md",
      ".agents/skills/facebook-ads-creative/references/creative-context-contract.md",
      ".agents/skills/facebook-ads-creative/references/creative-draft-contract.md",
      ".agents/skills/facebook-ads-creative/scripts/validate-context.mjs",
    ],
  },
  {
    case_id: "FWD-FBW-002",
    skill: "facebook-ads-campaign-builder",
    prompt:
      "使用 $facebook-ads-campaign-builder 处理下面的离线 fixture 投放上下文，生成严格符合 Skill 输出契约的 Campaign、Ad Set 和 Ad 最终 JSON 草稿。",
    createContext: createCampaignContext,
    allowedSkillAssets: [
      ".agents/skills/facebook-ads-campaign-builder/SKILL.md",
      ".agents/skills/facebook-ads-campaign-builder/references/campaign-context-contract.md",
      ".agents/skills/facebook-ads-campaign-builder/references/campaign-draft-contract.md",
      ".agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs",
    ],
  },
  {
    case_id: "FWD-FBW-003",
    skill: "facebook-ads-daily-brief",
    prompt:
      "使用 $facebook-ads-daily-brief 处理下面的离线 fixture 日报上下文，只汇总已声明事项，生成严格符合 Skill 输出契约的最终 JSON 简报。",
    createContext: () => createDailyBriefContext({ withItems: true }),
    allowedSkillAssets: [
      ".agents/skills/facebook-ads-daily-brief/SKILL.md",
      ".agents/skills/facebook-ads-daily-brief/references/daily-brief-context-contract.md",
      ".agents/skills/facebook-ads-daily-brief/references/daily-brief-output-contract.md",
      ".agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs",
    ],
  },
  {
    case_id: "FWD-FBW-004",
    skill: "facebook-ads-optimization",
    prompt:
      "使用 $facebook-ads-optimization 处理下面的离线 fixture 测试上下文；先遵守有效性结论，再生成严格符合 Skill 输出契约、不可执行的最终 JSON 草稿。",
    createContext: createInconclusiveOptimizationContext,
    allowedSkillAssets: [
      ".agents/skills/facebook-ads-optimization/SKILL.md",
      ".agents/skills/facebook-ads-optimization/references/optimization-context-contract.md",
      ".agents/skills/facebook-ads-optimization/references/optimization-output-contract.md",
      ".agents/skills/facebook-ads-optimization/scripts/validate-context.mjs",
    ],
  },
  {
    case_id: "FWD-FBW-005",
    skill: "facebook-ads-change-management",
    prompt:
      "使用 $facebook-ads-change-management 处理下面的离线 fixture 变更上下文，生成严格符合 Skill 输出契约、不可提交且不可执行的最终 JSON 草稿。",
    createContext: createChangeContext,
    allowedSkillAssets: [
      ".agents/skills/facebook-ads-change-management/SKILL.md",
      ".agents/skills/facebook-ads-change-management/references/change-context-contract.md",
      ".agents/skills/facebook-ads-change-management/references/change-draft-contract.md",
      ".agents/skills/facebook-ads-change-management/scripts/validate-context.mjs",
    ],
  },
];

const FORBIDDEN_EVALUATION_ASSETS = [
  "evals/facebook-ads-workflow-skills/golden-drafts.mjs",
  "evals/facebook-ads-workflow-skills/evaluate-drafts.mjs",
  "tests/facebook-ads-workflow-skill-evals.test.mjs",
  "tests/facebook-ads-workflow-forward-test.test.mjs",
  "scripts/score-facebook-ads-workflow-forward-test.mjs",
];

export function listWorkflowForwardTestCases() {
  return CASE_DEFINITIONS.map(({ case_id, skill, prompt }) => ({
    case_id,
    skill,
    prompt,
  }));
}

export function createWorkflowForwardTestCase(caseId) {
  const definition = CASE_DEFINITIONS.find((item) => item.case_id === caseId);
  if (!definition) {
    throw new Error(`未知 workflow forward-test case: ${String(caseId)}`);
  }

  const context = definition.createContext();
  if (context.codex_handoff?.intended_skill !== definition.skill) {
    throw new Error(`${definition.case_id}: intended_skill 与 fixture 不一致`);
  }

  return {
    schema_version: WORKFLOW_FORWARD_TEST_CASE_SCHEMA_VERSION,
    case_id: definition.case_id,
    skill: definition.skill,
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
      allowed_skill_assets: [...definition.allowedSkillAssets],
      forbidden_evaluation_assets: [...FORBIDDEN_EVALUATION_ASSETS],
    },
  };
}
