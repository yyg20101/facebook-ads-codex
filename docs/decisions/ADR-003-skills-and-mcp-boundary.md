---
doc_id: ADR-003
type: decision
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# ADR-003：Skill 与 MCP 分工固定

## 背景

分析流程需要稳定指导，同时实时数据、身份和副作用必须由服务端控制。把两类能力混在
Skill 中会泄漏凭据并允许模型绕过授权。

## 决策

- Skill 保存流程、指标、诊断顺序、输出格式和安全规则。
- Remote MCP 提供实时数据、认证、授权和受控工具。
- Skill MUST NOT 保存 Meta Token、Cloudflare Token 或其他密钥。
- MCP 服务端 MUST 重新验证 Workspace、广告账户和操作权限。
- MCP 不信任模型传入的账户 ID、角色或任意 payload。

## 后果

- Skill 可以独立演进流程，不携带环境凭据。
- MCP 契约需要稳定 schema、错误、allowlist 和副作用标记。
- Codex 工具确认是附加防线，网页审批和服务端策略仍是强制控制。

## 影响

- 关联需求：FR-007、FR-008、NFR-002、NFR-009、SEC-002、SEC-004、SEC-009。
- Gate：G2 验证只读工具与分析；G4 验证写工具边界。
