---
doc_id: REQ-TRACEABILITY
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 需求追踪矩阵

每个 `ACCEPTED` 需求必须映射到设计、验证和 Gate。文档基线中的映射是实现计划输入，
不是测试已经通过的声明。

| Requirement | Source | Technical design | ADR | Verification | Gate | Status |
| --- | --- | --- | --- | --- | --- | --- |
| FR-001 | [功能需求](functional.md) | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-004 | 授权集成与越权测试 | G2 | ACCEPTED |
| FR-002 | [功能需求](functional.md) | [领域与数据](../technical/domain-and-data.md) | ADR-005 | 层级完整性集成测试 | G1 | ACCEPTED |
| FR-003 | [功能需求](functional.md) | [领域与数据](../technical/domain-and-data.md) | ADR-006 | D1 唯一约束与重跑测试 | G1 | ACCEPTED |
| FR-004 | [功能需求](functional.md) | [部署与运维](../technical/deployment-and-operations.md) | ADR-006 | 新鲜度与失败场景 E2E | G1/G2 | ACCEPTED |
| FR-005 | [功能需求](functional.md) | [Codex Skills](../technical/codex-skills.md) | ADR-001 | 代表性分析 fixture | G2 | ACCEPTED |
| FR-006 | [功能需求](functional.md) | [Codex Skills](../technical/codex-skills.md) | ADR-001 | 日报场景测试 | G2 | ACCEPTED |
| FR-007 | [功能需求](functional.md) | [Codex Skills](../technical/codex-skills.md) | ADR-003 | 证据与低置信度测试 | G2 | ACCEPTED |
| FR-008 | [功能需求](functional.md) | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-003 | 无外部副作用集成测试 | G4 | ACCEPTED |
| FR-009 | [功能需求](functional.md) | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-002 | 网页审批 E2E | G4 | ACCEPTED |
| FR-010 | [功能需求](functional.md) | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-006 | 过期、STALE、重放测试 | G4 | ACCEPTED |
| FR-011 | [功能需求](functional.md) | [系统架构](../technical/architecture.md) | ADR-002 | RBAC、敏感信息与可访问性 E2E | G3 | ACCEPTED |
| FR-012 | [功能需求](functional.md) | [部署与运维](../technical/deployment-and-operations.md) | ADR-001 | Codex 离线调度测试 | G1 | ACCEPTED |
| FR-013 | [功能需求](functional.md) | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-005 | 审计完整性测试 | G1/G4 | ACCEPTED |
| FR-014 | [功能需求](functional.md) | [项目章程](../project/charter.md) | ADR-006 | Gate 与授权负向检查 | G0–G5 | ACCEPTED |
| NFR-001 | [非功能需求](non-functional.md) | [安全架构](../technical/security-architecture.md) | ADR-004 | 跨租户安全测试 | G1–G4 | ACCEPTED |
| NFR-002 | [非功能需求](non-functional.md) | [领域与数据](../technical/domain-and-data.md) | ADR-003 | 指标公式与口径单元测试 | G1/G2 | ACCEPTED |
| NFR-003 | [非功能需求](non-functional.md) | [领域与数据](../technical/domain-and-data.md) | ADR-005 | 重复同步与执行测试 | G1/G4 | ACCEPTED |
| NFR-004 | [非功能需求](non-functional.md) | [Meta 接入](../technical/meta-integration-and-sync.md) | ADR-005 | 分页、限流、重试集成测试 | G1 | ACCEPTED |
| NFR-005 | [非功能需求](non-functional.md) | [部署与运维](../technical/deployment-and-operations.md) | ADR-005 | 指标、日志和告警验证 | G1–G4 | ACCEPTED |
| NFR-006 | [非功能需求](non-functional.md) | [部署与运维](../technical/deployment-and-operations.md) | ADR-005 | migration 与反向变更演练 | G1/G4 | ACCEPTED |
| NFR-007 | [非功能需求](non-functional.md) | [系统架构](../technical/architecture.md) | ADR-002 | accessibility 与响应式 E2E | G3 | ACCEPTED |
| NFR-009 | [非功能需求](non-functional.md) | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-003 | 契约与版本回归测试 | G1/G2 | ACCEPTED |
| NFR-010 | [非功能需求](non-functional.md) | [系统架构](../technical/architecture.md) | ADR-005 | 架构与共享层评审 | G1 | ACCEPTED |
| SEC-001 | [非功能需求](non-functional.md) | [安全架构](../technical/security-architecture.md) | ADR-004 | 认证授权负向测试 | G1–G4 | ACCEPTED |
| SEC-002 | [非功能需求](non-functional.md) | [安全架构](../technical/security-architecture.md) | ADR-003 | 密钥、存储和日志泄密测试 | G1/G4 | ACCEPTED |
| SEC-003 | [非功能需求](non-functional.md) | [Meta 接入](../technical/meta-integration-and-sync.md) | ADR-002 | 浏览器与 Skill 边界测试 | G1/G3 | ACCEPTED |
| SEC-004 | [非功能需求](non-functional.md) | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-003 | 任意 URL/SQL/Graph 注入测试 | G2/G4 | ACCEPTED |
| SEC-005 | [非功能需求](non-functional.md) | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-006 | 审批绕过测试 | G4 | ACCEPTED |
| SEC-006 | [非功能需求](non-functional.md) | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-005 | 快照与审计完整性测试 | G4 | ACCEPTED |
| SEC-007 | [非功能需求](non-functional.md) | [安全架构](../technical/security-architecture.md) | ADR-006 | Emergency stop 和缺省失败测试 | G4/G5 | ACCEPTED |
| SEC-008 | [非功能需求](non-functional.md) | [部署与运维](../technical/deployment-and-operations.md) | ADR-005 | 环境绑定与密钥隔离审查 | G1 | ACCEPTED |
| SEC-009 | [非功能需求](non-functional.md) | [日志规范](../standards/logging-and-observability.md) | ADR-003 | 日志与错误泄密测试 | G1–G4 | ACCEPTED |
| SEC-010 | [非功能需求](non-functional.md) | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-006 | 重放、TTL 和 before hash 测试 | G4 | ACCEPTED |

`FR-015`、`FR-016` 和 `NFR-008` 保持 `DRAFT`，分别由 `BQ-09`、`BQ-05`
和 `BQ-02` 阻塞；其验收条件关闭后再加入强制追踪检查。
