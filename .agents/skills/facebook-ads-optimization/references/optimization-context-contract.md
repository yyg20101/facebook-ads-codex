# 优化输入契约

`facebook-ads-optimization` 只接受完整、手动提供且不含真实数据的
`facebook-ads-optimization-context/v1` JSON。本契约已纳入固定 fixture 自动测试；独立
Codex 会话和真实账户验证均未执行。

## 顶层字段

字段必须且只能按下列集合出现：

```text
schema_version
artifact_type
source_kind
scenario_id
scope
evidence
test_plan
validity
variants
allowed_action_types
review_window
known_constraints
unknowns
guardrails
codex_handoff
```

固定值：

```yaml
schema_version: facebook-ads-optimization-context/v1
artifact_type: CODEX_OPTIMIZATION_INPUT
source_kind: FIXTURE
scenario_id: SC-03
```

`scenario_id` 也可为 `SC-02`。

## 范围与证据

```yaml
scope:
  workspace_ref: ws_fixture_01
  account_ref: fixture-ad-account-01
  object_ref: fixture-campaign-01
  object_type: CAMPAIGN
evidence:
  - evidence_ref: fixture-evidence-01
    claim_type: FACT
    statement: 固定 fixture 中两个变体完成同周期观察。
    source_paths:
      - $.variants
      - $.review_window
```

`object_type` 只接受 `ACCOUNT`、`CAMPAIGN`、`AD_SET`、`AD`。证据必须有唯一 fixture
ref，`claim_type` 固定为 `FACT`，source path 只能引用 `$.test_plan`、`$.validity`、
`$.variants` 或 `$.review_window`。

## 测试计划与规则评估

```yaml
test_plan:
  test_ref: fixture-test-01
  hypothesis: 在固定其他条件时测试一个素材变量。
  primary_variable: CREATIVE
  primary_metric: CONVERSIONS
  guardrail_metrics:
    - SPEND
  allocation_rule: 两个变体使用固定且相同的 fixture 分配规则。
  rule_evaluation:
    state: SUPPORTS_ITERATE
    statement: 现有规则评估支持继续迭代，但不支持执行投放变更。
    evidence_refs:
      - fixture-evidence-01
```

- `primary_variable`：`CREATIVE`、`AUDIENCE`、`PLACEMENT`、`OFFER`；
- 指标：`SPEND`、`IMPRESSIONS`、`CLICKS`、`CONVERSIONS`、`CONVERSION_VALUE`、
  `CTR`、`COST_PER_CONVERSION`、`ROAS`；
- primary metric 不得与 guardrail metric 重复；
- `rule_evaluation.state`：`SUPPORTS_KEEP`、`SUPPORTS_STOP`、
  `SUPPORTS_ITERATE`、`INCONCLUSIVE`；
- 这是已有规则的 fixture 评估，不是 Skill 自行创造阈值或显著性结论。

## 有效性与变体

```yaml
validity:
  tracking_state: STABLE
  mid_test_configuration_change: false
  allocation_state: AS_PLANNED
  sample_state: SUFFICIENT
  comparison_window_complete: true
variants:
  - variant_ref: fixture-variant-01
    label: Control
    metrics:
      spend_minor: 10000
      impressions: 2000
      clicks: 120
      conversions: 8
      conversion_value_minor: 16000
      currency: CNY
```

- `tracking_state`：`STABLE`、`DEGRADED`、`FAILED`；
- `allocation_state`：`AS_PLANNED`、`DEVIATED`、`UNKNOWN`；
- `sample_state`：`SUFFICIENT`、`INSUFFICIENT`、`UNKNOWN`；
- 需要 2–5 个唯一变体；全部 currency 必须一致；所有指标为非负整数；
- 有效性任一条件不满足都必须输出 `INCONCLUSIVE`，不得选赢家。

## 允许动作与评审窗口

```yaml
allowed_action_types:
  - CONTINUE_OBSERVATION
  - COLLECT_DATA
  - DRAFT_NEXT_TEST
  - REQUEST_HUMAN_REVIEW
  - PROPOSE_CREATIVE_CHANGE
review_window:
  start_date: 2026-08-01
  end_date: 2026-08-07
  next_review_date: 2026-08-10
```

完整允许集合为：

- `CONTINUE_OBSERVATION`、`COLLECT_DATA`、`DRAFT_NEXT_TEST`、
  `REQUEST_HUMAN_REVIEW`；
- `PROPOSE_PAUSE`、`PROPOSE_ENABLE`、`PROPOSE_BUDGET_CHANGE`、
  `PROPOSE_SCHEDULE_CHANGE`、`PROPOSE_CREATIVE_CHANGE`。

`PROPOSE_*` 只表示待人工确认、可继续交给 Change Management 起草的语义候选，不是
暂停、启用、预算、排期、素材或发布执行。preflight 为 `INCONCLUSIVE` 时禁止使用所有
`PROPOSE_*`。
日期必须有效，end 不早于 start，next review 晚于 end；它不是自动计划任务。

## 未知项与护栏

未知项使用 `{ claim_type: UNKNOWN, code, statement }`，code 唯一且为大写下划线格式。
护栏必须精确为：

```yaml
guardrails:
  fixture_data_only: true
  meta_connection_allowed: false
  causal_claims_allowed: false
  automatic_actions_allowed: false
  change_request_allowed: false
  external_write: false
  persisted: false
codex_handoff:
  intended_skill: facebook-ads-optimization
  mode: MANUAL_CONTEXT
  context_only: true
  target_web_area: OPTIMIZATION_REVIEW
```

任何凭据、真实账户/客户字段、URL、请求追踪值、模型/工具调用、change request、自动
动作或写入意图都必须拒绝。
