# 投放草稿输出契约

最终输出是可人工评审的 fixture-only 三层草稿，不是 Meta API payload、已创建广告对象、
政策批准或投放建议。本契约已纳入确定性黄金草稿评分；独立 Codex 会话验证仍未执行。

## 顶层顺序

```text
campaign_mode
source_schema_version
scenario_id
scope
preflight
campaign_draft
ad_set_draft
ad_draft
preflight_input
unknown_fields
human_review
handoff
limitations
external_write
```

固定值：

```yaml
campaign_mode: OFFLINE_FIXTURE_DRAFT
source_schema_version: facebook-ads-campaign-context/v1
scenario_id: SC-01
external_write: false
```

## Preflight

`preflight` 必须原样使用确定性校验器结果，至少包含：

- `status: READY | BLOCKED`；
- `facts`、`blockers`、`warnings`；
- `objects_created: false`、`recommendations_generated: false`；
- `external_write: false`。

`BLOCKED` 时三个 draft 都必须为 `null`。不得让语言模型覆盖 preflight 状态。

## 三层草稿

`READY` 时三个对象分别使用以下稳定结构：

```yaml
campaign_draft:
  claim_type: DRAFT
  state: DRAFT
  fields: {}
  source_fact_paths:
    - $.campaign
ad_set_draft:
  claim_type: DRAFT
  state: DRAFT
  fields: {}
  source_fact_paths:
    - $.ad_set
ad_draft:
  claim_type: DRAFT
  state: DRAFT
  fields: {}
  source_fact_paths:
    - $.ad
    - $.asset
    - $.landing_page
```

`fields` 只复制对应输入的语义字段。Ad 可以把 `landing_page.destination_ref` 作为
`destination_ref`，除此以外不得追加字段。尤其不得把 `asset.asset_ref` 复制为
`ad_draft.fields.asset_ref`；`$.asset` 只保留为素材审查来源路径。不得转换为 URL、
Meta ID、endpoint 或实际请求参数。

## Preflight input 与未知字段

```yaml
preflight_input:
  supported_fields: []
  known_constraints: []
  asset_review_state: REVIEWED
  domain_review_state: REVIEWED
unknown_fields: []
```

`unknown_fields` 必须原样保留输入 `unknowns`，并可追加 `TASK_*` 缺口；不得猜测补齐。

## 人工评审与 handoff

```yaml
human_review:
  required: true
  checklist:
    - CAMPAIGN_OBJECTIVE_AND_CATEGORY
    - CONVERSION_AND_OPTIMIZATION_EVENT
    - BUDGET_CURRENCY_TIMEZONE_AND_SCHEDULE
    - AUDIENCE_AND_PLACEMENTS
    - ASSET_RIGHTS_AND_COPY
    - LANDING_PAGE_AND_META_POLICY
handoff:
  mode: MANUAL_CONTEXT
  target_web_area: CAMPAIGN_DRAFTS
  target_state: DRAFT
  external_write: false
  persisted: false
limitations:
  - FIXTURE_DATA_ONLY
  - NO_META_CONNECTION
  - NO_ACCOUNT_CAPABILITY_VALIDATION
  - NO_POLICY_APPROVAL
  - NO_PERFORMANCE_GUARANTEE
  - NO_PUBLISH_OR_EXTERNAL_WRITE
external_write: false
```

不得增加真实 object ID、请求载荷、发布动作、预算或状态变更、审批结果、自动保存或
真实 Meta/Web 交接字段。
