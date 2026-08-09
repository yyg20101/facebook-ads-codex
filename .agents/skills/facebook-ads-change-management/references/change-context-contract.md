# 变更草稿输入契约

`facebook-ads-change-management` 只接受完整、手动提供且不含真实数据的
`facebook-ads-change-context/v1` JSON。本契约已纳入固定 fixture 自动测试；独立 Codex
会话和真实审批验证均未执行。

## 顶层字段

字段必须且只能按下列集合出现：

```text
schema_version
artifact_type
source_kind
scenario_id
scope
source_action
target
proposed_patch
evidence
policy_context
approval_context
known_constraints
unknowns
guardrails
codex_handoff
```

固定值：

```yaml
schema_version: facebook-ads-change-context/v1
artifact_type: CODEX_CHANGE_DRAFT_INPUT
source_kind: FIXTURE
scenario_id: SC-03
```

`scenario_id` 也可为 `SC-02`。

## 范围与来源动作

```yaml
scope:
  workspace_ref: ws_fixture_01
  account_ref: fixture-ad-account-01
source_action:
  draft_ref: fixture-change-draft-01
  action_ref: fixture-optimization-action-01
  source_skill: facebook-ads-optimization
  action_type: PROPOSE_CREATIVE_CHANGE
  statement: 待人工评审的虚构素材替换建议。
  state: PENDING_CONFIRMATION
```

- 所有 ref 必须为 fixture ref，`source_skill` 固定为 `facebook-ads-optimization`；
- `state` 固定为 `PENDING_CONFIRMATION`；
- `action_type`：`REQUEST_HUMAN_REVIEW`、`PROPOSE_PAUSE`、`PROPOSE_ENABLE`、
  `PROPOSE_BUDGET_CHANGE`、`PROPOSE_SCHEDULE_CHANGE`、`PROPOSE_CREATIVE_CHANGE`；
- statement 不能充当写授权，也不能包含真实对象、审批或执行信息。

## 目标与语义 patch

```yaml
target:
  object_ref: fixture-ad-01
  object_type: AD
  current_state: ACTIVE
proposed_patch:
  - field: creative_ref
    operation: REPLACE
    before: fixture-creative-01
    after: fixture-creative-02
```

- `object_type`：`CAMPAIGN`、`AD_SET`、`AD`；
- `current_state`：`ACTIVE`、`PAUSED`、`DRAFT`、`UNKNOWN`；`UNKNOWN` 会阻断草稿；
- patch field 只接受 `delivery_status`、`daily_budget_minor`、`schedule_end_date`、
  `creative_ref`，operation 固定 `REPLACE`；
- before 与 after 必须不同；状态只接受 `ACTIVE`/`PAUSED`，预算为正整数 minor unit，
  日期为 `YYYY-MM-DD`，creative ref 必须为 fixture ref；
- action/field 必须对应；`REQUEST_HUMAN_REVIEW` 不得带 patch，其他动作必须恰有一个
  patch；
- patch 是产品语义草稿，不是 Meta 字段或 API payload。

## 证据

```yaml
evidence:
  - evidence_ref: fixture-evidence-01
    claim_type: FACT
    statement: 结构化优化输入给出了待评审的素材变化。
    source_paths:
      - $.source_action
      - $.proposed_patch
```

需要 1–20 项唯一 fixture evidence ref；source path 只可引用 `$.source_action`、
`$.target`、`$.proposed_patch`、`$.policy_context` 或 `$.approval_context`。

## 政策、审批与护栏

开发期固定值：

```yaml
policy_context:
  policy_state: NOT_EVALUATED
  emergency_stop: false
  write_authorized: false
approval_context:
  web_approval_state: NOT_REQUESTED
  approver_ref: null
  expires_at: null
guardrails:
  fixture_data_only: true
  meta_connection_allowed: false
  submission_allowed: false
  approval_execution_allowed: false
  natural_language_execution_allowed: false
  external_write: false
  persisted: false
codex_handoff:
  intended_skill: facebook-ads-change-management
  mode: MANUAL_CONTEXT
  context_only: true
  target_web_area: CHANGE_DRAFTS
```

未知项使用 `{ claim_type: UNKNOWN, code, statement }`，code 唯一且为大写下划线格式。
任何凭据、真实账户/对象、change request ID、URL、请求追踪值、审批者、提交参数、外部
工具调用或写入意图都必须拒绝。
