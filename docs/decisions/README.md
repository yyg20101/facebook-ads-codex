---
doc_id: ADR-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-09
---

# 架构决策记录

`DG0` 通过后已按产品证据、Phase 0 事实、安全边界、替代方案和可逆性重新评审六项旧
决策。ADR-001、ADR-002、ADR-004、ADR-006 已接受；ADR-003 仍需决定实时服务端工具
是否采用 Remote MCP，ADR-005 仍需外部 Cloudflare 事实和控制平面方案比较。

`ACCEPTED` ADR 只约束其明确决策范围，不表示候选技术文档整体选型、G0 通过、运行时
可用、外部资源可访问或部署/Meta 写操作获得授权。

## 候选决策

| ADR | 决策 | 状态 |
| --- | --- | --- |
| [ADR-001](ADR-001-codex-only-ai-agent.md) | 前期 Codex 是唯一 AI Agent | `ACCEPTED` |
| [ADR-002](ADR-002-web-is-not-ai-entry.md) | 前期 Web 不重复实现 AI 会话入口 | `ACCEPTED` |
| [ADR-003](ADR-003-skills-and-mcp-boundary.md) | Skill 与 MCP 分工固定 | `DRAFT` |
| [ADR-004](ADR-004-cloudflare-account-is-not-meta-tenant.md) | Cloudflare 账户不等于 Meta 租户 | `ACCEPTED` |
| [ADR-005](ADR-005-single-control-plane.md) | MVP 使用单一主控制平面 | `DRAFT` |
| [ADR-006](ADR-006-read-only-first.md) | 能力只读优先并逐级开放 | `ACCEPTED` |

## 接受条件

候选 ADR 只有在以下条件同时满足时才能改为 `ACCEPTED`：

- `DG0` 已通过，且产品定义证明该架构问题真实存在。
- 关联的 MVP 功能和产品证据已记录。
- 至少比较一个可行替代方案，并说明后果、风险和可逆性。
- 技术设计、安全政策和当前授权没有冲突。

## 新增 ADR 的条件

以下变化必须新增或取代 ADR：

- 改变系统边界、职责或主要数据流。
- 引入新的基础设施、存储或部署单元。
- 改变租户、认证、授权或密钥模型。
- 改变长期 MCP/HTTP 契约。
- 修改阶段顺序、Gate 或难以逆转的技术选择。

使用 [ADR 模板](ADR-TEMPLATE.md)，分配下一个连续编号。ADR 不得暗中扩大
[当前授权](../project/status-and-authorizations.md)或削弱[安全策略](../../SECURITY.md)。
