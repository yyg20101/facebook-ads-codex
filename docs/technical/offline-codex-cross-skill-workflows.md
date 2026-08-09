---
doc_id: TECH-OFFLINE-CODEX-CROSS-SKILL-WORKFLOWS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 跨 Skill 手动工作流

本文记录第 21 个可逆离线开发切片：用固定虚构输入验证多个 Codex Skill 之间的人工
交接连续性。当前授权只以[项目状态与授权](../project/status-and-authorizations.md)为准。

本切片不调用模型、不执行 Skill 会话、不连接 Web、MCP、Meta 或 Cloudflare，也不保存
交接结果。它只验证上游草稿与下游上下文之间的固定字段是否原样传递，以及哪些下游
字段仍必须由人工提供和复核。

## 支持的固定链路

| Workflow | 阶段 | 结果边界 |
| --- | --- | --- |
| `CREATIVE_TO_CAMPAIGN_DRAFT` | Creative → Campaign Builder | 复制已选文案、素材、受众和版位；Campaign、预算、排期、CTA、素材审查和落地页仍由人工确认 |
| `OPTIMIZATION_TO_CHANGE_DRAFT` | Optimization → Change Management | 复制一个 `PENDING_CONFIRMATION` 动作、证据引用和目标；patch、当前状态、政策与审批上下文仍由人工确认 |

Daily Brief 是只读事实终点，不会自动触发 Analysis、Optimization 或 Change
Management。Analysis 也不会在没有独立证据契约和人工选择时自动进入 Optimization。
因此本切片没有把六个 Skill 人为串成一条自动化流水线。

## Bundle 契约

输入 schema 为 `facebook-ads-cross-skill-workflow-bundle/v1`，顶层固定包含：

```text
schema_version
artifact_type
source_kind
workflow_id
workflow_type
scenario_id
scope
stages
handoffs
guardrails
```

每个 `stage` 包含 `stage_id`、`skill`、`context` 和 `draft`。校验器先复用对应 Skill 的
既有 8 项草稿契约，再验证：

1. 阶段顺序、Skill 和 preflight 状态与固定链路一致；
2. Workspace、账户以及适用时的对象范围连续；
3. 每个声明的 `from_path` 与 `to_path` 值完全一致；
4. 无法从上游安全派生的字段仍在固定 `manual_inputs` 清单中；
5. `human_review_required: true`，且自动交接、持久化、模型调用和外部写入全部关闭。

路径解析器只支持受限字段和数组下标语法，不执行动态表达式。工作流类型、映射路径、
人工输入和阶段数量均为固定 allowlist；调用方不能添加任意 Skill、任意字段或动态工具。

## 素材到广告草稿

`SC-01` 固定复制以下内容：

- Workspace 与 fixture 广告账户范围；
- 被选择的 Creative `variant_ref`、正文、标题和描述；
- 原素材引用、来源类型和商业使用权状态；
- 受众与版位。

Campaign 目标、转化位置、优化与计费事件、预算、排期、CTA、素材人工审查、落地页和
支持字段不会从 Creative 草稿猜测。即使 Campaign 草稿自身 schema 合法，只要复制值与
上游不一致，整个 bundle 仍会拒绝。

## 优化到变更草稿

`SC-03` 只允许把一个结构化 `PENDING_CONFIRMATION` Optimization 动作带入 Change
Management。动作引用、类型、陈述、状态、证据引用和目标范围必须保持一致。

Change Management 仍只产生 `executable: false` 的本地 `DRAFT`。语义 patch、目标当前
状态、政策结果和 Web 审批上下文必须单独人工提供；执行状态固定为 `NOT_AUTHORIZED`，
不会创建 `change_request_id`、提交审批或调用 Meta。

## 开发产物

```text
evals/facebook-ads-cross-skill-workflows/
  workflow-contracts.mjs
  fixture-workflows.mjs
  evaluate-workflows.mjs
tests/
  facebook-ads-cross-skill-workflows.test.mjs
```

评分 CLI 只接受标准输入，避免读取或保存运行结果文件：

```text
node evals/facebook-ads-cross-skill-workflows/evaluate-workflows.mjs -
```

统一专项命令：

```text
npm run skill:cross-workflow:check
```

## 本地验证结果

2026-08-09 的固定 fixture 验证结果：

- 两条链路的四个阶段均通过既有 Skill 草稿契约；
- 两个 bundle 均通过 10/10 跨阶段检查；
- 11 项专项测试覆盖字段传递、阶段/范围漂移、映射和人工输入漂移、自动交接、持久化、
  外部写入、敏感内容以及标准输入 CLI；
- 状态仅为 `LOCAL_FIXTURE_VALIDATED`。

这些结果不是实际跨会话运行、Web 手动导入、MCP 集成、真实对象、政策审核、审批、
执行或产品价值证据，也不推进 G2、G3 或 G4。
