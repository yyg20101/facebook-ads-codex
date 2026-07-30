import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  SCENARIOS,
  SHAPES,
  artifactId
} from "../docs/discovery/prototypes/src/model.mjs";
import {
  renderPrototypeSvg
} from "../docs/discovery/prototypes/src/render-svg.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = resolve(ROOT, "docs/discovery/prototypes/generated");

function gallery() {
  const sections = SCENARIOS.map((scenario) => {
    const shapes = SHAPES.map((shape) => {
      const images = scenario.stages
        .map((stage) => {
          const id = artifactId(shape, scenario, stage);
          return `![${shape.id} ${scenario.id} ${stage.title}](${id}.svg)`;
        })
        .join("\n\n");
      return `### ${scenario.id} / ${shape.id}：${shape.name}\n\n${images}`;
    }).join("\n\n");
    return `## ${scenario.id}：${scenario.title}\n\n${shapes}`;
  }).join("\n\n");
  return `---
doc_id: DISC-DG0-PROTOTYPE-GALLERY
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# DG0 三形态原型画廊

所有图使用同一脱敏场景模型，不连接真实 Meta，也不包含写操作。请按照
[走查指南](../review-guide.md)逐项查看，不能以视觉偏好替代任务完成记录。

${sections}
`;
}

export function buildArtifacts() {
  const artifacts = new Map();
  const manifestItems = [];
  for (const shape of SHAPES) {
    for (const scenario of SCENARIOS) {
      for (const stage of scenario.stages) {
        const id = artifactId(shape, scenario, stage);
        const file = `${id}.svg`;
        artifacts.set(
          file,
          `${renderPrototypeSvg({ shape, scenario, stage })}\n`
        );
        manifestItems.push({
          id,
          file,
          shape_id: shape.id,
          scenario_id: scenario.id,
          stage_id: stage.id
        });
      }
    }
  }
  artifacts.set(
    "manifest.json",
    `${JSON.stringify(
      {
        schema_version: 1,
        source_spec:
          "docs/superpowers/specs/2026-07-30-facebook-ads-assistant-design.md",
        items: manifestItems
      },
      null,
      2
    )}\n`
  );
  artifacts.set("gallery.md", gallery());
  return artifacts;
}

export async function writeArtifacts() {
  await mkdir(GENERATED, { recursive: true });
  const artifacts = buildArtifacts();
  for (const [name, content] of artifacts) {
    await writeFile(resolve(GENERATED, name), content, "utf8");
  }
  return artifacts.size;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = await writeArtifacts();
  process.stdout.write(`Generated ${count} DG0 prototype artifacts.\n`);
}
