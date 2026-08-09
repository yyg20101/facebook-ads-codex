---
doc_id: REQ-METRICS
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-08
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
| `conversions` | 当前分析广告上下文所配置转化事件的归因数量 |
| `conversion_rate` | `conversions /` 与当前点击口径一致的点击数 |
| `conversion_value` | 当前分析广告上下文所配置转化事件的归因价值 |
| `cpa` | `spend / conversions` |
| `roas` | `conversion_value / spend` |
| `frequency` | `impressions / reach` |
| `spend_pacing` | 当前累计花费与计划进度的比率 |

零分母 MUST 返回 `null`，不得返回 `0`、`Infinity` 或编造值。

## 口径规则

- 投放目标、主 KPI、转化事件、币种、时区、归因口径和历史可用范围 MUST 来自当前
  广告账户、广告对象及查询返回的实际上下文，不得设置猜测性的项目级默认值。
- 每份分析结果 MUST 携带广告账户、广告对象、日期范围、币种、时区、归因口径和
  `data_through`；缺失或冲突的上下文 MUST 标记为 `UNKNOWN` 或 `UNAVAILABLE`。
- 不同币种不得直接求和或比较。
- 不同时区不得在未转换前按自然日比较。
- 不同归因窗口不得直接比较 ROAS、CPA 或 conversions。
- `clicks` 和 `link_clicks` 不得混用。
- 转化事件必须来自当前分析广告的实际配置和事件数据，或由用户显式映射；不得使用
  猜测的项目级默认事件。
- 广告事件缺失、冲突或无法识别时，转化类指标 MUST 标记为未知或不可比较。
- 首期只使用 Meta 广告账户报告的投放与归因数据；不将外部 CRM 或独立转化数据连接
  作为首期依赖。
- Meta 平台归因不能表述为确定的真实增量因果效果。

## 候选指标配置

```yaml
campaign_objective_policy: per_ad_object_context
primary_kpi_policy: derive_from_objective_event_and_account_context
primary_conversion_event_policy: per_ad_context
reporting_data_source: meta_ad_account_reported
external_conversion_join: out_of_scope_for_initial_phase
currency_policy: per_ad_account_no_cross_currency_aggregation
timezone_policy: per_ad_account
attribution_policy: meta_returned_context
history_read_policy: requested_range_within_account_availability
analysis_storage_policy: persistent_normalized_history
normalized_history_retention: 25_months
generated_analysis_retention: 25_months
raw_response_retention: 90_days
```

`BQ-03`–`BQ-08` 已确认账户上下文驱动策略：产品不要求项目负责人预先选择一个适用于
所有广告账户的投放目标、主 KPI、转化事件或归因窗口。主 KPI 必须根据当前对象的实际
目标、事件和可用指标动态选择，并说明选择依据。首期只使用广告账户报告数据；不得把
ROAS、CPA 或日报硬编码为所有账户的核心指标。

## 历史分析数据

项目 MUST 持久化标准化历史指标及其账户、广告对象、日期、币种、时区、归因口径、
转化事件、API 版本、同步批次和数据截至时间，以支持趋势分析、区间对比、数据修订识别
和分析复现。持久化数据仍以广告账户返回事实为来源，不得将项目存储中的旧值表述为
Meta 当前状态。

标准化历史指标和生成的分析结果滚动保留 25 个月。原始响应、诊断日志、审计记录和
导出的保留与加速删除规则见[领域与数据模型](../technical/domain-and-data.md#保留与删除)。

## 候选分析流程

如果选择证据型分析能力，候选流程为：

1. 验证 Workspace、广告账户、日期、时区、币种、归因、新鲜度和同步错误。
2. 根据当前广告对象的实际投放目标、转化事件与账户上下文选择主 KPI。
3. 按 Outcome、delivery、CPM、CTR、CPC、CVR 和转化价值分解变化。
4. 从账户逐级定位到 Campaign、Ad Set、Ad，必要时才增加 breakdown。
5. 将结论标记为 `CONFIRMED`、`LIKELY` 或 `HYPOTHESIS`。
6. 输出目标、事实、建议、影响方向、风险、反证条件、写操作需求和证据。

当前仅使用 fixture 验证方向变化和非因果诊断模式，候选契约见
[离线周期对比与诊断](../technical/offline-period-comparison-and-diagnostics.md)。该实现不
接受本页候选指标或 `FR-005`。本地 Web 的账户来源和结果绑定另见
[离线账户上下文](../technical/offline-web-account-context.md)；固定对象范围的汇总一致性与
显式 comparison 见[离线对象级分析](../technical/offline-object-level-analysis.md)；直接
子对象的两期可加指标父子对账见
[离线直接子对象拆解](../technical/offline-direct-child-breakdown.md)。这些切片不证明
真实账户授权、真实对象数据正确或 `FR-005` 已接受，也不提供对象排名或因果解释。
固定对象的 3–31 日日值和单指标展示见
[离线对象日趋势](../technical/offline-object-daily-trend.md)：该候选切片固定使用花费、
展示、点击、报告转化、CTR、CVR、CPC、CPM、CPA，派生值保留六位小数且零分母为
`null`。这些指标只用于 fixture 契约验证，默认花费视图不是主 KPI，页面不解释趋势。
直接子级的同期展示见
[离线直接子对象日趋势](../technical/offline-direct-child-daily-trend.md)：Campaign→Ad Set
或 Ad Set→Ad 的每日日值按稳定 ID 并列，花费、展示、点击和报告转化逐日与父对象对账；
派生指标不做加总，也不据此排名、判断赢家或解释原因。
全账户 fixture 的分析前检查见
[离线数据质量报告](../technical/offline-data-quality-report.md)：主体日粒度、连续覆盖、
统一报告上下文、对象层级以及账户→Campaign→Ad Set→Ad 三层四项可加指标必须全部
通过。该候选检查不使用业务效果阈值，也不接受 `FR-002`、`FR-003` 或 `FR-005`。
本地 Web 的候选强制入口见
[离线分析质量 Preflight](../technical/offline-analysis-quality-preflight.md)：只有账户、
分析日期和对象被质量凭证覆盖时才请求指标，响应口径与快照还必须再次匹配。该内存凭证
不是认证或真实账户授权，也不接受 `FR-004`、`FR-005` 或任何 NFR。
当前可信 comparison 到 Codex 手动输入的候选交接见
[离线 Codex 分析证据包](../technical/offline-codex-evidence-bundle.md)：只传递 fixture
范围、新鲜度、事实、确定性模式、直接子对象输入和未知项，不生成分析结论、置信度或
建议。该切片仍不接受 `FR-005` 或 `NFR-002`。
对象与直接子对象日趋势的候选交接见
[离线 Codex 趋势证据包](../technical/offline-codex-trend-evidence.md)：schema v2 传递完整
固定 9 项日值和逐日父子对账，但不解释趋势、不使用当前图表指标推导主 KPI，也不排名
或生成建议。
当前 schema v2 到只读分析草稿的候选处理见
[离线 Codex 分析 Skill](../technical/offline-codex-analysis-skill.md)：它先复核输入结构、
公式和对账，再区分 `FACT`、有限非因果 `INFERENCE` 与 `UNKNOWN`；该切片不接受
`FR-005` 或 `NFR-002`，也不生成优化动作。
五种固定输入到最终草稿契约的候选回归见
[离线 Codex 分析草稿评测](../technical/offline-codex-analysis-evals.md)：它逐项验证 evidence
path 与原值、未知项、直接子对象覆盖和非因果安全边界，但不调用模型，不证明真实分析
正确或接受任何需求。

## 候选报告上下文

如果产品包含报告，以下内容用于 `DQ-06` 和原型测试，不表示全部已被用户验证：

- Workspace 与 Meta Ad Account。
- 当前日期范围与基线范围。
- 币种、时区、归因设置和主转化事件。
- `data_through`、`sync_run_id` 和稳定状态。
- 结论置信度、warnings 及结果是否截断。
