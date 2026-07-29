# 架构决策记录

> **权威级别：导航。**
>
> 当前已接受 ADR 的规范正文位于执行规范 `v1.0.0` 第 2 节。本文只提供索引和摘要，
> 不重新定义决策。

## 已接受决策

| ADR | 决策 | 摘要 |
| --- | --- | --- |
| [ADR-001](../FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md#adr-001codex-是唯一-ai-agent) | Codex 是唯一 AI Agent | Cloudflare 不实现第二个聊天或 LLM 决策系统。 |
| [ADR-002](../FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md#adr-002网页不是-ai-入口) | 网页不是 AI 入口 | 网页只负责配置、状态、审批、审计和紧急停止。 |
| [ADR-003](../FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md#adr-003skill-与-mcp-分工固定) | Skill 与 MCP 分工固定 | Skill 保存流程；MCP 提供实时数据、授权和受控操作。 |
| [ADR-004](../FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md#adr-004cloudflare-账户不等于-meta-租户) | Cloudflare 账户不等于 Meta 租户 | 部署所有权与业务租户独立建模。 |
| [ADR-005](../FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md#adr-005单一主控制平面) | 单一主控制平面 | MVP 的 Cloudflare 资源位于同一个明确主账户。 |
| [ADR-006](../FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md#adr-006只读优先) | 只读优先 | 能力按 READ_ONLY 到 BOUNDED_AUTONOMY 顺序开放。 |

## 新增 ADR

只有满足以下任一条件时才应新增 ADR：

- 改变系统边界、职责或主要数据流。
- 引入新的基础设施、存储或部署单元。
- 改变租户、认证、授权或密钥模型。
- 改变公开 MCP/HTTP 接口的长期约束。
- 修改阶段顺序、Gate 或不可逆技术选择。

新增时：

1. 复制 [`ADR-TEMPLATE.md`](ADR-TEMPLATE.md)。
2. 使用下一个连续编号，例如 `ADR-007-short-title.md`。
3. 将状态设为 `Proposed`，记录上下文、选项和后果。
4. 明确安全、租户、迁移、回滚、接口和 Gate 影响。
5. 用户接受后再将状态改为 `Accepted`。
6. 同步更新执行规范版本、本文索引和变更日志。

不得用 ADR 暗中扩大授权或绕过执行规范的安全边界。
