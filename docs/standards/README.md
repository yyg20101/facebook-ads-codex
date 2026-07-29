---
doc_id: STD-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 工程规范

本目录定义后续实现和文档变更必须遵守的工程规则。

| 文档 | 范围 |
| --- | --- |
| [工程规范](engineering.md) | TypeScript、结构、依赖和变更原则 |
| [API 与错误](api-and-errors.md) | schema、响应、分页、错误和版本 |
| [数据与迁移](data-and-migrations.md) | D1、R2、租户、幂等和 migration |
| [安全与密钥](security-and-secrets.md) | Secret、敏感数据和安全编码 |
| [测试规范](testing.md) | 单元、集成、E2E、安全和证据 |
| [日志与可观测性](logging-and-observability.md) | 日志字段、脱敏、指标和告警 |
| [文档规范](documentation.md) | 元数据、状态、ID、链接和权威 |
| [Git、评审与发布](git-review-and-release.md) | `dev`/`main`、提交和 Gate |

规范不能扩大[当前授权](../project/status-and-authorizations.md)，也不能削弱
[安全策略](../../SECURITY.md)。需要偏离 `MUST` 或长期偏离 `SHOULD` 时必须先记录并评审。
