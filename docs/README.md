---
doc_id: DOC-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-05
---

# 项目文档

本目录是 `facebook-ads-codex` 的唯一文档入口。项目采用按领域划分的事实源，
不再维护包含全部要求的单体执行规范。

## 当前状态

当前阶段、运行模式和授权布尔值只在
[项目状态与授权](project/status-and-authorizations.md)中维护。项目当前为
`READY_FOR_PHASE_0` / `PRODUCT_DISCOVERY_COMPLETE`。完整 Web 运营平台与独立 Codex
前期助手的内部试点产品定义、本地交互原型和 Codex 场景包已由负责人默认验收，
`DG0` 为 `PASS`；Phase 0 的 `BQ-01`–`BQ-12` 已全部回答，G0 因尚未取得真实 Meta
只读接入证据而未评估。

## 权威边界

| 领域 | 唯一事实源 | 说明 |
| --- | --- | --- |
| 项目目标、范围和全局边界 | [项目章程](project/charter.md) | 任何领域文档不得扩大章程范围 |
| 当前阶段和授权 | [项目状态与授权](project/status-and-authorizations.md) | 其他文档不得复制授权值 |
| 安全政策 | [根目录安全策略](../SECURITY.md) | 技术设计和编码规范不得削弱安全不变量 |
| 产品问题与证据 | [产品发现](discovery/README.md) | `DQ-*`、`EVD-*`、形态验证和 `DG0` |
| 产品行为与验收 | [需求文档](requirements/README.md) | 使用稳定需求 ID |
| 候选架构与实现契约 | [技术文档](technical/README.md) | `DG0` 前不得作为实施依据 |
| 工程实践 | [规范文档](standards/README.md) | 约束代码、数据、测试和发布 |
| 长期架构决策 | [ADR 索引](decisions/README.md) | 仅 `ACCEPTED` ADR 具有约束力 |
| 阶段、Gate 和证据 | [规划文档](planning/roadmap.md) | Gate 必须由证据通过 |
| 运维步骤 | [Runbook 索引](runbooks/README.md) | 未实际验证只能标记为草案 |

用户当前明确指令和平台安全要求始终优先。不同领域发生冲突时，必须停止受影响工作，
记录冲突，并通过需求变更或 ADR 解决；不得自行选择更宽松的解释。

## 按任务阅读

### 任何工作

1. [项目章程](project/charter.md)
2. [项目状态与授权](project/status-and-authorizations.md)
3. [安全策略](../SECURITY.md)
4. 当前任务所属领域的需求、技术和规范文档

### Product Discovery

- [产品发现入口](discovery/README.md)
- [发现问题](discovery/discovery-questions.md)
- [研究计划](discovery/research-plan.md)
- [产品形态验证](discovery/product-shape-validation.md)
- [全流程产品设计](superpowers/specs/2026-07-30-meta-ads-operations-platform-design.md)
- [完整 Web 原型计划](superpowers/plans/2026-07-30-full-web-platform-prototype.md)
- [本地交互原型](../prototype/README.md)
- [视觉一致性记录](../prototype/design/fidelity-ledger.md)
- [Codex 辅助流程原型](discovery/codex-prototype/README.md)
- [产品定义与 DG0](discovery/product-definition.md)

### Phase 0

- 前置条件：[产品定义与 DG0](discovery/product-definition.md)为 `PASS`。
- [产品需求](requirements/product.md)
- [Phase 0 问卷](planning/phase-0-questionnaire.md)
- [Gate 与证据](planning/gates-and-evidence.md)
- [Meta 只读连接验证 Runbook](runbooks/meta-read-connection.md)

### 数据控制平面

- [系统架构](technical/architecture.md)
- [领域与数据模型](technical/domain-and-data.md)
- [Meta 接入与同步](technical/meta-integration-and-sync.md)
- [数据与迁移规范](standards/data-and-migrations.md)

### Codex 与 MCP

- [Codex Skills](technical/codex-skills.md)
- [API 与 MCP 契约](technical/api-and-mcp-contracts.md)
- [API 与错误规范](standards/api-and-errors.md)

### 审批式写操作

- [认证、审批与审计](technical/auth-approval-and-audit.md)
- [安全架构](technical/security-architecture.md)
- [安全与密钥规范](standards/security-and-secrets.md)

## 文档地图

| 分类 | 入口 | 状态 |
| --- | --- | --- |
| 项目治理 | [项目章程](project/charter.md) | `ACCEPTED` |
| 产品发现 | [发现入口](discovery/README.md) | `ACCEPTED` |
| 需求 | [需求索引](requirements/README.md) | 全部 `DRAFT` |
| 技术设计 | [技术索引](technical/README.md) | `DRAFT` |
| 工程规范 | [规范索引](standards/README.md) | 治理已接受，实施规范为候选 |
| 架构决策 | [ADR 索引](decisions/README.md) | ADR-001–006 `DRAFT` |
| 实施规划 | [路线图](planning/roadmap.md) | `DRAFT` |
| 运维手册 | [Runbook 索引](runbooks/README.md) | Meta 只读验证流程为 `DRAFT` |
| 术语 | [术语表](glossary.md) | `ACCEPTED` |

## 官方参考

- [OpenAI Codex Skills](https://developers.openai.com/plugins/build/skills)
- [OpenAI Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp)
- [OpenAI Plugins](https://developers.openai.com/plugins/build/plugins)
- [OpenAI Scheduled Tasks](https://learn.chatgpt.com/docs/automations)
- [Meta Marketing API](https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi)
- [Meta Insights API](https://www.postman.com/meta/facebook-marketing-api/folder/zzd6d5p/insights-api)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/how-r2-works/)
- [Cloudflare Secrets Store](https://developers.cloudflare.com/secrets-store/integrations/workers/)
- [Cloudflare Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)

外部链接可用性不作为仓库 CI 的阻塞条件；引用内容进入设计前仍需人工核验。
