---
doc_id: TECH-DEPLOYMENT-OPS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 部署与运维设计

## 控制平面

MVP 使用一个逻辑主 Cloudflare 账户 `cf-primary` 承载 Worker、Remote MCP、D1、
R2、Queues、Workflows 和 Secrets。具体账户所有权、域名、套餐和账单归属由
`BQ-12` 在 Phase 0 确认，仓库不保存个人邮箱或实际账户 ID。

- Wrangler 配置 MUST 显式设置目标 `account_id`。
- CI/CD MUST 对每个账户和环境使用独立、最小权限 API Token。
- 自动部署不得依赖交互式 Wrangler profile 切换。
- 未经明确授权，不得向其他 Cloudflare 账户部署。
- 跨账户硬隔离时，各账户必须拥有独立数据、队列、工作流和 Secret 资源。

## 环境

| 环境 | 目的 | 数据与密钥 | 当前授权 |
| --- | --- | --- | --- |
| local | 开发、fixture 和单元测试 | 仅本地测试值 | 未启动 |
| staging | 只读集成与 Gate 验证 | 独立测试资源 | 未授权部署 |
| production | 真实业务运行 | 独立生产资源 | 未授权部署 |

staging 和 production MUST 使用不同的密钥、D1、R2、Queues 和 Workflows。
当前值以[项目状态与授权](../project/status-and-authorizations.md)为准。

## Cloudflare 调度

Cloudflare 负责：

- Meta 数据同步和归因回补。
- Token 与权限健康检查。
- 同步失败的有界重试。
- 数据稳定状态更新。
- 审计保留和经批准的清理。

这些任务必须独立于 Codex 是否在线。

## Codex 调度

Codex Scheduled Tasks MAY 负责日报、周报、异常摘要和审批提醒。它们只能读取有效数据，
不得成为唯一同步机制，也不得在当前授权下创建或执行 Meta 写操作。

## 可观测性

必须监控：

- 每个广告账户最后成功同步时间。
- 同步持续时间、成功率和失败分类。
- Meta 限流、使用量和重试。
- 数据行数、重复、范围缺口和口径变化。
- MCP 工具延迟、错误率和截断率。
- 待审批、过期、STALE 和失败变更数量。
- Emergency stop 状态和变化。

告警必须包含 Workspace 范围、脱敏请求 ID、影响、首次时间和 Runbook 链接，
不得包含 Token 或完整第三方响应。

## 恢复策略

- D1 schema migration 必须可回滚或提供经过测试的前向修复。
- R2 原始数据不得依赖单个同步批次。
- Queue/Workflow 重试必须有上限、死信或人工恢复路径。
- 数据差异通过重新同步和证据比对解决，不得直接覆盖审计。
- 广告变更使用新的反向变更申请，不把删除作为回滚。

具体操作只有在环境中验证后才能写入
[Runbook](../runbooks/README.md)并标记为可操作。

## 发布前提

部署 staging 或 production 前必须：

1. 对应 Phase 已明确启动。
2. 依赖 Gate 满足并有证据。
3. 目标账户、域名、套餐和资源所有权已确认。
4. 配置、migration、回滚、Secret 和监控经过评审。
5. [授权事实源](../project/status-and-authorizations.md)允许目标动作。
