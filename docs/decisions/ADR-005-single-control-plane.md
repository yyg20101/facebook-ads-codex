---
doc_id: ADR-005
type: decision
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# ADR-005：MVP 使用单一主控制平面

> 候选方案：本 ADR 尚未由用户问题和产品形态证据支持，`DG0` 前不具有约束力。

## 背景

MVP 需要 Worker、MCP、D1、R2、Queues、Workflows 和 Secret。过早跨账户或拆分服务会增加
部署、权限、数据一致性和恢复复杂度。

## 决策

- MVP 的控制平面资源位于一个逻辑主 Cloudflare 账户 `cf-primary`。
- API 与 MCP 使用一个 Worker 项目和共享业务层。
- staging 与 production 在该账户内使用独立资源和 Secret。
- 具体账户所有权、域名、套餐和账单由 `BQ-12` 确认。
- 未来跨账户硬隔离必须通过新 ADR，并使用完整独立资源。

## 后果

- MVP 部署、授权和观测路径更简单。
- 单一账户仍需严格 Workspace 隔离，不能把资源账户当作业务租户。
- 仓库不固化个人邮箱或实际 Cloudflare 账户 ID。

## 影响

- 关联需求：FR-002、FR-012、FR-013、NFR-003–NFR-006、NFR-010、SEC-006、SEC-008。
- Gate：G0 确认账户事实；G1 验证 staging 控制平面。
