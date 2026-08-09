# 优化输出契约

最终输出是 fixture-only、待人工确认的诊断和测试复盘草稿，不是广告对象排名、因果
证明、change request 或可执行优化。本契约已纳入确定性黄金草稿评分；独立 Codex
会话验证仍未执行。

## 顶层顺序

```text
optimization_mode
source_schema_version
scenario_id
scope
preflight
evidence_summary
recommended_actions
test_plan
test_conclusion
stop_conditions
next_review
unknowns
human_review
handoff
limitations
external_write
```

固定值：

```yaml
optimization_mode: OFFLINE_FIXTURE_REVIEW
source_schema_version: facebook-ads-optimization-context/v1
external_write: false
```

## Preflight 与证据摘要

`preflight` 必须原样使用确定性校验器结果：

- `status: READY | INCONCLUSIVE`；
- `facts`、`blockers`、`warnings`；
- `conclusion_allowed`；
- `permitted_action_types`；有效性不足时不包含任何 `PROPOSE_*`；
- `automatic_action: false`、`change_request_generated: false`、
  `external_write: false`。

`evidence_summary` 逐项保留 evidence ref、FACT statement 和 source paths。不得删去不利
证据、重排成赢家榜单或补充输入以外的事实。

## 建议与测试计划

每项建议只能使用 allowed action type：

```yaml
action_ref: fixture-optimization-action-01
claim_type: DRAFT
action_type: DRAFT_NEXT_TEST
statement: 待人工确认的下一测试草稿。
rationale: 只引用已有 fixture 证据。
evidence_refs:
  - fixture-evidence-01
state: PENDING_CONFIRMATION
automatic_action: false
```

- action ref 按输出顺序使用稳定 `fixture-optimization-action-NN`；
- `PROPOSE_*` 只能作为非执行语义类型出现；不得输出直接 PAUSE、ENABLE、BUDGET、
  BID、SCHEDULE、PUBLISH、Meta payload 或其他执行动作；
- `test_plan` 忠实保留输入，不增加第二个主变量或猜测阈值。

## 结论、停止条件与下一评审

映射固定为：

```text
SUPPORTS_KEEP    -> KEEP
SUPPORTS_STOP    -> STOP
SUPPORTS_ITERATE -> ITERATE
INCONCLUSIVE     -> INCONCLUSIVE
```

如果 preflight 是 `INCONCLUSIVE`，无论输入 rule evaluation 为何，都必须输出
`INCONCLUSIVE`。`STOP` 仅表示测试复盘标签，不表示暂停任何 Meta 对象。

`stop_conditions` 只列出有效性失效、证据不一致、出现新混杂因素或人工撤回确认等安全
条件；不得转化成自动规则。`next_review` 忠实复制 review window 的下一日期，并固定
`scheduled: false`。

```yaml
stop_conditions:
  - TRACKING_NOT_STABLE
  - MID_TEST_CONFIGURATION_CHANGE
  - ALLOCATION_NOT_AS_PLANNED
  - SAMPLE_NOT_SUFFICIENT
  - COMPARISON_WINDOW_INCOMPLETE
  - EVIDENCE_CONFLICT
  - HUMAN_CONFIRMATION_WITHDRAWN
next_review:
  date: 2026-08-10
  scheduled: false
```

## 人工评审与 handoff

输入 `unknowns` 原样保留；新增缺口只使用 `TASK_*` code。

```yaml
human_review:
  required: true
  checklist:
    - TRACKING_AND_DATA_QUALITY
    - SAMPLE_AND_ALLOCATION_VALIDITY
    - SINGLE_VARIABLE_CONTROL
    - EVIDENCE_AND_RULE_EVALUATION
    - NON_EXECUTABLE_ACTION_BOUNDARY
handoff:
  mode: MANUAL_CONTEXT
  target_web_area: OPTIMIZATION_REVIEW
  target_state: PENDING_CONFIRMATION
  external_write: false
  persisted: false
limitations:
  - FIXTURE_DATA_ONLY
  - NO_WINNER_RANKING
  - NO_UNSUPPORTED_CAUSAL_CLAIMS
  - NO_GUESSED_THRESHOLDS
  - NO_AUTOMATIC_ACTION
  - NO_CHANGE_REQUEST
  - NO_EXTERNAL_WRITE
external_write: false
```

不得增加真实账户动作、Meta payload、审批结果、定时任务、自动 Web 保存或外部执行字段。
