---
doc_id: REQ-TRACEABILITY
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 需求追踪矩阵

当前矩阵记录已确认产品能力、需求语义、候选技术落点和后续验证 Gate。`ACCEPTED`
只表示需求已获得产品证据并具备可验证落点，不表示实现完成、真实配置可用、对应 ADR
全部接受或 Gate 已通过。离线 fixture 结果只验证候选契约，不是接受需求的产品证据。

| Requirement | Discovery dependency | Product evidence | Candidate design | Candidate ADR | Verification | Later Gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-001 | DQ-01、DQ-07；BQ-01、BQ-02、BQ-11 | EVD-006、EVD-019、EVD-023 | [API 与 MCP](../technical/api-and-mcp-contracts.md)、[角色与权限](roles-and-permissions.md) | ADR-004（ACCEPTED） | 授权集成与越权测试 | G2/G3 | ACCEPTED |
| FR-002 | DQ-06、DQ-07；BQ-01 | EVD-015、EVD-016、EVD-023 | [领域与数据](../technical/domain-and-data.md)、[Meta 同步](../technical/meta-integration-and-sync.md)、[离线对象层级](../technical/offline-ad-object-hierarchy.md) | ADR-004（ACCEPTED）、ADR-005（DRAFT） | 层级完整性与同步集成测试 | G1 | ACCEPTED |
| FR-003 | DQ-06；BQ-03–BQ-08 | EVD-016、EVD-017、EVD-023 | [领域与数据](../technical/domain-and-data.md)、[离线对象分析](../technical/offline-object-level-analysis.md)、[离线数据质量](../technical/offline-data-quality-report.md) | ADR-006（ACCEPTED） | 唯一约束、日级完整性、父子汇总一致性与重跑测试 | G1 | ACCEPTED |
| FR-004 | DQ-06、DQ-08；BQ-03–BQ-08 | EVD-016、EVD-019、EVD-021、EVD-023 | [部署与运维](../technical/deployment-and-operations.md)、[Meta 同步](../technical/meta-integration-and-sync.md) | ADR-006（ACCEPTED） | 新鲜度、覆盖和失败场景 E2E | G1/G2/G3 | ACCEPTED |
| FR-005 | DQ-02、DQ-05、DQ-06；BQ-03–BQ-08 | EVD-009、EVD-016、EVD-023、EVD-025 | [Codex Skills](../technical/codex-skills.md)、[离线周期诊断](../technical/offline-period-comparison-and-diagnostics.md)、[离线分析 Skill](../technical/offline-codex-analysis-skill.md)、[草稿评测](../technical/offline-codex-analysis-evals.md) | ADR-001（ACCEPTED）、ADR-003（DRAFT） | 真实上下文、证据绑定、非因果边界、对象下钻与独立会话测试 | G2 | ACCEPTED |
| FR-006 | DQ-02、DQ-06 | EVD-009、EVD-016；每日必要性和触发规则未确认 | [Codex Skills](../technical/codex-skills.md)、[离线工作流 Skills](../technical/offline-codex-workflow-skills.md) | ADR-001（ACCEPTED） | 简报价值、触发、实质变化和无事输出测试 | G2 | DRAFT |
| FR-007 | DQ-05、DQ-08；BQ-03–BQ-08 | EVD-016、EVD-017、EVD-018 | [Codex Skills](../technical/codex-skills.md)、[离线工作流 Skills](../technical/offline-codex-workflow-skills.md) | ADR-003（DRAFT）、ADR-006（ACCEPTED） | 证据、反证、低置信度与无执行副作用测试 | G2 | ACCEPTED |
| FR-008 | DQ-07、DQ-08；BQ-10 | EVD-003、EVD-023；PF-011 为 LATER | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-003（DRAFT）、ADR-006（ACCEPTED） | 无外部副作用与 schema 测试 | G4 | DRAFT |
| FR-009 | DQ-07、DQ-08；BQ-10 | EVD-003、EVD-019、EVD-023；PF-011 为 LATER | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-002（ACCEPTED）、ADR-006（ACCEPTED） | 审批身份、状态机和 E2E | G4 | DRAFT |
| FR-010 | DQ-07、DQ-08；BQ-10 | EVD-003、EVD-019、EVD-023；PF-011 为 LATER | [API 与 MCP](../technical/api-and-mcp-contracts.md)、[认证与审批](../technical/auth-approval-and-audit.md) | ADR-006（ACCEPTED） | 过期、对象变化、策略和重放测试 | G4 | DRAFT |
| FR-011 | DQ-06–DQ-08；BQ-11 | EVD-021、EVD-023、EVD-025 | [系统架构](../technical/architecture.md)、[离线 Web 接入](../technical/offline-web-analysis-integration.md)、[产品原型](../../prototype/README.md) | ADR-002（ACCEPTED） | 三场景、RBAC、禁用能力、敏感信息、响应式与可访问性 E2E | G3 | ACCEPTED |
| FR-012 | DQ-06、DQ-08；BQ-08 | EVD-016、EVD-019、EVD-023 | [部署与运维](../technical/deployment-and-operations.md)、[Meta 同步](../technical/meta-integration-and-sync.md) | ADR-001（ACCEPTED）、ADR-005（DRAFT） | Codex 离线、调度、重试和状态记录测试 | G1 | ACCEPTED |
| FR-013 | DQ-08；BQ-09、BQ-10 | EVD-019、EVD-023 | [认证、审批与审计](../technical/auth-approval-and-audit.md)、[安全架构](../technical/security-architecture.md) | ADR-004（ACCEPTED）、ADR-005（DRAFT） | 审计字段、脱敏、追加完整性和权限测试 | G1/G3/G4 | ACCEPTED |
| FR-014 | DQ-08；BQ-10 | EVD-003、EVD-018、EVD-019、EVD-023 | [项目章程](../project/charter.md)、[状态与授权](../project/status-and-authorizations.md) | ADR-006（ACCEPTED） | Gate、授权组合和越级负向检查 | DG0/G0–G5 | ACCEPTED |
| FR-015 | DQ-06；BQ-09 | EVD-019、EVD-023；E-011、E-012 | [领域与数据](../technical/domain-and-data.md)、[安全架构](../technical/security-architecture.md) | ADR-005（DRAFT） | 保留、删除、断连加速删除和导出授权测试 | G1/G3 | ACCEPTED |
| FR-016 | DQ-06；BQ-05 | EVD-009、EVD-018；首期明确不依赖外部转化数据 | [Meta 接入](../technical/meta-integration-and-sync.md) | 新数据源 ADR（Post-MVP） | 数据源、身份匹配、隐私和指标契约测试 | Post-MVP | DRAFT |
| FR-017 | DQ-05、DQ-06、DQ-08 | EVD-007、EVD-015、EVD-018、EVD-023 | [领域与数据](../technical/domain-and-data.md)、[离线素材 Skill](../technical/offline-codex-creative-skill.md) | ADR-002（ACCEPTED）、ADR-003（DRAFT） | 来源、权利、版本、AI 标记和发布阻断测试 | G2/G3 | ACCEPTED |
| FR-018 | DQ-05、DQ-06、DQ-08 | EVD-007、EVD-017、EVD-023 | [Codex Skills](../technical/codex-skills.md)、[离线素材 Skill](../technical/offline-codex-creative-skill.md) | ADR-001（ACCEPTED）、ADR-003（DRAFT） | 输入事实、权利、单变量、人工评审和无外部副作用测试 | G2/G3 | ACCEPTED |
| FR-019 | DQ-05、DQ-06；BQ-03、BQ-04 | EVD-008、EVD-015、EVD-023 | [领域与数据](../technical/domain-and-data.md)、[API 与 MCP](../technical/api-and-mcp-contracts.md)、[离线工作流 Skills](../technical/offline-codex-workflow-skills.md) | ADR-002（ACCEPTED）、ADR-003（DRAFT） | 必填字段、上下文枚举、版本差异和虚假创建声明测试 | G2/G3 | ACCEPTED |
| FR-020 | DQ-06、DQ-08；BQ-10 | EVD-015、EVD-018、EVD-023 | [认证、审批与审计](../technical/auth-approval-and-audit.md)、[离线工作流 Skills](../technical/offline-codex-workflow-skills.md) | ADR-002（ACCEPTED）、ADR-006（ACCEPTED） | 分级检查、阻断、人工交接、状态来源和审核失败回链 E2E | G3 | ACCEPTED |
| FR-021 | DQ-05、DQ-06；BQ-03–BQ-08 | EVD-017、EVD-018、EVD-023 | [领域与数据](../technical/domain-and-data.md)、[Codex Skills](../technical/codex-skills.md)、[离线工作流 Skills](../technical/offline-codex-workflow-skills.md) | ADR-001（ACCEPTED）、ADR-003（DRAFT）、ADR-006（ACCEPTED） | 有效性、单变量、最小数据、INCONCLUSIVE 和非因果测试 | G2/G3 | ACCEPTED |
| FR-022 | DQ-06–DQ-08 | EVD-019、EVD-023、EVD-025 | [Codex Skills](../technical/codex-skills.md)、[跨 Skill 手动工作流](../technical/offline-codex-cross-skill-workflows.md)、[API 与 MCP](../technical/api-and-mcp-contracts.md) | ADR-001（ACCEPTED）、ADR-002（ACCEPTED）、ADR-003（DRAFT） | schema、来源、跨阶段字段连续性、人工评审、权限不提升和无副作用 E2E | G2/G3 | ACCEPTED |
| NFR-001 | DQ-01、DQ-08；BQ-01、BQ-11 | EVD-006、EVD-019、EVD-023 | [安全架构](../technical/security-architecture.md)、[领域与数据](../technical/domain-and-data.md) | ADR-004（ACCEPTED） | 跨 Workspace、ID 枚举和绑定安全测试 | G1–G4 | ACCEPTED |
| NFR-002 | DQ-05、DQ-06；BQ-03–BQ-08 | EVD-016、EVD-017、EVD-023 | [指标与报告](metrics-and-reporting.md)、[领域与数据](../technical/domain-and-data.md)、[离线数据质量](../technical/offline-data-quality-report.md) | ADR-003（DRAFT）、ADR-006（ACCEPTED） | 指标公式、口径兼容、连续覆盖、零分母和快照绑定测试 | G1/G2 | ACCEPTED |
| NFR-003 | DQ-06、DQ-08；BQ-08 | EVD-016、EVD-019、EVD-023 | [领域与数据](../technical/domain-and-data.md)、[Meta 同步](../technical/meta-integration-and-sync.md) | ADR-005（DRAFT）、ADR-006（ACCEPTED） | 重复同步、回补和任务重试测试 | G1 | ACCEPTED |
| NFR-004 | DQ-06；BQ-02、BQ-08 | EVD-016、EVD-023 | [Meta 接入](../technical/meta-integration-and-sync.md)、[部署与运维](../technical/deployment-and-operations.md) | ADR-005（DRAFT） | 分页、限流、上限重试、异步报表和部分失败测试 | G1 | ACCEPTED |
| NFR-005 | DQ-06、DQ-08 | EVD-016、EVD-019、EVD-023 | [部署与运维](../technical/deployment-and-operations.md)、[日志规范](../standards/logging-and-observability.md) | ADR-005（DRAFT） | 新鲜度、失败、限流、质量、延迟和告警验证 | G1–G3 | ACCEPTED |
| NFR-006 | DQ-08；BQ-09 | EVD-019、EVD-023 | [部署与运维](../technical/deployment-and-operations.md)、[领域与数据](../technical/domain-and-data.md) | ADR-005（DRAFT） | migration、前向修复、恢复与审计保留演练 | G1 | ACCEPTED |
| NFR-007 | DQ-07、DQ-08 | EVD-021、EVD-023、EVD-025 | [系统架构](../technical/architecture.md)、[产品原型](../../prototype/README.md) | ADR-002（ACCEPTED） | accessibility、响应式和关键流程 E2E | G3 | ACCEPTED |
| NFR-008 | DQ-06；BQ-02 | EVD-006、EVD-021；真实容量和延迟阈值未测量 | [部署与运维](../technical/deployment-and-operations.md) | ADR-005（DRAFT） | 真实账户容量、日期范围、并发和延迟测试 | G1 | DRAFT |
| NFR-009 | DQ-07、DQ-08 | EVD-016、EVD-019、EVD-023 | [API 与 MCP](../technical/api-and-mcp-contracts.md)、[Meta 接入](../technical/meta-integration-and-sync.md) | ADR-003（DRAFT） | API 版本、schema、兼容和回归测试 | G1/G2 | ACCEPTED |
| NFR-010 | DQ-07、DQ-08；BQ-12 | EVD-023；控制平面与传输替代方案未完成 | [系统架构](../technical/architecture.md) | ADR-003（DRAFT）、ADR-005（DRAFT） | 架构替代方案、共享层和部署单元评审 | G1 | DRAFT |
| SEC-001 | DQ-01、DQ-08；BQ-11 | EVD-019、EVD-023 | [安全架构](../technical/security-architecture.md)、[角色与权限](roles-and-permissions.md) | ADR-004（ACCEPTED） | 认证映射、最小权限和授权负向测试 | G1–G4 | ACCEPTED |
| SEC-002 | DQ-07、DQ-08；BQ-11 | EVD-019、EVD-023 | [安全架构](../technical/security-architecture.md)、[密钥规范](../standards/security-and-secrets.md) | ADR-003（DRAFT）、ADR-005（DRAFT） | 密钥、存储、浏览器、Skill 和日志泄密测试 | G1/G2/G4 | ACCEPTED |
| SEC-003 | DQ-07、DQ-08；BQ-11 | EVD-016、EVD-019、EVD-023 | [Meta 接入](../technical/meta-integration-and-sync.md)、[安全架构](../technical/security-architecture.md) | ADR-002（ACCEPTED） | 客户端凭据边界和直连阻断测试 | G1/G3 | ACCEPTED |
| SEC-004 | DQ-07、DQ-08 | EVD-016、EVD-019、EVD-023 | [API 与 MCP](../technical/api-and-mcp-contracts.md)、[安全架构](../technical/security-architecture.md) | ADR-003（DRAFT） | 任意 URL、SQL、Graph path 和能力扩大负向测试 | G2/G4 | ACCEPTED |
| SEC-005 | DQ-07、DQ-08；BQ-10 | EVD-003、EVD-019、EVD-023；PF-011 为 LATER | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-006（ACCEPTED） | 审批身份、不可变 payload 和绕过测试 | G4 | DRAFT |
| SEC-006 | DQ-07、DQ-08；BQ-09 | EVD-019、EVD-023 | [认证、审批与审计](../technical/auth-approval-and-audit.md)、[安全架构](../technical/security-architecture.md) | ADR-004（ACCEPTED）、ADR-005（DRAFT） | 审计追加完整性、脱敏、关联和未来快照测试 | G1/G3/G4 | ACCEPTED |
| SEC-007 | DQ-08；BQ-10 | EVD-003、EVD-018、EVD-019；PF-011、PF-012 为 LATER | [安全架构](../technical/security-architecture.md) | ADR-006（ACCEPTED） | Emergency stop、缺省失败和审计测试 | G4/G5 | DRAFT |
| SEC-008 | DQ-07、DQ-08；BQ-11、BQ-12 | EVD-019、EVD-023 | [部署与运维](../technical/deployment-and-operations.md)、[安全架构](../technical/security-architecture.md) | ADR-005（DRAFT） | 环境绑定、资源和密钥隔离审查 | G1 | ACCEPTED |
| SEC-009 | DQ-07、DQ-08 | EVD-019、EVD-023 | [日志规范](../standards/logging-and-observability.md)、[安全架构](../technical/security-architecture.md) | ADR-003（DRAFT） | 成功、失败和重试路径日志与错误泄密测试 | G1–G4 | ACCEPTED |
| SEC-010 | DQ-07、DQ-08；BQ-10 | EVD-003、EVD-019、EVD-023；PF-011 为 LATER | [认证、审批与审计](../technical/auth-approval-and-audit.md) | ADR-006（ACCEPTED） | 重放、TTL、before hash、幂等和状态测试 | G4 | DRAFT |

## 状态推进

- `DRAFT`：必须有 `DQ-*` 或 `BQ-*` 依赖；候选设计不表示选型。
- `ACCEPTED`：必须来自已确认 `MVP` 功能，并引用具体 `EVD-*`、技术落点和验证方式。
- `SUPERSEDED`：必须保留替代或拒绝理由，不能静默删除稳定 ID。

本轮共复核 42 项需求：32 项 `ACCEPTED`，10 项保持 `DRAFT`。新增 `FR-017`–`FR-022`
用于补齐旧需求体系未覆盖的素材、AI 变体、广告草稿、发布前检查、素材测试和 Codex 与
Web 结构化交接；旧编号未重新分配。
