# 每日简报输入契约

`facebook-ads-daily-brief` 只接受完整、手动提供且不含真实数据的
`facebook-ads-daily-brief-context/v1` JSON。本契约已纳入固定 fixture 自动测试；独立
Codex 会话和实时数据验证均未执行。

## 顶层字段

字段必须且只能按下列集合出现：

```text
schema_version
artifact_type
source_kind
scenario_id
scope
report_date
freshness
data_quality
delivery_summary
review_summary
material_events
open_items
known_constraints
unknowns
guardrails
codex_handoff
```

固定值：

```yaml
schema_version: facebook-ads-daily-brief-context/v1
artifact_type: CODEX_DAILY_BRIEF_INPUT
source_kind: FIXTURE
scenario_id: SC-02
```

## 范围、日期与数据状态

```yaml
scope:
  workspace_ref: ws_fixture_01
  account_ref: fixture-ad-account-01
report_date: 2026-08-09
freshness:
  updated_at: 2026-08-09T08:00:00Z
  state: STABLE
data_quality:
  status: PASS
  checks_failed: []
```

- 日期必须是真实存在的 `YYYY-MM-DD`，时间必须是带 `Z` 的 ISO UTC 字符串；
- `freshness.state`：`STABLE`、`STALE`、`FAILED`；
- `data_quality.status`：`PASS`、`FAIL`；
- `PASS` 时 `checks_failed` 必须为空，`FAIL` 时至少包含一个大写下划线检查 code；
- 非 `STABLE` 或 `FAIL` 时，简报必须进入 `DATA_ISSUE`，不得评价投放表现。

## 只读汇总

```yaml
delivery_summary:
  spend_minor: 10000
  impressions: 2000
  clicks: 120
  conversions: 8
  currency: CNY
review_summary:
  approved: 2
  rejected: 1
  pending: 1
```

全部值为非负整数；`currency` 只接受 `CNY` 或 `USD`。这些数字只作为 fixture 事实，
不能单独产生重要性、好坏、因果、排名或优化建议。

## 重要事件与待查看事项

每个 material event 必须为：

```yaml
event_ref: fixture-event-01
event_type: REVIEW
severity: WARNING
statement: 一个虚构广告审核被拒绝，需人工查看原因。
evidence_paths:
  - $.review_summary.rejected
```

- `event_type`：`DATA_QUALITY`、`DELIVERY`、`REVIEW`、`CONFIGURATION`；
- `severity`：`INFO`、`WARNING`、`BLOCKER`；
- `statement` 只能陈述 fixture 已提供事实；
- evidence path 必须以 `$.freshness`、`$.data_quality`、`$.delivery_summary`、
  `$.review_summary`、`$.material_events` 或 `$.open_items` 开头。

每个 open item 必须为：

```yaml
item_ref: fixture-open-item-01
kind: REVIEW
state: OPEN
statement: 人工查看固定 fixture 审核原因。
evidence_paths:
  - $.material_events[0]
```

- `kind`：`DATA_QUALITY`、`REVIEW`、`DELIVERY`、`FOLLOW_UP`；
- `state`：`OPEN`、`BLOCKED`、`WAITING_REVIEW`；
- open item 是人工查看事项，不是 Meta 写操作或 change request。

## 未知项与护栏

未知项使用 `{ claim_type: UNKNOWN, code, statement }`，code 唯一且为大写下划线格式。
护栏必须精确为：

```yaml
guardrails:
  fixture_data_only: true
  meta_connection_allowed: false
  scheduled_delivery_allowed: false
  optimization_recommendations_allowed: false
  change_request_allowed: false
  external_write: false
  persisted: false
codex_handoff:
  intended_skill: facebook-ads-daily-brief
  mode: MANUAL_CONTEXT
  context_only: true
  target_web_area: DAILY_BRIEF
```

任何凭据、真实账户/客户字段、URL、请求追踪值、定时任务、通知、外部工具调用、变更
请求或写入意图都必须拒绝。
