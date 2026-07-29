---
doc_id: PLAN-PHASE-0
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Phase 0 业务与权限确认问卷

## 当前记录状态

```yaml
phase_status: NOT_STARTED
gate_status: NOT_EVALUATED
```

本文用于收集 Phase 0 决策和脱敏证据，不代表 Phase 0 已启动，也不构成部署、
Meta 写操作或密钥管理授权。

## 使用方式

1. 项目负责人使用[明确启动语句](../project/status-and-authorizations.md)后，
   将 `phase_status` 改为 `IN_PROGRESS`。
2. 每项答案记录负责人、证据和确认日期。
3. 未确定值使用 `UNRESOLVED`，不得猜测默认值。
4. 所有阻塞问题关闭并满足证据要求后，才能评估 G0。
5. Gate 通过时记录确认者和证据，不只填写布尔值。

## Phase 0 任务

| Task | 内容 | 状态 | 负责人 | 证据 |
| --- | --- | --- | --- | --- |
| P0-01 | 确认自有或客户 Meta 广告账户业务模型 | NOT_STARTED | TBD | 待提供 |
| P0-02 | 确认 Meta Business、账户数量和数据量 | NOT_STARTED | TBD | 待提供 |
| P0-03 | 确认投放目标、主 KPI 和主转化事件 | NOT_STARTED | TBD | 待提供 |
| P0-04 | 确认币种、时区和归因政策 | NOT_STARTED | TBD | 待提供 |
| P0-05 | 确认历史回填和数据保留期 | NOT_STARTED | TBD | 待提供 |
| P0-06 | 确认网页用户、角色、登录方式和审批权 | NOT_STARTED | TBD | 待提供 |
| P0-07 | 确认主 Cloudflare 账户、域名、套餐和所有权 | NOT_STARTED | TBD | 待提供 |
| P0-08 | 创建 Meta App 和只读授权路径 | NOT_STARTED | TBD | 待提供 |

## 阻塞问题

| ID | 问题 | 状态 | 决定/答案 | 证据或备注 |
| --- | --- | --- | --- | --- |
| BQ-01 | 系统只管理自有 Meta Business，还是也管理客户账户？ | UNRESOLVED | — | — |
| BQ-02 | 首批 Meta 广告账户数量是多少？ | UNRESOLVED | — | — |
| BQ-03 | 主要投放目标是销售、线索、应用安装还是其他？ | UNRESOLVED | — | — |
| BQ-04 | 主转化事件是什么？ | UNRESOLVED | — | — |
| BQ-05 | 是否已有 Pixel、Conversions API 或 CRM 转化数据？ | UNRESOLVED | — | — |
| BQ-06 | 广告账户包含哪些币种和时区？ | UNRESOLVED | — | — |
| BQ-07 | 采用哪个 Meta 归因窗口作为标准口径？ | UNRESOLVED | — | — |
| BQ-08 | 需要回填多少天历史数据？ | UNRESOLVED | — | — |
| BQ-09 | 原始数据和审计数据保留多久？ | UNRESOLVED | — | — |
| BQ-10 | 哪些用户拥有审批权？ | UNRESOLVED | — | — |
| BQ-11 | 网页使用 Cloudflare Access，还是外部客户登录系统？ | UNRESOLVED | — | — |
| BQ-12 | `cf-primary` 是否确定为生产域名、账单和 Workers 资源所有者？ | UNRESOLVED | — | — |

## G0 检查

| 条件 | 目标 | 当前 | 证据 |
| --- | --- | --- | --- |
| `business_model_confirmed` | `true` | `false` | 待提供 |
| `primary_kpi_configured` | `true` | `false` | 待提供 |
| `meta_read_access_available` | `true` | `false` | 待提供 |
| `cloudflare_primary_account_confirmed` | `true` | `false` | 待提供 |
| `production_deploy_authorized` | `false` | 链接授权事实源 | [当前授权](../project/status-and-authorizations.md) |

G0 只有在所有阻塞问题有明确答案、测试环境能只读列出至少一个 Meta 广告账户，
且没有 production 部署时才能通过。

## 证据登记

| Evidence ID | 日期 | 来源/所有者 | 脱敏说明 | 支持的任务或 Gate |
| --- | --- | --- | --- | --- |
| E-001 | YYYY-MM-DD | TBD | 不得包含 Token 或客户敏感数据 | TBD |

## 决策记录

| 日期 | 决策 | 决策者 | 影响 | 后续动作 |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD | TBD | TBD | ADR/需求/接口/Gate/安全/无 | TBD |

## 完成记录

- 完成日期：`TBD`
- 确认者：`TBD`
- G0 状态：`NOT_EVALUATED`
- 未完成项：`TBD`
- 下一 Gate：G1

Phase 0 完成仍不等于 production 部署或 Meta 写操作授权。
