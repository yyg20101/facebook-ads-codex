---
doc_id: TECH-OFFLINE-DIRECT-CHILD-DAILY-TREND-DESIGN
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线直接子对象日趋势设计

## 文档目的

本文定义第十个可逆离线切片：把既有直接子对象拆解与对象日趋势组合为一个原子读取，
让已验证 fixture Campaign 或 Ad Set 的父对象与全部直接子对象按日并列展示，同时逐日
验证四项可加指标与父对象完全对账。

本文是候选切片设计，不接受任何 `FR-*`、ADR 或正式阶段转换。当前阶段与权限只以
[项目状态与授权](../../project/status-and-authorizations.md)为准。

## 目标与非目标

本切片 MUST：

- 只接受已验证 fixture Campaign 或 Ad Set；Ad 叶子 MUST 安全拒绝。
- 只读取连续 3–31 个 UTC 自然日，且每个父子对象每天恰有一条口径一致的数据。
- 直接子对象最多 10 个，并始终按稳定对象 ID 升序返回和展示。
- 对每一天分别验证 `spendMinorUnits`、`impressions`、`clicks`、`conversions` 的子对象
  总和等于父对象。
- 返回父对象与每个直接子对象的固定 9 项日级指标；Web 一次只展示一个指标。
- 任何覆盖、层级、上下文或逐日对账失败时拒绝整个响应，不返回部分序列。

本切片 MUST NOT：

- 排名子对象、选择赢家、应用业务阈值、解释趋势、声明因果或生成执行建议。
- 接受手工 Workspace、账户、对象 ID，任意指标、动态排序、SQL 或 Graph path。
- 增加真实 Meta 同步、外部访问、认证替代、远程基址、CORS、Secret、部署或写操作。
- 从父对象反推缺失子对象数据，补零、合并不同口径或隐藏失败序列。

## 固定本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /objects/{parent_object_id}/children-trend
    ?date_start=YYYY-MM-DD&date_stop=YYYY-MM-DD
```

接口继承现有本机 Host、GET-only、`/offline/` 前缀和 fixture 开关。查询参数只允许
`date_start` 与 `date_stop` 各一次。父对象必须来自当前完整层级；Campaign 的直接子级
只能是 Ad Set，Ad Set 的直接子级只能是 Ad。

## 原子读取与验证

Worker 先读取完整层级，再为父对象和稳定排序后的每个直接子对象并发调用既有固定趋势
读取模型。组合器 MUST 验证：

1. 父对象与子对象层级、账户和父级引用精确匹配，ID 与外部引用均唯一。
2. 所有序列请求日期、日期点、账户、币种、时区、点击口径、转化事件、归因哈希、
   API 版本、稳定状态、新鲜度和同步批次完全一致。
3. 每个日期的四项可加指标逐项对账；`null` 只能与所有子值均为 `null` 对账。
4. 加总必须保持安全整数；任何溢出、缺失或不等均返回
   `INCOMPATIBLE_OBJECT_ROLLUP`。

不存在直接子对象返回 `NO_CHILD_OBJECTS`；层级错误返回
`INCOMPATIBLE_OBJECT_HIERARCHY`；覆盖不完整和上下文冲突沿用既有错误码。

## 成功响应

成功响应包含：

- `data.account`、`data.parent`、`data.requestedRange`。
- `data.parentItems[]`：父对象日级序列。
- `data.items[]`：稳定 ID 顺序的 `{ object, items[] }`。
- `data.reconciliation.additiveMetricKeys` 与 `dailyMatchesParent=true`。
- `context.parentObjectLevel`、`childObjectLevel`、`childCount`、`pointCount`。
- 统一 `metricContext`、`stabilityStatus`、`fetchedAt`、`syncRunIds`。
- 固定策略：`metricSelection=SINGLE`、`seriesOrder=STABLE_OBJECT_ID`、
  `rankingApplied=false`、`thresholdsApplied=false`、`causalClaims=false`、
  `trendInterpretationApplied=false`。
- `sourceKind=FIXTURE`、`FIXTURE_DATA_ONLY` 和 `NO_EXTERNAL_CONNECTION`。

## Web 展示

Web 在既有单对象趋势之后增加独立“直接子对象日趋势”入口。只有已选择 Campaign 或
Ad Set 时可加载；Ad 明确显示为无直接子级。图表同时展示父对象参考线与按稳定 ID 排列
的子对象序列，配套逐日精确值表和对账状态。

切换固定指标只在本地重绘，不重新请求 Worker。账户、父对象或日期变化 MUST 中止在途
请求并清除旧结果。图例和表格 MUST 使用对象名称与稳定 ID，视觉颜色不得表达优劣。

## 验收条件

- Campaign → Ad Set 和 Ad Set → Ad 均返回完整、稳定排序、逐日对账的三日 fixture。
- Ad、跨作用域对象、缺日、上下文冲突和逐日汇总不一致均安全失败。
- 严格客户端复算派生指标、连续日期和逐日父子汇总；错误响应不渲染旧数据。
- Web 指标切换不产生额外请求，父对象/日期变化清空结果，Ad 不可发起请求。
- 全量文档、Worker、Web、构建与本地浏览器检查通过；生产构建入口继续关闭。
