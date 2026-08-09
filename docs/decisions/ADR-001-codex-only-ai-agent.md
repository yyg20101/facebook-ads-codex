---
doc_id: ADR-001
type: decision
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-09
---

# ADR-001：前期 Codex 是唯一 AI Agent

> 接受依据：`EVD-023`、`EVD-024`、`EVD-025` 已确认前期 AI 入口、产品职责分工和对旧
> 形态的反证。本决策只约束前期，不宣称 Codex 永久是唯一 AI 入口。

## 背景

系统同时需要自然语言分析和确定性的身份、数据、审批及执行控制。若 Cloudflare
再实现独立 LLM Agent，会产生重复决策、上下文分裂和无法明确审计责任的问题。

## 备选方案评审

| 方案 | 结果 | 理由 |
| --- | --- | --- |
| 独立 Codex 会话 + 确定性 Web/服务端 | 采用 | 与 `PF-021` 和当前 Skills 工作方式一致，AI 与授权事实源分离。 |
| Web 内置第二 AI 会话 | 当前不采用 | `EVD-024` 已否定把 AI 壳层当作产品主体；`PF-022` 留待新价值证据。 |
| Cloudflare 内运行第二个 Agent | 当前不采用 | 增加重复推理、模型运行和审计边界，当前没有产品必要性。 |

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

## 风险与可逆性

- 风险：Codex 不可用时自然语言辅助中断；确定性 Web 状态、同步、审计和安全控制不得
  因此中断。
- 可逆性：中等。未来有独立价值证据时可新增 Web AI 或服务端 Agent，但必须通过新
  Product Feature、威胁评审和替代本 ADR 的新决策。

## 影响

- 关联需求：FR-005、FR-006、FR-012。
- 安全：模型不持有凭据，也不成为授权事实源。
- Gate：G2 验证 Codex 分析；G1 验证后台任务独立运行。
