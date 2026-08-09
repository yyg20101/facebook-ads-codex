import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const DOCS_DIR = resolve(ROOT, "docs");
const DISCOVERY_DIR = resolve(DOCS_DIR, "discovery");
const errors = [];

const REQUIRED_DOCS = [
  "docs/README.md",
  "docs/glossary.md",
  "docs/project/charter.md",
  "docs/project/status-and-authorizations.md",
  "docs/discovery/README.md",
  "docs/discovery/discovery-questions.md",
  "docs/discovery/research-plan.md",
  "docs/discovery/interview-guide.md",
  "docs/discovery/evidence-log.md",
  "docs/discovery/solution-hypotheses.md",
  "docs/discovery/product-shape-validation.md",
  "docs/discovery/product-definition.md",
  "docs/discovery/codex-prototype/README.md",
  "docs/discovery/codex-prototype/sc-01-creative-and-campaign.md",
  "docs/discovery/codex-prototype/sc-02-analysis-and-action.md",
  "docs/discovery/codex-prototype/sc-03-test-and-optimization.md",
  "docs/discovery/codex-prototype/skill-contracts.md",
  "docs/superpowers/specs/2026-07-30-meta-ads-operations-platform-design.md",
  "docs/superpowers/plans/2026-07-30-full-web-platform-prototype.md",
  "docs/superpowers/specs/2026-08-07-offline-object-daily-trend-design.md",
  "docs/superpowers/plans/2026-08-07-offline-object-daily-trend.md",
  "docs/superpowers/specs/2026-08-07-offline-direct-child-daily-trend-design.md",
  "docs/superpowers/plans/2026-08-07-offline-direct-child-daily-trend.md",
  "docs/requirements/README.md",
  "docs/requirements/product.md",
  "docs/requirements/functional.md",
  "docs/requirements/non-functional.md",
  "docs/requirements/roles-and-permissions.md",
  "docs/requirements/metrics-and-reporting.md",
  "docs/requirements/traceability.md",
  "docs/technical/README.md",
  "docs/technical/architecture.md",
  "docs/technical/domain-and-data.md",
  "docs/technical/meta-integration-and-sync.md",
  "docs/technical/codex-skills.md",
  "docs/technical/api-and-mcp-contracts.md",
  "docs/technical/auth-approval-and-audit.md",
  "docs/technical/deployment-and-operations.md",
  "docs/technical/security-architecture.md",
  "docs/technical/offline-phase-1-scaffold.md",
  "docs/technical/offline-read-only-analysis.md",
  "docs/technical/offline-period-comparison-and-diagnostics.md",
  "docs/technical/offline-web-analysis-integration.md",
  "docs/technical/offline-web-account-context.md",
  "docs/technical/offline-ad-object-hierarchy.md",
  "docs/technical/offline-object-level-analysis.md",
  "docs/technical/offline-direct-child-breakdown.md",
  "docs/technical/offline-object-daily-trend.md",
  "docs/technical/offline-direct-child-daily-trend.md",
  "docs/technical/offline-data-quality-report.md",
  "docs/technical/offline-analysis-quality-preflight.md",
  "docs/technical/offline-codex-evidence-bundle.md",
  "docs/technical/offline-codex-trend-evidence.md",
  "docs/technical/offline-codex-analysis-skill.md",
  "docs/technical/offline-codex-analysis-evals.md",
  "docs/standards/README.md",
  "docs/standards/engineering.md",
  "docs/standards/api-and-errors.md",
  "docs/standards/data-and-migrations.md",
  "docs/standards/security-and-secrets.md",
  "docs/standards/testing.md",
  "docs/standards/logging-and-observability.md",
  "docs/standards/documentation.md",
  "docs/standards/git-review-and-release.md",
  "docs/decisions/README.md",
  "docs/decisions/ADR-TEMPLATE.md",
  "docs/planning/roadmap.md",
  "docs/planning/phase-0-questionnaire.md",
  "docs/planning/gates-and-evidence.md",
  "docs/planning/document-baseline-checklist.md",
  "docs/runbooks/README.md",
  "docs/runbooks/local-control-plane.md",
  "docs/runbooks/meta-read-connection.md",
  "docs/runbooks/RUNBOOK-TEMPLATE.md",
  "docs/templates/FEATURE-SPEC.md",
  "docs/templates/TECHNICAL-DESIGN.md",
  "docs/templates/TEST-PLAN.md",
  "docs/templates/INCIDENT-POSTMORTEM.md"
];

const FORBIDDEN_OBSOLETE_PATHS = [
  "docs/discovery/prototypes/generated/gallery.md",
  "docs/superpowers/plans/2026-07-30-dg0-prototype-validation.md",
  "docs/superpowers/specs/2026-07-30-facebook-ads-assistant-design.md",
  "scripts/build-dg0-prototypes.mjs",
  "scripts/score-dg0-review.mjs"
];

const CANDIDATE_TECH_DOCS = [
  "docs/technical/architecture.md",
  "docs/technical/domain-and-data.md",
  "docs/technical/meta-integration-and-sync.md",
  "docs/technical/codex-skills.md",
  "docs/technical/api-and-mcp-contracts.md",
  "docs/technical/auth-approval-and-audit.md",
  "docs/technical/deployment-and-operations.md",
  "docs/technical/security-architecture.md",
  "docs/technical/offline-phase-1-scaffold.md",
  "docs/technical/offline-read-only-analysis.md",
  "docs/technical/offline-period-comparison-and-diagnostics.md",
  "docs/technical/offline-web-analysis-integration.md",
  "docs/technical/offline-web-account-context.md",
  "docs/technical/offline-ad-object-hierarchy.md",
  "docs/technical/offline-object-level-analysis.md",
  "docs/technical/offline-direct-child-breakdown.md",
  "docs/technical/offline-object-daily-trend.md",
  "docs/technical/offline-direct-child-daily-trend.md",
  "docs/technical/offline-data-quality-report.md",
  "docs/technical/offline-analysis-quality-preflight.md",
  "docs/technical/offline-codex-evidence-bundle.md",
  "docs/technical/offline-codex-trend-evidence.md",
  "docs/technical/offline-codex-analysis-skill.md",
  "docs/technical/offline-codex-analysis-evals.md"
];

const OFFLINE_WORKER_FILES = [
  ".github/workflows/offline-worker.yml",
  "services/control-plane-worker/src/index.ts",
  "services/control-plane-worker/migrations/0001_initial.sql",
  "services/control-plane-worker/migrations/0002_offline_ad_objects.sql",
  "services/control-plane-worker/fixtures/0001_seed.sql",
  "services/control-plane-worker/test/worker.spec.ts",
  "services/control-plane-worker/tsconfig.json",
  "services/control-plane-worker/vitest.config.mts",
  "services/control-plane-worker/worker-configuration.d.ts",
  "services/control-plane-worker/wrangler.jsonc"
];

const OFFLINE_ANALYSIS_FILES = [
  "services/control-plane-worker/src/http.ts",
  "services/control-plane-worker/src/metrics.ts",
  "services/control-plane-worker/src/read-model.ts",
  "services/control-plane-worker/test/metrics.spec.ts"
];

const OFFLINE_DIAGNOSTIC_FILES = [
  "services/control-plane-worker/src/comparison.ts",
  "services/control-plane-worker/test/comparison.spec.ts"
];

const OFFLINE_WEB_ANALYSIS_FILES = [
  "prototype/src/data/offlineComparison.ts",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx",
  "prototype/src/pages/AnalyticsPage.tsx",
  "prototype/vite.config.ts",
  "prototype/README.md"
];

const OFFLINE_WEB_ACCOUNT_CONTEXT_FILES = [
  "docs/technical/offline-web-account-context.md",
  "prototype/src/data/offlineComparison.ts",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
];

const OFFLINE_AD_OBJECT_HIERARCHY_FILES = [
  "docs/technical/offline-ad-object-hierarchy.md",
  "services/control-plane-worker/migrations/0002_offline_ad_objects.sql",
  "services/control-plane-worker/src/http.ts",
  "services/control-plane-worker/src/read-model.ts",
  "services/control-plane-worker/test/object-hierarchy.spec.ts",
  "prototype/src/data/offlineHierarchy.ts",
  "prototype/src/components/analytics/OfflineObjectHierarchyPanel.tsx",
  "prototype/src/components/analytics/OfflineObjectHierarchyPanel.test.tsx"
];

const OFFLINE_OBJECT_LEVEL_ANALYSIS_FILES = [
  "docs/technical/offline-object-level-analysis.md",
  "services/control-plane-worker/fixtures/0001_seed.sql",
  "services/control-plane-worker/src/http.ts",
  "services/control-plane-worker/src/read-model.ts",
  "services/control-plane-worker/test/object-analysis.spec.ts",
  "prototype/src/data/offlineHierarchy.ts",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
];

const OFFLINE_DIRECT_CHILD_BREAKDOWN_FILES = [
  "docs/technical/offline-direct-child-breakdown.md",
  "services/control-plane-worker/src/comparison.ts",
  "services/control-plane-worker/src/http.ts",
  "services/control-plane-worker/test/object-analysis.spec.ts",
  "prototype/src/data/offlineBreakdown.ts",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
];

const OFFLINE_OBJECT_DAILY_TREND_FILES = [
  "services/control-plane-worker/src/read-model.ts",
  "services/control-plane-worker/src/http.ts",
  "services/control-plane-worker/test/object-trend.spec.ts",
  "prototype/src/data/offlineTrend.ts",
  "prototype/src/data/offlineTrend.test.ts",
  "prototype/src/components/analytics/OfflineObjectTrendPanel.tsx",
  "prototype/src/components/analytics/OfflineObjectTrendPanel.test.tsx"
];

const OFFLINE_DIRECT_CHILD_DAILY_TREND_FILES = [
  "services/control-plane-worker/src/comparison.ts",
  "services/control-plane-worker/src/http.ts",
  "services/control-plane-worker/test/object-child-trend.spec.ts",
  "prototype/src/data/offlineChildTrend.ts",
  "prototype/src/data/offlineChildTrend.test.ts",
  "prototype/src/components/analytics/OfflineDirectChildTrendPanel.tsx",
  "prototype/src/components/analytics/OfflineDirectChildTrendPanel.test.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
];

const OFFLINE_DATA_QUALITY_REPORT_FILES = [
  "docs/technical/offline-data-quality-report.md",
  "services/control-plane-worker/src/quality.ts",
  "services/control-plane-worker/src/http.ts",
  "services/control-plane-worker/src/read-model.ts",
  "services/control-plane-worker/test/data-quality.spec.ts",
  "prototype/src/data/offlineDataQuality.ts",
  "prototype/src/data/offlineDataQuality.test.ts",
  "prototype/src/components/analytics/OfflineDataQualityPanel.tsx",
  "prototype/src/components/analytics/OfflineDataQualityPanel.test.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
];

const OFFLINE_ANALYSIS_QUALITY_PREFLIGHT_FILES = [
  "docs/technical/offline-analysis-quality-preflight.md",
  "prototype/src/data/offlineDataQuality.ts",
  "prototype/src/data/offlineDataQuality.test.ts",
  "prototype/src/components/analytics/OfflineDataQualityPanel.tsx",
  "prototype/src/components/analytics/OfflineDataQualityPanel.test.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx",
  "prototype/src/components/analytics/OfflineObjectTrendPanel.tsx",
  "prototype/src/components/analytics/OfflineObjectTrendPanel.test.tsx",
  "prototype/src/components/analytics/OfflineDirectChildTrendPanel.tsx",
  "prototype/src/components/analytics/OfflineDirectChildTrendPanel.test.tsx",
  "prototype/src/styles/pages.css"
];

const OFFLINE_CODEX_EVIDENCE_BUNDLE_FILES = [
  "docs/technical/offline-codex-evidence-bundle.md",
  "prototype/src/data/offlineCodexEvidence.ts",
  "prototype/src/data/offlineCodexEvidence.test.ts",
  "prototype/src/components/analytics/OfflineCodexEvidencePanel.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.tsx",
  "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx",
  "prototype/src/styles/pages.css"
];

const OFFLINE_CODEX_TREND_EVIDENCE_FILES = [
  "docs/technical/offline-codex-trend-evidence.md",
  "prototype/src/data/offlineCodexEvidence.ts",
  "prototype/src/data/offlineCodexEvidence.test.ts",
  "prototype/src/components/analytics/OfflineCodexEvidencePanel.tsx",
  "prototype/src/components/analytics/OfflineObjectTrendPanel.tsx",
  "prototype/src/components/analytics/OfflineObjectTrendPanel.test.tsx",
  "prototype/src/components/analytics/OfflineDirectChildTrendPanel.tsx",
  "prototype/src/components/analytics/OfflineDirectChildTrendPanel.test.tsx",
  "prototype/src/styles/pages.css"
];

const OFFLINE_CODEX_ANALYSIS_SKILL_FILES = [
  "docs/technical/offline-codex-analysis-skill.md",
  ".agents/skills/facebook-ads-analysis/SKILL.md",
  ".agents/skills/facebook-ads-analysis/agents/openai.yaml",
  ".agents/skills/facebook-ads-analysis/references/offline-analysis-contract.md",
  ".agents/skills/facebook-ads-analysis/scripts/validate-context.mjs",
  "tests/facebook-ads-analysis-skill.test.mjs",
  "package.json",
  ".github/workflows/docs.yml"
];

const OFFLINE_CODEX_ANALYSIS_EVAL_FILES = [
  "docs/technical/offline-codex-analysis-evals.md",
  ".agents/skills/facebook-ads-analysis/SKILL.md",
  ".agents/skills/facebook-ads-analysis/references/analysis-draft-contract.md",
  ".agents/skills/facebook-ads-analysis/scripts/evaluate-draft.mjs",
  "evals/facebook-ads-analysis/fixture-contexts.mjs",
  "evals/facebook-ads-analysis/golden-cases.mjs",
  "tests/facebook-ads-analysis-evals.test.mjs",
  "package.json",
  ".github/workflows/docs.yml"
];

const OFFLINE_CODEX_SESSION_FORWARD_TEST_FILES = [
  "docs/technical/offline-codex-session-forward-test.md",
  "evals/facebook-ads-analysis/session-cases.mjs",
  "scripts/prepare-facebook-ads-analysis-forward-test.mjs",
  "scripts/score-facebook-ads-analysis-forward-test.mjs",
  "tests/facebook-ads-analysis-forward-test.test.mjs",
  "package.json",
  ".github/workflows/docs.yml"
];

const CANDIDATE_IMPLEMENTATION_STANDARDS = [
  "docs/standards/engineering.md",
  "docs/standards/api-and-errors.md",
  "docs/standards/data-and-migrations.md",
  "docs/standards/security-and-secrets.md",
  "docs/standards/testing.md",
  "docs/standards/logging-and-observability.md"
];

const ALLOWED_TYPES = new Set([
  "index",
  "governance",
  "requirements",
  "technical",
  "standard",
  "decision",
  "planning",
  "runbook",
  "template",
  "reference"
]);
const ALLOWED_STATUSES = new Set(["DRAFT", "ACCEPTED", "SUPERSEDED"]);
const ALLOWED_DQ_STATUSES = new Set(["UNRESOLVED", "RESOLVED", "DEFERRED"]);
const ALLOWED_HYPOTHESIS_STATUSES = new Set([
  "UNTESTED",
  "SUPPORTED",
  "REJECTED",
  "INCONCLUSIVE"
]);
const ALLOWED_DELIVERY_PHASES = new Set([
  "PRODUCT_DISCOVERY_REQUIRED|PRE_DISCOVERY",
  "PRODUCT_DISCOVERY_IN_PROGRESS|PRODUCT_DISCOVERY",
  "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE",
  "READY_FOR_PHASE_1|PHASE_0_COMPLETE"
]);

function walk(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    if (name === ".git" || name === "node_modules") {
      continue;
    }
    const absolute = resolve(directory, name);
    if (statSync(absolute).isDirectory()) {
      files.push(...walk(absolute));
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function repoPath(absolute) {
  return relative(ROOT, absolute).replaceAll("\\", "/");
}

function withoutCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]*`/g, "");
}

function parseFrontMatter(text, file) {
  if (!text.startsWith("---\n")) {
    errors.push(`${file}: missing YAML front matter`);
    return {};
  }
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) {
    errors.push(`${file}: unterminated YAML front matter`);
    return {};
  }
  const metadata = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = line.match(/^([a-z_]+):\s*(.*?)\s*$/);
    if (match) {
      metadata[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
  return metadata;
}

function slugifyHeading(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function headingAnchors(text) {
  const anchors = new Set();
  const counts = new Map();
  for (const line of withoutCode(text).split("\n")) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (!match) {
      continue;
    }
    const base = slugifyHeading(match[1]);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    anchors.add(count === 0 ? base : `${base}-${count}`);
  }
  return anchors;
}

function validateLinks(file, text, contentByFile) {
  const body = withoutCode(text);
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  for (const match of body.matchAll(linkPattern)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    } else {
      target = target.split(/\s+["']/)[0];
    }
    if (
      target === "" ||
      /^(https?:|mailto:|tel:|data:)/i.test(target)
    ) {
      continue;
    }

    const hashIndex = target.indexOf("#");
    const rawPath = hashIndex === -1 ? target : target.slice(0, hashIndex);
    const rawAnchor = hashIndex === -1 ? "" : target.slice(hashIndex + 1);
    let decodedPath;
    let decodedAnchor;
    try {
      decodedPath = decodeURIComponent(rawPath);
      decodedAnchor = decodeURIComponent(rawAnchor);
    } catch {
      errors.push(`${repoPath(file)}: invalid encoded link ${target}`);
      continue;
    }

    const destination = decodedPath
      ? resolve(dirname(file), decodedPath)
      : file;
    if (!existsSync(destination)) {
      errors.push(`${repoPath(file)}: broken internal link ${target}`);
      continue;
    }
    if (decodedAnchor && destination.endsWith(".md")) {
      const destinationText =
        contentByFile.get(destination) ?? readFileSync(destination, "utf8");
      if (!headingAnchors(destinationText).has(decodedAnchor.toLowerCase())) {
        errors.push(`${repoPath(file)}: missing anchor ${target}`);
      }
    }
  }
}

function tableCells(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function yamlValue(text, key) {
  return text.match(new RegExp(`^${key}:\\s*([^\\s]+)\\s*$`, "m"))?.[1];
}

function requirementSections(text) {
  const headingPattern = /^## ((?:FR|NFR|SEC)-\d{3})：[^\n]+$/gm;
  const matches = [...text.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? text.length;
    const section = text.slice(start, end);
    const status = section.match(
      /^- 状态：`(ACCEPTED|DRAFT|SUPERSEDED)`$/m
    )?.[1];
    const dependencyLine = section.match(/^- 依赖：(.+)$/m)?.[1] ?? "";
    const dependencies = [
      ...dependencyLine.matchAll(/`((?:DQ|BQ)-\d{2})`/g)
    ].map((dependency) => dependency[1]);
    return { id: match[1], section, status, dependencies };
  });
}

for (const required of REQUIRED_DOCS) {
  if (!existsSync(resolve(ROOT, required))) {
    errors.push(`missing required document: ${required}`);
  }
}
for (const obsolete of FORBIDDEN_OBSOLETE_PATHS) {
  if (existsSync(resolve(ROOT, obsolete))) {
    errors.push(`obsolete product-shape artifact must be removed: ${obsolete}`);
  }
}

const markdownFiles = walk(ROOT)
  .filter((file) => file.endsWith(".md"))
  .sort();
const docsFiles = markdownFiles.filter((file) => file.startsWith(`${DOCS_DIR}/`));
const discoveryFiles = docsFiles.filter((file) =>
  file.startsWith(`${DISCOVERY_DIR}/`)
);
const contentByFile = new Map(
  markdownFiles.map((file) => [file, readFileSync(file, "utf8")])
);

const docIds = new Map();
const metadataByFile = new Map();
for (const file of docsFiles) {
  const fileName = repoPath(file);
  const text = contentByFile.get(file);
  const metadata = parseFrontMatter(text, fileName);
  metadataByFile.set(file, metadata);
  for (const field of ["doc_id", "type", "status", "owner", "last_reviewed"]) {
    if (!metadata[field]) {
      errors.push(`${fileName}: missing front matter field ${field}`);
    }
  }
  if (metadata.type && !ALLOWED_TYPES.has(metadata.type)) {
    errors.push(`${fileName}: invalid type ${metadata.type}`);
  }
  if (metadata.status && !ALLOWED_STATUSES.has(metadata.status)) {
    errors.push(`${fileName}: invalid status ${metadata.status}`);
  }
  if (
    metadata.last_reviewed &&
    !/^\d{4}-\d{2}-\d{2}$/.test(metadata.last_reviewed)
  ) {
    errors.push(`${fileName}: last_reviewed must use YYYY-MM-DD`);
  }
  if (metadata.doc_id) {
    const previous = docIds.get(metadata.doc_id);
    if (previous) {
      errors.push(
        `${fileName}: duplicate doc_id ${metadata.doc_id}, first used by ${previous}`
      );
    } else {
      docIds.set(metadata.doc_id, fileName);
    }
  }
}

for (const file of markdownFiles) {
  validateLinks(file, contentByFile.get(file), contentByFile);
}

const discoveryQuestionsFile = resolve(
  ROOT,
  "docs/discovery/discovery-questions.md"
);
const discoveryQuestionsText = contentByFile.get(discoveryQuestionsFile) ?? "";
const discoveryQuestions = new Map();
for (const line of discoveryQuestionsText.split("\n")) {
  if (!/^\| DQ-\d{2} \|/.test(line)) {
    continue;
  }
  const cells = tableCells(line);
  if (cells.length !== 5) {
    errors.push(
      `docs/discovery/discovery-questions.md: malformed row for ${cells[0] ?? "unknown"}`
    );
    continue;
  }
  const [id, , status, answer, evidence] = cells;
  if (discoveryQuestions.has(id)) {
    errors.push(`duplicate discovery question: ${id}`);
  }
  if (!ALLOWED_DQ_STATUSES.has(status)) {
    errors.push(`discovery question ${id}: invalid status ${status}`);
  }
  discoveryQuestions.set(id, { status, answer, evidence });
}
if (discoveryQuestions.size !== 8) {
  errors.push(
    `discovery questionnaire must declare exactly 8 unique DQ entries; found ${discoveryQuestions.size}`
  );
}
for (let number = 1; number <= 8; number += 1) {
  const id = `DQ-${String(number).padStart(2, "0")}`;
  if (!discoveryQuestions.has(id)) {
    errors.push(`discovery questionnaire is missing ${id}`);
  }
}

const phaseZeroFile = resolve(
  ROOT,
  "docs/planning/phase-0-questionnaire.md"
);
const phaseZeroText = contentByFile.get(phaseZeroFile) ?? "";
const bqDeclarations = [
  ...phaseZeroText.matchAll(/^\| (BQ-\d{2}) \|/gm)
].map((match) => match[1]);
const bqIds = new Set(bqDeclarations);
if (bqDeclarations.length !== 12 || bqIds.size !== 12) {
  errors.push(
    `Phase 0 questionnaire must declare exactly 12 unique BQ entries; found ${bqDeclarations.length}`
  );
}
for (let number = 1; number <= 12; number += 1) {
  const id = `BQ-${String(number).padStart(2, "0")}`;
  if (!bqIds.has(id)) {
    errors.push(`Phase 0 questionnaire is missing ${id}`);
  }
}

const evidenceFile = resolve(ROOT, "docs/discovery/evidence-log.md");
const evidenceText = contentByFile.get(evidenceFile) ?? "";
const evidenceRecords = new Map();
for (const line of evidenceText.split("\n")) {
  if (!/^\| EVD-\d{3} \|/.test(line)) {
    continue;
  }
  const cells = tableCells(line);
  if (cells.length !== 9) {
    errors.push(
      `docs/discovery/evidence-log.md: malformed row for ${cells[0] ?? "unknown"}`
    );
    continue;
  }
  const [id, date, alias, method, type, questions, finding, confidence, limitations] =
    cells;
  if (evidenceRecords.has(id)) {
    errors.push(`duplicate discovery evidence: ${id}`);
  }
  for (const [label, value] of [
    ["date", date],
    ["participant alias", alias],
    ["method", method],
    ["type", type],
    ["linked questions", questions],
    ["finding", finding],
    ["confidence", confidence],
    ["limitations", limitations]
  ]) {
    if (!value || value === "—" || value === "TBD") {
      errors.push(`discovery evidence ${id}: missing ${label}`);
    }
  }
  if (
    ["PROBLEM_INTERVIEW", "PROTOTYPE_TEST"].includes(method) &&
    !/^P-\d{2}$/.test(alias)
  ) {
    errors.push(`discovery evidence ${id}: invalid participant alias ${alias}`);
  }
  if (
    ![
      "PROBLEM_INTERVIEW",
      "PROTOTYPE_TEST",
      "OWNER_DECISION",
      "SCENARIO_REVIEW"
    ].includes(method)
  ) {
    errors.push(`discovery evidence ${id}: invalid method ${method}`);
  }
  if (!["FACT", "INFERENCE", "COUNTEREVIDENCE"].includes(type)) {
    errors.push(`discovery evidence ${id}: invalid evidence type ${type}`);
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(confidence)) {
    errors.push(`discovery evidence ${id}: invalid confidence ${confidence}`);
  }
  evidenceRecords.set(id, { alias, method, type, questions });
}

for (const [id, question] of discoveryQuestions) {
  if (
    question.status === "RESOLVED" &&
    !/EVD-\d{3}/.test(question.evidence)
  ) {
    errors.push(`resolved discovery question ${id} must reference EVD evidence`);
  }
  if (
    question.status === "DEFERRED" &&
    (question.answer === "—" || question.evidence === "—")
  ) {
    errors.push(`deferred discovery question ${id} needs a reason and evidence`);
  }
}

for (const file of discoveryFiles) {
  const text = contentByFile.get(file);
  for (const match of text.matchAll(/\bEVD-\d{3}\b/g)) {
    if (!evidenceRecords.has(match[0])) {
      errors.push(`${repoPath(file)}: undeclared discovery evidence ${match[0]}`);
    }
  }
}

const solutionHypothesesFile = resolve(
  ROOT,
  "docs/discovery/solution-hypotheses.md"
);
const solutionHypothesesText =
  contentByFile.get(solutionHypothesesFile) ?? "";
const solutionHypotheses = new Map();
for (const line of solutionHypothesesText.split("\n")) {
  if (!/^\| SH-\d{3} \|/.test(line)) {
    continue;
  }
  const cells = tableCells(line);
  if (cells.length !== 4) {
    errors.push(
      `docs/discovery/solution-hypotheses.md: malformed row for ${cells[0] ?? "unknown"}`
    );
    continue;
  }
  const [id, , status] = cells;
  if (solutionHypotheses.has(id)) {
    errors.push(`duplicate solution hypothesis: ${id}`);
  }
  if (!ALLOWED_HYPOTHESIS_STATUSES.has(status)) {
    errors.push(`solution hypothesis ${id}: invalid status ${status}`);
  }
  solutionHypotheses.set(id, status);
}
if (solutionHypotheses.size !== 6) {
  errors.push(
    `solution hypothesis register must declare 6 entries; found ${solutionHypotheses.size}`
  );
}
const decisionIndexFile = resolve(ROOT, "docs/decisions/README.md");
const decisionIndexText = contentByFile.get(decisionIndexFile) ?? "";
const indexedDecisionStatuses = new Map();
for (const line of decisionIndexText.split("\n")) {
  if (!/^\| \[ADR-\d{3}\]\(/.test(line)) {
    continue;
  }
  const cells = tableCells(line);
  const id = cells[0]?.match(/^\[(ADR-\d{3})\]\(/)?.[1];
  const status = cells[2]?.match(/^`(DRAFT|ACCEPTED|SUPERSEDED)`$/)?.[1];
  if (!id || !status) {
    errors.push("docs/decisions/README.md: malformed ADR index row");
    continue;
  }
  if (indexedDecisionStatuses.has(id)) {
    errors.push(`duplicate ADR index row: ${id}`);
  }
  indexedDecisionStatuses.set(id, status);
}

for (let number = 1; number <= 6; number += 1) {
  const id = `SH-${String(number).padStart(3, "0")}`;
  if (!solutionHypotheses.has(id)) {
    errors.push(`solution hypothesis register is missing ${id}`);
  }
}

const declaredRequirements = new Map();
for (const requirementFile of [
  resolve(ROOT, "docs/requirements/functional.md"),
  resolve(ROOT, "docs/requirements/non-functional.md")
]) {
  for (const requirement of requirementSections(
    contentByFile.get(requirementFile) ?? ""
  )) {
    if (declaredRequirements.has(requirement.id)) {
      errors.push(`duplicate requirement declaration: ${requirement.id}`);
      continue;
    }
    if (!requirement.status) {
      errors.push(`${repoPath(requirementFile)}: ${requirement.id} has no status`);
    }
    if (requirement.status === "DRAFT" && requirement.dependencies.length === 0) {
      errors.push(
        `${repoPath(requirementFile)}: draft ${requirement.id} must reference a DQ or BQ dependency`
      );
    }
    for (const dependency of requirement.dependencies) {
      if (
        dependency.startsWith("DQ-") &&
        !discoveryQuestions.has(dependency)
      ) {
        errors.push(`${requirement.id}: unknown discovery dependency ${dependency}`);
      }
      if (dependency.startsWith("BQ-") && !bqIds.has(dependency)) {
        errors.push(`${requirement.id}: unknown Phase 0 dependency ${dependency}`);
      }
    }
    declaredRequirements.set(requirement.id, requirement);
  }
}

const traceabilityFile = resolve(
  ROOT,
  "docs/requirements/traceability.md"
);
const traceabilityText = contentByFile.get(traceabilityFile) ?? "";
const tracedRequirements = new Map();
for (const line of traceabilityText.split("\n")) {
  if (!/^\| (?:FR|NFR|SEC)-\d{3} \|/.test(line)) {
    continue;
  }
  const cells = tableCells(line);
  if (cells.length !== 8) {
    errors.push(
      `docs/requirements/traceability.md: malformed row for ${cells[0] ?? "unknown"}`
    );
    continue;
  }
  const [id, dependency, productEvidence, design, adr, verification, gate, status] =
    cells;
  if (tracedRequirements.has(id)) {
    errors.push(`duplicate traceability row: ${id}`);
  }
  for (const [label, value] of [
    ["discovery dependency", dependency],
    ["product evidence", productEvidence],
    ["candidate design", design],
    ["candidate ADR", adr],
    ["verification", verification],
    ["Gate", gate],
    ["status", status]
  ]) {
    if (!value || value === "—" || value === "TBD") {
      errors.push(`traceability ${id}: missing ${label}`);
    }
  }
  if (!ALLOWED_STATUSES.has(status)) {
    errors.push(`traceability ${id}: invalid status ${status}`);
  }
  tracedRequirements.set(id, {
    dependency,
    productEvidence,
    design,
    adr,
    verification,
    gate,
    status
  });
}

for (const [id, requirement] of declaredRequirements) {
  const trace = tracedRequirements.get(id);
  if (!trace) {
    errors.push(`requirement is missing from traceability: ${id}`);
    continue;
  }
  if (trace.status !== requirement.status) {
    errors.push(
      `traceability ${id}: status ${trace.status} does not match requirement ${requirement.status}`
    );
  }
  if (requirement.status === "ACCEPTED") {
    const evidenceIds = [
      ...trace.productEvidence.matchAll(/\bEVD-\d{3}\b/g)
    ].map((match) => match[0]);
    if (evidenceIds.length === 0) {
      errors.push(`accepted requirement ${id} has no product evidence`);
    }
    for (const evidenceId of evidenceIds) {
      if (!evidenceRecords.has(evidenceId)) {
        errors.push(`accepted requirement ${id}: unknown evidence ${evidenceId}`);
      }
    }
    if (/待|UNRESOLVED|DRAFT/.test(trace.design)) {
      errors.push(`accepted requirement ${id} has no accepted technical landing`);
    }
  }
}
for (const id of tracedRequirements.keys()) {
  if (!declaredRequirements.has(id)) {
    errors.push(`traceability row has no requirement declaration: ${id}`);
  }
}

const statusFile = resolve(
  ROOT,
  "docs/project/status-and-authorizations.md"
);
const statusText = contentByFile.get(statusFile) ?? "";
const projectVersion = yamlValue(statusText, "project_version");
const deliveryState = yamlValue(statusText, "delivery_state");
const currentPhase = yamlValue(statusText, "current_phase");
const operationMode = yamlValue(statusText, "operation_mode");
const runtimeAvailable = yamlValue(
  statusText,
  "runtime_implementation_available"
);
const metaReadValidationAuthorized = yamlValue(
  statusText,
  "meta_read_validation_authorized"
);
const offlinePhaseOneScaffoldAuthorized = yamlValue(
  statusText,
  "offline_phase_1_scaffold_authorized"
);
const offlineReadOnlyAnalysisAuthorized = yamlValue(
  statusText,
  "offline_read_only_analysis_authorized"
);
const offlinePeriodDiagnosticsAuthorized = yamlValue(
  statusText,
  "offline_period_diagnostics_authorized"
);
const offlineWebAnalysisIntegrationAuthorized = yamlValue(
  statusText,
  "offline_web_analysis_integration_authorized"
);
const offlineWebAccountContextAuthorized = yamlValue(
  statusText,
  "offline_web_account_context_authorized"
);
const offlineAdObjectHierarchyAuthorized = yamlValue(
  statusText,
  "offline_ad_object_hierarchy_authorized"
);
const offlineObjectLevelAnalysisAuthorized = yamlValue(
  statusText,
  "offline_object_level_analysis_authorized"
);
const offlineDirectChildBreakdownAuthorized = yamlValue(
  statusText,
  "offline_direct_child_breakdown_authorized"
);
const offlineObjectDailyTrendAuthorized = yamlValue(
  statusText,
  "offline_object_daily_trend_authorized"
);
const offlineDirectChildDailyTrendAuthorized = yamlValue(
  statusText,
  "offline_direct_child_daily_trend_authorized"
);
const offlineDataQualityReportAuthorized = yamlValue(
  statusText,
  "offline_data_quality_report_authorized"
);
const offlineAnalysisQualityPreflightAuthorized = yamlValue(
  statusText,
  "offline_analysis_quality_preflight_authorized"
);
const offlineCodexEvidenceBundleAuthorized = yamlValue(
  statusText,
  "offline_codex_evidence_bundle_authorized"
);
const offlineCodexTrendEvidenceAuthorized = yamlValue(
  statusText,
  "offline_codex_trend_evidence_authorized"
);
const offlineCodexAnalysisSkillAuthorized = yamlValue(
  statusText,
  "offline_codex_analysis_skill_authorized"
);
const offlineCodexAnalysisEvalsAuthorized = yamlValue(
  statusText,
  "offline_codex_analysis_evals_authorized"
);
const offlineCodexSessionForwardTestKitAuthorized = yamlValue(
  statusText,
  "offline_codex_session_forward_test_kit_authorized"
);
const productionAuthorized = yamlValue(
  statusText,
  "production_deployment_authorized"
);
const metaWriteAuthorized = yamlValue(
  statusText,
  "meta_write_operations_authorized"
);

if (projectVersion !== "1.0.0") {
  errors.push("project status must retain version 1.0.0");
}
if (!ALLOWED_DELIVERY_PHASES.has(`${deliveryState}|${currentPhase}`)) {
  errors.push(
    `invalid delivery/current phase combination: ${deliveryState}|${currentPhase}`
  );
}
if (operationMode !== "READ_ONLY") {
  errors.push("operation_mode must remain READ_ONLY through Phase 0");
}
for (const [field, value] of [
  ["runtime_implementation_available", runtimeAvailable],
  ["production_deployment_authorized", productionAuthorized],
  ["meta_write_operations_authorized", metaWriteAuthorized]
]) {
  if (value !== "false") {
    errors.push(`${field} must remain false during product discovery`);
  }
}
if (!["true", "false"].includes(metaReadValidationAuthorized)) {
  errors.push("meta_read_validation_authorized must be a boolean");
}
if (!["true", "false"].includes(offlinePhaseOneScaffoldAuthorized)) {
  errors.push("offline_phase_1_scaffold_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineReadOnlyAnalysisAuthorized)) {
  errors.push("offline_read_only_analysis_authorized must be a boolean");
}
if (!["true", "false"].includes(offlinePeriodDiagnosticsAuthorized)) {
  errors.push("offline_period_diagnostics_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineWebAnalysisIntegrationAuthorized)) {
  errors.push("offline_web_analysis_integration_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineWebAccountContextAuthorized)) {
  errors.push("offline_web_account_context_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineAdObjectHierarchyAuthorized)) {
  errors.push("offline_ad_object_hierarchy_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineObjectLevelAnalysisAuthorized)) {
  errors.push("offline_object_level_analysis_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineDirectChildBreakdownAuthorized)) {
  errors.push("offline_direct_child_breakdown_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineObjectDailyTrendAuthorized)) {
  errors.push("offline_object_daily_trend_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineDirectChildDailyTrendAuthorized)) {
  errors.push("offline_direct_child_daily_trend_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineDataQualityReportAuthorized)) {
  errors.push("offline_data_quality_report_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineAnalysisQualityPreflightAuthorized)) {
  errors.push(
    "offline_analysis_quality_preflight_authorized must be a boolean"
  );
}
if (!["true", "false"].includes(offlineCodexEvidenceBundleAuthorized)) {
  errors.push("offline_codex_evidence_bundle_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineCodexTrendEvidenceAuthorized)) {
  errors.push("offline_codex_trend_evidence_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineCodexAnalysisSkillAuthorized)) {
  errors.push("offline_codex_analysis_skill_authorized must be a boolean");
}
if (!["true", "false"].includes(offlineCodexAnalysisEvalsAuthorized)) {
  errors.push("offline_codex_analysis_evals_authorized must be a boolean");
}
if (
  !["true", "false"].includes(offlineCodexSessionForwardTestKitAuthorized)
) {
  errors.push(
    "offline_codex_session_forward_test_kit_authorized must be a boolean"
  );
}
if (
  metaReadValidationAuthorized === "true" &&
  `${deliveryState}|${currentPhase}` !==
    "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE"
) {
  errors.push("Meta read validation can only be authorized during Phase 0");
}
if (
  deliveryState === "READY_FOR_PHASE_1" &&
  metaReadValidationAuthorized !== "false"
) {
  errors.push("Phase 0 completion requires Meta read validation authorization to be closed");
}

const discoveryIndexFile = resolve(ROOT, "docs/discovery/README.md");
const discoveryIndexText = contentByFile.get(discoveryIndexFile) ?? "";
const productDefinitionFile = resolve(
  ROOT,
  "docs/discovery/product-definition.md"
);
const productDefinitionText = contentByFile.get(productDefinitionFile) ?? "";
const researchStatus = yamlValue(discoveryIndexText, "research_status");
const definitionStatus = yamlValue(
  productDefinitionText,
  "definition_status"
);
const dg0Status = yamlValue(productDefinitionText, "dg0_status");
const productFeatures = new Map();
for (const line of productDefinitionText.split("\n")) {
  if (!/^\| PF-\d{3} \|/.test(line)) {
    continue;
  }
  const cells = tableCells(line);
  if (cells.length !== 6) {
    errors.push(
      `docs/discovery/product-definition.md: malformed feature row for ${cells[0] ?? "unknown"}`
    );
    continue;
  }
  const [id, feature, classification, sourceTask, evidence, explanation] = cells;
  if (productFeatures.has(id)) {
    errors.push(`duplicate product feature: ${id}`);
  }
  if (!["MVP", "LATER", "REJECTED"].includes(classification)) {
    errors.push(`product feature ${id}: invalid classification ${classification}`);
  }
  for (const [label, value] of [
    ["feature", feature],
    ["source task", sourceTask],
    ["evidence", evidence],
    ["explanation", explanation]
  ]) {
    if (!value || value === "—" || value === "TBD") {
      errors.push(`product feature ${id}: missing ${label}`);
    }
  }
  productFeatures.set(id, { classification, evidence });
}

if (!["NOT_STARTED", "IN_PROGRESS", "COMPLETE"].includes(researchStatus)) {
  errors.push(`invalid research_status: ${researchStatus}`);
}
if (!["UNRESOLVED", "DRAFT", "ACCEPTED"].includes(definitionStatus)) {
  errors.push(`invalid definition_status: ${definitionStatus}`);
}
if (!["NOT_EVALUATED", "PARTIAL", "PASS", "FAIL"].includes(dg0Status)) {
  errors.push(`invalid dg0_status: ${dg0Status}`);
}
if (
  deliveryState === "PRODUCT_DISCOVERY_IN_PROGRESS" &&
  researchStatus === "NOT_STARTED"
) {
  errors.push("PRODUCT_DISCOVERY_IN_PROGRESS requires started research");
}

const discoveryComplete = dg0Status === "PASS";
if (discoveryComplete) {
  if (
    ![
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE",
      "READY_FOR_PHASE_1|PHASE_0_COMPLETE"
    ].includes(`${deliveryState}|${currentPhase}`)
  ) {
    errors.push("DG0 PASS requires Phase 0 readiness or a later completed Phase 0 state");
  }
  if (researchStatus !== "COMPLETE" || definitionStatus !== "ACCEPTED") {
    errors.push("DG0 PASS requires complete research and accepted product definition");
  }
  if (metadataByFile.get(productDefinitionFile)?.status !== "ACCEPTED") {
    errors.push("DG0 PASS requires accepted product-definition document");
  }
  const unresolvedQuestions = [...discoveryQuestions.values()].filter(
    (question) => question.status === "UNRESOLVED"
  );
  if (unresolvedQuestions.length > 0) {
    errors.push("DG0 PASS cannot contain unresolved discovery questions");
  }
  const ownerDecisions = [...evidenceRecords.values()].filter(
    (record) => record.method === "OWNER_DECISION"
  );
  const scenarioReviews = [...evidenceRecords.values()].filter(
    (record) => record.method === "SCENARIO_REVIEW"
  );
  if (ownerDecisions.length < 1) {
    errors.push("DG0 PASS requires product owner decision evidence");
  }
  if (scenarioReviews.length < 3) {
    errors.push("DG0 PASS requires at least 3 scenario review records");
  }
  if (
    ![...productFeatures.values()].some(
      (feature) => feature.classification === "MVP"
    )
  ) {
    errors.push("DG0 PASS requires at least one MVP product feature");
  }
} else if (["READY_FOR_PHASE_0", "READY_FOR_PHASE_1"].includes(deliveryState)) {
  errors.push("Phase 0 readiness or completion requires DG0 PASS");
}

const phaseZeroStatus = yamlValue(phaseZeroText, "phase_status");
const gateZeroStatus = yamlValue(phaseZeroText, "gate_status");
if (!["NOT_STARTED", "IN_PROGRESS", "COMPLETE"].includes(phaseZeroStatus)) {
  errors.push(`invalid Phase 0 status: ${phaseZeroStatus}`);
}
if (!["NOT_EVALUATED", "PARTIAL", "PASS", "FAIL"].includes(gateZeroStatus)) {
  errors.push(`invalid G0 status: ${gateZeroStatus}`);
}
if (gateZeroStatus === "PASS" && phaseZeroStatus !== "COMPLETE") {
  errors.push("G0 PASS requires Phase 0 COMPLETE");
}
if (phaseZeroStatus === "COMPLETE" && gateZeroStatus !== "PASS") {
  errors.push("Phase 0 COMPLETE requires G0 PASS");
}
if (deliveryState === "READY_FOR_PHASE_1") {
  if (phaseZeroStatus !== "COMPLETE" || gateZeroStatus !== "PASS") {
    errors.push("READY_FOR_PHASE_1 requires Phase 0 COMPLETE and G0 PASS");
  }
}
if (offlinePhaseOneScaffoldAuthorized === "true") {
  if (
    `${deliveryState}|${currentPhase}` !==
    "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE"
  ) {
    errors.push(
      "offline Phase 1 scaffold authorization requires the Phase 0 readiness state"
    );
  }
  if (dg0Status !== "PASS") {
    errors.push("offline Phase 1 scaffold authorization requires DG0 PASS");
  }
  if (phaseZeroStatus !== "IN_PROGRESS" || gateZeroStatus !== "PARTIAL") {
    errors.push(
      "offline Phase 1 scaffold authorization requires Phase 0 IN_PROGRESS and G0 PARTIAL"
    );
  }
  if (
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Phase 1 scaffold authorization cannot enable runtime, production, or Meta writes"
    );
  }

  for (const path of OFFLINE_WORKER_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline Phase 1 scaffold is missing required file: ${path}`);
    }
  }

  const workerConfigPath = resolve(
    ROOT,
    "services/control-plane-worker/wrangler.jsonc"
  );
  const workerConfig = existsSync(workerConfigPath)
    ? readFileSync(workerConfigPath, "utf8")
    : "";
  for (const [label, pattern] of [
    ["workers_dev=false", /"workers_dev"\s*:\s*false/],
    ["preview_urls=false", /"preview_urls"\s*:\s*false/],
    ["local-only D1 placeholder", /"database_id"\s*:\s*"LOCAL_ONLY_DO_NOT_DEPLOY"/],
    ["offline fixture guard", /"OFFLINE_FIXTURES_ENABLED"\s*:\s*"true"/]
  ]) {
    if (!pattern.test(workerConfig)) {
      errors.push(`offline Worker config must declare ${label}`);
    }
  }
  for (const forbiddenKey of ["account_id", "route", "routes"]) {
    if (new RegExp(`"${forbiddenKey}"\\s*:`).test(workerConfig)) {
      errors.push(
        `offline Worker config must not declare remote key ${forbiddenKey}`
      );
    }
  }

  const packageJson = JSON.parse(
    readFileSync(resolve(ROOT, "package.json"), "utf8")
  );
  const scripts = packageJson.scripts ?? {};
  if (typeof scripts["worker:check"] !== "string") {
    errors.push("offline Worker scaffold must expose npm run worker:check");
  }
  for (const [name, command] of Object.entries(scripts)) {
    if (
      typeof command === "string" &&
      /\bwrangler\s+deploy\b|\bwrangler\b[^\n]*\s--remote\b/.test(command)
    ) {
      errors.push(`package script ${name} must not enable remote Worker operations`);
    }
  }

  const workerWorkflow = readFileSync(
    resolve(ROOT, ".github/workflows/offline-worker.yml"),
    "utf8"
  );
  if (!workerWorkflow.includes("npm run worker:check")) {
    errors.push("offline Worker CI must run npm run worker:check");
  }
  if (/\bsecrets\.|\bwrangler\s+deploy\b|\s--remote\b/.test(workerWorkflow)) {
    errors.push("offline Worker CI must not consume secrets or run remote operations");
  }
}
if (offlineReadOnlyAnalysisAuthorized === "true") {
  if (offlinePhaseOneScaffoldAuthorized !== "true") {
    errors.push("offline read-only analysis requires the offline scaffold authorization");
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline read-only analysis requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline read-only analysis cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_ANALYSIS_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline read-only analysis is missing required file: ${path}`);
    }
  }

  const offlineHttpSource = readFileSync(
    resolve(ROOT, "services/control-plane-worker/src/http.ts"),
    "utf8"
  );
  const offlineReadModelSource = readFileSync(
    resolve(ROOT, "services/control-plane-worker/src/read-model.ts"),
    "utf8"
  );
  if (
    !offlineHttpSource.includes("isLocalHostname") ||
    !offlineHttpSource.includes('segments[1] === "offline"')
  ) {
    errors.push("offline analysis HTTP routes must retain local-host and /offline guards");
  }
  if (!offlineReadModelSource.includes("source_kind = 'FIXTURE'")) {
    errors.push("offline analysis queries must retain the fixture source guard");
  }
  for (const path of OFFLINE_ANALYSIS_FILES.filter((file) => file.endsWith(".ts"))) {
    const source = readFileSync(resolve(ROOT, path), "utf8");
    if (source.includes("as unknown as")) {
      errors.push(`${path}: unsafe double-cast is forbidden in offline analysis code`);
    }
  }
  for (const line of offlineHttpSource.split("\n")) {
    if (line.includes("fetch(") && !/async fetch\(/.test(line)) {
      errors.push("offline analysis HTTP code must not make external fetch calls");
    }
  }
}
if (offlinePeriodDiagnosticsAuthorized === "true") {
  if (offlineReadOnlyAnalysisAuthorized !== "true") {
    errors.push(
      "offline period diagnostics requires the offline read-only analysis authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline period diagnostics requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline period diagnostics cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_DIAGNOSTIC_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline period diagnostics is missing required file: ${path}`);
    }
  }

  const diagnosticSource = readFileSync(
    resolve(ROOT, "services/control-plane-worker/src/comparison.ts"),
    "utf8"
  );
  const diagnosticHttpSource = readFileSync(
    resolve(ROOT, "services/control-plane-worker/src/http.ts"),
    "utf8"
  );
  for (const [label, source, pattern] of [
    ["comparison route", diagnosticHttpSource, 'segments[7] === "comparison"'],
    [
      "complete coverage failure",
      diagnosticHttpSource,
      "INCOMPLETE_PERIOD_COVERAGE"
    ],
    ["no threshold policy", diagnosticHttpSource, "thresholdsApplied: false"],
    ["no causal claim", diagnosticSource, "causalClaim: false"]
  ]) {
    if (!source.includes(pattern)) {
      errors.push(`offline period diagnostics must retain ${label}`);
    }
  }
  if (
    !diagnosticHttpSource.includes(
      "baselineStopTimestamp >= currentStartTimestamp"
    )
  ) {
    errors.push("offline period diagnostics must reject overlapping periods");
  }
  for (const path of OFFLINE_DIAGNOSTIC_FILES.filter((file) =>
    file.endsWith(".ts")
  )) {
    const source = readFileSync(resolve(ROOT, path), "utf8");
    if (source.includes("as unknown as")) {
      errors.push(`${path}: unsafe double-cast is forbidden in diagnostic code`);
    }
    for (const line of source.split("\n")) {
      if (line.includes("fetch(") && !/async fetch\(/.test(line)) {
        errors.push(`${path}: diagnostic code must not make external fetch calls`);
      }
    }
  }
}
if (offlineWebAnalysisIntegrationAuthorized === "true") {
  if (offlinePeriodDiagnosticsAuthorized !== "true") {
    errors.push(
      "offline Web analysis integration requires the offline period diagnostics authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline Web analysis integration requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Web analysis integration cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_WEB_ANALYSIS_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline Web analysis integration is missing required file: ${path}`);
    }
  }

  if (OFFLINE_WEB_ANALYSIS_FILES.every((path) => existsSync(resolve(ROOT, path)))) {
    const offlineWebClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineComparison.ts"),
      "utf8"
    );
    const offlineWebPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
      ),
      "utf8"
    );
    const prototypeViteConfig = readFileSync(
      resolve(ROOT, "prototype/vite.config.ts"),
      "utf8"
    );

    for (const marker of [
      "/offline-api/v1/workspaces/",
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_CONNECTION",
      "thresholdsApplied",
      "causalClaims",
      "AbortSignal"
    ]) {
      if (!offlineWebClient.includes(marker)) {
        errors.push(`offline Web client must retain ${marker}`);
      }
    }
    if (/https?:\/\//.test(offlineWebClient)) {
      errors.push("offline Web client must use a relative same-origin path");
    }
    if (offlineWebClient.includes("as unknown as")) {
      errors.push("offline Web client must not use unsafe double-casts");
    }
    if (!offlineWebPanel.includes("import.meta.env.DEV")) {
      errors.push("offline Web integration must be disabled outside Vite development");
    }
    if (
      !prototypeViteConfig.includes('target: "http://127.0.0.1:8791"') ||
      !prototypeViteConfig.includes('"/offline-api"') ||
      !prototypeViteConfig.includes('replace(/^\\/offline-api/, "/offline")')
    ) {
      errors.push("Vite must retain the fixed local-only offline Worker proxy");
    }
  }
}
if (offlineWebAccountContextAuthorized === "true") {
  if (offlineWebAnalysisIntegrationAuthorized !== "true") {
    errors.push(
      "offline Web account context requires the offline Web analysis integration authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline Web account context requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Web account context cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_WEB_ACCOUNT_CONTEXT_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline Web account context is missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_WEB_ACCOUNT_CONTEXT_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const accountClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineComparison.ts"),
      "utf8"
    );
    const accountPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
      ),
      "utf8"
    );
    const accountTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
      ),
      "utf8"
    );

    for (const marker of [
      "loadOfflineAdAccounts",
      "items.length > 10",
      "new Set",
      "expectedAccount.id",
      "expectedRequest.baselineStart",
      "encodeURIComponent(account.id)"
    ]) {
      if (!accountClient.includes(marker)) {
        errors.push(`offline account client must retain ${marker}`);
      }
    }
    if (accountClient.includes("FIXTURE_AD_ACCOUNT_ID")) {
      errors.push("offline account client must not hardcode a comparison account ID");
    }
    for (const marker of [
      "selectedAccountId",
      "handleAccountChange",
      "loadOfflineAdAccounts",
      "accounts.map"
    ]) {
      if (!accountPanel.includes(marker)) {
        errors.push(`offline account selection UI must retain ${marker}`);
      }
    }
    if (
      !accountTests.includes("aa_fixture_02") ||
      !accountTests.includes("different account")
    ) {
      errors.push(
        "offline account tests must cover a selected account and account-binding mismatch"
      );
    }
  }
}
if (offlineAdObjectHierarchyAuthorized === "true") {
  if (offlineWebAccountContextAuthorized !== "true") {
    errors.push(
      "offline ad object hierarchy requires the offline Web account context authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline ad object hierarchy requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline ad object hierarchy cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_AD_OBJECT_HIERARCHY_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline ad object hierarchy is missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_AD_OBJECT_HIERARCHY_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const hierarchyMigration = readFileSync(
      resolve(
        ROOT,
        "services/control-plane-worker/migrations/0002_offline_ad_objects.sql"
      ),
      "utf8"
    );
    const hierarchyReadModel = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/read-model.ts"),
      "utf8"
    );
    const hierarchyHttp = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/http.ts"),
      "utf8"
    );
    const hierarchyClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineHierarchy.ts"),
      "utf8"
    );
    const hierarchyPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectHierarchyPanel.tsx"
      ),
      "utf8"
    );
    const hierarchyTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectHierarchyPanel.test.tsx"
      ),
      "utf8"
    );

    for (const marker of [
      "CREATE TABLE meta_ad_objects",
      "parent_object_id",
      "source_kind = 'FIXTURE'",
      "object_level IN ('CAMPAIGN', 'AD_SET', 'AD')"
    ]) {
      if (!hierarchyMigration.includes(marker)) {
        errors.push(`offline hierarchy migration must retain ${marker}`);
      }
    }
    for (const marker of [
      "listFixtureAdObjects",
      "LIMIT 51",
      "source_kind = 'FIXTURE'",
      "expectedParentLevel",
      "invalid_hierarchy"
    ]) {
      if (!hierarchyReadModel.includes(marker)) {
        errors.push(`offline hierarchy read model must retain ${marker}`);
      }
    }
    for (const marker of [
      'segments[7] === "objects"',
      "INCOMPATIBLE_OBJECT_HIERARCHY",
      "listFixtureAdObjects"
    ]) {
      if (!hierarchyHttp.includes(marker)) {
        errors.push(`offline hierarchy HTTP route must retain ${marker}`);
      }
    }
    for (const marker of [
      "/offline-api/v1/workspaces/",
      "/objects",
      "MAX_OFFLINE_AD_OBJECTS = 50",
      "new Map",
      "expectedParentLevel",
      "encodeURIComponent(account.id)",
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_CONNECTION"
    ]) {
      if (!hierarchyClient.includes(marker)) {
        errors.push(`offline hierarchy client must retain ${marker}`);
      }
    }
    if (/https?:\/\//.test(hierarchyClient)) {
      errors.push("offline hierarchy client must use a relative same-origin path");
    }
    if (
      hierarchyClient.includes("as unknown as") ||
      hierarchyReadModel.includes("as unknown as")
    ) {
      errors.push("offline hierarchy code must not use unsafe double-casts");
    }
    for (const marker of [
      "loadOfflineAdObjectHierarchy",
      "selectedObjectId",
      "childrenByParent",
      "可选对象分析"
    ]) {
      if (!hierarchyPanel.includes(marker)) {
        errors.push(`offline hierarchy UI must retain ${marker}`);
      }
    }
    if (
      !hierarchyTests.includes("orphaned object") ||
      !hierarchyTests.includes("different account")
    ) {
      errors.push(
        "offline hierarchy tests must cover orphan rejection and account mismatch"
      );
    }
  }
}
if (offlineObjectLevelAnalysisAuthorized === "true") {
  if (offlineAdObjectHierarchyAuthorized !== "true") {
    errors.push(
      "offline object-level analysis requires the offline ad object hierarchy authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline object-level analysis requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline object-level analysis cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_OBJECT_LEVEL_ANALYSIS_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline object-level analysis is missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_OBJECT_LEVEL_ANALYSIS_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const objectFixture = readFileSync(
      resolve(ROOT, "services/control-plane-worker/fixtures/0001_seed.sql"),
      "utf8"
    );
    const objectReadModel = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/read-model.ts"),
      "utf8"
    );
    const objectHttp = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/http.ts"),
      "utf8"
    );
    const objectClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineHierarchy.ts"),
      "utf8"
    );
    const objectPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
      ),
      "utf8"
    );
    const objectWorkerTests = readFileSync(
      resolve(
        ROOT,
        "services/control-plane-worker/test/object-analysis.spec.ts"
      ),
      "utf8"
    );
    const objectWebTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
      ),
      "utf8"
    );

    for (const marker of [
      "insight_campaign_01_20260802",
      "insight_adset_01_20260802",
      "insight_ad_01_20260802"
    ]) {
      if (!objectFixture.includes(marker)) {
        errors.push(`offline object fixture must retain ${marker}`);
      }
    }
    for (const marker of [
      "getFixtureAdObjectSummary",
      "object_level = ?3",
      "AND i.object_level = 'ACCOUNT'"
    ]) {
      if (!objectReadModel.includes(marker)) {
        errors.push(`offline object read model must retain ${marker}`);
      }
    }
    for (const marker of [
      "ad_object_comparison",
      'segments[9] === "comparison"',
      "getFixtureAdObjectSummary",
      "objectId: object.id",
      "causalClaims: false"
    ]) {
      if (!objectHttp.includes(marker)) {
        errors.push(`offline object comparison route must retain ${marker}`);
      }
    }
    for (const marker of [
      "loadOfflineAdObjectComparison",
      "isObjectComparisonResponse",
      "encodeURIComponent(account.id)",
      "encodeURIComponent(object.id)",
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_CONNECTION"
    ]) {
      if (!objectClient.includes(marker)) {
        errors.push(`offline object analysis client must retain ${marker}`);
      }
    }
    if (/https?:\/\//.test(objectClient)) {
      errors.push("offline object analysis client must use a relative same-origin path");
    }
    if (
      objectClient.includes("as unknown as") ||
      objectReadModel.includes("as unknown as")
    ) {
      errors.push("offline object analysis code must not use unsafe double-casts");
    }
    for (const marker of [
      "selectedAdObject",
      "loadOfflineAdObjectComparison",
      "加载所选账户对比",
      "加载所选对象对比"
    ]) {
      if (!objectPanel.includes(marker)) {
        errors.push(`offline object analysis UI must retain ${marker}`);
      }
    }
    if (
      !objectWorkerTests.includes("reconciled to the account by day") ||
      !objectWebTests.includes("different object")
    ) {
      errors.push(
        "offline object analysis tests must cover hierarchy rollups and object-binding mismatch"
      );
    }
  }
}
if (offlineDirectChildBreakdownAuthorized === "true") {
  if (offlineObjectLevelAnalysisAuthorized !== "true") {
    errors.push(
      "offline direct-child breakdown requires the offline object-level analysis authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline direct-child breakdown requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline direct-child breakdown cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_DIRECT_CHILD_BREAKDOWN_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline direct-child breakdown is missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_DIRECT_CHILD_BREAKDOWN_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const breakdownComparison = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/comparison.ts"),
      "utf8"
    );
    const breakdownHttp = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/http.ts"),
      "utf8"
    );
    const breakdownClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineBreakdown.ts"),
      "utf8"
    );
    const breakdownPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
      ),
      "utf8"
    );
    const breakdownWorkerTests = readFileSync(
      resolve(
        ROOT,
        "services/control-plane-worker/test/object-analysis.spec.ts"
      ),
      "utf8"
    );
    const breakdownWebTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
      ),
      "utf8"
    );

    for (const marker of [
      "buildDirectChildBreakdown",
      "ADDITIVE_METRIC_KEYS",
      "incompatible_rollup",
      "parentObjectId"
    ]) {
      if (!breakdownComparison.includes(marker)) {
        errors.push(`offline direct-child comparison must retain ${marker}`);
      }
    }
    for (const marker of [
      "direct_child_breakdown",
      "children-comparison",
      "MAX_OFFLINE_DIRECT_CHILDREN = 10",
      "INCOMPATIBLE_OBJECT_ROLLUP",
      "rankingApplied: false"
    ]) {
      if (!breakdownHttp.includes(marker)) {
        errors.push(`offline direct-child HTTP route must retain ${marker}`);
      }
    }
    for (const marker of [
      "loadOfflineDirectChildBreakdown",
      "children-comparison",
      "periodRollupMatches",
      "MAX_OFFLINE_DIRECT_CHILDREN = 10",
      "rankingApplied",
      "hasRequiredFixtureWarnings"
    ]) {
      if (!breakdownClient.includes(marker)) {
        errors.push(`offline direct-child client must retain ${marker}`);
      }
    }
    if (/https?:\/\//.test(breakdownClient)) {
      errors.push("offline direct-child client must use a relative same-origin path");
    }
    if (
      breakdownComparison.includes("as unknown as") ||
      breakdownHttp.includes("as unknown as") ||
      breakdownClient.includes("as unknown as")
    ) {
      errors.push("offline direct-child code must not use unsafe double-casts");
    }
    for (const source of [breakdownComparison, breakdownHttp]) {
      for (const line of source.split("\n")) {
        if (line.includes("fetch(") && !/async fetch\(/.test(line)) {
          errors.push("offline direct-child Worker code must not make external fetch calls");
        }
      }
    }
    for (const marker of [
      "loadOfflineDirectChildBreakdown",
      "加载直接子对象拆解",
      "无排名"
    ]) {
      if (!breakdownPanel.includes(marker)) {
        errors.push(`offline direct-child UI must retain ${marker}`);
      }
    }
    if (
      !breakdownWorkerTests.includes(
        "reconciles direct Ad Set changes to the selected Campaign"
      ) ||
      !breakdownWebTests.includes("different parent") ||
      !breakdownWebTests.includes("do not reconcile")
    ) {
      errors.push(
        "offline direct-child tests must cover parent binding and parent-child rollup mismatch"
      );
    }
  }
}
if (offlineObjectDailyTrendAuthorized === "true") {
  if (offlineDirectChildBreakdownAuthorized !== "true") {
    errors.push(
      "offline object daily trend requires the offline direct-child breakdown authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline object daily trend requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline object daily trend cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_OBJECT_DAILY_TREND_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline object daily trend is missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_OBJECT_DAILY_TREND_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const trendReadModel = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/read-model.ts"),
      "utf8"
    );
    const trendHttp = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/http.ts"),
      "utf8"
    );
    const trendWorkerTests = readFileSync(
      resolve(ROOT, "services/control-plane-worker/test/object-trend.spec.ts"),
      "utf8"
    );
    const trendClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineTrend.ts"),
      "utf8"
    );
    const trendClientTests = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineTrend.test.ts"),
      "utf8"
    );
    const trendPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectTrendPanel.tsx"
      ),
      "utf8"
    );
    const trendPanelTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectTrendPanel.test.tsx"
      ),
      "utf8"
    );

    for (const marker of [
      "getFixtureAdObjectTrend",
      "ORDER BY date_start ASC",
      "LIMIT 32",
      "deriveMetrics"
    ]) {
      if (!trendReadModel.includes(marker)) {
        errors.push(`offline object trend read model must retain ${marker}`);
      }
    }
    for (const marker of [
      "ad_object_trend",
      'segments[9] === "trend"',
      "minimumDays: 3",
      "maximumDays: 31",
      'metricSelection: "SINGLE"',
      "trendInterpretationApplied: false"
    ]) {
      if (!trendHttp.includes(marker)) {
        errors.push(`offline object trend HTTP route must retain ${marker}`);
      }
    }
    for (const marker of [
      "loadOfflineAdObjectTrend",
      "expectedAccount.id",
      "expectedObject.id",
      "deriveExpectedMetrics",
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_CONNECTION"
    ]) {
      if (!trendClient.includes(marker)) {
        errors.push(`offline object trend client must retain ${marker}`);
      }
    }
    if (/https?:\/\//.test(trendClient) || /remoteBase|baseUrl/.test(trendClient)) {
      errors.push("offline object trend client must use a relative same-origin path");
    }
    for (const source of [trendReadModel, trendHttp]) {
      for (const line of source.split("\n")) {
        if (line.includes("fetch(") && !/async fetch\(/.test(line)) {
          errors.push("offline object trend Worker code must not make external fetch calls");
        }
      }
    }
    for (const source of [
      trendReadModel,
      trendHttp,
      trendWorkerTests,
      trendClient,
      trendClientTests,
      trendPanel,
      trendPanelTests
    ]) {
      if (source.includes("as unknown as")) {
        errors.push("offline object trend code must not use unsafe double-casts");
      }
    }
    for (const marker of [
      "加载所选对象趋势",
      "OfflineTrendMetricKey",
      "不解释趋势"
    ]) {
      if (!trendPanel.includes(marker)) {
        errors.push(`offline object trend UI must retain ${marker}`);
      }
    }
    if (
      !trendWorkerTests.includes("31-day range") ||
      !trendClientTests.includes("different object") ||
      !trendPanelTests.includes("does not refetch")
    ) {
      errors.push(
        "offline object trend tests must cover the 31-day bound, object binding, and local metric switching"
      );
    }
  }
}
if (offlineDirectChildDailyTrendAuthorized === "true") {
  if (
    offlineDirectChildBreakdownAuthorized !== "true" ||
    offlineObjectDailyTrendAuthorized !== "true"
  ) {
    errors.push(
      "offline direct-child daily trend requires direct-child breakdown and object daily trend authorizations"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline direct-child daily trend requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline direct-child daily trend cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_DIRECT_CHILD_DAILY_TREND_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(
        `offline direct-child daily trend is missing required file: ${path}`
      );
    }
  }

  if (
    OFFLINE_DIRECT_CHILD_DAILY_TREND_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const childTrendComparison = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/comparison.ts"),
      "utf8"
    );
    const childTrendHttp = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/http.ts"),
      "utf8"
    );
    const childTrendWorkerTests = readFileSync(
      resolve(
        ROOT,
        "services/control-plane-worker/test/object-child-trend.spec.ts"
      ),
      "utf8"
    );
    const childTrendClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineChildTrend.ts"),
      "utf8"
    );
    const childTrendClientTests = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineChildTrend.test.ts"),
      "utf8"
    );
    const childTrendPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDirectChildTrendPanel.tsx"
      ),
      "utf8"
    );
    const childTrendPanelTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDirectChildTrendPanel.test.tsx"
      ),
      "utf8"
    );

    for (const marker of [
      "buildDirectChildTrend",
      "ADDITIVE_METRIC_KEYS",
      "dailyMatchesParent",
      "incompatible_rollup"
    ]) {
      if (!childTrendComparison.includes(marker)) {
        errors.push(`offline direct-child daily trend must retain ${marker}`);
      }
    }
    for (const marker of [
      "direct_child_daily_trend",
      'segments[9] === "children-trend"',
      "MAX_OFFLINE_DIRECT_CHILDREN = 10",
      'seriesOrder: "STABLE_OBJECT_ID"',
      "rankingApplied: false",
      "trendInterpretationApplied: false"
    ]) {
      if (!childTrendHttp.includes(marker)) {
        errors.push(
          `offline direct-child daily trend HTTP route must retain ${marker}`
        );
      }
    }
    for (const marker of [
      "loadOfflineDirectChildTrend",
      "children-trend",
      "deriveExpectedMetrics",
      "dailyRollupMatches",
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_CONNECTION"
    ]) {
      if (!childTrendClient.includes(marker)) {
        errors.push(
          `offline direct-child daily trend client must retain ${marker}`
        );
      }
    }
    if (
      /https?:\/\//.test(childTrendClient) ||
      /remoteBase|baseUrl/.test(childTrendClient)
    ) {
      errors.push(
        "offline direct-child daily trend client must use a relative same-origin path"
      );
    }
    for (const source of [childTrendComparison, childTrendHttp]) {
      for (const line of source.split("\n")) {
        if (line.includes("fetch(") && !/async fetch\(/.test(line)) {
          errors.push(
            "offline direct-child daily trend Worker code must not make external fetch calls"
          );
        }
      }
    }
    for (const source of [
      childTrendComparison,
      childTrendHttp,
      childTrendWorkerTests,
      childTrendClient,
      childTrendClientTests,
      childTrendPanel,
      childTrendPanelTests
    ]) {
      if (source.includes("as unknown as")) {
        errors.push(
          "offline direct-child daily trend code must not use unsafe double-casts"
        );
      }
    }
    for (const marker of [
      "加载直接子对象趋势",
      "OfflineTrendMetricKey",
      "无排名",
      "不解释趋势"
    ]) {
      if (!childTrendPanel.includes(marker)) {
        errors.push(`offline direct-child daily trend UI must retain ${marker}`);
      }
    }
    if (
      !childTrendWorkerTests.includes("daily rollup mismatch") ||
      !childTrendClientTests.includes("different parent") ||
      !childTrendPanelTests.includes("does not refetch")
    ) {
      errors.push(
        "offline direct-child daily trend tests must cover daily rollup, parent binding, and local metric switching"
      );
    }
  }
}
if (offlineDataQualityReportAuthorized === "true") {
  if (offlineDirectChildDailyTrendAuthorized !== "true") {
    errors.push(
      "offline data quality report requires the direct-child daily trend authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline data quality report requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline data quality report cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_DATA_QUALITY_REPORT_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(
        `offline data quality report is missing required file: ${path}`
      );
    }
  }

  if (
    OFFLINE_DATA_QUALITY_REPORT_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const qualityDomain = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/quality.ts"),
      "utf8"
    );
    const qualityHttp = readFileSync(
      resolve(ROOT, "services/control-plane-worker/src/http.ts"),
      "utf8"
    );
    const qualityWorkerTests = readFileSync(
      resolve(ROOT, "services/control-plane-worker/test/data-quality.spec.ts"),
      "utf8"
    );
    const qualityClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineDataQuality.ts"),
      "utf8"
    );
    const qualityClientTests = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineDataQuality.test.ts"),
      "utf8"
    );
    const qualityPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDataQualityPanel.tsx"
      ),
      "utf8"
    );
    const qualityPanelTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDataQualityPanel.test.tsx"
      ),
      "utf8"
    );

    for (const marker of [
      "buildFixtureDataQualityReport",
      "PRIMARY_GRAIN_UNIQUE",
      "DAILY_COVERAGE_COMPLETE",
      "REPORTING_CONTEXT_CONSISTENT",
      "OBJECT_HIERARCHY_COMPLETE",
      "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP",
      "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
      "AD_SET_TO_AD_DAILY_ROLLUP",
      "incompatible_rollup"
    ]) {
      if (!qualityDomain.includes(marker)) {
        errors.push(`offline data quality domain must retain ${marker}`);
      }
    }
    for (const marker of [
      "account_data_quality",
      'segments[7] === "data-quality"',
      "OFFLINE_DATA_QUALITY_CHECK_CODES",
      "performanceEvaluationApplied: false",
      "businessThresholdsApplied: false",
      "gateEvidence: false"
    ]) {
      if (!qualityHttp.includes(marker)) {
        errors.push(`offline data quality HTTP route must retain ${marker}`);
      }
    }
    for (const marker of [
      "loadOfflineDataQuality",
      "data-quality",
      "PRIMARY_GRAIN_UNIQUE",
      "performanceEvaluationApplied",
      "FIXTURE_DATA_ONLY",
      "NO_EXTERNAL_CONNECTION"
    ]) {
      if (!qualityClient.includes(marker)) {
        errors.push(`offline data quality client must retain ${marker}`);
      }
    }
    if (
      /https?:\/\//.test(qualityClient) ||
      /remoteBase|baseUrl/.test(qualityClient)
    ) {
      errors.push(
        "offline data quality client must use a relative same-origin path"
      );
    }
    for (const source of [qualityDomain, qualityHttp]) {
      for (const line of source.split("\n")) {
        if (line.includes("fetch(") && !/async fetch\(/.test(line)) {
          errors.push(
            "offline data quality Worker code must not make external fetch calls"
          );
        }
      }
    }
    for (const source of [
      qualityDomain,
      qualityHttp,
      qualityWorkerTests,
      qualityClient,
      qualityClientTests,
      qualityPanel,
      qualityPanelTests
    ]) {
      if (source.includes("as unknown as")) {
        errors.push(
          "offline data quality code must not use unsafe double-casts"
        );
      }
    }
    for (const marker of [
      "运行离线数据质量核验",
      "全部检查必须通过",
      "不评价表现",
      "不作为 Gate 证据"
    ]) {
      if (!qualityPanel.includes(marker)) {
        errors.push(`offline data quality UI must retain ${marker}`);
      }
    }
    if (
      !qualityWorkerTests.includes("complete subject-day dataset") ||
      !qualityClientTests.includes("different account") ||
      !qualityPanelTests.includes("clears stale evidence")
    ) {
      errors.push(
        "offline data quality tests must cover complete grain, account binding, and stale evidence clearing"
      );
    }
  }
}
if (offlineAnalysisQualityPreflightAuthorized === "true") {
  if (offlineDataQualityReportAuthorized !== "true") {
    errors.push(
      "offline analysis quality preflight requires the data quality report authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline analysis quality preflight requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline analysis quality preflight cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_ANALYSIS_QUALITY_PREFLIGHT_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(
        `offline analysis quality preflight is missing required file: ${path}`
      );
    }
  }

  if (
    OFFLINE_ANALYSIS_QUALITY_PREFLIGHT_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const preflightClient = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineDataQuality.ts"),
      "utf8"
    );
    const preflightClientTests = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineDataQuality.test.ts"),
      "utf8"
    );
    const preflightQualityPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDataQualityPanel.tsx"
      ),
      "utf8"
    );
    const preflightComparisonPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
      ),
      "utf8"
    );
    const preflightComparisonTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
      ),
      "utf8"
    );
    const preflightObjectTrendPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectTrendPanel.tsx"
      ),
      "utf8"
    );
    const preflightObjectTrendTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectTrendPanel.test.tsx"
      ),
      "utf8"
    );
    const preflightChildTrendPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDirectChildTrendPanel.tsx"
      ),
      "utf8"
    );
    const preflightChildTrendTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDirectChildTrendPanel.test.tsx"
      ),
      "utf8"
    );
    const preflightStyles = readFileSync(
      resolve(ROOT, "prototype/src/styles/pages.css"),
      "utf8"
    );

    for (const marker of [
      "createOfflineDataQualityAttestation",
      "offlineDataQualityAttestsRanges",
      "offlineAnalysisContextMatchesAttestation",
      "objectIds.includes",
      "fetchedAt",
      "syncRunIds"
    ]) {
      if (!preflightClient.includes(marker)) {
        errors.push(`offline analysis quality preflight must retain ${marker}`);
      }
    }
    for (const marker of [
      "QUALITY_PREFLIGHT_REQUIRED",
      "comparisonQualityReady",
      "onAttestationChange",
      "offlineAnalysisContextMatchesAttestation",
      "import.meta.env.DEV"
    ]) {
      if (!preflightComparisonPanel.includes(marker)) {
        errors.push(
          `offline analysis comparison preflight must retain ${marker}`
        );
      }
    }
    for (const source of [
      preflightObjectTrendPanel,
      preflightChildTrendPanel
    ]) {
      for (const marker of [
        "QUALITY_PREFLIGHT_REQUIRED",
        "offlineDataQualityAttestsRanges",
        "offlineAnalysisContextMatchesAttestation"
      ]) {
        if (!source.includes(marker)) {
          errors.push(`offline analysis trend preflight must retain ${marker}`);
        }
      }
    }
    if (!preflightQualityPanel.includes("步骤 2 · 分析 preflight")) {
      errors.push("offline data quality UI must remain the analysis preflight");
    }
    if (
      !preflightStyles.includes("offline-comparison__preflight--ready") ||
      !preflightStyles.includes("offline-comparison__preflight--locked")
    ) {
      errors.push("offline analysis preflight must expose ready and locked UI states");
    }
    if (
      !preflightClientTests.includes("binds an attestation to account") ||
      !preflightComparisonTests.includes("keeps metric analysis locked") ||
      !preflightComparisonTests.includes(
        "differs from the quality attestation"
      ) ||
      !preflightObjectTrendTests.includes(
        "locked without a covering quality attestation"
      ) ||
      !preflightChildTrendTests.includes(
        "locked without a covering quality attestation"
      )
    ) {
      errors.push(
        "offline analysis preflight tests must cover range, object, lock, and snapshot mismatch boundaries"
      );
    }
    for (const source of [
      preflightClient,
      preflightClientTests,
      preflightQualityPanel,
      preflightComparisonPanel,
      preflightComparisonTests,
      preflightObjectTrendPanel,
      preflightObjectTrendTests,
      preflightChildTrendPanel,
      preflightChildTrendTests
    ]) {
      if (source.includes("as unknown as")) {
        errors.push(
          "offline analysis quality preflight must not use unsafe double-casts"
        );
      }
    }
    for (const source of [
      preflightClient,
      preflightQualityPanel,
      preflightComparisonPanel,
      preflightObjectTrendPanel,
      preflightChildTrendPanel
    ]) {
      if (/localStorage|sessionStorage/.test(source)) {
        errors.push(
          "offline analysis quality attestation must remain in memory only"
        );
      }
    }
  }
}
if (offlineCodexEvidenceBundleAuthorized === "true") {
  if (offlineAnalysisQualityPreflightAuthorized !== "true") {
    errors.push(
      "offline Codex evidence bundle requires the analysis quality preflight authorization"
    );
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline Codex evidence bundle requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Codex evidence bundle cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_CODEX_EVIDENCE_BUNDLE_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(
        `offline Codex evidence bundle is missing required file: ${path}`
      );
    }
  }

  if (
    OFFLINE_CODEX_EVIDENCE_BUNDLE_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const evidenceBuilder = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineCodexEvidence.ts"),
      "utf8"
    );
    const evidenceBuilderTests = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineCodexEvidence.test.ts"),
      "utf8"
    );
    const evidencePanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineCodexEvidencePanel.tsx"
      ),
      "utf8"
    );
    const evidenceComparisonPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.tsx"
      ),
      "utf8"
    );
    const evidenceComparisonTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineComparisonPanel.test.tsx"
      ),
      "utf8"
    );
    const evidenceStyles = readFileSync(
      resolve(ROOT, "prototype/src/styles/pages.css"),
      "utf8"
    );

    for (const marker of [
      "facebook-ads-offline-analysis-context/v2",
      "CODEX_ANALYSIS_INPUT",
      "buildOfflineCodexEvidenceBundle",
      "serializeOfflineCodexEvidenceBundle",
      "offlineDataQualityAttestsRanges",
      "offlineAnalysisContextMatchesAttestation",
      'claim_type: "FACT"',
      'claim_type: "UNKNOWN"',
      "recommendations_generated: false",
      "external_write: false",
      "persisted: false",
      "JSON.stringify(bundle, null, 2)"
    ]) {
      if (!evidenceBuilder.includes(marker)) {
        errors.push(`offline Codex evidence builder must retain ${marker}`);
      }
    }
    for (const marker of [
      "Codex 手动上下文",
      "Codex 分析上下文 JSON",
      "readOnly",
      "不是分析结论",
      "不保存",
      "不上传",
      "不生成建议"
    ]) {
      if (!evidencePanel.includes(marker)) {
        errors.push(`offline Codex evidence UI must retain ${marker}`);
      }
    }
    for (const marker of [
      "OfflineCodexEvidencePanel",
      'comparisonState.kind === "success"',
      "qualityAttestation={qualityAttestation}",
      "developmentEnabled ?"
    ]) {
      if (!evidenceComparisonPanel.includes(marker)) {
        errors.push(`offline Codex evidence integration must retain ${marker}`);
      }
    }
    if (
      !evidenceBuilderTests.includes(
        "builds a deterministic account comparison context"
      ) ||
      !evidenceBuilderTests.includes(
        "stable non-ranked order with reconciliation"
      ) ||
      !evidenceBuilderTests.includes(
        "differs from the quality preflight"
      ) ||
      !evidenceComparisonTests.includes(
        "shows a manual Codex context only for the current preflight-backed comparison"
      )
    ) {
      errors.push(
        "offline Codex evidence tests must cover determinism, reconciliation, snapshot mismatch, and UI invalidation"
      );
    }
    if (!evidenceStyles.includes(".offline-codex-evidence__preview textarea")) {
      errors.push("offline Codex evidence UI must retain a scoped JSON preview");
    }
    if (
      /requestId|executive_answer|recommended_actions|nextChecks/.test(
        evidenceBuilder
      )
    ) {
      errors.push(
        "offline Codex evidence output must omit request IDs, final answers, recommendations, and next-check suggestions"
      );
    }
    for (const source of [evidenceBuilder, evidencePanel]) {
      if (
        /https?:\/\/|fetch\(|localStorage|sessionStorage|indexedDB|navigator\.clipboard/.test(
          source
        )
      ) {
        errors.push(
          "offline Codex evidence generation must remain local, in-memory, and manually handed off"
        );
      }
      if (source.includes("as unknown as")) {
        errors.push(
          "offline Codex evidence generation must not use unsafe double-casts"
        );
      }
    }
  }
}
if (offlineCodexTrendEvidenceAuthorized === "true") {
  for (const [dependency, value] of [
    ["offline object daily trend", offlineObjectDailyTrendAuthorized],
    ["offline direct-child daily trend", offlineDirectChildDailyTrendAuthorized],
    ["offline analysis quality preflight", offlineAnalysisQualityPreflightAuthorized],
    ["offline Codex evidence bundle", offlineCodexEvidenceBundleAuthorized]
  ]) {
    if (value !== "true") {
      errors.push(`offline Codex trend evidence requires ${dependency} authorization`);
    }
  }
  if (
    `${deliveryState}|${currentPhase}` !==
      "READY_FOR_PHASE_0|PRODUCT_DISCOVERY_COMPLETE" ||
    phaseZeroStatus !== "IN_PROGRESS" ||
    gateZeroStatus !== "PARTIAL" ||
    dg0Status !== "PASS"
  ) {
    errors.push(
      "offline Codex trend evidence requires DG0 PASS, Phase 0 IN_PROGRESS, and G0 PARTIAL"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Codex trend evidence cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_CODEX_TREND_EVIDENCE_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline Codex trend evidence is missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_CODEX_TREND_EVIDENCE_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const trendEvidenceBuilder = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineCodexEvidence.ts"),
      "utf8"
    );
    const trendEvidenceTests = readFileSync(
      resolve(ROOT, "prototype/src/data/offlineCodexEvidence.test.ts"),
      "utf8"
    );
    const objectTrendPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectTrendPanel.tsx"
      ),
      "utf8"
    );
    const objectTrendTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineObjectTrendPanel.test.tsx"
      ),
      "utf8"
    );
    const childTrendPanel = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDirectChildTrendPanel.tsx"
      ),
      "utf8"
    );
    const childTrendTests = readFileSync(
      resolve(
        ROOT,
        "prototype/src/components/analytics/OfflineDirectChildTrendPanel.test.tsx"
      ),
      "utf8"
    );
    const trendEvidenceDoc = readFileSync(
      resolve(ROOT, "docs/technical/offline-codex-trend-evidence.md"),
      "utf8"
    );

    for (const marker of [
      "facebook-ads-offline-analysis-context/v2",
      "OBJECT_DAILY_TREND",
      "DIRECT_CHILD_DAILY_TREND",
      "DIRECT_CHILDREN_DAILY",
      "TREND_METRIC_KEYS",
      "daily_matches_parent: true",
      "directChildDailyRollupMatches",
      "copyDailyItems"
    ]) {
      if (!trendEvidenceBuilder.includes(marker)) {
        errors.push(`offline Codex trend evidence builder must retain ${marker}`);
      }
    }
    if (
      !trendEvidenceTests.includes(
        "builds a deterministic object daily trend context with all fixed metrics"
      ) ||
      !trendEvidenceTests.includes(
        "keeps direct-child daily trend inputs stable and reconciled"
      ) ||
      !trendEvidenceTests.includes(
        "rejects a trend snapshot outside the current preflight"
      )
    ) {
      errors.push(
        "offline Codex trend evidence tests must cover determinism, fixed metrics, daily reconciliation, and preflight mismatch"
      );
    }
    for (const [label, panel, tests, kind] of [
      ["object", objectTrendPanel, objectTrendTests, "OBJECT_DAILY_TREND"],
      [
        "direct-child",
        childTrendPanel,
        childTrendTests,
        "DIRECT_CHILD_DAILY_TREND"
      ]
    ]) {
      if (
        !panel.includes("OfflineCodexEvidencePanel") ||
        !panel.includes("source={state.response}") ||
        !tests.includes(kind) ||
        !tests.includes("Codex 分析上下文 JSON")
      ) {
        errors.push(
          `offline Codex ${label} trend evidence must derive its read-only UI from the current successful response`
        );
      }
    }
    for (const marker of [
      "完整固定 9 项日值",
      "不复制为第二份",
      "不自动请求 Codex",
      "不增加或修改 Worker"
    ]) {
      if (!trendEvidenceDoc.includes(marker)) {
        errors.push(`offline Codex trend evidence documentation must retain ${marker}`);
      }
    }
    for (const source of [trendEvidenceBuilder, objectTrendPanel, childTrendPanel]) {
      if (
        /https?:\/\/|localStorage|sessionStorage|indexedDB|navigator\.clipboard/.test(
          source
        )
      ) {
        errors.push(
          "offline Codex trend evidence must remain local, in-memory, and manually handed off"
        );
      }
    }
  }
}
if (offlineCodexAnalysisSkillAuthorized === "true") {
  for (const [label, value] of [
    ["offline Codex evidence bundle", offlineCodexEvidenceBundleAuthorized],
    ["offline Codex trend evidence", offlineCodexTrendEvidenceAuthorized]
  ]) {
    if (value !== "true") {
      errors.push(`offline Codex analysis Skill requires ${label}`);
    }
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Codex analysis Skill cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_CODEX_ANALYSIS_SKILL_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline Codex analysis Skill is missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_CODEX_ANALYSIS_SKILL_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const skill = readFileSync(
      resolve(ROOT, ".agents/skills/facebook-ads-analysis/SKILL.md"),
      "utf8"
    );
    const metadata = readFileSync(
      resolve(
        ROOT,
        ".agents/skills/facebook-ads-analysis/agents/openai.yaml"
      ),
      "utf8"
    );
    const validator = readFileSync(
      resolve(
        ROOT,
        ".agents/skills/facebook-ads-analysis/scripts/validate-context.mjs"
      ),
      "utf8"
    );
    const skillTests = readFileSync(
      resolve(ROOT, "tests/facebook-ads-analysis-skill.test.mjs"),
      "utf8"
    );
    const skillDoc = readFileSync(
      resolve(ROOT, "docs/technical/offline-codex-analysis-skill.md"),
      "utf8"
    );
    const packageJson = readFileSync(resolve(ROOT, "package.json"), "utf8");
    const docsWorkflow = readFileSync(
      resolve(ROOT, ".github/workflows/docs.yml"),
      "utf8"
    );

    for (const marker of [
      "facebook-ads-offline-analysis-context/v2",
      "FACT / INFERENCE / UNKNOWN",
      "allow_implicit_invocation",
      "external_write",
      "不生成执行建议"
    ]) {
      if (!skill.includes(marker)) {
        errors.push(`offline Codex analysis Skill must retain ${marker}`);
      }
    }
    if (
      !metadata.includes("allow_implicit_invocation: false") ||
      metadata.includes("dependencies:")
    ) {
      errors.push(
        "offline Codex analysis Skill must be explicit-only and have no external tool dependencies"
      );
    }
    for (const marker of [
      "INPUT_SCHEMA_VERSION",
      "assertNoSensitiveKeys",
      "validateGuardrails",
      "validateDriverInputs",
      "buildOfflineAnalysisPreflight",
      "recommendations_generated: false",
      "external_write: false"
    ]) {
      if (!validator.includes(marker)) {
        errors.push(`offline Codex analysis validator must retain ${marker}`);
      }
    }
    if (
      /https?:\/\/|\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB/.test(
        validator
      )
    ) {
      errors.push(
        "offline Codex analysis validator must remain local, non-networked, and non-persistent"
      );
    }
    for (const marker of [
      "validates a schema v2 comparison",
      "validates a complete direct-child daily trend",
      "rejects any attempt to enable a real data connection",
      "rejects a derived metric",
      "rejects a direct-child daily rollup mismatch",
      "rejects request tracking or sensitive keys",
      "rejects superseded schema versions",
      "supports stdin without writing files",
      "keeps discovery metadata explicit-only"
    ]) {
      if (!skillTests.includes(marker)) {
        errors.push(`offline Codex analysis Skill tests must retain ${marker}`);
      }
    }
    for (const marker of [
      "第十五个可逆离线候选切片",
      "不增加或修改 Web、Worker、HTTP、D1、Meta 或 MCP 接口",
      "不接受 `FR-005`",
      "11 项固定 fixture"
    ]) {
      if (!skillDoc.includes(marker)) {
        errors.push(`offline Codex analysis Skill documentation must retain ${marker}`);
      }
    }
    if (
      !packageJson.includes('"skill:check"') ||
      !packageJson.includes("tests/facebook-ads-analysis-skill.test.mjs") ||
      !docsWorkflow.includes("npm run skill:check") ||
      !docsWorkflow.includes(".agents/skills/facebook-ads-analysis/**")
    ) {
      errors.push(
        "offline Codex analysis Skill must remain in the local and GitHub validation path"
      );
    }
  }
}
if (offlineCodexAnalysisEvalsAuthorized === "true") {
  if (offlineCodexAnalysisSkillAuthorized !== "true") {
    errors.push("offline Codex analysis evals require the offline analysis Skill");
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Codex analysis evals cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_CODEX_ANALYSIS_EVAL_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(`offline Codex analysis evals are missing required file: ${path}`);
    }
  }

  if (
    OFFLINE_CODEX_ANALYSIS_EVAL_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const skill = readFileSync(
      resolve(ROOT, ".agents/skills/facebook-ads-analysis/SKILL.md"),
      "utf8"
    );
    const contract = readFileSync(
      resolve(
        ROOT,
        ".agents/skills/facebook-ads-analysis/references/analysis-draft-contract.md"
      ),
      "utf8"
    );
    const evaluator = readFileSync(
      resolve(
        ROOT,
        ".agents/skills/facebook-ads-analysis/scripts/evaluate-draft.mjs"
      ),
      "utf8"
    );
    const fixtureContexts = readFileSync(
      resolve(ROOT, "evals/facebook-ads-analysis/fixture-contexts.mjs"),
      "utf8"
    );
    const goldenCases = readFileSync(
      resolve(ROOT, "evals/facebook-ads-analysis/golden-cases.mjs"),
      "utf8"
    );
    const evalTests = readFileSync(
      resolve(ROOT, "tests/facebook-ads-analysis-evals.test.mjs"),
      "utf8"
    );
    const evalDoc = readFileSync(
      resolve(ROOT, "docs/technical/offline-codex-analysis-evals.md"),
      "utf8"
    );
    const packageJson = readFileSync(resolve(ROOT, "package.json"), "utf8");
    const docsWorkflow = readFileSync(
      resolve(ROOT, ".github/workflows/docs.yml"),
      "utf8"
    );

    for (const marker of [
      "analysis-draft-contract.md",
      "evaluate-draft.mjs",
      "evidence_value",
      "TASK_*",
      "8 项确定性评测"
    ]) {
      if (!skill.includes(marker)) {
        errors.push(`offline Codex analysis Skill must expose eval contract marker ${marker}`);
      }
    }
    for (const marker of [
      "evidence_values",
      "TASK_*",
      "NON_CAUSAL_ANALYSIS",
      "NO_OPTIMIZATION_ACTIONS",
      "npm run skill:eval"
    ]) {
      if (!contract.includes(marker)) {
        errors.push(`offline Codex analysis draft contract must retain ${marker}`);
      }
    }
    for (const marker of [
      "DRAFT_EVALUATION_SCHEMA_VERSION",
      "REQUIRED_LIMITATIONS",
      "resolveOfflineAnalysisEvidencePath",
      "validateMissingData",
      "validateDriver",
      "EVALUATION_CHECKS",
      "INVALID_OFFLINE_ANALYSIS_DRAFT",
      "external_write: false"
    ]) {
      if (!evaluator.includes(marker)) {
        errors.push(`offline Codex analysis draft evaluator must retain ${marker}`);
      }
    }
    if (
      /https?:\/\/|\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB/.test(
        evaluator
      )
    ) {
      errors.push(
        "offline Codex analysis draft evaluator must remain local, non-networked, and non-persistent"
      );
    }
    for (const kind of [
      "ACCOUNT_COMPARISON",
      "OBJECT_COMPARISON",
      "DIRECT_CHILD_BREAKDOWN",
      "OBJECT_DAILY_TREND",
      "DIRECT_CHILD_DAILY_TREND"
    ]) {
      if (!fixtureContexts.includes(kind)) {
        errors.push(`offline Codex analysis eval fixtures must cover ${kind}`);
      }
    }
    for (let number = 1; number <= 5; number += 1) {
      const caseId = `EVAL-FBA-${String(number).padStart(3, "0")}`;
      if (!goldenCases.includes(caseId)) {
        errors.push(`offline Codex analysis evals must retain golden case ${caseId}`);
      }
    }
    if (
      /https?:\/\/|\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB/.test(
        `${fixtureContexts}\n${goldenCases}`
      )
    ) {
      errors.push("offline Codex analysis golden cases must remain local fixture data");
    }
    for (const marker of [
      "passes fixed golden drafts for all five analysis kinds",
      "rejects source schema, analysis kind, or scope drift",
      "rejects a fabricated evidence path",
      "rejects an evidence value",
      "rejects deleted or rewritten source UNKNOWN items",
      "rejects an incomplete direct-child decomposition",
      "rejects ranking or forbidden recommendation fields",
      "rejects causal, ranking, or executable optimization language",
      "evaluates a stdin envelope",
      "returns a safe rejected CLI envelope"
    ]) {
      if (!evalTests.includes(marker)) {
        errors.push(`offline Codex analysis eval tests must retain ${marker}`);
      }
    }
    for (const marker of [
      "第十六个可逆离线候选切片",
      "不调用模型 API",
      "不增加或修改 Web、Worker、HTTP、D1、Meta、MCP 或模型接口",
      "12 项草稿评测"
    ]) {
      if (!evalDoc.includes(marker)) {
        errors.push(`offline Codex analysis eval documentation must retain ${marker}`);
      }
    }
    if (
      !packageJson.includes('"skill:eval"') ||
      !packageJson.includes("tests/facebook-ads-analysis-evals.test.mjs") ||
      !docsWorkflow.includes("evals/facebook-ads-analysis/**") ||
      !docsWorkflow.includes("tests/facebook-ads-analysis-evals.test.mjs") ||
      !docsWorkflow.includes("npm run skill:check")
    ) {
      errors.push(
        "offline Codex analysis evals must remain in the local and GitHub validation path"
      );
    }
  }
}
if (offlineCodexSessionForwardTestKitAuthorized === "true") {
  if (offlineCodexAnalysisEvalsAuthorized !== "true") {
    errors.push(
      "offline Codex session forward-test kit requires deterministic analysis evals"
    );
  }
  if (
    metaReadValidationAuthorized !== "false" ||
    runtimeAvailable !== "false" ||
    productionAuthorized !== "false" ||
    metaWriteAuthorized !== "false"
  ) {
    errors.push(
      "offline Codex session forward-test kit cannot enable Meta reads, runtime availability, deployment, or writes"
    );
  }
  for (const path of OFFLINE_CODEX_SESSION_FORWARD_TEST_FILES) {
    if (!existsSync(resolve(ROOT, path))) {
      errors.push(
        `offline Codex session forward-test kit is missing required file: ${path}`
      );
    }
  }

  if (
    OFFLINE_CODEX_SESSION_FORWARD_TEST_FILES.every((path) =>
      existsSync(resolve(ROOT, path))
    )
  ) {
    const sessionCases = readFileSync(
      resolve(ROOT, "evals/facebook-ads-analysis/session-cases.mjs"),
      "utf8"
    );
    const preparer = readFileSync(
      resolve(ROOT, "scripts/prepare-facebook-ads-analysis-forward-test.mjs"),
      "utf8"
    );
    const scorer = readFileSync(
      resolve(ROOT, "scripts/score-facebook-ads-analysis-forward-test.mjs"),
      "utf8"
    );
    const forwardTests = readFileSync(
      resolve(ROOT, "tests/facebook-ads-analysis-forward-test.test.mjs"),
      "utf8"
    );
    const forwardDoc = readFileSync(
      resolve(ROOT, "docs/technical/offline-codex-session-forward-test.md"),
      "utf8"
    );
    const packageJson = readFileSync(resolve(ROOT, "package.json"), "utf8");
    const docsWorkflow = readFileSync(
      resolve(ROOT, ".github/workflows/docs.yml"),
      "utf8"
    );

    for (let number = 1; number <= 5; number += 1) {
      const caseId = `FWD-FBA-${String(number).padStart(3, "0")}`;
      if (!sessionCases.includes(caseId)) {
        errors.push(
          `offline Codex session forward-test kit must retain case ${caseId}`
        );
      }
    }
    for (const marker of [
      "FRESH_CODEX_SESSION",
      "expected_output_withheld",
      "external_connections_allowed: false",
      "repository_result_persistence_allowed: false",
      "forbidden_evaluation_assets"
    ]) {
      if (!sessionCases.includes(marker)) {
        errors.push(
          `offline Codex session cases must retain protocol marker ${marker}`
        );
      }
    }
    for (const forbidden of [
      "createGoldenCases",
      "EVAL-FBA-",
      "evidence_values",
      "draft:"
    ]) {
      if (sessionCases.includes(forbidden)) {
        errors.push(
          `offline Codex session cases must withhold expected output marker ${forbidden}`
        );
      }
    }
    for (const marker of [
      "execution_status: \"NOT_RUN\"",
      "createForwardTestCase",
      "external_write: false"
    ]) {
      if (!preparer.includes(marker)) {
        errors.push(`offline Codex forward-test preparer must retain ${marker}`);
      }
    }
    for (const marker of [
      "REQUIRED_FORWARD_TEST_ATTESTATION",
      "expected_output_seen: false",
      "golden_assets_read: false",
      "OPERATOR_ATTESTATION",
      "attestation_independently_verified: false",
      "evaluateOfflineAnalysisDraft",
      "external_write: false"
    ]) {
      if (!scorer.includes(marker)) {
        errors.push(`offline Codex forward-test scorer must retain ${marker}`);
      }
    }
    if (
      /https?:\/\/|\bfetch\s*\(|XMLHttpRequest|WebSocket|\bOpenAI\b|responses\.create|writeFile|appendFile|localStorage|sessionStorage|indexedDB/.test(
        `${sessionCases}\n${preparer}\n${scorer}`
      )
    ) {
      errors.push(
        "offline Codex session forward-test kit must remain model-free, local, and non-persistent"
      );
    }
    for (const marker of [
      "lists one isolated prompt for all five analysis kinds",
      "withholds golden drafts and expected answers from every prepared case",
      "prepares a NOT_RUN case without starting a model or writing a result",
      "scores operator-attested drafts for all five fixed contexts",
      "rejects a draft scored against the wrong session case",
      "rejects an incomplete or unsafe protocol attestation",
      "scores a stdin result without persisting the session input or output",
      "returns a safe rejected CLI result when session evidence is invalid",
      "keeps preparation and scoring scripts free of model, network, and write clients"
    ]) {
      if (!forwardTests.includes(marker)) {
        errors.push(`offline Codex forward-test tests must retain ${marker}`);
      }
    }
    for (const marker of [
      "第十七个可逆离线候选切片",
      "当前执行状态为 `NOT_RUN`",
      "不自动启动另一个 Codex 会话",
      "不调用模型 API",
      "attestation_independently_verified: false",
      "不增加或修改 Web、Worker、HTTP、D1、Meta、MCP 或模型接口"
    ]) {
      if (!forwardDoc.includes(marker)) {
        errors.push(
          `offline Codex session forward-test documentation must retain ${marker}`
        );
      }
    }
    if (
      !packageJson.includes('"skill:forward-test:prepare"') ||
      !packageJson.includes('"skill:forward-test:score"') ||
      !packageJson.includes('"skill:forward-test:check"') ||
      !packageJson.includes("tests/facebook-ads-analysis-forward-test.test.mjs") ||
      !docsWorkflow.includes(
        "scripts/prepare-facebook-ads-analysis-forward-test.mjs"
      ) ||
      !docsWorkflow.includes(
        "scripts/score-facebook-ads-analysis-forward-test.mjs"
      ) ||
      !docsWorkflow.includes("tests/facebook-ads-analysis-forward-test.test.mjs") ||
      !docsWorkflow.includes("npm run skill:check")
    ) {
      errors.push(
        "offline Codex session forward-test kit must remain in the local and GitHub validation path"
      );
    }
  }
}
if (
  !discoveryComplete &&
  (definitionStatus === "ACCEPTED" ||
    metadataByFile.get(productDefinitionFile)?.status === "ACCEPTED")
) {
  errors.push("product definition cannot be ACCEPTED before DG0 passes");
}

for (let number = 1; number <= 6; number += 1) {
  const id = `ADR-${String(number).padStart(3, "0")}`;
  const matchingFile = docsFiles.find(
    (file) => metadataByFile.get(file)?.doc_id === id
  );
  if (!matchingFile) {
    errors.push(`missing decision file ${id}`);
    continue;
  }
  const metadata = metadataByFile.get(matchingFile);
  const indexedStatus = indexedDecisionStatuses.get(id);
  if (!indexedStatus) {
    errors.push(`ADR index is missing ${id}`);
  } else if (indexedStatus !== metadata.status) {
    errors.push(
      `${id} index status ${indexedStatus} does not match document ${metadata.status}`
    );
  }
  if (!discoveryComplete && metadata.status !== "DRAFT") {
    errors.push(`${id} must remain DRAFT until DG0 passes`);
  }
  if (
    metadata.status === "DRAFT" &&
    !contentByFile.get(matchingFile).includes("候选方案")
  ) {
    errors.push(`${id} must identify itself as a candidate solution`);
  }
  if (metadata.status === "ACCEPTED") {
    const decisionText = contentByFile.get(matchingFile);
    for (const heading of ["## 备选方案评审", "## 风险与可逆性"]) {
      if (!decisionText.includes(heading)) {
        errors.push(`accepted ${id} must include ${heading}`);
      }
    }
  }
}
if (indexedDecisionStatuses.size !== 6) {
  errors.push(
    `ADR index must declare exactly 6 unique decisions; found ${indexedDecisionStatuses.size}`
  );
}

if (!discoveryComplete) {
  for (const [id, requirement] of declaredRequirements) {
    if (requirement.status === "ACCEPTED") {
      errors.push(`${id} must not be ACCEPTED before DG0 passes`);
    }
  }
}

for (const path of [
  ...CANDIDATE_TECH_DOCS,
  ...CANDIDATE_IMPLEMENTATION_STANDARDS
]) {
  const file = resolve(ROOT, path);
  const metadata = metadataByFile.get(file);
  const text = contentByFile.get(file) ?? "";
  if (metadata?.status !== "DRAFT") {
    errors.push(`${path} must remain DRAFT until product and architecture selection`);
  }
  if (!text.includes("候选")) {
    errors.push(`${path} must identify itself as candidate content`);
  }
}

const forbiddenLegacyReferences = [
  ["FACEBOOK_ADS_CODEX", "EXECUTION_SPEC"].join("_"),
  ["docs", "architecture", "overview.md"].join("/"),
  ["docs", "roadmap.md"].join("/")
];
for (const [file, text] of contentByFile) {
  for (const forbidden of forbiddenLegacyReferences) {
    if (text.includes(forbidden)) {
      errors.push(`${repoPath(file)}: legacy documentation reference ${forbidden}`);
    }
  }
}

const secretPatterns = [
  { name: "private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "GitHub token", pattern: /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/ },
  { name: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: "OpenAI secret", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "Meta access token", pattern: /\bEA[A-Za-z0-9]{30,}\b/ },
  {
    name: "Bearer credential",
    pattern: /Authorization:\s*Bearer\s+(?!TOKEN\b|REDACTED\b|<)[A-Za-z0-9._-]{12,}/i
  }
];
const textExtensions = new Set([
  ".md",
  ".mjs",
  ".js",
  ".ts",
  ".tsx",
  ".json",
  ".jsonc",
  ".yml",
  ".yaml",
  ".env"
]);
const trackedAndUnignoredFiles = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { cwd: ROOT, encoding: "utf8" }
)
  .split("\0")
  .filter(Boolean)
  .map((file) => resolve(ROOT, file))
  .filter((file) => {
    const extension = file.slice(file.lastIndexOf("."));
    return textExtensions.has(extension) || file.endsWith("/.gitignore");
  });
for (const file of trackedAndUnignoredFiles) {
  const text = readFileSync(file, "utf8");
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(text)) {
      errors.push(`${repoPath(file)}: possible ${name}`);
    }
  }
}

const discoveryPiiPatterns = [
  {
    name: "email address",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  },
  { name: "mainland China phone number", pattern: /\b1[3-9]\d{9}\b/ }
];
for (const file of discoveryFiles) {
  const text = contentByFile.get(file);
  for (const { name, pattern } of discoveryPiiPatterns) {
    if (pattern.test(text)) {
      errors.push(`${repoPath(file)}: possible participant ${name}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Documentation validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const requirementStatusCounts = [...declaredRequirements.values()].reduce(
  (counts, requirement) => {
    counts[requirement.status] = (counts[requirement.status] ?? 0) + 1;
    return counts;
  },
  { ACCEPTED: 0, DRAFT: 0, SUPERSEDED: 0 }
);
const decisionStatusCounts = [...indexedDecisionStatuses.values()].reduce(
  (counts, status) => {
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  },
  { ACCEPTED: 0, DRAFT: 0, SUPERSEDED: 0 }
);

console.log(
  `Documentation validation passed: ${docsFiles.length} docs, ` +
    `${declaredRequirements.size} requirements ` +
    `(${requirementStatusCounts.ACCEPTED} accepted, ` +
    `${requirementStatusCounts.DRAFT} draft, ` +
    `${requirementStatusCounts.SUPERSEDED} superseded), ` +
    `${indexedDecisionStatuses.size} ADRs ` +
    `(${decisionStatusCounts.ACCEPTED} accepted, ` +
    `${decisionStatusCounts.DRAFT} draft, ` +
    `${decisionStatusCounts.SUPERSEDED} superseded), ` +
    `${tracedRequirements.size} traceability rows, ` +
    `${discoveryQuestions.size} discovery questions, ` +
    `${evidenceRecords.size} evidence records, 12 Phase 0 blocking questions.`
);
