---
doc_id: TECH-OFFLINE-DIRECT-CHILD-DAILY-TREND
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线直接子对象日趋势

## 文档定位

本文记录第十个可逆离线切片的实现契约。它仅用于固定 fixture 的候选方案验证，不构成
被接受的需求、ADR、正式 Phase 1/2/3 或 Gate 证据。设计见
[设计文档](../superpowers/specs/2026-08-07-offline-direct-child-daily-trend-design.md)，执行见
[实施计划](../superpowers/plans/2026-08-07-offline-direct-child-daily-trend.md)。

## 固定契约

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /objects/{parent_object_id}/children-trend
    ?date_start=YYYY-MM-DD&date_stop=YYYY-MM-DD
```

- 父对象只允许已验证 Campaign 或 Ad Set；Ad 返回 `NO_CHILD_OBJECTS`。
- 日期必须连续包含首尾且为 3–31 天，子对象最多 10 个。
- 父、子序列均使用既有固定 9 项指标和相同派生公式。
- 子对象按稳定 ID 排序；不提供排序、排名、阈值或动态指标参数。
- 每一天的花费、展示、点击和报告转化子级总和 MUST 等于父级。
- 覆盖、上下文或逐日汇总任一失败时拒绝整个响应。

## 信任边界

Worker 只复用固定 SQL 和绑定参数，不发起外部请求。Web 只从已验证账户与对象层级构造
同源相对 URL，使用 `credentials: omit`，并在渲染前重新验证完整 envelope、日期顺序、
对象绑定、派生公式、逐日汇总、warning 和策略字段。

成功结果固定声明：

```yaml
minimumDays: 3
maximumDays: 31
metricSelection: SINGLE
seriesOrder: STABLE_OBJECT_ID
rankingApplied: false
thresholdsApplied: false
causalClaims: false
trendInterpretationApplied: false
dailyMatchesParent: true
sourceKind: FIXTURE
```

本切片不包含真实数据、Meta 同步、外部访问、认证替代、部署、写操作、趋势解释、赢家
判断或优化建议。具体完成证据以测试和本地验收记录为准。

## 已实现与验证

- Worker 的 `buildDirectChildTrend` 纯组合器验证父子对象身份、直接层级、稳定 ID、统一
  上下文和逐日四项可加指标汇总；读取继续复用固定 SQL 与绑定参数。
- `children-trend` 路由原子读取父对象和全部直接子对象。Campaign→Ad Set 与
  Ad Set→Ad 成功返回；Ad、非法日期、未知作用域、缺日、口径冲突和汇总不一致均使用
  稳定错误码拒绝。
- Web 严格客户端在渲染前复算 9 项指标、连续日期和每日父子汇总；响应声明
  `dailyMatchesParent=true` 不能替代客户端验证。
- 本地页面提供父对象参考线、稳定 ID 子对象序列、单指标切换和精确日值表；账户、日期
  或父对象变化清除旧结果，Ad 入口禁用。

2026-08-07 全仓验证通过：78 份规范文档、14 项 Phase 0、61 项 Worker 和 58 项原型
测试及 production build。HTTP 验证 Campaign→Ad Set 与 Ad Set→Ad 为 `200`，Ad
叶子为 `409`，两日输入为 `400`，未知对象为 `404`。浏览器在 `1280 × 720` 与
`430 × 932` 完成父子趋势、指标本地切换、对象变化清除和 Ad 禁用验证；无控制台告警
或页面横向溢出，移动表格只在自身容器滚动。production 预览不渲染账户或本切片入口，
`8791`、`5173`、`4173` 随后均停止监听。该证据不形成任何 Gate 证据。
