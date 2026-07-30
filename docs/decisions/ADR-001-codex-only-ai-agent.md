---
doc_id: ADR-001
type: decision
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# ADR-001：前期 Codex 是唯一 AI Agent

> 候选方案：`EVD-023` 已支持前期使用 Codex 的产品方向；长期唯一性、工具与运行时
> 边界仍须在 `DG0` 后评审，因此本 ADR 继续为 `DRAFT`。

## 背景

系统同时需要自然语言分析和确定性的身份、数据、审批及执行控制。若 Cloudflare
再实现独立 LLM Agent，会产生重复决策、上下文分裂和无法明确审计责任的问题。

## 决策

- 前期 Codex 负责生成、理解、推理、分析、建议、报告和工具编排。
- Web 和候选 Cloudflare 服务 MUST NOT 在前期实现第二个独立聊天或 LLM 决策系统。
- Cloudflare 只负责数据、认证、授权、任务、存储、策略、执行和审计。
- 服务端后台任务独立于 Codex 在线状态。
- 未来增加 Web 内置 AI 或更换 AI 入口必须以新证据和 ADR 重新评审。

## 后果

- AI 行为集中在 Codex 和 Focused Skills，便于维护与审查。
- Cloudflare 服务保持确定性、可测试和可审计。
- Scheduled Tasks 可以触发报告，但不能取代服务端同步或外部执行控制。

## 影响

- 关联需求：FR-005、FR-006、FR-012。
- 安全：模型不持有凭据，也不成为授权事实源。
- Gate：G2 验证 Codex 分析；G1 验证后台任务独立运行。
