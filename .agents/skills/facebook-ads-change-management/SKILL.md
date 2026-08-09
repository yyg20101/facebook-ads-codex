---
name: facebook-ads-change-management
description: Validate manually supplied facebook-ads-change-context/v1 fixture-only JSON and turn a structured optimization action into a non-executable, reviewable change draft with policy and approval gaps. Use only when the user explicitly invokes $facebook-ads-change-management or asks to structure an offline fixture change. Do not use natural language as write authority, submit or approve requests, query execution state, call Meta, persist drafts, or perform external writes.
---

# Facebook Ads Change Management

把完整的 schema v1 离线 fixture 优化动作转换为可人工评审、不可执行的结构化变更草稿。
它明确展示政策与审批缺口，但不提交、批准、查询或执行任何 change request。
`agents/openai.yaml` 固定 `allow_implicit_invocation: false`，必须显式调用。

## 适用边界

只接受用户手动提供的 `facebook-ads-change-context/v1` JSON，且必须满足：

- `artifact_type: CODEX_CHANGE_DRAFT_INPUT`、`source_kind: FIXTURE`；
- `scenario_id` 只为 `SC-02` 或 `SC-03`，范围、对象、动作、草稿和证据均为 fixture ref；
- source action 必须来自 `facebook-ads-optimization` 的结构化、待确认动作；
- 写授权固定为 false、政策固定未评估、Web 审批固定未请求；
- Meta 连接、提交、审批执行、自然语言执行、外部写入和持久化全部关闭；
- handoff 目标为 `facebook-ads-change-management` 与 `CHANGE_DRAFTS`。

以下请求立即停止并说明本 Skill 不适用：

- 把“确认”“执行”“暂停它”等自然语言直接转成 Meta 写操作；
- 接受真实账户、object ID、change request ID、Token、生产响应或客户数据；
- 提交/批准/拒绝/撤回 change request，查询执行状态或调用 Meta；
- 绕过政策、素材权利、Web 审批、双重确认、过期或紧急停止；
- 把本地 draft ref 声称为服务器 change request ID。

## 执行流程

### 1. 校验完整上下文

要求完整 JSON 或仓库内的本机 fixture 文件路径。文件不能是符号链接：

```text
node .agents/skills/facebook-ads-change-management/scripts/validate-context.mjs <context.json>
```

也可通过标准输入传入：

```text
node .agents/skills/facebook-ads-change-management/scripts/validate-context.mjs -
```

脚本退出码 `1` 或 `preflight.status: REJECTED` 时停止。退出码 `2` 且状态为 `BLOCKED`
时只形成阻断输出，不生成变更草稿。无法执行脚本时，完整应用
[变更草稿输入契约](references/change-context-contract.md)；无法逐项确认就停止。

### 2. 验证来源与目标

source action 必须是 `PENDING_CONFIRMATION` 的结构化优化动作，并携带稳定 draft/action
refs 和证据。目标必须为 fixture 对象，当前状态不能为 `UNKNOWN`。

- 不从自由文本中抽取或猜测 object ref、预算、日期、素材或状态；
- 不生成真实 Meta 字段、endpoint 或 payload；
- 不接受输入中存在 `change_request_id`、approval token、request ID 或执行状态；
- 输入 `unknowns` 原样保留，新增缺口仅使用 `TASK_*` code。

### 3. 校验语义 patch

只接受下列语义字段及 `REPLACE` 操作：

- `delivery_status`：只对应 `PROPOSE_PAUSE` 或 `PROPOSE_ENABLE`；
- `daily_budget_minor`：只对应 `PROPOSE_BUDGET_CHANGE`；
- `schedule_end_date`：只对应 `PROPOSE_SCHEDULE_CHANGE`；
- `creative_ref`：只对应 `PROPOSE_CREATIVE_CHANGE`；
- `REQUEST_HUMAN_REVIEW` 不得包含 patch。

before 与 after 必须不同并符合字段类型。该 patch 只是语义草稿，不能直接发送给任何 API。

### 4. 形成不可执行草稿

读取[变更草稿输出契约](references/change-draft-contract.md)：

- preflight `DRAFTABLE` 时生成 `change_request_draft.state: DRAFT`；
- preflight `BLOCKED` 时 `change_request_draft: null`；
- `policy_gaps` 必须包含政策未评估与写入未授权；
- `approval_requirements` 必须说明 Web 审批仍未请求；
- `execution.status` 固定 `NOT_AUTHORIZED`，`change_request_id: null`；
- 不产生提交参数、批准链接、审批者、有效授权或执行结果。

### 5. 输出稳定 JSON

输出一个 JSON 代码块，顶层字段按契约固定。始终保持：

- `change_mode: OFFLINE_FIXTURE_CHANGE_DRAFT`；
- `human_review.required: true`；
- `handoff.target_state: DRAFT`；
- `handoff.external_write: false`、`handoff.persisted: false`；
- `external_write: false`。

## 完成检查

1. 来源、结构、敏感字段、证据和 action/patch 对应关系检查通过。
2. 草稿只包含 fixture 语义字段，无真实 ID、endpoint 或 Meta payload。
3. 政策、审批、写授权和执行缺口全部明确且未被弱化。
4. draft ref 没有被写成 change request ID 或已提交记录。
5. 没有持久化、Web 审批、Meta 调用、状态查询或外部写入。

本 Skill 已通过仓库内固定 fixture 的输入、CLI 安全失败和输出契约确定性测试。独立
Codex 会话仍为 `NOT_RUN`，因此不得把本地测试解释为模型质量、真实审批、提交、查询
或 Meta 执行能力。
