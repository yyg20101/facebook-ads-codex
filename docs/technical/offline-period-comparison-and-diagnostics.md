---
doc_id: TECH-OFFLINE-PERIOD-DIAGNOSTICS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线周期对比与诊断切片

> 候选实现：本切片响应项目负责人“继续下一阶段”的指令，只验证固定虚构数据中的
> 周期变化计算、数据质量护栏和确定性诊断模式。它不接受 `FR-005`、候选 HTTP 契约
> 或 Cloudflare 架构，不构成正式 Phase 1、G0/G1/G2 证据或真实广告诊断能力。

## 范围

允许实现：

- 对一个 fixture 广告账户比较一个基线周期和一个当前周期。
- 计算花费、展示、点击、转化、CTR、CVR、CPC、CPM 和 CPA 的绝对与相对变化。
- 在基线为零或任一值缺失时保留方向，但将不可计算的相对变化返回 `null` 并说明原因。
- 只根据响应中的数字匹配确定性模式，给出后续检查项，不声明原因或广告效果因果关系。
- 对非法范围、不完整日级覆盖、跨 Workspace 和跨周期口径变化安全失败。

禁止增加用户自定义 SQL、阈值、任意指标、Meta 请求、自动优化动作、认证替代、写接口、
Secret、远程资源或部署。

## 本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/comparison
    ?baseline_start=YYYY-MM-DD&baseline_stop=YYYY-MM-DD
    &current_start=YYYY-MM-DD&current_stop=YYYY-MM-DD
```

两个周期 MUST 各为 1–31 个自然日、长度相同、互不重叠，并且基线早于当前周期。参数
必须各出现一次，未知参数被拒绝。接口继承[离线只读分析](offline-read-only-analysis.md)
的本机 Host、固定 ID allowlist、GET-only、fixture 和 Workspace 护栏。

## 可比性与覆盖

每个周期只有同时满足以下条件才可比较：

- 请求首尾日期均有数据，实际范围与请求范围一致。
- 每个自然日恰有一个兼容的账户级日粒度记录。
- 两个周期的币种、时区、点击口径、转化事件、归因哈希和 API 版本完全相同。
- 各周期内部不存在口径冲突。

覆盖不完整返回 `INCOMPLETE_PERIOD_COVERAGE`；口径不兼容返回
`INCOMPATIBLE_METRIC_CONTEXT`。缺失日期不得当作零，跨口径结果不得生成变化或诊断。

## 变化计算

每项变化包含 `baseline`、`current`、`absoluteChange`、`relativeChange`、`direction` 和
`relativeChangeUnavailableReason`。相对变化为：

```text
(current - baseline) / baseline
```

基线为零时 `relativeChange=null`、原因为 `BASELINE_ZERO`；任一值缺失时绝对和相对
变化均为 `null`、方向为 `NOT_COMPARABLE`、原因为 `MISSING_VALUE`。离线结果只为
fixture 可重复测试保留六位小数，不构成产品展示精度决定。

## 确定性诊断模式

当前不使用业务阈值或统计显著性。规则只确认输入数字满足的方向模式：

| Code | 已确认模式 | 级别 |
| --- | --- | --- |
| `SPEND_WITH_ZERO_CONVERSIONS` | 当前周期有花费且报告转化为零 | `WARNING` |
| `SPEND_UP_CONVERSIONS_DOWN` | 花费上升且报告转化下降 | `WARNING` |
| `CLICKS_UP_CONVERSIONS_NOT_UP` | 点击上升但报告转化未上升 | `WATCH` |
| `CTR_UP_CONVERSION_RATE_DOWN` | CTR 上升且报告 CVR 下降 | `WATCH` |
| `CONVERSION_VOLUME_UP_COST_DOWN` | 报告转化上升且 CPA 下降 | `INFO` |

每条命中结果固定携带 `findingConfidence=CONFIRMED_PATTERN` 和 `causalClaim=false`。
`nextChecks` 只是建议验证数据、事件、归因、素材、受众或落地流程，不能被解释为已验证
原因、优化结论或可执行 Meta 操作。未命中规则时返回空数组，不编造结论。

## 响应上下文

结果 MUST 包含：

- 两个周期的请求范围、实际范围、覆盖、原始指标和派生指标。
- 统一的币种、时区、点击口径、转化事件、归因哈希和 API 版本。
- 每个周期各自的稳定状态、获取时间和同步批次。
- `thresholdsApplied=false`、`causalClaims=false`、fixture 和无外部连接警告。

## 验证

Workers runtime 和纯函数测试至少覆盖：

- 正向效率模式和花费增加但转化恶化的模式。
- 基线为零、缺失指标和零分母。
- 周期长度不等、重叠、顺序错误、超长、重复和未知参数。
- 不完整覆盖、无数据、跨周期口径变化和跨 Workspace 请求。
- 所有诊断均不包含因果断言，代码中没有外部 `fetch()`、任意 SQL 或写路由。

本切片完成后项目仍停留在 Phase 0。只有真实配置和只读证据补齐、G0 `PASS`、需求与
ADR 接受且负责人启动后续正式阶段，才能验证真实数据或设计面向用户的诊断阈值。

该计算后来被负责人允许复用于已验证 fixture 对象，范围绑定和额外失败条件见
[离线对象级分析](offline-object-level-analysis.md)。复用不接受本页候选契约，也不把
对象数字模式升级为因果结论。
