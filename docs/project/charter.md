---
doc_id: GOV-CHARTER
type: governance
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 项目章程

## 目的

构建一套以 Codex 为唯一 AI 决策与日常交互入口、以 Cloudflare 为数据和执行控制平面的
Facebook/Meta 广告管理系统。

系统最终应支持：

1. 安全读取多个已授权 Meta 广告账户的数据。
2. 统一 Campaign、Ad Set 和 Ad 层级的指标口径。
3. 生成日报、周期对比、异常诊断和有证据支持的优化建议。
4. 将建议转换为可审计的变更申请。
5. 仅在人工审批和确定性策略校验后执行有限写操作。
6. 仅在长期 Dry Run 验证后开放有预算、白名单和熔断边界的自动化。

## 规范词

- `MUST`：必须满足，否则不得进入下一 Gate。
- `MUST NOT`：禁止执行。
- `SHOULD`：默认满足，偏离前必须记录理由和影响。
- `MAY`：可选能力，不得阻塞 MVP。

## 产品边界

### MVP

- 一个或多个 Workspace，以及多个 Meta Business 和广告账户。
- Campaign、Ad Set、Ad 和 Insights 的只读同步。
- 账户、Campaign、Ad Set 和 Ad 层级的日粒度指标。
- Codex 自然语言分析、日报、异常诊断和建议。
- 网页控制台中的连接配置、数据状态、审批、审计和 Emergency stop。
- 变更申请与人工审批框架；外部写能力必须等待独立授权。

### 后续能力

- 审批后的暂停、启用和预算变更。
- Campaign、Ad Set 和 Ad 草稿创建。
- 创意与素材表现分析。
- 有边界的预算和状态自动化。
- CRM、Pixel、Conversions API 或线下转化数据。
- 其他广告平台。

### 非目标

MVP MUST NOT：

- 自动创建 Meta Business 或广告账户。
- 修改账单、支付方式或账户消费上限。
- 无审批删除 Campaign、Ad Set、Ad 或素材。
- 上传客户名单、自定义受众等个人数据。
- 使用 Codex Scheduled Task 代替服务端数据同步。
- 为每个 Meta 广告账户创建一个 Cloudflare 账户。
- 在浏览器中直接调用 Meta Marketing API。

## 系统责任边界

- Codex 负责理解、推理、分析、建议、报告和工具编排。
- Focused Skills 保存流程、指标语义、诊断顺序、输出格式和安全规则。
- Cloudflare Remote MCP 与 HTTP API 负责认证、授权、实时数据和受控操作。
- Cloudflare Worker、D1、R2、Queues 和 Workflows 负责确定性控制、存储和执行。
- Web Control Console 负责配置、状态、审批、审计和 Emergency stop，不是 AI 入口。
- Meta Marketing API 是外部数据源及后续受控写入目标。

Cloudflare 账户表示部署资源所有权，Workspace 表示本系统的业务与授权租户，
Meta Ad Account 表示广告数据作用域；三者 MUST 独立建模。

## 不可变边界

- Codex 是唯一 AI Agent，不得在 Cloudflare 中实现第二个独立决策 Agent。
- 浏览器和 Skill 不得保存或读取 Meta Token、Cloudflare Token 或根密钥。
- 服务端 MUST 重新计算工作空间和广告账户权限。
- MCP/HTTP MUST NOT 提供任意 SQL、任意 URL、任意 Graph API 或任意云 API 能力。
- 外部广告写操作只能执行已批准、未过期且 payload 不可变的 `change_request_id`。
- 租户隔离、幂等、before/after 快照、审计和 Emergency stop 不得绕过。
- 缺少 KPI、归因、预算、白名单或安全配置时必须安全失败。

详细安全政策以根目录
[SECURITY.md](../../SECURITY.md)为准，长期架构决策以
[ADR 索引](../decisions/README.md)中的 `ACCEPTED` 记录为准。

## 能力开放顺序

```text
READ_ONLY
  -> ADVISORY
  -> APPROVAL_REQUIRED
  -> BOUNDED_AUTONOMY
```

任何阶段不得跳过。阶段完成、代码存在或 Gate 通过都不能自动扩大
[项目状态与授权](status-and-authorizations.md)中的授权值。

## 变更治理

- 需求变化必须更新稳定需求 ID、验收条件和追踪矩阵。
- 长期架构边界变化必须通过 ADR。
- 权限扩大必须由项目负责人明确授权并更新授权事实源。
- 实现与已接受文档冲突时必须停止并报告，不得通过代码暗中改变策略。
- 文档版本保持 `1.0.0`，直到项目负责人决定建立后续发布版本。
