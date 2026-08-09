---
name: facebook-ads-optimization
description: Validate manually supplied facebook-ads-optimization-context/v1 fixture-only JSON and turn controlled-test evidence into non-executable diagnostic, test-plan, conclusion, and next-review drafts. Use only when the user explicitly invokes $facebook-ads-optimization or asks to review an offline fixture test. Do not use for live data, winner ranking, causal claims without valid evidence, automatic actions, change execution, or external writes.
---

# Facebook Ads Optimization

把完整的 schema v1 离线 fixture 测试上下文转换为证据约束的诊断、测试计划、结论和
下一次人工评审草稿。它不直接改变广告，也不把相关性写成因果。
`agents/openai.yaml` 固定 `allow_implicit_invocation: false`，必须显式调用。

## 适用边界

只接受用户手动提供的 `facebook-ads-optimization-context/v1` JSON，且必须满足：

- `artifact_type: CODEX_OPTIMIZATION_INPUT`、`source_kind: FIXTURE`；
- `scenario_id` 只为 `SC-02` 或 `SC-03`，范围、测试、变体和证据均为 fixture ref；
- 只允许继续观察、收集数据、起草下一测试、请求人工评审，或在证据有效时形成受限的
  `PROPOSE_*` 非执行候选；
- 因果断言、自动动作、change request、Meta 连接、外部写入和持久化全部关闭；
- handoff 目标为 `facebook-ads-optimization` 与 `OPTIMIZATION_REVIEW`。

以下请求立即停止并说明本 Skill 不适用：

- 使用真实账户/客户数据、刷新 Meta 数据或读取生产响应；
- 自动暂停/启用对象、修改预算/排期/出价、发布广告或提交 change request；
- 在跟踪不稳、样本不足、分配偏离、测试期间配置变化或窗口未完成时选赢家；
- 用个人经验补充业务阈值，删除不利证据，或把观察性差异声称为因果。

## 执行流程

### 1. 校验完整上下文

要求完整 JSON 或仓库内的本机 fixture 文件路径。文件不能是符号链接：

```text
node .agents/skills/facebook-ads-optimization/scripts/validate-context.mjs <context.json>
```

也可通过标准输入传入：

```text
node .agents/skills/facebook-ads-optimization/scripts/validate-context.mjs -
```

脚本退出码 `1` 或 `preflight.status: REJECTED` 时停止。退出码 `2` 且状态为
`INCONCLUSIVE` 时只形成不确定结论与安全下一步。无法执行脚本时，完整应用
[优化输入契约](references/optimization-context-contract.md)；无法逐项确认就停止。

### 2. 先判断有效性

必须先读取 `validity`，不得先比较变体：

- 只有 tracking `STABLE`、测试期间无配置变化、allocation `AS_PLANNED`、sample
  `SUFFICIENT` 且 comparison window 完成时，preflight 才为 `READY`；
- 任一条件不满足时为 `INCONCLUSIVE`，只允许补数、继续观察或请求人工评审；
- `INCONCLUSIVE` 时不得输出 `KEEP`、`STOP`、赢家、因果或 `PROPOSE_*` 变更候选；
- 不自行设定最小样本、显著性、CPA、ROAS 或其他阈值。

### 3. 保留测试事实

只使用 `evidence`、`test_plan`、`variants`、`validity` 和 `review_window` 的明确事实。

- 每项结论和建议必须列出 fixture evidence refs 与 source paths；
- variant 指标只是固定原始事实，不自动形成排名；
- `rule_evaluation` 是人工或上游 fixture 已给出的规则评估，不得覆盖；
- 输入 `unknowns` 原样保留，新增缺口仅使用 `TASK_*` code。

### 4. 形成结论与非执行建议

读取[优化输出契约](references/optimization-output-contract.md)：

- `INCONCLUSIVE` preflight 强制 `test_conclusion: INCONCLUSIVE`；
- `READY` 时仅可忠实映射 `rule_evaluation.state` 到 `KEEP`、`STOP`、`ITERATE` 或
  `INCONCLUSIVE`；
- `recommended_actions` 只能使用 preflight 的 `permitted_action_types`；证据有效时可包含
  `PROPOSE_PAUSE`、`PROPOSE_ENABLE`、`PROPOSE_BUDGET_CHANGE`、
  `PROPOSE_SCHEDULE_CHANGE` 或 `PROPOSE_CREATIVE_CHANGE`，但只表达语义候选；
- 每项 action 都必须为 `DRAFT`、`PENDING_CONFIRMATION`、
  `automatic_action: false`；
- `STOP` 是测试结论标签，不等于暂停广告或写入状态。

### 5. 输出稳定 JSON

输出一个 JSON 代码块，顶层字段按契约固定。始终保持：

- `optimization_mode: OFFLINE_FIXTURE_REVIEW`；
- `human_review.required: true`；
- `handoff.target_state: PENDING_CONFIRMATION`；
- `handoff.external_write: false`、`handoff.persisted: false`；
- `external_write: false`。

## 完成检查

1. 来源、结构、敏感字段和证据引用检查通过。
2. 有效性不足时结论严格为 `INCONCLUSIVE`。
3. 未排名、未虚构赢家、未生成未声明阈值或因果结论。
4. 所有建议均可追溯、待人工确认且不可执行。
5. 没有 Meta 连接、change request、持久化、预算/状态动作或外部写入。

本 Skill 已通过仓库内固定 fixture 的输入、CLI 安全失败和输出契约确定性测试。独立
Codex 会话仍为 `NOT_RUN`，因此不得把本地测试解释为模型质量、因果证明、真实优化或
可执行广告动作。
