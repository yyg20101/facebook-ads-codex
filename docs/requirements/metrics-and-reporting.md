---
doc_id: REQ-METRICS
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 指标与报告需求

本页保存旧分析方案的候选指标和输出规则。是否需要报告、哪些指标支持核心任务以及用户
如何理解结果，依赖 `DQ-02`、`DQ-05`、`DQ-06` 和产品形态测试。

## 候选指标

| Metric | 定义 |
| --- | --- |
| `spend` | Meta 返回的广告花费，保留广告账户原币种 |
| `impressions` | 广告展示次数 |
| `reach` | 去重触达人数 |
| `link_clicks` | 链接点击，不与全部点击混用 |
| `ctr_link` | `link_clicks / impressions` |
| `cpc_link` | `spend / link_clicks` |
| `cpm` | `spend / impressions * 1000` |
| `conversions` | 工作空间配置的主转化事件数量 |
| `conversion_value` | 主转化事件的归因价值 |
| `cpa` | `spend / conversions` |
| `roas` | `conversion_value / spend` |
| `frequency` | `impressions / reach` |
| `spend_pacing` | 当前累计花费与计划进度的比率 |

零分母 MUST 返回 `null`，不得返回 `0`、`Infinity` 或编造值。

## 口径规则

- 不同币种不得直接求和或比较。
- 不同时区不得在未转换前按自然日比较。
- 不同归因窗口不得直接比较 ROAS、CPA 或 conversions。
- `clicks` 和 `link_clicks` 不得混用。
- 主转化事件必须由 Workspace 显式配置。
- Meta 平台归因不能表述为确定的真实增量因果效果。

## 候选指标配置

```yaml
campaign_objective: UNRESOLVED
primary_kpi: UNRESOLVED
primary_conversion_event: UNRESOLVED
currency_policy: no_cross_currency_aggregation
timezone_policy: ad_account_local_time
attribution_policy: UNRESOLVED
```

这些字段只有在 Product Discovery 选择分析/报告能力后才进入 Phase 0，并分别依赖
`BQ-03`、`BQ-04` 和 `BQ-07`。当前不得把 ROAS、CPA 或日报预设为用户核心需求。

## 候选分析流程

如果选择证据型分析能力，候选流程为：

1. 验证 Workspace、广告账户、日期、时区、币种、归因、新鲜度和同步错误。
2. 根据投放目标与 Workspace 配置选择主 KPI。
3. 按 Outcome、delivery、CPM、CTR、CPC、CVR 和转化价值分解变化。
4. 从账户逐级定位到 Campaign、Ad Set、Ad，必要时才增加 breakdown。
5. 将结论标记为 `CONFIRMED`、`LIKELY` 或 `HYPOTHESIS`。
6. 输出目标、事实、建议、影响方向、风险、反证条件、写操作需求和证据。

## 候选报告上下文

如果产品包含报告，以下内容用于 `DQ-06` 和原型测试，不表示全部已被用户验证：

- Workspace 与 Meta Ad Account。
- 当前日期范围与基线范围。
- 币种、时区、归因设置和主转化事件。
- `data_through`、`sync_run_id` 和稳定状态。
- 结论置信度、warnings 及结果是否截断。
