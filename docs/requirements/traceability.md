---
doc_id: REQ-TRACEABILITY
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 需求追踪矩阵

当前矩阵记录旧需求与候选设计的关系，不表示产品价值、架构或测试已经确认。所有需求
必须先获得发现证据；只有 `MVP` 产品功能可以进入接受评审。

| Requirement | Discovery dependency | Product evidence | Candidate design | Candidate ADR | Verification | Later Gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-001 | DQ-01、DQ-07 | 待 EVD-* | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-004（DRAFT） | 授权集成与越权测试 | G2 | DRAFT |
| FR-002 | DQ-06、DQ-07 | 待 EVD-* | [领域与数据](../technical/domain-and-data.md) | ADR-005（DRAFT） | 层级完整性集成测试 | G1 | DRAFT |
| FR-003 | DQ-06 | 待 EVD-* | [领域与数据](../technical/domain-and-data.md) | ADR-006（DRAFT） | 唯一约束与重跑测试 | G1 | DRAFT |
| FR-004 | DQ-06、DQ-08 | 待 EVD-* | [部署与运维](../technical/deployment-and-operations.md) | ADR-006（DRAFT） | 新鲜度与失败场景 E2E | G1/G2 | DRAFT |
| FR-005 | DQ-02、DQ-05、DQ-06 | 待 EVD-* | [Codex Skills](../technical/codex-skills.md) | ADR-001（DRAFT） | 代表性分析 fixture | G2 | DRAFT |
| FR-006 | DQ-02、DQ-06 | 待 EVD-* | [Codex Skills](../technical/codex-skills.md) | ADR-001（DRAFT） | 简报场景测试 | G2 | DRAFT |
| FR-007 | DQ-05、DQ-08 | 待 EVD-* | [Codex Skills](../technical/codex-skills.md) | ADR-003（DRAFT） | 证据与低置信度测试 | G2 | DRAFT |
| FR-008 | DQ-07、DQ-08 | 待 EVD-* | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-003（DRAFT） | 无外部副作用集成测试 | G4 | DRAFT |
| FR-009 | DQ-07、DQ-08 | 待 EVD-* | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-002（DRAFT） | 审批 E2E | G4 | DRAFT |
| FR-010 | DQ-07、DQ-08 | 待 EVD-* | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-006（DRAFT） | 过期、STALE、重放测试 | G4 | DRAFT |
| FR-011 | DQ-07 | 待 EVD-* | [系统架构](../technical/architecture.md) | ADR-002（DRAFT） | RBAC、敏感信息与可访问性 E2E | G3 | DRAFT |
| FR-012 | DQ-06、DQ-08 | 待 EVD-* | [部署与运维](../technical/deployment-and-operations.md) | ADR-001（DRAFT） | 离线调度测试 | G1 | DRAFT |
| FR-013 | DQ-08 | 待 EVD-* | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-005（DRAFT） | 审计完整性测试 | G1/G4 | DRAFT |
| FR-014 | DQ-08 | 待 EVD-* | [项目章程](../project/charter.md) | ADR-006（DRAFT） | Gate 与授权负向检查 | DG0/G0–G5 | DRAFT |
| FR-015 | DQ-06、BQ-09 | EVD-019、EVD-023；E-011、E-012 | [领域与数据](../technical/domain-and-data.md) | 待存储设计 ADR | 保留、删除和导出测试 | G1 | DRAFT |
| FR-016 | DQ-06、BQ-05 | 待 EVD-* | [Meta 接入](../technical/meta-integration-and-sync.md) | 待 DG0 | 外部转化数据契约测试 | Post-MVP | DRAFT |
| NFR-001 | DQ-01、DQ-08 | 待 EVD-* | [安全架构](../technical/security-architecture.md) | ADR-004（DRAFT） | 跨租户安全测试 | G1–G4 | DRAFT |
| NFR-002 | DQ-05、DQ-06 | 待 EVD-* | [领域与数据](../technical/domain-and-data.md) | ADR-003（DRAFT） | 指标公式与口径单元测试 | G1/G2 | DRAFT |
| NFR-003 | DQ-06、DQ-08 | 待 EVD-* | [领域与数据](../technical/domain-and-data.md) | ADR-005（DRAFT） | 重复同步与执行测试 | G1/G4 | DRAFT |
| NFR-004 | DQ-06 | 待 EVD-* | [Meta 接入](../technical/meta-integration-and-sync.md) | ADR-005（DRAFT） | 分页、限流、重试集成测试 | G1 | DRAFT |
| NFR-005 | DQ-06、DQ-08 | 待 EVD-* | [部署与运维](../technical/deployment-and-operations.md) | ADR-005（DRAFT） | 指标、日志和告警验证 | G1–G4 | DRAFT |
| NFR-006 | DQ-08 | 待 EVD-* | [部署与运维](../technical/deployment-and-operations.md) | ADR-005（DRAFT） | migration 与恢复演练 | G1/G4 | DRAFT |
| NFR-007 | DQ-07、DQ-08 | 待 EVD-* | [系统架构](../technical/architecture.md) | ADR-002（DRAFT） | accessibility 与响应式 E2E | G3 | DRAFT |
| NFR-008 | DQ-06、BQ-02 | 待 EVD-* | [部署与运维](../technical/deployment-and-operations.md) | 待 DG0 | 容量和延迟测试 | G1 | DRAFT |
| NFR-009 | DQ-07、DQ-08 | 待 EVD-* | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-003（DRAFT） | 契约与版本回归测试 | G1/G2 | DRAFT |
| NFR-010 | DQ-07、DQ-08 | 待 EVD-* | [系统架构](../technical/architecture.md) | ADR-005（DRAFT） | 架构与共享层评审 | G1 | DRAFT |
| SEC-001 | DQ-01、DQ-08 | 待 EVD-* | [安全架构](../technical/security-architecture.md) | ADR-004（DRAFT） | 认证授权负向测试 | G1–G4 | DRAFT |
| SEC-002 | DQ-07、DQ-08 | 待 EVD-* | [安全架构](../technical/security-architecture.md) | ADR-003（DRAFT） | 密钥、存储和日志泄密测试 | G1/G4 | DRAFT |
| SEC-003 | DQ-07、DQ-08 | 待 EVD-* | [Meta 接入](../technical/meta-integration-and-sync.md) | ADR-002（DRAFT） | 客户端凭据边界测试 | G1/G3 | DRAFT |
| SEC-004 | DQ-07、DQ-08 | 待 EVD-* | [API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-003（DRAFT） | 任意 URL/SQL/Graph 注入测试 | G2/G4 | DRAFT |
| SEC-005 | DQ-07、DQ-08 | 待 EVD-* | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-006（DRAFT） | 审批绕过测试 | G4 | DRAFT |
| SEC-006 | DQ-07、DQ-08 | 待 EVD-* | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-005（DRAFT） | 快照与审计完整性测试 | G4 | DRAFT |
| SEC-007 | DQ-08 | 待 EVD-* | [安全架构](../technical/security-architecture.md) | ADR-006（DRAFT） | Emergency stop 和缺省失败测试 | G4/G5 | DRAFT |
| SEC-008 | DQ-07、DQ-08 | 待 EVD-* | [部署与运维](../technical/deployment-and-operations.md) | ADR-005（DRAFT） | 环境绑定与密钥隔离审查 | G1 | DRAFT |
| SEC-009 | DQ-07、DQ-08 | 待 EVD-* | [日志规范](../standards/logging-and-observability.md) | ADR-003（DRAFT） | 日志与错误泄密测试 | G1–G4 | DRAFT |
| SEC-010 | DQ-07、DQ-08 | 待 EVD-* | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-006（DRAFT） | 重放、TTL 和 before hash 测试 | G4 | DRAFT |

## 状态推进

- `DRAFT`：必须有 `DQ-*` 或 `BQ-*` 依赖；候选设计不表示选型。
- `ACCEPTED`：必须来自已确认 `MVP` 功能，并引用具体 `EVD-*`、技术落点和验证方式。
- `SUPERSEDED`：必须保留替代或拒绝理由，不能静默删除稳定 ID。

当前所有 36 项需求均为 `DRAFT`。
