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
  "docs/technical/security-architecture.md"
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
  if (!discoveryComplete && metadata.status !== "DRAFT") {
    errors.push(`${id} must remain DRAFT until DG0 passes`);
  }
  if (
    metadata.status === "DRAFT" &&
    !contentByFile.get(matchingFile).includes("候选方案")
  ) {
    errors.push(`${id} must identify itself as a candidate solution`);
  }
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

console.log(
  `Documentation validation passed: ${docsFiles.length} docs, ` +
    `${declaredRequirements.size} draft requirements, ` +
    `${tracedRequirements.size} traceability rows, ` +
    `${discoveryQuestions.size} discovery questions, ` +
    `${evidenceRecords.size} evidence records, 12 Phase 0 blocking questions.`
);
