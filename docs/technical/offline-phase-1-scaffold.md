---
doc_id: TECH-OFFLINE-PHASE-1-SCAFFOLD
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# Phase 1 离线控制平面脚手架

> 候选实现：本文记录项目负责人在 G0 `PARTIAL` 时单独允许的离线技术准备，不接受
> Cloudflare 为最终架构，也不构成正式 Phase 1、G1、外部访问或部署决定。

## 目标与边界

当前脚手架用于提前验证以下低风险、可逆事实：

- TypeScript Worker 能使用 Wrangler 生成的 runtime 和 binding 类型严格编译。
- 本地 D1 migration 能表达 Workspace 作用域、外键、唯一约束和指标非负约束。
- 固定虚构 fixture 可以在 Workers runtime 测试中重复创建。
- HTTP 入口在没有认证和业务接口时只暴露本地健康检查，并对其他请求安全失败。

当前 MUST NOT 包含 Meta 客户端、真实账户或 Token、Cloudflare 账户 ID、远程资源、
部署路由、R2、Queue、Workflow、认证、同步或写操作。业务读取只允许负责人随后单独
批准的[离线只读分析切片](offline-read-only-analysis.md)和
[离线周期诊断切片](offline-period-comparison-and-diagnostics.md)，以及负责人后续单独允许的
[离线对象级分析](offline-object-level-analysis.md)，不得扩大为公开 API。

## 代码布局

```text
services/control-plane-worker/
  src/
    index.ts
    http.ts
    comparison.ts
    metrics.ts
    read-model.ts
  migrations/0001_initial.sql
  migrations/0002_offline_ad_objects.sql
  fixtures/0001_seed.sql
  test/
  worker-configuration.d.ts
  wrangler.jsonc
```

Wrangler 配置使用当前日期 `compatibility_date`、`nodejs_compat`、JSONC、D1 binding 和
observability。`database_id` 是不可部署占位值，`workers_dev` 与 preview URL 均关闭，
仓库不提供 deploy 命令。

## 本地 HTTP 接口

基础接口：

```text
GET /healthz
```

成功响应只说明本地 Worker 和 D1 readiness：

```json
{
  "ok": true,
  "data": {
    "service": "control-plane-worker",
    "mode": "OFFLINE_FIXTURE",
    "storage": "ready"
  },
  "context": {
    "requestId": "generated-value"
  },
  "warnings": [
    "No Meta or Cloudflare account connection is configured"
  ]
}
```

另行批准的 `/offline/` 读取路径见
[离线只读分析设计](offline-read-only-analysis.md)和
[离线周期诊断](offline-period-comparison-and-diagnostics.md)，对象级路径见
[离线对象级分析](offline-object-level-analysis.md)。其他路径返回稳定
`NOT_FOUND`，非 GET 请求返回 `METHOD_NOT_ALLOWED`。错误不包含堆栈、请求体、绑定值或
第三方响应。这些接口都不是后续 Web/MCP 业务契约。

## 初始本地数据模型

初始 migration 只包含：

- `workspaces`
- `meta_ad_accounts`
- `sync_runs`
- `insights_daily`
- `meta_ad_objects`（后续获准层级切片使用）

所有业务记录直接带有或通过外键关联 `workspace_id`。账户唯一性包含 Workspace，指标
拒绝负数，日期和状态使用检查约束。金额以最小货币单位整数保存；`null` 与零保持不同
语义。fixture 的所有 ID、名称、账户引用和指标均明确标记为虚构。

该 schema 只验证基础约束，不表示完整领域模型或 D1 选型已接受。后续正式 migration
必须基于已接受需求和 ADR 扩展，不能把 fixture 数据迁入真实环境。

`meta_ad_objects` 的额外边界见
[离线广告对象层级](offline-ad-object-hierarchy.md)，其中对象只用于固定 fixture 导航，
后续 fixture 对象指标另见[离线对象级分析](offline-object-level-analysis.md)；两者都不
代表真实 Meta 同步或真实对象 Insights 已实现。

## 安全设计

- Worker 没有任意 URL、Graph path、SQL 或代理接口。
- 代码没有 `fetch()` 外部调用、Secret、Token 或认证 Header。
- 请求状态不保存在模块级变量。
- 请求 ID 使用 `crypto.randomUUID()`。
- 结构化错误日志只包含时间、固定服务名、请求 ID、路径和稳定错误码。
- 所有响应使用 `no-store` 与 `nosniff`。
- 配置和脚本没有 deployment 命令；远程执行继续由授权事实源禁止。

## 验证

```text
npm run worker:types:check
npm run worker:typecheck
npm run worker:test
```

Workers runtime 测试覆盖健康检查、稳定错误、migration 重复应用、虚构数据、Workspace
唯一性、非负指标和已批准的离线读取切片。完整操作见
[本地控制平面 Runbook](../runbooks/local-control-plane.md)。

实现遵循 [Cloudflare Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
和 [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)。

## 升级条件

只有 G0 `PASS`、关联需求和 ADR 接受、目标 Cloudflare 事实确认且项目负责人另行启动
正式 Phase 1 后，才能评审真实资源配置、认证、Meta 客户端、同步和 staging。脚手架
测试通过不能替代这些条件。
