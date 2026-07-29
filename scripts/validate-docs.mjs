import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const DOCS_DIR = resolve(ROOT, "docs");
const errors = [];

const REQUIRED_DOCS = [
  "docs/README.md",
  "docs/glossary.md",
  "docs/project/charter.md",
  "docs/project/status-and-authorizations.md",
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
  "docs/runbooks/RUNBOOK-TEMPLATE.md",
  "docs/templates/FEATURE-SPEC.md",
  "docs/templates/TECHNICAL-DESIGN.md",
  "docs/templates/TEST-PLAN.md",
  "docs/templates/INCIDENT-POSTMORTEM.md"
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

function requirementSections(text) {
  const headingPattern = /^## ((?:FR|NFR|SEC)-\d{3})：[^\n]+$/gm;
  const matches = [...text.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? text.length;
    const section = text.slice(start, end);
    const status = section.match(/^- 状态：`(ACCEPTED|DRAFT|SUPERSEDED)`$/m)?.[1];
    return { id: match[1], section, status };
  });
}

for (const required of REQUIRED_DOCS) {
  if (!existsSync(resolve(ROOT, required))) {
    errors.push(`missing required document: ${required}`);
  }
}

const markdownFiles = walk(ROOT)
  .filter((file) => file.endsWith(".md"))
  .sort();
const docsFiles = markdownFiles.filter((file) => file.startsWith(`${DOCS_DIR}/`));
const contentByFile = new Map(
  markdownFiles.map((file) => [file, readFileSync(file, "utf8")])
);

const docIds = new Map();
for (const file of docsFiles) {
  const fileName = repoPath(file);
  const text = contentByFile.get(file);
  const metadata = parseFrontMatter(text, fileName);
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
    if (
      requirement.status === "DRAFT" &&
      !/- 依赖：`BQ-\d{2}`/m.test(requirement.section)
    ) {
      errors.push(
        `${repoPath(requirementFile)}: draft ${requirement.id} must reference a BQ dependency`
      );
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
  const cells = line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (cells.length !== 7) {
    errors.push(
      `docs/requirements/traceability.md: malformed row for ${cells[0] ?? "unknown"}`
    );
    continue;
  }
  const [id, source, design, adr, verification, gate, status] = cells;
  if (tracedRequirements.has(id)) {
    errors.push(`duplicate traceability row: ${id}`);
  }
  for (const [label, value] of [
    ["source", source],
    ["technical design", design],
    ["ADR", adr],
    ["verification", verification],
    ["Gate", gate],
    ["status", status]
  ]) {
    if (!value || value === "—" || value === "TBD") {
      errors.push(`traceability ${id}: missing ${label}`);
    }
  }
  tracedRequirements.set(id, status);
}

for (const [id, requirement] of declaredRequirements) {
  if (
    requirement.status === "ACCEPTED" &&
    tracedRequirements.get(id) !== "ACCEPTED"
  ) {
    errors.push(`accepted requirement is not fully traced: ${id}`);
  }
}

const phaseZeroText =
  contentByFile.get(
    resolve(ROOT, "docs/planning/phase-0-questionnaire.md")
  ) ?? "";
const bqDeclarations = [
  ...phaseZeroText.matchAll(/^\| (BQ-\d{2}) \|/gm)
].map((match) => match[1]);
if (bqDeclarations.length !== 12 || new Set(bqDeclarations).size !== 12) {
  errors.push(
    `Phase 0 questionnaire must declare exactly 12 unique BQ entries; found ${bqDeclarations.length}`
  );
}
for (let number = 1; number <= 12; number += 1) {
  const id = `BQ-${String(number).padStart(2, "0")}`;
  if (!bqDeclarations.includes(id)) {
    errors.push(`Phase 0 questionnaire is missing ${id}`);
  }
}

for (let number = 1; number <= 6; number += 1) {
  const id = `ADR-${String(number).padStart(3, "0")}`;
  const matchingFile = docsFiles.find((file) => {
    const metadata = parseFrontMatter(
      contentByFile.get(file),
      repoPath(file)
    );
    return metadata.doc_id === id;
  });
  if (!matchingFile) {
    errors.push(`missing accepted decision file ${id}`);
    continue;
  }
  const metadata = parseFrontMatter(
    contentByFile.get(matchingFile),
    repoPath(matchingFile)
  );
  if (metadata.status !== "ACCEPTED") {
    errors.push(`${id} must have status ACCEPTED`);
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
for (const [file, text] of contentByFile) {
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(text)) {
      errors.push(`${repoPath(file)}: possible ${name}`);
    }
  }
}

const statusText =
  contentByFile.get(
    resolve(ROOT, "docs/project/status-and-authorizations.md")
  ) ?? "";
if (!statusText.includes("project_version: 1.0.0")) {
  errors.push("project status must retain version 1.0.0");
}
if (!statusText.includes("delivery_state: READY_FOR_PHASE_0")) {
  errors.push("project status must be READY_FOR_PHASE_0");
}

if (errors.length > 0) {
  console.error(`Documentation validation failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Documentation validation passed: ${docsFiles.length} docs, ` +
    `${declaredRequirements.size} requirements, ` +
    `${tracedRequirements.size} traceability rows, 12 blocking questions.`
);
