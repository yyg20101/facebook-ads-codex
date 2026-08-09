import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  InvalidCampaignContext,
  validateCampaignContext,
} from "../.agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs";
import {
  InvalidChangeContext,
  validateChangeContext,
} from "../.agents/skills/facebook-ads-change-management/scripts/validate-context.mjs";
import {
  InvalidCreativeContext,
  validateCreativeContext,
} from "../.agents/skills/facebook-ads-creative/scripts/validate-context.mjs";
import {
  InvalidDailyBriefContext,
  validateDailyBriefContext,
} from "../.agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs";
import {
  InvalidOptimizationContext,
  validateOptimizationContext,
} from "../.agents/skills/facebook-ads-optimization/scripts/validate-context.mjs";
import {
  createBlockedCampaignContext,
  createBlockedChangeContext,
  createBlockedCreativeContext,
  createCampaignContext,
  createChangeContext,
  createCreativeContext,
  createDailyBriefContext,
  createDataIssueDailyBriefContext,
  createInconclusiveOptimizationContext,
  createOptimizationContext,
} from "../evals/facebook-ads-workflow-skills/fixture-contexts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const CASES = [
  {
    skill: "facebook-ads-creative",
    script: ".agents/skills/facebook-ads-creative/scripts/validate-context.mjs",
    factory: createCreativeContext,
    alternateFactory: createBlockedCreativeContext,
    validator: validateCreativeContext,
    ErrorType: InvalidCreativeContext,
    ready: "READY",
    alternate: "BLOCKED",
    closedGuardrail: "external_search_allowed",
  },
  {
    skill: "facebook-ads-campaign-builder",
    script: ".agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs",
    factory: createCampaignContext,
    alternateFactory: createBlockedCampaignContext,
    validator: validateCampaignContext,
    ErrorType: InvalidCampaignContext,
    ready: "READY",
    alternate: "BLOCKED",
    closedGuardrail: "meta_connection_allowed",
  },
  {
    skill: "facebook-ads-daily-brief",
    script: ".agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs",
    factory: createDailyBriefContext,
    alternateFactory: createDataIssueDailyBriefContext,
    validator: validateDailyBriefContext,
    ErrorType: InvalidDailyBriefContext,
    ready: "READY",
    alternate: "DATA_ISSUE",
    closedGuardrail: "scheduled_delivery_allowed",
  },
  {
    skill: "facebook-ads-optimization",
    script: ".agents/skills/facebook-ads-optimization/scripts/validate-context.mjs",
    factory: createOptimizationContext,
    alternateFactory: createInconclusiveOptimizationContext,
    validator: validateOptimizationContext,
    ErrorType: InvalidOptimizationContext,
    ready: "READY",
    alternate: "INCONCLUSIVE",
    closedGuardrail: "automatic_actions_allowed",
  },
  {
    skill: "facebook-ads-change-management",
    script: ".agents/skills/facebook-ads-change-management/scripts/validate-context.mjs",
    factory: createChangeContext,
    alternateFactory: createBlockedChangeContext,
    validator: validateChangeContext,
    ErrorType: InvalidChangeContext,
    ready: "DRAFTABLE",
    alternate: "BLOCKED",
    closedGuardrail: "submission_allowed",
  },
];

function runValidator(testCase, input, argument = "-") {
  return spawnSync(process.execPath, [resolve(ROOT, testCase.script), argument], {
    cwd: ROOT,
    input,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

function outputStatus(result) {
  const text = result.stdout.trim() || result.stderr.trim();
  const parsed = JSON.parse(text);
  return parsed.preflight?.status ?? parsed.status;
}

describe("offline Facebook Ads workflow Skill input contracts", () => {
  it("retains exact output mappings learned from fresh-session failures", () => {
    const creative = readFileSync(
      resolve(ROOT, ".agents/skills/facebook-ads-creative/SKILL.md"),
      "utf8",
    );
    const campaign = readFileSync(
      resolve(ROOT, ".agents/skills/facebook-ads-campaign-builder/SKILL.md"),
      "utf8",
    );
    const dailyBrief = readFileSync(
      resolve(ROOT, ".agents/skills/facebook-ads-daily-brief/SKILL.md"),
      "utf8",
    );

    expect(creative).toContain(
      "`product.approved_messages[*].message` 按输入顺序用 `；` 连接的原文",
    );
    expect(creative).toContain(
      "visual direction 的 `source_fact_paths` 只能列出对应",
    );
    expect(campaign).toContain(
      "`asset_ref` 只参与 preflight 和",
    );
    expect(campaign).toContain(
      "不得复制进 `ad_draft.fields`",
    );
    expect(dailyBrief).toContain(
      "`delivery_summary` 只作为 validator 返回的 `preflight.facts`",
    );
    expect(dailyBrief).toContain(
      "`data_status` 的字段必须且只能为",
    );
  });

  it.each(CASES)("$skill accepts the ready fixture", (testCase) => {
    expect(testCase.validator(testCase.factory()).status).toBe(testCase.ready);
  });

  it.each(CASES)("$skill returns its safe non-ready state", (testCase) => {
    const preflight = testCase.validator(testCase.alternateFactory());
    expect(preflight.status).toBe(testCase.alternate);
    expect(preflight.external_write).toBe(false);
  });

  it.each(CASES)("$skill rejects a sensitive request tracking field", (testCase) => {
    const context = testCase.factory();
    context.scope.request_id = "fixture-request-01";
    expect(() => testCase.validator(context)).toThrowError(testCase.ErrorType);
    expect(() => testCase.validator(context)).toThrow(/敏感|请求追踪|禁止/);
  });

  it.each(CASES)("$skill rejects an unknown top-level field", (testCase) => {
    const context = testCase.factory();
    context.unexpected_fixture_field = false;
    expect(() => testCase.validator(context)).toThrowError(testCase.ErrorType);
    expect(() => testCase.validator(context)).toThrow(/字段/);
  });

  it.each(CASES)("$skill rejects an opened external guardrail", (testCase) => {
    const context = testCase.factory();
    context.guardrails[testCase.closedGuardrail] = true;
    expect(() => testCase.validator(context)).toThrowError(testCase.ErrorType);
    expect(() => testCase.validator(context)).toThrow(/guardrails/);
  });

  it.each(CASES)("$skill CLI accepts stdin and preserves the ready status", (testCase) => {
    const result = runValidator(testCase, JSON.stringify(testCase.factory()));
    expect(result.status).toBe(0);
    expect(outputStatus(result)).toBe(testCase.ready);
  });

  it.each(CASES)("$skill CLI uses exit 2 for a validated non-ready fixture", (testCase) => {
    const result = runValidator(
      testCase,
      JSON.stringify(testCase.alternateFactory()),
    );
    expect(result.status).toBe(2);
    expect(outputStatus(result)).toBe(testCase.alternate);
  });

  it.each(CASES)("$skill CLI rejects malformed JSON without unsafe output", (testCase) => {
    const result = runValidator(testCase, "{not-json");
    expect(result.status).toBe(1);
    expect(outputStatus(result)).toBe("REJECTED");
    expect(`${result.stdout}${result.stderr}`).toContain('"external_write": false');
  });

  it.each(CASES)("$skill CLI rejects input larger than 2 MiB", (testCase) => {
    const result = runValidator(testCase, "x".repeat(2 * 1024 * 1024 + 1));
    expect(result.status).toBe(1);
    expect(outputStatus(result)).toBe("REJECTED");
  });

  it.each(CASES)("$skill CLI rejects a path outside the repository", (testCase) => {
    const externalDirectory = mkdtempSync(resolve(tmpdir(), "facebook-ads-skill-outside-"));
    const externalPath = resolve(externalDirectory, "context.json");
    try {
      writeFileSync(externalPath, JSON.stringify(testCase.factory()), "utf8");
      const result = runValidator(testCase, undefined, externalPath);
      expect(result.status).toBe(1);
      expect(outputStatus(result)).toBe("REJECTED");
    } finally {
      rmSync(externalDirectory, { recursive: true, force: true });
    }
  });

  it.each(CASES)("$skill CLI rejects a repository-local symbolic link", (testCase) => {
    const directory = mkdtempSync(resolve(ROOT, ".workflow-skill-test-"));
    const sourcePath = resolve(directory, "context.json");
    const linkPath = resolve(directory, "context-link.json");
    try {
      writeFileSync(sourcePath, JSON.stringify(testCase.factory()), "utf8");
      symlinkSync(sourcePath, linkPath);
      const result = runValidator(testCase, undefined, relative(ROOT, linkPath));
      expect(result.status).toBe(1);
      expect(outputStatus(result)).toBe("REJECTED");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it.each(CASES)("$skill metadata remains explicit-only and dependency-free", (testCase) => {
    const skill = readFileSync(resolve(ROOT, `.agents/skills/${testCase.skill}/SKILL.md`), "utf8");
    const metadata = readFileSync(
      resolve(ROOT, `.agents/skills/${testCase.skill}/agents/openai.yaml`),
      "utf8",
    );
    expect(skill).toContain(`name: ${testCase.skill}`);
    expect(skill).not.toContain("[TODO:");
    expect(metadata).toContain("allow_implicit_invocation: false");
    expect(metadata).toContain(`\$${testCase.skill}`);
    expect(metadata).not.toContain("dependencies:");
  });
});
