---
doc_id: ADR-004
type: decision
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# ADR-004：Cloudflare 账户不等于 Meta 租户

> 候选方案：本 ADR 尚未由用户问题和产品形态证据支持，`DG0` 前不具有约束力。

## 背景

Cloudflare 账户、系统 Workspace、Meta Business 和 Meta Ad Account 分别表示资源所有权、
业务授权和外部资产作用域。把它们一对一绑定会导致错误隔离和权限推导。

## 决策

- Cloudflare 账户表示部署和资源所有权边界。
- Workspace 是本系统的业务与授权租户边界。
- Meta Ad Account 是外部广告数据作用域。
- 这些实体 MUST 独立建模，不建立默认一对一关系。
- 所有业务查询在服务端应用 Workspace 过滤。

## 后果

- 一个控制平面可安全服务多个 Workspace 和 Meta 账户。
- 数据表、唯一约束和授权查询必须包含 Workspace 作用域。
- 跨 Workspace 汇总需要独立显式权限，默认拒绝。

## 影响

- 关联需求：FR-001、NFR-001、SEC-001。
- Gate：G1–G4 均必须包含跨租户负向测试。
