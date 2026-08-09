---
doc_id: TECH-OFFLINE-CODEX-WORKFLOW-SKILLS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 工作流 Skills

本文记录 `facebook-ads-campaign-builder`、`facebook-ads-daily-brief`、
`facebook-ads-optimization` 和 `facebook-ads-change-management` 四个开发期 Skill 的
实现边界。当前授权只以[项目状态与授权](../project/status-and-authorizations.md)为准。

四个 Skill 均已形成代码和契约，并通过仓库内固定 fixture 的结构、正反输入、CLI
安全失败与输出契约确定性验证，状态统一为 `LOCAL_FIXTURE_VALIDATED`。独立 Codex
会话仍为 `NOT_RUN`。这些结果不构成已接受产品能力、模型质量、真实数据接口、Meta
对象、审批流程、G2/G3/G4 证据或外部写入授权。

## 共同实现约束

- 只接受用户手动提供、schema 精确匹配的固定虚构 JSON；
- 只能显式调用，`allow_implicit_invocation: false`；
- 输入文件必须位于仓库内、是普通文件、不是符号链接且不超过 2 MiB；
- 拒绝凭据、Authorization、真实账户/客户字段、URL、请求追踪值和动态工具调用；
- 每个 Skill 先运行无第三方依赖的确定性 preflight，再由 Codex 按稳定输出契约起草；
- 所有结果要求人工评审、手动交接、`persisted: false` 和 `external_write: false`；
- 不声明 MCP、模型 API、Web runtime、Meta、数据库或供应商依赖。

preflight 只验证固定 schema 与安全边界。它不是 Meta 字段兼容性、政策、素材权利、
业务阈值、模型回答质量或实际执行能力的证明。

## Campaign Builder

目录：`.agents/skills/facebook-ads-campaign-builder/`

输入：`facebook-ads-campaign-context/v1`。

开发产物：

- Campaign、Ad Set、Ad 三层 `DRAFT` 输出契约；
- 目标、转化位置、优化/计费事件、预算、日期、受众、版位、素材和落地页语义字段；
- 必需支持字段、fixture ref、敏感字段和关闭 guardrail 的确定性校验；
- 关键枚举未确认、素材来源/权利/审查或落地页审查不满足时 `BLOCKED`。

`READY` 只说明 fixture 输入足以形成草稿；它不表示账户字段可用、对象已创建、政策
通过或广告可以发布。

## Daily Brief

目录：`.agents/skills/facebook-ads-daily-brief/`

输入：`facebook-ads-daily-brief-context/v1`。

开发产物：

- 数据新鲜度、质量检查、只读 delivery/review 数字、重要事件和待查看事项契约；
- 只汇总上游明确标记的 material event，不从数值自行推导业务阈值；
- 数据稳定且无事项时固定 `无须处理`；
- 数据过期、失败或质量检查失败时进入 `DATA_ISSUE`，禁止表现判断。

该 Skill 不创建定时任务、通知、诊断、优化建议或 change request。

## Optimization

目录：`.agents/skills/facebook-ads-optimization/`

输入：`facebook-ads-optimization-context/v1`。

开发产物：

- fixture evidence、单变量测试计划、规则评估、有效性、2–5 个变体和人工复查窗口契约；
- tracking、测试期间配置、allocation、sample 和 comparison window 的先行校验；
- 任一有效性条件不足时强制 `INCONCLUSIVE`；
- 有效性不足时只允许继续观察、收集数据、起草下一测试和请求人工评审；有效性完整时
  还可形成受限 `PROPOSE_*` 非执行候选，供 Change Management 继续起草。

每项建议固定为 `DRAFT` / `PENDING_CONFIRMATION` / `automatic_action: false`。Skill 不
排名赢家、不猜测阈值、不删除不利证据、不声明未经支持的因果，也不暂停对象或修改
预算、状态、出价、排期。

## Change Management

目录：`.agents/skills/facebook-ads-change-management/`

输入：`facebook-ads-change-context/v1`。

开发产物：

- 只接受来自 `facebook-ads-optimization` 的结构化 `PENDING_CONFIRMATION` fixture 动作；
- 只允许 `delivery_status`、`daily_budget_minor`、`schedule_end_date`、`creative_ref` 的
  单个语义 `REPLACE` patch，或无 patch 的 `REQUEST_HUMAN_REVIEW`；
- 验证 action type、目标类型、当前状态、before/after、证据和 patch 字段一致性；
- 只生成 `state: DRAFT`、`executable: false` 的本地草稿。

政策状态固定 `NOT_EVALUATED`、写授权固定 false、Web 审批固定 `NOT_REQUESTED`；输出
执行状态固定 `NOT_AUTHORIZED`，且 `change_request_id: null`。本 Skill 不提交、审批、
拒绝、撤回、查询或执行 change request，也不把自然语言确认当作写授权。

## 目录结构

每个目录当前包含：

```text
SKILL.md
agents/openai.yaml
references/*-context-contract.md
references/*-output-or-draft-contract.md
scripts/validate-context.mjs
```

`SKILL.md` 定义触发、步骤、输出、非推断规则和停止条件；`openai.yaml` 只提供发现与安全
调用元数据，不是模型或外部环境配置；references 定义精确开发契约；validator 只进行
本地确定性输入检查。

中央确定性验证材料位于：

```text
evals/facebook-ads-workflow-skills/
  fixture-contexts.mjs
  golden-drafts.mjs
  evaluate-drafts.mjs
tests/
  facebook-ads-workflow-skills.test.mjs
  facebook-ads-workflow-skill-evals.test.mjs
```

## 本地验证结果

2026-08-09 的固定 fixture 验证结果：

1. 官方 Skill `quick_validate.py` 对分析、素材和四个工作流 Skill 共六个目录全部通过；
2. 五个本轮 Skill 均覆盖就绪与安全非就绪状态，以及非法输入的 `REJECTED`；
3. 五个 CLI 均覆盖敏感字段、未知字段、打开外部 guardrail、路径越界、符号链接、
   超过 2 MiB 输入和无效 JSON；
4. 十一组黄金草稿覆盖五个 Skill 的就绪与安全非就绪输出，统一评分均为 8/8；
5. `npm run skill:check` 共 105 项 Skill 测试通过；
6. `npm run docs:check`、14 项 Phase 0 测试、67 项 Worker 测试、81 项 Web 原型测试和
   production build 均通过；GitHub Actions 已复用 `npm run skill:check`。

复现命令：

```text
npm run skill:workflow:check
npm run skill:check
npm run docs:check
npm run p0:test
npm run worker:check
npm run prototype:check
```

验证器只证明固定 schema、确定性输出契约和安全失败行为。五个全新独立 Codex 会话的
手动前向验证仍为 `NOT_RUN`，且当前授权禁止自动启动模型会话。因此不得把
`LOCAL_FIXTURE_VALIDATED` 简写为 `VALIDATED`，也不得据此推进正式 Phase 2、Phase 4
或任何 Gate。
