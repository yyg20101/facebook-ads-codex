---
doc_id: ADR-004
type: decision
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-09
---

# ADR-004：Cloudflare 账户不等于 Meta 租户

> 接受依据：`EVD-006`、`EVD-019`、`EVD-023` 与 `BQ-01`、`BQ-11`、`BQ-12` 已确认
> 产品用户、Workspace 权限和基础设施所有权必须分别建模。实际 Cloudflare 账户事实
> 仍待验证，但不影响禁止从基础设施账户推导业务授权。

## 背景

Cloudflare 账户、系统 Workspace、Meta Business 和 Meta Ad Account 分别表示资源所有权、
业务授权和外部资产作用域。把它们一对一绑定会导致错误隔离和权限推导。

## 备选方案评审

| 方案 | 结果 | 理由 |
| --- | --- | --- |
| Cloudflare、Workspace、Meta Business、Ad Account 分离 | 采用 | 分别表达资源所有权、产品授权和外部资产范围，支持最小权限。 |
| Cloudflare 账户直接作为产品租户 | 不采用 | 基础设施成员关系不能证明用户可访问哪个广告账户。 |
| 直接用 Meta Business 或 Ad Account 作为产品租户 | 不采用 | 无法表达产品内成员、多个账户组合、审计和未来小团队权限。 |

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

## 风险与可逆性

- 风险：实体和授权查询比一对一映射更复杂，必须用服务端绑定和负向测试控制。
- 可逆性：低且不建议逆转。未来可以简化首期 UI，但不能把资源账户或外部 ID 重新
  解释为业务授权事实源。

## 影响

- 关联需求：FR-001、NFR-001、SEC-001。
- Gate：G1–G4 均必须包含跨租户负向测试。
