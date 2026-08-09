---
name: facebook-ads-daily-brief
description: Validate manually supplied facebook-ads-daily-brief-context/v1 fixture-only JSON and summarize material delivery facts, data quality, review status, and open items into a reviewable daily brief. Use only when the user explicitly invokes $facebook-ads-daily-brief or requests an offline fixture brief. Do not use for live data, scheduled delivery, performance diagnosis, optimization, change requests, or external writes.
---

# Facebook Ads Daily Brief

把完整的 schema v1 离线 fixture 日报上下文转换成短、可追溯、可人工评审的每日简报。
只汇总输入明确声明的重要事项；不自行应用业务阈值或生成优化动作。
`agents/openai.yaml` 固定 `allow_implicit_invocation: false`，必须显式调用。

## 适用边界

只接受用户手动提供的 `facebook-ads-daily-brief-context/v1` JSON，且必须满足：

- `artifact_type: CODEX_DAILY_BRIEF_INPUT`、`source_kind: FIXTURE`；
- `scenario_id: SC-02`，范围、事件和事项引用都是固定 fixture ref；
- Meta 连接、定时发送、优化建议、变更请求、外部写入和持久化全部关闭；
- handoff 目标为 `facebook-ads-daily-brief` 与 `DAILY_BRIEF`；
- 不包含 Token、真实账户、客户信息、URL、生产响应或请求追踪值。

以下请求立即停止并说明本 Skill 不适用：

- 读取实时账户、调用 Meta、刷新数据或发送通知；
- 根据未声明阈值判断好坏、解释因果、排名对象或推荐预算/状态动作；
- 生成、批准或执行 change request；
- 把普通波动包装成重要变化，或在数据失败时继续评价广告表现。

## 执行流程

### 1. 校验完整上下文

要求完整 JSON 或仓库内的本机 fixture 文件路径。文件不能是符号链接：

```text
node .agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs <context.json>
```

也可使用标准输入：

```text
node .agents/skills/facebook-ads-daily-brief/scripts/validate-context.mjs -
```

脚本退出码 `1` 或 `preflight.status: REJECTED` 时停止。退出码 `2` 且状态为
`DATA_ISSUE` 时只形成数据问题简报。无法执行脚本时，完整应用
[每日简报输入契约](references/daily-brief-context-contract.md)；无法逐项确认就停止。

### 2. 先处理数据状态

必须先读取 `freshness` 和 `data_quality`：

- `freshness.state !== STABLE` 或 `data_quality.status === FAIL` 时，preflight 为
  `DATA_ISSUE`；
- `DATA_ISSUE` 时只说明数据新鲜度、失败检查和等待项，不评价 delivery 指标；
- 不得把缺数、延迟或质量失败解释成广告表现变化；
- `updated_at` 只是 fixture 事实，不代表已连接实时数据源。

### 3. 汇总已声明的重要事项

只使用 `material_events` 和 `open_items`，每项必须保留原始 fixture ref、事实陈述、严重
程度或状态以及 evidence paths。`delivery_summary` 和 `review_summary` 仅提供上下文数字，
不能自行产生重要性判断。

- 不新增输入中不存在的事件；
- 不用环比、绝对值或个人经验推导阈值；
- 不把 `FOLLOW_UP` 改写为自动动作；
- 输入 `unknowns` 原样保留，新增缺口仅使用 `TASK_*` code。

### 4. 形成简报

读取[每日简报输出契约](references/daily-brief-output-contract.md)：

- 数据正常且无 material event、无 open item 时，`headline` 为 `无须处理`，
  `no_action_required: true`；
- 有事项时按 `BLOCKER`、`WARNING`、`INFO` 顺序展示，但不得引入对象排名；
- `today_items` 只是待人工查看的事项，不是可执行投放动作；
- 不输出 recommended action、test plan、change request 或执行参数。

### 5. 输出稳定 JSON

输出一个 JSON 代码块，顶层字段按契约固定。始终保持：

- `brief_mode: OFFLINE_FIXTURE_BRIEF`；
- `human_review.required: true`；
- `handoff.delivery_mode: MANUAL`；
- `handoff.external_write: false`、`handoff.persisted: false`；
- `external_write: false`。

## 完成检查

1. 来源、结构、敏感字段和 evidence path 检查通过。
2. 数据失败时未输出广告表现判断。
3. 每个变化和事项都能追溯到输入，不含推断阈值、因果或排名。
4. 无事项时明确“无须处理”，有事项时也不生成执行动作。
5. 没有定时任务、通知、持久化、Meta 连接或外部写入。

本 Skill 已通过仓库内固定 fixture 的输入、CLI 安全失败和输出契约确定性测试。独立
Codex 会话仍为 `NOT_RUN`，因此不得把本地测试解释为模型质量、实时数据、表现诊断、
定时发送或外部通知能力。
