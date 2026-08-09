# 变更草稿输出契约

最终输出是 fixture-only、不可执行且待人工评审的语义变更草稿，不是已提交 change
request、Web 审批或 Meta 写操作。本契约已纳入确定性黄金草稿评分；独立 Codex 会话
验证仍未执行。

## 顶层顺序

```text
change_mode
source_schema_version
scenario_id
scope
preflight
change_request_draft
policy_gaps
approval_requirements
execution
unknowns
human_review
handoff
limitations
external_write
```

固定值：

```yaml
change_mode: OFFLINE_FIXTURE_CHANGE_DRAFT
source_schema_version: facebook-ads-change-context/v1
external_write: false
```

## Preflight 与草稿

`preflight` 必须原样使用确定性校验器结果：

- `status: DRAFTABLE | BLOCKED`；
- `facts`、`blockers`、`warnings`；
- `submission_allowed: false`、`approval_execution_allowed: false`；
- `external_write: false`。

`BLOCKED` 时 `change_request_draft` 必须为 `null`。`DRAFTABLE` 时：

```yaml
change_request_draft:
  draft_ref: fixture-change-draft-01
  claim_type: DRAFT
  state: DRAFT
  source_action_ref: fixture-optimization-action-01
  target: {}
  proposed_patch: []
  evidence_refs:
    - fixture-evidence-01
  executable: false
  human_confirmation_required: true
```

不得使用 `change_request_id` 替代 draft ref，不得增加 Meta payload、endpoint、幂等 key、
审批 token 或提交状态。

## 政策、审批与执行

开发期必须明确输出：

```yaml
policy_gaps:
  - code: POLICY_NOT_EVALUATED
    blocking_execution: true
  - code: META_WRITE_NOT_AUTHORIZED
    blocking_execution: true
approval_requirements:
  web_approval_state: NOT_REQUESTED
  required_before_execution: true
  approver_ref: null
  expires_at: null
execution:
  status: NOT_AUTHORIZED
  change_request_id: null
  submitted: false
  approved: false
  executed: false
  external_write: false
```

这些字段只说明缺口，不构成真实审批流程或可调用接口。不得生成批准链接、真实审批者、
有效期、结果轮询或执行回执。

## 人工评审与 handoff

输入 `unknowns` 必须原样保留；新增缺口只能使用 `TASK_*` code。

```yaml
human_review:
  required: true
  checklist:
    - SOURCE_ACTION_AND_EVIDENCE
    - TARGET_AND_PATCH_SEMANTICS
    - POLICY_AND_ASSET_RIGHTS
    - WRITE_AUTHORIZATION
    - WEB_APPROVAL_AND_EXPIRY
    - EMERGENCY_STOP
handoff:
  mode: MANUAL_CONTEXT
  target_web_area: CHANGE_DRAFTS
  target_state: DRAFT
  external_write: false
  persisted: false
limitations:
  - FIXTURE_DATA_ONLY
  - NON_EXECUTABLE_DRAFT_ONLY
  - NO_META_CONNECTION
  - NO_SUBMISSION_OR_APPROVAL
  - NO_STATUS_QUERY
  - NO_PERSISTENCE
  - NO_EXTERNAL_WRITE
external_write: false
```

不得增加自动 Web 保存、通知、队列、重试、真实状态机转换或外部调用字段。
