---
doc_id: TECH-OFFLINE-READ-ONLY-ANALYSIS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-05
---

# 离线只读分析切片

> 候选实现：本切片响应项目负责人“继续下一步，跳过配置”的指令，只验证固定虚构数据
> 的本地读取、指标计算和错误边界。它不接受候选 HTTP 契约、Cloudflare 架构或任何
> `FR-*`，也不构成正式 Phase 1、G0/G1 证据或真实广告分析能力。

## 范围

允许实现：

- 列出指定 fixture Workspace 内最多 10 个虚构广告账户。
- 对一个 fixture 广告账户按有界日期范围汇总日级指标。
- 返回币种、时区、点击口径、转化事件、归因哈希、API 版本、同步批次、新鲜度和稳定
  状态。
- 计算点击率、单次点击成本、千次展示成本和单次转化成本；零分母返回 `null`。
- 对非法输入、跨 Workspace、无数据、口径冲突、非本机 Host 和关闭 fixture 模式安全
  失败。

禁止实现认证替代、用户枚举、任意 SQL/URL/Graph path、Meta 客户端、同步、远程资源、
写接口、Secret 或部署。

## 本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/summary
    ?date_start=YYYY-MM-DD&date_stop=YYYY-MM-DD
```

接口只接受 `localhost`、`127.0.0.1`、`[::1]` 和测试 Host `offline.invalid`。所有 ID 使用
固定字符 allowlist；summary 只接受两个必填日期参数，最大包含 31 个自然日，未知或重复
参数被拒绝。该限制是离线测试护栏，不是产品容量决定。

所有数据库查询使用固定 SQL 和绑定参数，并同时约束 `workspace_id`、广告账户 ID 与
`source_kind=FIXTURE`。资源不存在和跨 Workspace 使用相同错误，避免暴露对象归属。

## 指标和上下文

原始汇总包括最小货币单位花费、展示、点击和转化。派生值携带 `click_metric_kind` 和
`conversion_event_ref`，不得把全部点击误称为链接点击，也不得在转化事件未知时猜测
CPA。币种、时区、点击口径、转化事件、归因哈希或 API 版本不唯一时返回
`INCOMPATIBLE_METRIC_CONTEXT`，不得聚合。

离线派生比例只为 fixture 验证保留六位小数；金额继续以账户币种的最小单位表达。该
舍入规则不是已接受的产品显示或财务精度决定。

响应必须标记 `FIXTURE_DATA_ONLY` 与 `NO_EXTERNAL_CONNECTION`。结果包含实际覆盖日期、
最近获取时间、同步批次和最保守稳定状态；它不能表述为 Meta 当前状态或真实业务效果。

## 安全护栏

1. Wrangler 配置没有 route、真实数据库 ID、Secret 或 deploy 命令。
2. `OFFLINE_FIXTURES_ENABLED` 不是 `true` 时所有入口拒绝。
3. 非本机 Host 在查询数据库前拒绝。
4. 只暴露固定 GET 路由；其他方法和路径失败。
5. 错误不返回 SQL、堆栈、请求体、绑定或其他 Workspace 的存在性。
6. 代码没有任何外部 `fetch()` 或模块级请求状态。

## 验证

Workers runtime 测试至少覆盖：

- 账户列表和有上下文的多日汇总。
- 零分母派生指标返回 `null`。
- 非法日期、超长范围、重复或未知参数。
- 跨 Workspace、SQL 注入式 ID、无数据和口径冲突。
- fixture 模式关闭、非本机 Host、未知路由和非 GET 方法。

本切片完成后仍须停留在 Phase 0。只有补齐真实配置与只读证据、G0 `PASS`、需求和 ADR
接受且负责人另行启动正式 Phase 1 后，才能设计认证接口、Meta 同步或 staging。
