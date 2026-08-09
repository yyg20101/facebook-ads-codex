---
doc_id: TECH-OFFLINE-OBJECT-DAILY-TREND-DESIGN
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线对象多日趋势设计

## 文档目的

本文定义第九个可逆离线切片：为已验证的固定 fixture Campaign、Ad Set 和 Ad 提供
连续日级趋势读取与本地 Web 展示。项目负责人已确认首期保留现有 9 项指标，但趋势图
一次只展示一个指标并允许用户切换。

本文是候选切片设计，不接受 `FR-003`、`FR-005`、`FR-011`、任何 ADR 或 Cloudflare
架构，不构成正式 Phase 1、Phase 2、Phase 3 或 Gate 证据。它不得扩大
[项目状态与授权](../../project/status-and-authorizations.md)定义的外部访问、部署和 Meta
写操作边界。

## 目标与非目标

本切片 MUST：

- 只为当前已验证 fixture 层级中选定的 Campaign、Ad Set 或 Ad 返回连续 3–31 天的
  日级数据。
- 按日期升序返回花费、展示、点击、报告转化、CTR、CVR、CPC、CPM 和 CPA。
- 要求请求范围完整覆盖、每天恰有一行、对象和指标口径精确匹配。
- 在 Web 中使用独立入口显式加载，不改变账户级 comparison、对象级 comparison 或
  直接子对象拆解的既有语义。
- 只展示数字事实和数据上下文，不生成阈值、排名、趋势解释、因果结论或执行建议。

本切片 MUST NOT：

- 增加真实 Meta 请求、同步、远程 API 基址、CORS、认证替代、Secret、部署或写操作。
- 接受手工 Workspace、账户或对象 ID。
- 接受任意指标、SQL、breakdown、排序表达式或动态 Graph path。
- 将缺失日期补零、将不同口径拼接为一条趋势，或从父级数据推算缺失对象数据。
- 将三日 fixture 验证表述为真实数据正确、用户价值、诊断有效性或产品需求已接受。

## 方案比较与选择

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 独立对象趋势接口 | 单次请求、原子校验、响应边界清晰、易于安全失败 | 增加一个固定路由和响应类型 | 选择 |
| 浏览器逐日请求既有 summary/comparison | 服务端改动少 | N 次请求、容易产生部分结果、上下文一致性难以证明 | 拒绝 |
| 通用分析接口加动态指标参数 | 表面灵活 | 过度设计，扩大输入面并接近任意查询能力 | 拒绝 |

选择独立对象趋势接口。它复用现有固定 SQL、绑定参数、完整层级和指标计算逻辑，但使用
专用读取模型和严格响应，避免将 comparison 契约误作时间序列接口。

## 本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /objects/{object_id}/trend
    ?date_start=YYYY-MM-DD&date_stop=YYYY-MM-DD
```

接口继承既有本机 Host、GET-only、`/offline/` 前缀、fixture 开关和固定 ID allowlist。
查询参数 `date_start`、`date_stop` 必须各出现一次，不接受未知参数。日期必须有效、按
自然日包含首尾且长度为 3–31 天。

Workspace、广告账户和对象必须来自同一份完整、未截断且父级关系有效的 fixture 层级。
未知对象、账户错配和跨 Workspace 均返回 `NOT_FOUND`，避免泄露对象存在性。非法日期
或参数返回 `INVALID_ARGUMENT`。

## 数据读取与完整性

读取模型使用固定 SQL 和绑定参数，同时约束：

- `workspace_id`、`ad_account_id`。
- 已验证对象的 `object_level` 和 `external_object_ref`。
- `source_kind='FIXTURE'`。
- `insight_date BETWEEN date_start AND date_stop`。

结果 MUST 按 `insight_date ASC` 排序。服务端 MUST 验证：

1. 返回行数等于请求自然日数量。
2. 首尾日期与请求一致，日期唯一且每日连续。
3. 每行币种、时区、点击口径、转化事件、归因哈希和 API 版本完全一致。
4. 每行对象级别、对象引用、同步批次和 fixture 来源合法。
5. 原始指标为允许的非负整数或明确的 `null`；派生指标按每日原始指标单独计算。

派生指标沿用既有离线计算的六位小数舍入契约；客户端使用同一公式和精度复核，避免
浮点表示差异被误判为响应篡改。

缺少数据返回 `DATA_UNAVAILABLE`；日期缺口或重复返回
`INCOMPLETE_PERIOD_COVERAGE`；口径冲突返回 `INCOMPATIBLE_METRIC_CONTEXT`。任何失败
都 MUST 拒绝整个响应，不返回部分趋势。

## 成功响应

成功 envelope 包含：

- `data.account`：已验证 fixture 账户。
- `data.object`：当前完整 fixture 对象。
- `data.requestedRange`：请求的首尾日期。
- `data.items[]`：日期升序的日级 `totals` 与 `derived`。
- `context.metricContext`：币种、时区、点击口径、转化事件、归因哈希和 API 版本。
- `context.stabilityStatus`、`fetchedAt`、`syncRunIds` 和 `pointCount`。
- `trendPolicy.minimumDays=3`、`maximumDays=31`、`metricSelection='SINGLE'`、
  `thresholdsApplied=false`、`causalClaims=false`、`trendInterpretationApplied=false`。
- `sourceKind=FIXTURE`、`FIXTURE_DATA_ONLY` 和 `NO_EXTERNAL_CONNECTION`。

九项指标固定为：

| Key | 来源 | 零分母行为 |
| --- | --- | --- |
| `spendMinorUnits` | 日级原始值 | 不适用 |
| `impressions` | 日级原始值 | 不适用 |
| `clicks` | 日级原始值 | 不适用 |
| `conversions` | 日级原始值 | 不适用 |
| `clickThroughRate` | `clicks / impressions` | `null` |
| `conversionRate` | `conversions / clicks` | `null` |
| `costPerClickMinorUnits` | `spendMinorUnits / clicks` | `null` |
| `costPerThousandImpressionsMinorUnits` | `spendMinorUnits / impressions * 1000` | `null` |
| `costPerConversionMinorUnits` | `spendMinorUnits / conversions` | `null` |

## Web 交互设计

数据分析页在既有离线面板中增加独立的“对象趋势”区域：

1. 用户先读取 fixture 账户和完整对象层级。
2. 用户选择 Campaign、Ad Set 或 Ad。
3. 用户选择趋势开始和结束日期；默认使用 fixture 完整三日范围。
4. 用户点击“加载所选对象趋势”。
5. 页面显示对象范围、请求范围、口径、覆盖、新鲜度和可信边界。
6. 用户通过选择器在 9 项指标间切换；一次只渲染一个指标。
7. 页面同时显示可访问的趋势图和该指标的精确日值表。

默认指标为 `spendMinorUnits`，这只是 fixture 演示初始视图，不是产品主 KPI 或业务默认
规则。指标切换只改变浏览器展示，不重新请求 Worker。

账户、对象或趋势日期变化时，客户端 MUST 中止旧请求并清除旧趋势。重新读取账户或层级
也 MUST 清除结果。客户端不得从静态 Product Discovery 数据、comparison 或父级汇总
回填失败响应。

## 图表与可访问性

趋势图使用仓库现有前端技术实现，不增加第三方图表依赖。图表 MUST：

- 使用同一单位和单一指标，日期按升序显示。
- 为每个点提供可读日期和值，`null` 显示为不可用且不连成伪造数据线。
- 提供明确的图表标题、当前对象、指标单位和日期范围。
- 保留与图表相同数据的语义化表格，不能只依赖颜色或鼠标悬停。
- 在桌面和移动宽度内使用容器适配，页面本身不得产生横向溢出。

## 客户端信任边界

客户端对响应执行运行时校验，至少验证：

- 账户、对象全部字段与当前选择精确匹配。
- 日期范围、点数、升序、唯一性和连续性精确匹配请求。
- 每个点包含固定 9 项指标，数值、`null` 和派生公式合法。
- `metricContext`、新鲜度、同步批次、fixture warnings 和策略标记完整。
- `metricSelection='SINGLE'`，三个禁用策略均为 `false`。

任何错配显示稳定的 `INVALID_RESPONSE`，不渲染部分图表。HTTP 或业务错误只显示稳定错误
码和安全说明，不暴露堆栈、SQL、路径或 fixture 内部实现细节。

## 组件边界

- Worker `read-model`：只读取和验证对象日级行。
- Worker `http`：解析固定路由和参数，组装 envelope 与稳定错误。
- Web `offlineTrend`：构建同源相对 URL、严格校验响应并返回类型化结果。
- Web `OfflineObjectTrendPanel`：管理趋势范围、请求状态、指标选择、图表和表格。
- 既有 `OfflineComparisonPanel`：继续负责账户、层级和当前对象选择，并向趋势组件传入
  已验证账户与对象；不把趋势状态混入 comparison 状态。

独立趋势组件避免继续扩大已包含多种 comparison 状态的面板，同时确保对象选择仍只有
一个来源。

## 测试设计

### Worker

- 成功返回 Campaign、Ad Set 和 Ad 的三日趋势，日期稳定升序且 9 项指标正确。
- 3 日和 31 日范围通过参数校验；固定 fixture 只有三日数据，因此 31 日请求随后必须以
  `DATA_UNAVAILABLE` 或 `INCOMPLETE_PERIOD_COVERAGE` 安全失败，而非误报参数非法。
- 1–2 日、32 日、倒序、非法日期、重复或未知参数被拒绝。
- 未知对象、账户错配、跨 Workspace、层级不完整和容量超限安全失败。
- 缺失日期、重复日期、对象数据缺失和跨日口径冲突整体失败。
- 零展示、零点击或零转化时，对应派生指标为 `null`，不得返回 `Infinity`。
- 代码不包含外部 `fetch()`、任意 SQL、写路由或不安全双重断言。

### Web

- 客户端接受完整三日响应，并拒绝对象、账户、日期、顺序、点数、公式、warning 或策略
  错配。
- 未选择对象时加载入口禁用；Campaign、Ad Set 和 Ad 均可显式加载。
- 九项指标可切换，切换不增加网络请求，图表和日值表同步更新。
- `null` 显示为不可用，不绘制伪造连接。
- 切换账户、对象、日期或重新读取层级时旧结果被清除，旧请求被中止。
- 错误、加载、空和成功状态不回退为静态故事数据。

### 端到端与治理

- 目标流程为“读取账户 → 读取层级 → 选择 Ad → 加载三日趋势 → 切换指标 → 核对日值”。
- 浏览器验证页面身份、关键 DOM、真实请求路径、控制台、错误层、桌面与移动横向溢出。
- 文档校验器检查授权依赖、必需文件、固定路由、3–31 日限制、9 项指标、同源客户端和
  禁用策略。
- `npm run check` 必须通过；验证后 Worker 与 Vite 本地端口必须停止。

## 完成条件与限制

本切片只有在设计、实现、自动测试、本地浏览器和治理证据全部完成时才可记录为完成。
完成后项目版本仍为 `1.0.0`，G0 仍为 `PARTIAL`，当前阶段和运行时可用状态不变。

真实账户趋势、动态主 KPI、数据量与性能、用户授权、Meta 对账、异常解释和优化价值仍
依赖真实只读证据、接受后的需求与 ADR、G0 通过及项目负责人另行启动正式阶段。
