---
doc_id: TECH-OFFLINE-OBJECT-DAILY-TREND
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线对象日趋势

## 文档定位

本文记录已获有限授权的第九个可逆离线切片。它只用于比较候选方案和验证固定 fixture
契约，不构成被接受的产品需求、架构决策、正式 Phase 1/2/3 实现或 Gate 证据。当前
阶段及权限只以[项目状态与授权](../project/status-and-authorizations.md)为准。

设计事实源见[离线对象多日趋势设计](../superpowers/specs/2026-08-07-offline-object-daily-trend-design.md)，
执行边界见[实施计划](../superpowers/plans/2026-08-07-offline-object-daily-trend.md)。

## 已实现范围

- 对已验证 fixture Campaign、Ad Set 或 Ad 显式请求连续 3–31 个 UTC 自然日。
- 按日期升序返回花费、展示、点击、报告转化和 5 项派生指标。
- Worker 在返回前验证每日恰有一行、完整连续覆盖、对象绑定和六项指标上下文一致。
- Web 只从已验证的固定账户与完整对象层级传入 ID；账户、对象或日期变化会清除旧结果
  并中止仍在进行的请求。
- 页面一次只展示一个指标，指标切换只更新本地视图，不重新请求 Worker；趋势图始终
  配套精确日值表。

本切片不包含真实 Meta 数据、同步、任意指标查询、阈值、排名、趋势解释、因果判断、
优化建议、自动执行、认证替代、远程基址、CORS、Cloudflare 部署或写操作。

## 固定本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /objects/{object_id}/trend
    ?date_start=YYYY-MM-DD&date_stop=YYYY-MM-DD
```

接口只接受 `date_start` 和 `date_stop` 各一次。日期包含首尾，少于 3 日、超过 31 日、
倒序、无效日期、重复参数或未知参数均以 `INVALID_ARGUMENT` 拒绝。Workspace、账户和
对象必须属于同一份完整、未截断且父级有效的 fixture 层级；未知或跨作用域对象统一
返回 `NOT_FOUND`。

读取模型使用固定列、六个绑定参数、`ORDER BY date_start ASC` 和 `LIMIT 32`。31 日是
输入上限，不代表 fixture 具有 31 日数据；超出当前三日 fixture 覆盖的合法请求会以
数据不可用或覆盖不完整安全失败。

## 指标契约

| Key | 日值来源 | 零分母结果 |
| --- | --- | --- |
| `spendMinorUnits` | 原始非负整数 | 不适用 |
| `impressions` | 原始非负整数 | 不适用 |
| `clicks` | 原始非负整数 | 不适用 |
| `conversions` | 原始非负整数 | 不适用 |
| `clickThroughRate` | `clicks / impressions` | `null` |
| `conversionRate` | `conversions / clicks` | `null` |
| `costPerClickMinorUnits` | `spendMinorUnits / clicks` | `null` |
| `costPerThousandImpressionsMinorUnits` | `spendMinorUnits / impressions * 1000` | `null` |
| `costPerConversionMinorUnits` | `spendMinorUnits / conversions` | `null` |

派生指标使用现有六位小数舍入规则。服务端逐日计算，客户端用同一公式复核；任何字段
缺失、非有限数、公式不符或 `Infinity`/`NaN` 均拒绝整个响应。默认展示花费只属于
fixture 演示初始状态，不是项目级主 KPI 或业务默认值。

## 完整性与错误语义

| 条件 | 稳定结果 |
| --- | --- |
| 对象或范围无数据 | `404 DATA_UNAVAILABLE` |
| 日期缺口、重复或非连续 | `409 INCOMPLETE_PERIOD_COVERAGE` |
| 币种、时区、点击口径、事件、归因或 API 版本冲突 | `409 INCOMPATIBLE_METRIC_CONTEXT` |
| 未知对象、账户错配或跨 Workspace | `404 NOT_FOUND` |
| 非本机、非 GET、非 fixture 或非法输入 | 既有安全失败响应 |

失败时不返回部分趋势，不补零、不从父级推算，也不回退到 Product Discovery 静态故事
数据。成功响应保留对象、请求范围、六项指标上下文、稳定状态、新鲜度、同步批次、点数
以及以下不可变边界：

```yaml
minimumDays: 3
maximumDays: 31
metricSelection: SINGLE
thresholdsApplied: false
causalClaims: false
trendInterpretationApplied: false
sourceKind: FIXTURE
warnings:
  - FIXTURE_DATA_ONLY
  - NO_EXTERNAL_CONNECTION
```

## Web 信任边界与可访问性

客户端只构造同源相对 URL，并使用 `credentials: omit`。它在渲染前精确绑定请求的
Workspace、账户、对象、日期和点数，校验日期唯一连续、固定 9 项指标、派生公式、
上下文、策略、warning、同步批次和新鲜度。错配统一显示安全的 `INVALID_RESPONSE`，
不暴露 SQL、堆栈或本地实现路径。

SVG 图表声明可访问名称；每个非空点提供日期和值，`null` 点显示“不可用”且中断折线。
同一组数据始终提供语义化表格，指标单位和当前对象可见，不依赖颜色或 hover 才能理解。

## 验证边界

自动测试覆盖三种对象层级、固定三日真值、3–31 日输入边界、缺失与重复日、六类口径
冲突、零分母、作用域错配、严格客户端校验、指标切换无重复请求、请求中止和错误不回退。
全仓命令为 `npm run check`，本地交互路径见
[控制平面 Runbook](../runbooks/local-control-plane.md)。

2026-08-07 实际验证结果为 54 项 Worker、45 项原型和 14 项 Phase 0 测试通过；本机
HTTP、`1280 × 720`、`430 × 932` 及 production 入口关闭均通过，三个本地端口已停止。

这些结果只证明固定虚构数据、本机契约和呈现可重复。真实趋势正确性、Ads Manager
对账、数据量性能、动态主 KPI、用户权限、原因解释和优化价值仍未验证。
