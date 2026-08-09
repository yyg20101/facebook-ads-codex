# 离线分析契约

本参考只适用于 `facebook-ads-offline-analysis-context/v2` 固定 fixture 输入。它不定义
真实 Meta 数据、Remote MCP、业务 KPI、优化动作或写操作。

## 输入不变量

顶层必须且只能包含：

```text
schema_version
artifact_type
source_kind
analysis_kind
scope_and_freshness
quality_evidence
fact_evidence
observed_patterns
driver_inputs
unknowns
guardrails
codex_handoff
warnings
```

固定值：

```yaml
schema_version: facebook-ads-offline-analysis-context/v2
artifact_type: CODEX_ANALYSIS_INPUT
source_kind: FIXTURE
quality_evidence:
  status: PASS
  all_checks_required: true
guardrails:
  quality_preflight_passed: true
  fixture_data_only: true
  real_data_connected: false
  thresholds_applied: false
  causal_claims: false
  ranking_applied: false
  recommendations_generated: false
  external_write: false
  persisted: false
warnings:
  - FIXTURE_DATA_ONLY
  - NO_EXTERNAL_CONNECTION
```

`codex_handoff` 必须指定 `facebook-ads-analysis`、`MANUAL_CONTEXT`、
`context_only: true`，并要求 `FACT`、`INFERENCE`、`UNKNOWN` 三种声明标签。

## 支持的分析类型

| `analysis_kind` | 事实类型 | Driver 类型 |
| --- | --- | --- |
| `ACCOUNT_COMPARISON` | `PERIOD_COMPARISON` | `NONE` |
| `OBJECT_COMPARISON` | `PERIOD_COMPARISON` | `NONE` |
| `DIRECT_CHILD_BREAKDOWN` | `PERIOD_COMPARISON` | `DIRECT_CHILDREN` |
| `OBJECT_DAILY_TREND` | `DAILY_TREND` | `NONE` |
| `DIRECT_CHILD_DAILY_TREND` | `DAILY_TREND` | `DIRECT_CHILDREN_DAILY` |

comparison 的基线与当前周期必须完整、不重叠，并位于质量凭证日期范围内。trend 必须
连续覆盖 3–31 日，包含固定 9 项指标，派生指标必须能由四项原始指标重新计算。

直接子对象只接受稳定 fixture 顺序、唯一对象引用和 `ranking_applied: false`。
comparison 两期或 daily 每一天的花费、展示、点击、转化都必须与父对象对账。

## 敏感信息与扩权检查

任何层级出现以下键都必须拒绝：

```text
authorization
authorization_header
access_token
refresh_token
client_secret
token
secret
password
request_id
requestId
cookie
```

不得因为字段名不同而接受等价敏感内容。输入声称连接真实数据、执行建议、写入或持久化
时同样拒绝。

## 声明分层

- `FACT`：输入直接提供或可用确定性算术复核；必须引用 JSON path。
- `INFERENCE`：由一个或多个事实支持的非因果解释；必须给出置信度和替代解释。
- `UNKNOWN`：输入未提供、无法验证或被当前边界刻意排除的事实。

以下内容永远不能仅凭本输入升级为事实：真实账户状态、业务阈值、主 KPI、因果驱动、
外部转化质量、对象赢家和可执行优化动作。

## 失败响应

校验失败时只返回：

```text
status: REJECTED
code: INVALID_OFFLINE_ANALYSIS_CONTEXT
path: <first failing JSON path>
reason: <concise reason>
external_write: false
```

不要输出已通过字段的部分分析，不要回退到示例数据，也不要尝试从外部系统补齐。
