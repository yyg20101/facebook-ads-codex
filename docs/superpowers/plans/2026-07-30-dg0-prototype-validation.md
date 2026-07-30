---
doc_id: PLAN-DG0-PROTOTYPE-VALIDATION
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# DG0 低保真原型验证 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可复现、可在 GitHub 手机端查看的三形态低保真原型，并使用同一组
`SC-01`–`SC-03` 任务数据完成可计算的 `DG0` 负责人走查。

**Architecture:** 使用无网络依赖的 Node.js ESM 数据模型定义三个场景、三个产品形态和
关键验收项；生成器从同一模型产生 27 张 SVG 故事板和移动端可读画廊。Node 内置测试
验证内容对等、关键安全文案和生成确定性，评分器将脱敏走查记录计算为覆盖率与关键误解
结果，但不自动改变 Gate 或授权。

**Tech Stack:** Node.js 20+、Node 内置 `node:test`、ESM、SVG、Markdown、JSON、
npm scripts、GitHub Actions。

---

## 范围与文件结构

本计划只实现 Product Discovery 原型和验证工具。MUST NOT 开发业务运行时、连接 Meta、
创建 Cloudflare 资源、部署站点或执行广告写操作。

### 新建文件

- `docs/discovery/prototypes/README.md`：原型入口、阅读顺序和授权限制。
- `docs/discovery/prototypes/review-guide.md`：项目负责人走查脚本和评分规则。
- `docs/discovery/prototypes/review-session.example.json`：无真实结果的格式示例。
- `docs/discovery/prototypes/src/model.mjs`：三个形态、三个场景、阶段和验收项的唯一模型。
- `docs/discovery/prototypes/src/render-svg.mjs`：把模型渲染为无外部资源的 SVG。
- `docs/discovery/prototypes/generated/gallery.md`：生成的手机端画廊。
- `docs/discovery/prototypes/generated/manifest.json`：生成文件、场景和内容键清单。
- `docs/discovery/prototypes/generated/*.svg`：3 形态 × 3 场景 × 3 阶段，共 27 张。
- `scripts/build-dg0-prototypes.mjs`：确定性生成入口。
- `scripts/score-dg0-review.mjs`：校验和计算负责人走查结果。
- `tests/dg0-prototype-model.test.mjs`：模型完整性测试。
- `tests/dg0-prototype-render.test.mjs`：SVG 内容与安全边界测试。
- `tests/dg0-prototype-build.test.mjs`：生成产物一致性测试。
- `tests/dg0-review-score.test.mjs`：走查评分测试。

### 走查后才创建

- `docs/discovery/prototypes/results/review-session.json`：只保存脱敏选择和完成项。
- `docs/discovery/prototypes/results/review-summary.md`：评分器生成的结果。

### 修改文件

- `package.json`：增加 `prototype:*` 命令，并将原型检查接入 `docs:check`。
- `.github/workflows/docs.yml`：监听原型源码、SVG、JSON、脚本和测试。
- `scripts/validate-docs.mjs`：将原型入口、指南和画廊加入必需文档。
- `docs/discovery/README.md`：加入原型阅读与执行入口。
- 走查完成后按结果修改 `evidence-log.md`、`discovery-questions.md`、
  `product-definition.md`、项目状态、路线图和变更日志。

## Task 1：建立共享场景与形态模型

**Files:**

- Create: `tests/dg0-prototype-model.test.mjs`
- Create: `docs/discovery/prototypes/src/model.mjs`

- [ ] **Step 1: 写入会失败的模型测试**

```js
// tests/dg0-prototype-model.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  CRITICAL_MISUNDERSTANDINGS,
  SCENARIOS,
  SHAPES,
  artifactId
} from "../docs/discovery/prototypes/src/model.mjs";

test("defines exactly three comparable shapes", () => {
  assert.deepEqual(
    SHAPES.map((shape) => shape.id),
    ["PROTO-A", "PROTO-B", "PROTO-C"]
  );
});

test("defines three scenarios with three stages and unique criteria", () => {
  assert.deepEqual(
    SCENARIOS.map((scenario) => scenario.id),
    ["SC-01", "SC-02", "SC-03"]
  );
  const criteria = SCENARIOS.flatMap((scenario) =>
    scenario.criteria.map((criterion) => criterion.id)
  );
  assert.equal(new Set(criteria).size, criteria.length);
  for (const scenario of SCENARIOS) {
    assert.equal(scenario.stages.length, 3);
    assert.ok(scenario.criteria.length >= 6);
  }
});

test("creates stable artifact identifiers", () => {
  assert.equal(
    artifactId(SHAPES[2], SCENARIOS[1], SCENARIOS[1].stages[2]),
    "proto-c-sc-02-result"
  );
});

test("enumerates the critical misunderstanding categories", () => {
  assert.deepEqual(CRITICAL_MISUNDERSTANDINGS, [
    "DATA_SCOPE_MISREAD",
    "PERMISSION_ESCALATION",
    "META_WRITE_ASSUMED",
    "CAUSALITY_OVERCLAIM",
    "RIGHTS_BYPASS"
  ]);
});
```

- [ ] **Step 2: 运行测试并确认缺少模型**

Run: `node --test tests/dg0-prototype-model.test.mjs`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND` 和
`docs/discovery/prototypes/src/model.mjs`。

- [ ] **Step 3: 写入完整共享模型**

```js
// docs/discovery/prototypes/src/model.mjs
export const SHAPES = Object.freeze([
  {
    id: "PROTO-A",
    slug: "proto-a",
    name: "对话主导",
    description: "会话承担主要任务，右侧只显示对象状态和安全边界。"
  },
  {
    id: "PROTO-B",
    slug: "proto-b",
    name: "纯 Web 工作台",
    description: "导航、表格和卡片承担任务，解释以内联帮助呈现。"
  },
  {
    id: "PROTO-C",
    slug: "proto-c",
    name: "Web 工作台 + 内置助手",
    description: "工作台承载对象和状态，助手承载生成、解释、诊断和建议。"
  }
]);

export const SCENARIOS = Object.freeze([
  {
    id: "SC-01",
    slug: "sc-01",
    title: "从投放目标到可审核广告草稿",
    criteria: [
      { id: "SC01-K01", label: "识别并补充关键简报信息" },
      { id: "SC01-K02", label: "找到素材来源与版权状态" },
      { id: "SC01-K03", label: "理解引导和高级配置入口" },
      { id: "SC01-K04", label: "检查结构化广告草稿" },
      { id: "SC01-K05", label: "识别并处理 BLOCKER" },
      { id: "SC01-K06", label: "确认草稿未发布并导出发布清单" }
    ],
    stages: [
      {
        id: "start",
        title: "目标简报",
        prompt: "为夏季课程生成广告草稿",
        facts: ["目标：未选择", "受众：城市家长", "落地页：未填写"],
        assistant: "检测到 2 项关键缺失，不能生成可审核草稿。",
        action: "补充投放目标与落地页",
        boundary: "广告状态：未发布"
      },
      {
        id: "work",
        title: "素材与发布前检查",
        prompt: "比较两张图片和三组文案",
        facts: ["图片 A：已上传", "图片 B：来源未确认", "文案：3 个变体"],
        assistant: "图片 B 的商业使用权不明确。",
        action: "替换图片 B 或确认授权来源",
        boundary: "BLOCKER：版权状态未确认"
      },
      {
        id: "result",
        title: "广告草稿",
        prompt: "草稿已满足内部审核条件",
        facts: ["版本：v3", "BLOCKER：0", "WARNING：2"],
        assistant: "可以导出发布清单；产品不会执行 Meta 发布。",
        action: "导出发布清单",
        boundary: "未发布 · 需要用户前往 Meta 操作"
      }
    ]
  },
  {
    id: "SC-02",
    slug: "sc-02",
    title: "从只读投放数据到诊断与行动建议",
    criteria: [
      { id: "SC02-K01", label: "确认账户、对象、时间和比较基线" },
      { id: "SC02-K02", label: "识别数据更新时间、时区和归因口径" },
      { id: "SC02-K03", label: "找到异常时间、范围和严重度" },
      { id: "SC02-K04", label: "区分支持证据、反证和缺失数据" },
      { id: "SC02-K05", label: "理解建议风险、验证周期和停止条件" },
      { id: "SC02-K06", label: "确认建议未执行并保存诊断报告" }
    ],
    stages: [
      {
        id: "start",
        title: "数据范围",
        prompt: "解释过去 7 天转化下降",
        facts: ["对象：Campaign A", "比较：前 7 天", "数据延迟：3 小时"],
        assistant: "归因窗口尚未确认，结论只能保持低置信度。",
        action: "确认归因口径与时区",
        boundary: "只读数据 · 更新时间 10:00"
      },
      {
        id: "work",
        title: "异常与证据",
        prompt: "点击率稳定，但转化率下降",
        facts: ["CTR：稳定", "CVR：下降", "落地页事件：缺失 8%"],
        assistant: "追踪缺失支持测量异常假设；尚不能证明广告素材失效。",
        action: "查看支持证据与反证",
        boundary: "低置信度 · 不得表述为因果"
      },
      {
        id: "result",
        title: "诊断报告",
        prompt: "先修复追踪，再复查转化",
        facts: ["验证周期：24 小时", "停止条件：事件继续缺失", "风险：中"],
        assistant: "建议已保存，系统没有修改 Campaign A。",
        action: "保存并安排复查",
        boundary: "建议尚未执行"
      }
    ]
  },
  {
    id: "SC-03",
    slug: "sc-03",
    title: "从素材变体到测试结论",
    criteria: [
      { id: "SC03-K01", label: "识别测试假设" },
      { id: "SC03-K02", label: "识别主要变化变量" },
      { id: "SC03-K03", label: "确认主要指标和保护指标" },
      { id: "SC03-K04", label: "找到最小数据与复查条件" },
      { id: "SC03-K05", label: "识别曝光不均或追踪异常" },
      { id: "SC03-K06", label: "理解置信度和干扰因素" },
      { id: "SC03-K07", label: "在证据不足时选择 INCONCLUSIVE" }
    ],
    stages: [
      {
        id: "start",
        title: "测试假设",
        prompt: "比较图片 A 与图片 B",
        facts: ["主要变量：图片", "文案：相同", "受众：相同"],
        assistant: "当前只有一个主要变量，具备可比基础。",
        action: "确认指标和最小数据条件",
        boundary: "一次只测试一个主要变量"
      },
      {
        id: "work",
        title: "测试状态",
        prompt: "图片 B 暂时领先",
        facts: ["图片 A：1,200 展示", "图片 B：420 展示", "消耗不均：是"],
        assistant: "曝光不均且数据未成熟，不能宣布赢家。",
        action: "等待最小数据条件或修复投放不均",
        boundary: "数据不足"
      },
      {
        id: "result",
        title: "测试结论",
        prompt: "当前比较无法形成可靠结论",
        facts: ["置信度：低", "干扰因素：曝光不均", "下一次复查：24 小时"],
        assistant: "保留两个变体并修正投放条件后重新比较。",
        action: "创建下一轮测试计划",
        boundary: "INCONCLUSIVE · 未自动修改广告"
      }
    ]
  }
]);

export const CRITICAL_MISUNDERSTANDINGS = Object.freeze([
  "DATA_SCOPE_MISREAD",
  "PERMISSION_ESCALATION",
  "META_WRITE_ASSUMED",
  "CAUSALITY_OVERCLAIM",
  "RIGHTS_BYPASS"
]);

export function artifactId(shape, scenario, stage) {
  return `${shape.slug}-${scenario.slug}-${stage.id}`;
}
```

- [ ] **Step 4: 运行模型测试**

Run: `node --test tests/dg0-prototype-model.test.mjs`

Expected: 4 tests PASS，0 tests FAIL。

- [ ] **Step 5: 提交模型**

```bash
git add tests/dg0-prototype-model.test.mjs docs/discovery/prototypes/src/model.mjs
git commit -m "test: define DG0 prototype model"
```

## Task 2：实现三种低保真 SVG 布局

**Files:**

- Create: `tests/dg0-prototype-render.test.mjs`
- Create: `docs/discovery/prototypes/src/render-svg.mjs`

- [ ] **Step 1: 写入会失败的渲染测试**

```js
// tests/dg0-prototype-render.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  SCENARIOS,
  SHAPES
} from "../docs/discovery/prototypes/src/model.mjs";
import {
  renderPrototypeSvg
} from "../docs/discovery/prototypes/src/render-svg.mjs";

test("renders all shape and scenario stages without external resources", () => {
  for (const shape of SHAPES) {
    for (const scenario of SCENARIOS) {
      for (const stage of scenario.stages) {
        const svg = renderPrototypeSvg({ shape, scenario, stage });
        assert.match(svg, /viewBox="0 0 1200 760"/);
        assert.match(svg, new RegExp(shape.id));
        assert.match(svg, new RegExp(scenario.id));
        assert.match(svg, /脱敏示例 · 无真实 Meta 连接 · 无写操作/);
        assert.doesNotMatch(svg, /https?:|<image/i);
      }
    }
  }
});

test("keeps the critical product boundaries visible", () => {
  const expected = new Map([
    ["SC-01", "未发布"],
    ["SC-02", "建议尚未执行"],
    ["SC-03", "INCONCLUSIVE"]
  ]);
  for (const scenario of SCENARIOS) {
    const resultStage = scenario.stages.at(-1);
    for (const shape of SHAPES) {
      const svg = renderPrototypeSvg({ shape, scenario, stage: resultStage });
      assert.match(svg, new RegExp(expected.get(scenario.id)));
    }
  }
});
```

- [ ] **Step 2: 运行测试并确认缺少渲染器**

Run: `node --test tests/dg0-prototype-render.test.mjs`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND` 和 `render-svg.mjs`。

- [ ] **Step 3: 写入完整 SVG 渲染器**

```js
// docs/discovery/prototypes/src/render-svg.mjs
const COLORS = {
  ink: "#172033",
  muted: "#5f6b7a",
  line: "#cfd7e3",
  panel: "#ffffff",
  canvas: "#f4f6f9",
  accent: "#315efb",
  assistant: "#eef3ff",
  warning: "#fff4dc"
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lines(value, max = 34) {
  const words = String(value).split(/\s+/u);
  const output = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (Array.from(next).length > max && current) {
      output.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) output.push(current);
  return output;
}

function textBlock(value, x, y, options = {}) {
  const {
    size = 20,
    fill = COLORS.ink,
    weight = 400,
    lineHeight = 30,
    max = 34
  } = options;
  return lines(value, max)
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" ` +
        `font-size="${size}" font-weight="${weight}" fill="${fill}">` +
        `${escapeXml(line)}</text>`
    )
    .join("");
}

function panel(x, y, width, height, title, body) {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="16" ` +
    `fill="${COLORS.panel}" stroke="${COLORS.line}"/>` +
    textBlock(title, x + 20, y + 34, { size: 18, weight: 700, max: 28 }) +
    body
  );
}

function factsList(stage, x, y, width) {
  return stage.facts
    .map((fact, index) => {
      const top = y + index * 58;
      return (
        `<rect x="${x}" y="${top}" width="${width}" height="44" rx="10" ` +
        `fill="${COLORS.canvas}"/>` +
        textBlock(fact, x + 14, top + 28, { size: 16, max: 38 })
      );
    })
    .join("");
}

function actionButton(stage, x, y, width) {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="54" rx="12" ` +
    `fill="${COLORS.accent}"/>` +
    textBlock(stage.action, x + 18, y + 34, {
      size: 17,
      fill: "#ffffff",
      weight: 700,
      max: 36
    })
  );
}

function conversationLayout(stage) {
  const conversation =
    textBlock(stage.prompt, 78, 220, { size: 21, weight: 700, max: 42 }) +
    `<rect x="70" y="255" width="700" height="110" rx="14" ` +
    `fill="${COLORS.assistant}"/>` +
    textBlock(stage.assistant, 92, 292, { size: 18, max: 54 }) +
    actionButton(stage, 70, 550, 700);
  const state =
    factsList(stage, 858, 220, 270) +
    `<rect x="850" y="455" width="286" height="100" rx="12" ` +
    `fill="${COLORS.warning}"/>` +
    textBlock(stage.boundary, 870, 492, { size: 17, weight: 700, max: 25 });
  return (
    panel(40, 160, 770, 480, "对话任务", conversation) +
    panel(830, 160, 330, 480, "对象状态", state)
  );
}

function workbenchLayout(stage) {
  const nav =
    textBlock("总览", 75, 230, { size: 18, weight: 700 }) +
    textBlock("素材", 75, 275, { size: 18 }) +
    textBlock("广告草稿", 75, 320, { size: 18 }) +
    textBlock("数据分析", 75, 365, { size: 18 }) +
    textBlock("素材测试", 75, 410, { size: 18 });
  const main =
    textBlock(stage.prompt, 300, 220, { size: 22, weight: 700, max: 45 }) +
    factsList(stage, 300, 260, 760) +
    `<rect x="300" y="455" width="760" height="80" rx="12" ` +
    `fill="${COLORS.assistant}"/>` +
    textBlock(stage.assistant, 320, 490, { size: 17, max: 62 }) +
    actionButton(stage, 300, 555, 760);
  return (
    panel(40, 160, 210, 480, "导航", nav) +
    panel(270, 160, 890, 480, stage.title, main)
  );
}

function hybridLayout(stage) {
  const nav =
    textBlock("总览", 68, 240, { size: 17, weight: 700 }) +
    textBlock("素材", 68, 285, { size: 17 }) +
    textBlock("草稿", 68, 330, { size: 17 }) +
    textBlock("分析", 68, 375, { size: 17 }) +
    textBlock("测试", 68, 420, { size: 17 });
  const main =
    textBlock(stage.prompt, 270, 220, { size: 21, weight: 700, max: 34 }) +
    factsList(stage, 270, 260, 500) +
    `<rect x="270" y="455" width="500" height="90" rx="12" ` +
    `fill="${COLORS.warning}"/>` +
    textBlock(stage.boundary, 290, 490, { size: 17, weight: 700, max: 40 }) +
    actionButton(stage, 270, 565, 500);
  const assistant =
    textBlock(stage.assistant, 835, 230, { size: 18, max: 26 }) +
    textBlock("来源与范围可见", 835, 445, {
      size: 16,
      fill: COLORS.muted,
      weight: 700
    }) +
    textBlock("结果保存为工作台对象", 835, 485, {
      size: 16,
      fill: COLORS.muted,
      weight: 700,
      max: 24
    });
  return (
    panel(40, 160, 170, 480, "导航", nav) +
    panel(230, 160, 580, 480, stage.title, main) +
    panel(830, 160, 330, 480, "上下文助手", assistant)
  );
}

export function renderPrototypeSvg({ shape, scenario, stage }) {
  const layout =
    shape.id === "PROTO-A"
      ? conversationLayout(stage)
      : shape.id === "PROTO-B"
        ? workbenchLayout(stage)
        : hybridLayout(stage);
  const stageIndex = scenario.stages.findIndex((item) => item.id === stage.id) + 1;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" ` +
    `role="img" aria-labelledby="title description">` +
    `<title id="title">${escapeXml(`${shape.id} ${scenario.id} ${stage.title}`)}</title>` +
    `<desc id="description">${escapeXml(shape.description)}</desc>` +
    `<rect width="1200" height="760" fill="${COLORS.canvas}"/>` +
    textBlock(`${shape.id} · ${shape.name}`, 40, 58, { size: 28, weight: 700 }) +
    textBlock(`${scenario.id} · ${scenario.title}`, 40, 100, {
      size: 22,
      fill: COLORS.muted,
      weight: 700
    }) +
    `<rect x="40" y="118" width="1120" height="30" rx="8" fill="#e8eefc"/>` +
    textBlock("脱敏示例 · 无真实 Meta 连接 · 无写操作", 58, 140, {
      size: 15,
      fill: COLORS.accent,
      weight: 700
    }) +
    layout +
    textBlock(`阶段 ${stageIndex}/3`, 40, 710, {
      size: 16,
      fill: COLORS.muted,
      weight: 700
    }) +
    textBlock(shape.description, 150, 710, {
      size: 16,
      fill: COLORS.muted,
      max: 80
    }) +
    `</svg>`
  );
}
```

- [ ] **Step 4: 运行渲染测试**

Run: `node --test tests/dg0-prototype-render.test.mjs`

Expected: 2 tests PASS，0 tests FAIL。

- [ ] **Step 5: 提交渲染器**

```bash
git add tests/dg0-prototype-render.test.mjs docs/discovery/prototypes/src/render-svg.mjs
git commit -m "feat: render comparable DG0 storyboards"
```

## Task 3：生成 27 张故事板、清单和手机画廊

**Files:**

- Create: `scripts/build-dg0-prototypes.mjs`
- Create: `tests/dg0-prototype-build.test.mjs`
- Generate: `docs/discovery/prototypes/generated/gallery.md`
- Generate: `docs/discovery/prototypes/generated/manifest.json`
- Generate: `docs/discovery/prototypes/generated/*.svg`

- [ ] **Step 1: 写入会失败的生成测试**

```js
// tests/dg0-prototype-build.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildArtifacts
} from "../scripts/build-dg0-prototypes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = resolve(ROOT, "docs/discovery/prototypes/generated");

test("builds 27 SVG files plus manifest and gallery", () => {
  const artifacts = buildArtifacts();
  assert.equal(
    [...artifacts.keys()].filter((name) => name.endsWith(".svg")).length,
    27
  );
  assert.ok(artifacts.has("manifest.json"));
  assert.ok(artifacts.has("gallery.md"));
});

test("tracked generated files exactly match the model", async () => {
  const artifacts = buildArtifacts();
  const actualNames = (await readdir(GENERATED)).sort();
  assert.deepEqual(actualNames, [...artifacts.keys()].sort());
  for (const [name, expected] of artifacts) {
    const actual = await readFile(resolve(GENERATED, name), "utf8");
    assert.equal(actual, expected, `${name} is stale; run npm run prototype:build`);
  }
});
```

- [ ] **Step 2: 运行测试并确认缺少生成器**

Run: `node --test tests/dg0-prototype-build.test.mjs`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND` 和
`scripts/build-dg0-prototypes.mjs`。

- [ ] **Step 3: 写入确定性生成器**

```js
// scripts/build-dg0-prototypes.mjs
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
      return `### ${shape.id}：${shape.name}\n\n${images}`;
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
```

- [ ] **Step 4: 生成原型**

Run: `node scripts/build-dg0-prototypes.mjs`

Expected: `Generated 29 DG0 prototype artifacts.`

- [ ] **Step 5: 运行生成测试**

Run: `node --test tests/dg0-prototype-build.test.mjs`

Expected: 2 tests PASS，0 tests FAIL。

- [ ] **Step 6: 提交生成产物**

```bash
git add scripts/build-dg0-prototypes.mjs tests/dg0-prototype-build.test.mjs \
  docs/discovery/prototypes/generated
git commit -m "feat: generate mobile-viewable DG0 prototypes"
```

## Task 4：实现脱敏走查评分器

**Files:**

- Create: `tests/dg0-review-score.test.mjs`
- Create: `scripts/score-dg0-review.mjs`
- Create: `docs/discovery/prototypes/review-session.example.json`

- [ ] **Step 1: 写入会失败的评分测试**

```js
// tests/dg0-review-score.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  SCENARIOS,
  SHAPES
} from "../docs/discovery/prototypes/src/model.mjs";
import {
  scoreReview
} from "../scripts/score-dg0-review.mjs";

function completeSession() {
  return {
    schema_version: 1,
    review_status: "COMPLETE",
    session_id: "DG0-EXAMPLE-PASS",
    reviewer_alias: "project_owner",
    date: "2026-07-30",
    selected_shape: "PROTO-C",
    runs: SHAPES.flatMap((shape) =>
      SCENARIOS.map((scenario) => ({
        shape_id: shape.id,
        scenario_id: scenario.id,
        completed_criteria: scenario.criteria.map((criterion) => criterion.id),
        critical_misunderstandings: [],
        notes: ["脱敏示例记录"]
      }))
    )
  };
}

test("passes a complete selected shape with no critical misunderstanding", () => {
  const score = scoreReview(completeSession());
  assert.equal(score.gate_status, "PASS");
  assert.equal(score.selected_shape_coverage, 1);
  assert.equal(score.selected_shape_critical_misunderstandings, 0);
});

test("returns PARTIAL below 80 percent", () => {
  const session = completeSession();
  const selected = session.runs.filter((run) => run.shape_id === "PROTO-C");
  selected[0].completed_criteria = [];
  selected[1].completed_criteria = [];
  const score = scoreReview(session);
  assert.equal(score.gate_status, "PARTIAL");
  assert.ok(score.selected_shape_coverage < 0.8);
});

test("returns PARTIAL for any selected-shape critical misunderstanding", () => {
  const session = completeSession();
  session.runs
    .find((run) => run.shape_id === "PROTO-C")
    .critical_misunderstandings.push("META_WRITE_ASSUMED");
  const score = scoreReview(session);
  assert.equal(score.gate_status, "PARTIAL");
  assert.equal(score.selected_shape_critical_misunderstandings, 1);
});

test("rejects incomplete shape and scenario coverage", () => {
  const session = completeSession();
  session.runs.pop();
  assert.throws(() => scoreReview(session), /exactly 9 runs/);
});
```

- [ ] **Step 2: 运行测试并确认缺少评分器**

Run: `node --test tests/dg0-review-score.test.mjs`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND` 和
`scripts/score-dg0-review.mjs`。

- [ ] **Step 3: 写入完整评分器**

```js
// scripts/score-dg0-review.mjs
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CRITICAL_MISUNDERSTANDINGS,
  SCENARIOS,
  SHAPES
} from "../docs/discovery/prototypes/src/model.mjs";

function assertSession(session) {
  if (session.schema_version !== 1) {
    throw new Error("review schema_version must be 1");
  }
  if (session.review_status !== "COMPLETE") {
    throw new Error("review_status must be COMPLETE");
  }
  if (session.reviewer_alias !== "project_owner") {
    throw new Error("reviewer_alias must be project_owner");
  }
  if (!SHAPES.some((shape) => shape.id === session.selected_shape)) {
    throw new Error("selected_shape is invalid");
  }
  if (!Array.isArray(session.runs) || session.runs.length !== 9) {
    throw new Error("review must contain exactly 9 runs");
  }
  const expectedKeys = new Set(
    SHAPES.flatMap((shape) =>
      SCENARIOS.map((scenario) => `${shape.id}|${scenario.id}`)
    )
  );
  const actualKeys = new Set(
    session.runs.map((run) => `${run.shape_id}|${run.scenario_id}`)
  );
  if (
    actualKeys.size !== expectedKeys.size ||
    [...expectedKeys].some((key) => !actualKeys.has(key))
  ) {
    throw new Error("review runs must cover each shape and scenario once");
  }
  for (const run of session.runs) {
    const scenario = SCENARIOS.find((item) => item.id === run.scenario_id);
    const allowedCriteria = new Set(
      scenario.criteria.map((criterion) => criterion.id)
    );
    for (const criterion of run.completed_criteria) {
      if (!allowedCriteria.has(criterion)) {
        throw new Error(`unknown criterion ${criterion}`);
      }
    }
    if (new Set(run.completed_criteria).size !== run.completed_criteria.length) {
      throw new Error("completed_criteria cannot contain duplicates");
    }
    for (const misunderstanding of run.critical_misunderstandings) {
      if (!CRITICAL_MISUNDERSTANDINGS.includes(misunderstanding)) {
        throw new Error(`unknown critical misunderstanding ${misunderstanding}`);
      }
    }
    if (
      new Set(run.critical_misunderstandings).size !==
      run.critical_misunderstandings.length
    ) {
      throw new Error("critical_misunderstandings cannot contain duplicates");
    }
  }
}

export function scoreReview(session) {
  assertSession(session);
  const selectedRuns = session.runs.filter(
    (run) => run.shape_id === session.selected_shape
  );
  const possible = SCENARIOS.reduce(
    (sum, scenario) => sum + scenario.criteria.length,
    0
  );
  const completed = selectedRuns.reduce(
    (sum, run) => sum + new Set(run.completed_criteria).size,
    0
  );
  const critical = selectedRuns.reduce(
    (sum, run) => sum + run.critical_misunderstandings.length,
    0
  );
  const coverage = completed / possible;
  return {
    gate_status: coverage >= 0.8 && critical === 0 ? "PASS" : "PARTIAL",
    selected_shape: session.selected_shape,
    selected_shape_completed_criteria: completed,
    selected_shape_possible_criteria: possible,
    selected_shape_coverage: coverage,
    selected_shape_critical_misunderstandings: critical,
    all_shape_critical_misunderstandings: session.runs.reduce(
      (sum, run) => sum + run.critical_misunderstandings.length,
      0
    )
  };
}

function renderSummary(session, score) {
  const rows = session.runs
    .map((run) => {
      const scenario = SCENARIOS.find((item) => item.id === run.scenario_id);
      const rate = run.completed_criteria.length / scenario.criteria.length;
      return `| ${run.shape_id} | ${run.scenario_id} | ` +
        `${run.completed_criteria.length}/${scenario.criteria.length} | ` +
        `${Math.round(rate * 100)}% | ` +
        `${run.critical_misunderstandings.join("、") || "0"} |`;
    })
    .join("\n");
  return `---
doc_id: DISC-DG0-REVIEW-RESULT
type: planning
status: DRAFT
owner: project_owner
last_reviewed: ${session.date}
---

# DG0 三形态同任务走查结果

## 结论

\`\`\`yaml
gate_status: ${score.gate_status}
selected_shape: ${score.selected_shape}
selected_shape_coverage: ${Math.round(score.selected_shape_coverage * 100)}%
selected_shape_critical_misunderstandings: ${score.selected_shape_critical_misunderstandings}
\`\`\`

该结果只验证项目负责人对脱敏低保真任务的完成与理解，不构成真实用户、市场或广告效果
验证，也不自动改变项目状态或授权。

## 逐项结果

| Shape | Scenario | 完成项 | 覆盖率 | 关键误解 |
| --- | --- | ---: | ---: | --- |
${rows}
`;
}

export async function scoreFile(inputPath, outputPath) {
  const session = JSON.parse(await readFile(resolve(inputPath), "utf8"));
  const score = scoreReview(session);
  await writeFile(resolve(outputPath), renderSummary(session, score), "utf8");
  return score;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    throw new Error(
      "usage: node scripts/score-dg0-review.mjs <session.json> <summary.md>"
    );
  }
  const score = await scoreFile(inputPath, outputPath);
  process.stdout.write(`${JSON.stringify(score)}\n`);
}
```

- [ ] **Step 4: 写入格式示例**

`docs/discovery/prototypes/review-session.example.json` 必须包含 9 个唯一
`shape_id` / `scenario_id` 组合，使用：

```json
{
  "schema_version": 1,
  "review_status": "EXAMPLE_ONLY",
  "session_id": "DG0-EXAMPLE-FORMAT",
  "reviewer_alias": "project_owner",
  "date": "2026-07-30",
  "selected_shape": "PROTO-C",
  "runs": [
    {
      "shape_id": "PROTO-A",
      "scenario_id": "SC-01",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-A",
      "scenario_id": "SC-02",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-A",
      "scenario_id": "SC-03",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-B",
      "scenario_id": "SC-01",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-B",
      "scenario_id": "SC-02",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-B",
      "scenario_id": "SC-03",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-C",
      "scenario_id": "SC-01",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-C",
      "scenario_id": "SC-02",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    },
    {
      "shape_id": "PROTO-C",
      "scenario_id": "SC-03",
      "completed_criteria": [],
      "critical_misunderstandings": [],
      "notes": []
    }
  ]
}
```

- [ ] **Step 5: 运行评分测试**

Run: `node --test tests/dg0-review-score.test.mjs`

Expected: 4 tests PASS，0 tests FAIL。

- [ ] **Step 6: 提交评分器**

```bash
git add scripts/score-dg0-review.mjs tests/dg0-review-score.test.mjs \
  docs/discovery/prototypes/review-session.example.json
git commit -m "feat: score DG0 prototype reviews"
```

## Task 5：接入文档入口、npm 与 GitHub Actions

**Files:**

- Create: `docs/discovery/prototypes/README.md`
- Create: `docs/discovery/prototypes/review-guide.md`
- Modify: `package.json`
- Modify: `.github/workflows/docs.yml`
- Modify: `scripts/validate-docs.mjs`
- Modify: `docs/discovery/README.md`

- [ ] **Step 1: 写入原型入口**

```markdown
---
doc_id: DISC-DG0-PROTOTYPES
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# DG0 低保真原型

本目录使用同一组完全脱敏数据比较 `PROTO-A`、`PROTO-B`、`PROTO-C`。原型不连接
Meta、不包含客户数据、不创建资源，也不具备任何写操作。

## 阅读顺序

1. 阅读[走查指南](review-guide.md)。
2. 在手机或桌面打开[三形态画廊](generated/gallery.md)。
3. 按形态顺序轮换完成 `SC-01`–`SC-03`。
4. 只记录完成项、关键误解和脱敏备注。
5. 使用评分器生成结果，人工复核后再更新 `DG0`。

视觉偏好不能覆盖任务失败、安全误解或数据边界误解。
```

- [ ] **Step 2: 写入走查指南**

```markdown
---
doc_id: DISC-DG0-PROTOTYPE-REVIEW
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# DG0 原型走查指南

## 执行方式

- 评审者固定使用别名 `project_owner`。
- 每个形态都使用相同的 `SC-01`–`SC-03` 脱敏输入。
- 每个场景按开始、处理中、结果三个画面查看。
- 未经提示找到并解释验收项时，才记录对应 `completed_criteria`。
- 备注只保存产品观察，不保存个人经历、账户、客户或生产数据。

## 关键误解

出现以下任一情况必须记录：

- `DATA_SCOPE_MISREAD`：无法识别账户、时间、口径或新鲜度。
- `PERMISSION_ESCALATION`：认为助手可以扩大当前角色权限。
- `META_WRITE_ASSUMED`：认为草稿或建议已经修改 Meta。
- `CAUSALITY_OVERCLAIM`：把相关性或低置信度假设当作确定因果。
- `RIGHTS_BYPASS`：认为来源或版权不明的素材可以继续使用。

## 通过规则

- 9 个 shape/scenario 组合全部完成走查。
- 负责人最终选择一个形态。
- 选定形态完成项总数除以可完成项总数不低于 80%。
- 选定形态的关键误解为 0。

评分器只生成结果，不自动改变 Gate、授权或项目阶段。
```

- [ ] **Step 3: 更新 npm scripts**

将 `package.json` 的 `scripts` 精确修改为：

```json
{
  "docs:lint": "markdownlint-cli2 \"**/*.md\" \"#node_modules\"",
  "docs:validate": "node scripts/validate-docs.mjs",
  "prototype:build": "node scripts/build-dg0-prototypes.mjs",
  "prototype:test": "node --test tests/dg0-prototype-*.test.mjs tests/dg0-review-score.test.mjs",
  "prototype:check": "npm run prototype:test",
  "docs:check": "npm run docs:lint && npm run docs:validate && npm run prototype:check"
}
```

- [ ] **Step 4: 扩展工作流路径**

在 `.github/workflows/docs.yml` 的 `push.paths` 和 `pull_request.paths` 中都加入：

```yaml
      - "docs/discovery/prototypes/**"
      - "scripts/build-dg0-prototypes.mjs"
      - "scripts/score-dg0-review.mjs"
      - "tests/dg0-*.test.mjs"
```

工作流执行命令继续使用 `npm run docs:check`。

- [ ] **Step 5: 扩展必需文档**

在 `scripts/validate-docs.mjs` 的 `REQUIRED_DOCS` 中加入：

```js
  "docs/discovery/prototypes/README.md",
  "docs/discovery/prototypes/review-guide.md",
  "docs/discovery/prototypes/generated/gallery.md",
```

- [ ] **Step 6: 更新 Discovery 阅读顺序**

在 `docs/discovery/README.md` 中把原型入口放在正式设计之后、产品定义与 `DG0` 之前：

```markdown
8. [DG0 低保真原型](prototypes/README.md)：使用同任务故事板完成三形态比较。
9. [产品定义与 DG0](product-definition.md)：综合证据并由项目负责人确认。
```

- [ ] **Step 7: 运行完整校验**

Run: `npm run prototype:build`

Expected: `Generated 29 DG0 prototype artifacts.`

Run: `npm run docs:check`

Expected: Markdown 0 issues；Documentation validation passed；12 prototype tests PASS。

Run: `git diff --check`

Expected: no output，exit code 0。

- [ ] **Step 8: 提交原型工具链**

```bash
git add package.json .github/workflows/docs.yml scripts/validate-docs.mjs \
  docs/discovery/README.md docs/discovery/prototypes
git commit -m "docs: add DG0 prototype review workflow"
```

## Task 6：执行项目负责人三形态同任务走查

**Files:**

- Create: `docs/discovery/prototypes/results/review-session.json`
- Create: `docs/discovery/prototypes/results/review-summary.md`

- [ ] **Step 1: 确认执行前状态**

Run: `git status --short --branch`

Expected: `dev` 分支且工作区无未提交变更。

Run: `npm run docs:check`

Expected: all checks PASS。

- [ ] **Step 2: 按轮换顺序展示 9 组故事板**

使用实施后生成的 `docs/discovery/prototypes/generated/gallery.md`，按以下顺序执行，
避免所有场景都固定从同一形态开始：

1. `SC-01`: `PROTO-A` → `PROTO-B` → `PROTO-C`
2. `SC-02`: `PROTO-B` → `PROTO-C` → `PROTO-A`
3. `SC-03`: `PROTO-C` → `PROTO-A` → `PROTO-B`

每组只问三件事：

1. “你下一步会点击或检查什么？”
2. “你认为当前数据、权限或发布状态是什么？”
3. “完成这个场景还缺少什么？”

不得提示正确答案后再把该项记录为完成。

- [ ] **Step 3: 写入脱敏走查记录**

复制 `review-session.example.json` 的 9 个组合到
`results/review-session.json`，并执行以下约束：

- 将 `review_status` 改为 `COMPLETE`。
- `session_id` 使用 `DG0-2026-07-30-OWNER-01`。
- `selected_shape` 使用负责人完成比较后的最终选择。
- `completed_criteria` 只写模型中实际独立完成的 ID。
- `critical_misunderstandings` 只写指南列出的枚举。
- `notes` 只写脱敏产品观察，不写姓名、账户、客户或生产数据。

- [ ] **Step 4: 计算结果**

Run:

```bash
node scripts/score-dg0-review.mjs \
  docs/discovery/prototypes/results/review-session.json \
  docs/discovery/prototypes/results/review-summary.md
```

Expected: 输出单行 JSON，`gate_status` 为 `PASS` 或 `PARTIAL`；生成的 Markdown
包含 9 行逐项结果。

- [ ] **Step 5: 安全检查结果**

Run:

```bash
rg -n "Token|Authorization|客户|账户 ID|邮箱|电话|微信" \
  docs/discovery/prototypes/results
```

Expected: no output，exit code 1。

Run: `npm run docs:check`

Expected: all checks PASS。

- [ ] **Step 6: 提交走查结果**

```bash
git add docs/discovery/prototypes/results
git commit -m "docs: record DG0 prototype review"
```

## Task 7：按评分结果更新 DG0，不扩大授权

**Files:**

- Modify: `docs/discovery/evidence-log.md`
- Modify: `docs/discovery/discovery-questions.md`
- Modify: `docs/discovery/product-definition.md`
- Modify: `docs/discovery/README.md`
- Modify: `docs/project/status-and-authorizations.md`（仅 `PASS`）
- Modify: `docs/planning/roadmap.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: 从生成结果读取事实**

Run:

```bash
sed -n '1,220p' docs/discovery/prototypes/results/review-summary.md
```

Expected: 能看到选定形态、覆盖率、关键误解数和 9 个组合；不得从记忆重写数字。

- [ ] **Step 2: 登记下一组连续证据 ID**

如果当前最后一个证据是 `EVD-022`，为三个场景分别使用 `EVD-023`、`EVD-024`、
`EVD-025`，方法为 `SCENARIO_REVIEW`。每条 finding 必须从
`review-summary.md` 的实际完成项和误解数生成，并引用对应场景；限制统一说明这是负责人
低保真走查，不是真实用户或广告效果验证。

- [ ] **Step 3: 处理 `PASS` 结果**

只有评分器输出同时满足以下值时执行本步骤：

```yaml
gate_status: PASS
selected_shape: PROTO-C
selected_shape_coverage: ">= 0.8"
selected_shape_critical_misunderstandings: 0
```

执行以下文档状态变化：

- `DQ-07` 改为 `RESOLVED`，引用 `EVD-023`–`EVD-025` 和走查结果。
- `DQ-08` 改为 `RESOLVED`，记录实际覆盖率和 0 个关键误解。
- `docs/discovery/product-definition.md` 的 front matter `status` 改为 `ACCEPTED`。
- `definition_status` 改为 `ACCEPTED`，`dg0_status` 改为 `PASS`。
- `research_status` 改为 `COMPLETE`。
- `delivery_state` 改为 `READY_FOR_PHASE_0`。
- `current_phase` 改为 `PRODUCT_DISCOVERY_COMPLETE`。
- `operation_mode`、runtime、production 和 Meta 写授权值保持不变。
- 路线图说明 Phase 0 仍须由项目负责人另行启动。

- [ ] **Step 4: 处理 `PARTIAL` 结果**

评分器输出 `PARTIAL` 时：

- `DQ-07`、`DQ-08` 保持 `UNRESOLVED`。
- `dg0_status` 保持 `PARTIAL`。
- `delivery_state` 和 `current_phase` 保持 Product Discovery。
- 在产品形态文档记录未完成项或关键误解及下一次迭代目标。
- MUST NOT 启动 Phase 0 或改变任何授权。

- [ ] **Step 5: 更新计数与变更记录**

- `scenario_reviews_completed` 增加 3。
- `EVD-*` 计数按实际新增行更新。
- `CHANGELOG.md` 在 `1.0.0` 下记录原型走查结果，不增加版本。

- [ ] **Step 6: 运行 Gate 校验**

Run: `npm run docs:check`

Expected: all checks PASS。若 `DG0` 为 `PASS`，validator 必须确认至少 3 条
`SCENARIO_REVIEW`、无未解决 `DQ-*`，且需求和 ADR 仍未被错误标记为 `ACCEPTED`。

Run: `git diff --check`

Expected: no output，exit code 0。

- [ ] **Step 7: 提交并推送 dev**

```bash
git add CHANGELOG.md docs/discovery docs/planning/roadmap.md \
  docs/project/status-and-authorizations.md
git commit -m "docs: evaluate DG0 prototype gate"
git push origin dev
```

随后运行：

```bash
gh run list --branch dev --limit 1
```

Expected: 最新 `Documentation` 工作流最终为 `success`。不得自动合入 `main`，不得自动
启动 Phase 0。
