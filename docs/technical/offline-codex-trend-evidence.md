---
doc_id: TECH-OFFLINE-CODEX-TREND-EVIDENCE
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-08
---

# 离线 Codex 趋势证据包

本文定义第十四个可逆离线候选切片：把当前已通过
[分析质量 Preflight](offline-analysis-quality-preflight.md)的对象日趋势或直接子对象
日趋势，整理为负责人可手动带入 Codex `facebook-ads-analysis` 会话的确定性 JSON。
它扩展[离线 Codex 分析证据包](offline-codex-evidence-bundle.md)，但仍只是分析输入，
不是趋势解释、分析结论、建议、真实账户证明、操作授权或 Gate 证据。

## 支持范围

本切片只增加两类当前成功结果：

1. 已验证 fixture Campaign、Ad Set 或 Ad 的连续 3–31 日趋势；
2. 已验证 fixture Campaign 或 Ad Set 与其全部直接子对象的同期日趋势。

账户、日期、对象、preflight 凭证或响应快照变化时，趋势结果沿现有失效链路清除，
其证据包同步消失。Ad 叶子仍不能生成直接子对象趋势输入。

## Schema v2

统一 schema 更新为 `facebook-ads-offline-analysis-context/v2`。既有三类 comparison
来源继续使用 `fact_evidence.kind: PERIOD_COMPARISON`；趋势来源使用：

```yaml
analysis_kind: OBJECT_DAILY_TREND | DIRECT_CHILD_DAILY_TREND
fact_evidence:
  claim_type: FACT
  kind: DAILY_TREND
  requested_range: {}
  point_count: 3-31
  metric_keys: fixed-nine-metrics
  daily_items: []
```

直接子对象趋势还必须提供：

```yaml
driver_inputs:
  claim_type: FACT
  kind: DIRECT_CHILDREN_DAILY
  ordering: STABLE_FIXTURE_OBJECT_ID_ASC
  ranking_applied: false
  reconciliation:
    additive_metric_keys:
      - spendMinorUnits
      - impressions
      - clicks
      - conversions
    daily_matches_parent: true
```

证据包总是包含完整固定 9 项日值。Web 当前选择的图表指标只控制呈现，不改变 JSON、
不发起第二次请求，也不暗示该指标是主 KPI。`observed_patterns` 对趋势来源保持空数组，
因为确定性打包器不得解释趋势。

`P2-OFFLINE-TREND-EVIDENCE-01`：相同 preflight 和相同趋势业务响应必须产生字节一致
JSON；随机请求追踪值不得进入产物。

`P2-OFFLINE-TREND-EVIDENCE-02`：直接子对象必须按稳定 fixture 对象 ID 输出，且每一天
四项可加指标均重新与父对象对账；不得排名、选择赢家或输出执行建议。

## 失败关闭

构建器必须再次验证：

- 来源、账户、对象、warning 和响应策略均明确为 fixture、非因果且未应用阈值；
- 日期连续完整，范围和对象被当前内存 preflight 凭证覆盖；
- 币种、时区、点击口径、转化事件、归因、API 版本、稳定状态、获取时间和同步批次与
  凭证完全一致；
- 9 项日值字段完整、数值有效，5 项派生指标与四项原始指标重新计算一致；
- 直接子对象数量、层级、唯一性、稳定顺序、完整日序列及逐日父子汇总均成立。

任一条件失败时返回 `INVALID_EVIDENCE_SOURCE`，不得输出部分 JSON、旧 JSON 或静态
回退内容。

## Web 交接

`P3-OFFLINE-TREND-EVIDENCE-01`：对象趋势和直接子对象趋势各自在当前成功结果下方
显示独立、只读且具有唯一可访问 ID 的 Codex 手动上下文。

`P3-OFFLINE-TREND-EVIDENCE-02`：JSON 直接从组件当前成功响应派生，不复制为第二份
React 状态，不用 Effect 同步，不写入 URL、浏览器存储或剪贴板，也不自动请求 Codex、
MCP 或远程端点。production 构建继续不渲染整个离线入口。

## 验证边界

自动检查至少覆盖 schema v2、两种趋势 `analysis_kind`、完整 9 项指标、请求追踪值排除、
preflight 快照错配、子对象稳定顺序、逐日对账、图表指标切换不改变 JSON，以及日期、
对象或凭证变化清除结果。桌面、移动和 production 关闭态验证结果在完成全量检查后
记录。

本切片不增加或修改 Worker、HTTP、D1、Meta 或 MCP 接口，不接受 `FR-005`、
`NFR-002`、任何 ADR 或候选架构，不改变 G0 `PARTIAL`，不授权真实数据、外部访问、
持久化、自动上传、部署、广告写操作或正式阶段转换。

## 当前验证结果

`P2-OFFLINE-TREND-EVIDENCE-01`–`P2-OFFLINE-TREND-EVIDENCE-02` 和
`P3-OFFLINE-TREND-EVIDENCE-01`–`P3-OFFLINE-TREND-EVIDENCE-02` 已于 2026-08-08
完成固定 fixture 验证。全仓检查覆盖 82 份规范文档、14 项 Phase 0、67 项 Worker、
81 项原型测试及 production build。

本机 HTTP 验证账户、质量、对象、Campaign 对象趋势、Campaign→Ad Set 和
Ad Set→Ad 直接子对象趋势均返回 `200`。浏览器在 `1280 × 720` 与 `430 × 932` 验证
schema v2、两种 `analysis_kind`、完整 9 项日值、稳定子对象顺序、逐日对账、请求追踪值
排除、指标切换后 JSON 字节不变，以及对象变化后旧上下文清除；自动组件测试另覆盖日期
变化失效。两个视口均无控制台告警或页面横向溢出。production 预览不渲染离线趋势或
Codex 证据面板，`8791`、`5173`、`4173` 验证后均无监听。

这些结果只证明固定 fixture 手动输入可重复，不构成趋势解释、Codex 分析、需求接受、
Gate 证据、真实数据证明或任何外部授权。
