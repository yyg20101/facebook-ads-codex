---
doc_id: ADR-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 架构决策记录

`ACCEPTED` ADR 是对应长期架构问题的事实源。技术文档只解释如何落实决策。

## 已接受决策

| ADR | 决策 | 状态 |
| --- | --- | --- |
| [ADR-001](ADR-001-codex-only-ai-agent.md) | Codex 是唯一 AI Agent | `ACCEPTED` |
| [ADR-002](ADR-002-web-is-not-ai-entry.md) | 网页不是 AI 入口 | `ACCEPTED` |
| [ADR-003](ADR-003-skills-and-mcp-boundary.md) | Skill 与 MCP 分工固定 | `ACCEPTED` |
| [ADR-004](ADR-004-cloudflare-account-is-not-meta-tenant.md) | Cloudflare 账户不等于 Meta 租户 | `ACCEPTED` |
| [ADR-005](ADR-005-single-control-plane.md) | MVP 使用单一主控制平面 | `ACCEPTED` |
| [ADR-006](ADR-006-read-only-first.md) | 能力只读优先并逐级开放 | `ACCEPTED` |

## 新增 ADR 的条件

以下变化必须新增或取代 ADR：

- 改变系统边界、职责或主要数据流。
- 引入新的基础设施、存储或部署单元。
- 改变租户、认证、授权或密钥模型。
- 改变长期 MCP/HTTP 契约。
- 修改阶段顺序、Gate 或难以逆转的技术选择。

使用 [ADR 模板](ADR-TEMPLATE.md)，分配下一个连续编号。ADR 不得暗中扩大
[当前授权](../project/status-and-authorizations.md)或削弱[安全策略](../../SECURITY.md)。
