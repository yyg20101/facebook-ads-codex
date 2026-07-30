---
doc_id: TECH-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 技术文档

本目录保存候选技术方案。产品方向已选择 Web 运营平台与前期 Codex 助手，但 `DG0`、
需求和 ADR 均未接受，因此技术内容只供后续比较，不得作为实现依据，也不得表述为
已选型、部署或验证。

| 文档 | 设计范围 |
| --- | --- |
| [系统架构](architecture.md) | 组件、责任、边界、拓扑和技术基线 |
| [领域与数据模型](domain-and-data.md) | 实体、D1、R2、指标粒度和幂等 |
| [Meta 接入与同步](meta-integration-and-sync.md) | 权限、Token、API、同步和回补 |
| [Codex Skills](codex-skills.md) | 前期上下文工作方式、六个候选聚焦 Skill 和输出 |
| [API 与 MCP 契约](api-and-mcp-contracts.md) | 认证、响应、工具和副作用边界 |
| [认证、审批与审计](auth-approval-and-audit.md) | RBAC、状态机、策略和审计 |
| [部署与运维](deployment-and-operations.md) | 环境、调度、可观测性和恢复 |
| [安全架构](security-architecture.md) | 资产、信任边界、威胁和控制 |

## 设计规则

- `DG0` 前只能维护候选方案，不能用技术可行性替代用户和问题证据。
- 技术设计必须引用需求 ID 和产品证据，不能自行改变需求。
- 长期或难以逆转的决策必须使用 ADR。
- 产品未知事实引用 `DQ-*`，后续业务值引用 `BQ-*`。
- 接口示例不得包含真实 Token、客户数据或账户标识。
- 实施后必须用测试和运行证据将对应设计状态从草案推进。
