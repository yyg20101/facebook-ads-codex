---
doc_id: STD-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 工程规范

本目录同时包含已接受的治理规范和旧候选架构的实现型规范。当前 Phase 0 文档确认期间，
文档、Git 与根目录安全政策具有约束力；技术栈、API、数据、测试和可观测性规范仍须
随需求和架构评审，保持 `DRAFT`。

| 文档 | 范围 | 状态 |
| --- | --- | --- |
| [工程规范](engineering.md) | 候选 TypeScript、结构、依赖和变更原则 | `DRAFT` |
| [API 与错误](api-and-errors.md) | 候选 schema、响应、分页、错误和版本 | `DRAFT` |
| [数据与迁移](data-and-migrations.md) | 候选 D1、R2、租户、幂等和 migration | `DRAFT` |
| [安全与密钥](security-and-secrets.md) | 候选架构中的 Secret 和安全编码 | `DRAFT` |
| [测试规范](testing.md) | 候选单元、集成、E2E 和安全测试 | `DRAFT` |
| [日志与可观测性](logging-and-observability.md) | 候选日志字段、指标和告警 | `DRAFT` |
| [文档规范](documentation.md) | 元数据、状态、ID、链接和权威 | `ACCEPTED` |
| [Git、评审与发布](git-review-and-release.md) | `dev`/`main`、提交和 Gate | `ACCEPTED` |

规范不能扩大[当前授权](../project/status-and-authorizations.md)，也不能削弱
[安全策略](../../SECURITY.md)。需要偏离 `MUST` 或长期偏离 `SHOULD` 时必须先记录并评审。
