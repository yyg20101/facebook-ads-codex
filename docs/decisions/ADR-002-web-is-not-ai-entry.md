---
doc_id: ADR-002
type: decision
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# ADR-002：前期 Web 不重复实现 AI 会话入口

> 候选方案：`EVD-023`–`EVD-025` 已支持 Web 与 Codex 的产品职责分工；`DG0` 已
> 通过，但具体运行时架构和替代方案仍未评审，因此本 ADR 继续为 `DRAFT`。

## 背景

系统需要完整的素材、广告创建与管理、数据分析、测试、审批和安全控制界面。前期复制
Codex 对话能力会造成第二个 AI 入口、重复权限逻辑和行为不一致。

## 决策

Web Operations Platform 负责：

- 素材中心和素材表现关系。
- Campaign、Ad Set、Ad 创建与生命周期管理。
- 投放数据、诊断报告和测试记录。
- Meta 连接和账户配置。
- 变更预览、批准、拒绝和取消。
- 审计日志、权限和 Emergency stop。

前期自然语言生成和分析入口是 Codex。网页 MUST NOT 直接调用 Meta API，也不实现独立
AI 对话。Web 可以展示或保存 Codex 生成的结构化结果，但不能把模型输出当作已授权操作。

## 后果

- Web 专注确定性业务体验，AI 边界更清晰。
- Web 与 MCP 必须共享服务端业务和授权层。
- 分析体验依赖 Codex 可用性，但同步、审批状态和安全控制不依赖 Codex 在线。

## 影响

- 关联需求：FR-009、FR-011、SEC-003。
- Gate：G3 验证 Web 产品范围、RBAC 和敏感信息边界。
