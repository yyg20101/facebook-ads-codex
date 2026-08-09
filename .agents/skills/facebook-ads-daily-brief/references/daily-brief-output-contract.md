# 每日简报输出契约

最终输出是 fixture-only、手动交接的每日事实简报，不是实时数据报告、诊断、优化建议、
change request 或通知。本契约已纳入确定性黄金草稿评分；独立 Codex 会话验证仍未执行。

## 顶层顺序

```text
brief_mode
source_schema_version
scenario_id
scope
preflight
headline
data_status
material_changes
review_status
today_items
no_action_required
unknowns
human_review
handoff
limitations
external_write
```

固定值：

```yaml
brief_mode: OFFLINE_FIXTURE_BRIEF
source_schema_version: facebook-ads-daily-brief-context/v1
scenario_id: SC-02
external_write: false
```

## Preflight 与标题

`preflight` 必须原样使用确定性校验器结果：

- `status: READY | DATA_ISSUE`；
- `facts`、`blockers`、`warnings`；
- `performance_summary_allowed`、`no_action_required`；
- `recommendations_generated: false`、`external_write: false`。

数据正常且无 material event、无 open item 时：

```yaml
headline: 无须处理
material_changes: []
today_items: []
no_action_required: true
```

`DATA_ISSUE` 时标题必须直接说明数据不可用于表现判断；`no_action_required` 必须为
`false`，因为仍需人工查看数据问题。

## 数据、变化与审核状态

```yaml
data_status:
  claim_type: FACT
  report_date: 2026-08-09
  freshness: {}
  data_quality: {}
material_changes: []
review_status:
  claim_type: FACT
  summary: {}
  source_fact_paths:
    - $.review_summary
today_items: []
```

`data_status` 字段必须且只能按示例顺序为 `claim_type`、`report_date`、`freshness`、
`data_quality`。正常数据下 `delivery_summary` 仍只存在于原输入及确定性
`preflight.facts`，不得复制进 `data_status`、顶层或任何新增字段。

- `material_changes` 逐项忠实复制 `material_events` 并保留 evidence paths；
- `today_items` 逐项忠实复制 `open_items`，只可增加 `human_review_required: true`；
- 正常数据下只能通过原样 preflight facts 保留 `delivery_summary` 上下文，不得计算
  未提供的衍生指标或改变固定输出 schema；
- `DATA_ISSUE` 时不得把 delivery 数字写成表现摘要或判断；
- 不得新增事件、阈值、因果、排名、推荐或执行状态。

## 未知项、人工评审与 handoff

输入 `unknowns` 必须原样、按顺序保留；新增缺口只能使用 `TASK_*` code。

```yaml
human_review:
  required: true
  checklist:
    - DATA_FRESHNESS_AND_QUALITY
    - MATERIAL_EVENT_EVIDENCE
    - REVIEW_STATUS
    - OPEN_ITEMS
handoff:
  mode: MANUAL_CONTEXT
  target_web_area: DAILY_BRIEF
  delivery_mode: MANUAL
  external_write: false
  persisted: false
limitations:
  - FIXTURE_DATA_ONLY
  - NO_REALTIME_REFRESH
  - NO_PERFORMANCE_DIAGNOSIS
  - NO_OPTIMIZATION_RECOMMENDATIONS
  - NO_CHANGE_REQUEST
  - NO_SCHEDULED_DELIVERY
  - NO_EXTERNAL_WRITE
external_write: false
```

不得增加定时表达式、收件人、通知渠道、外部链接、change request、Meta 参数或自动
Web 保存字段。
