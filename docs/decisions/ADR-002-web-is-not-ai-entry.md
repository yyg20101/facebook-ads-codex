---
doc_id: ADR-002
type: decision
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# ADR-002：网页不是 AI 入口

## 背景

系统需要配置、图表、审批和安全控制界面，但复制 Codex 对话能力会造成第二个 AI 入口、
重复权限逻辑和行为不一致。

## 决策

Web Control Console 只负责：

- Meta 连接和账户配置。
- 数据图表、新鲜度和同步状态。
- 变更预览、批准、拒绝和取消。
- 审计日志、权限和 Emergency stop。

日常分析和指令入口是 Codex。网页 MUST NOT 直接调用 Meta API，也不实现独立 AI 对话。

## 后果

- 网页范围更小，审批和安全边界更清晰。
- Web 与 MCP 必须共享服务端业务和授权层。
- 分析体验依赖 Codex 可用性，但同步、审批状态和安全控制不依赖 Codex 在线。

## 影响

- 关联需求：FR-009、FR-011、SEC-003。
- Gate：G3 验证控制台范围、RBAC 和敏感信息边界。
