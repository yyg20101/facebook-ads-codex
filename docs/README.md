---
doc_id: DOC-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-09
---

# 项目文档

本目录是 `facebook-ads-codex` 的唯一文档入口。项目采用按领域划分的事实源，
不再维护包含全部要求的单体执行规范。

## 当前状态

当前阶段、运行模式和授权布尔值只在
[项目状态与授权](project/status-and-authorizations.md)中维护。项目当前为
`READY_FOR_PHASE_0` / `PRODUCT_DISCOVERY_COMPLETE`。完整 Web 运营平台与独立 Codex
前期助手的内部试点产品定义、本地交互原型和 Codex 场景包已由负责人默认验收，
`DG0` 为 `PASS`；Phase 0 的 `BQ-01`–`BQ-12` 已全部回答。项目负责人决定暂时跳过
真实配置，因此 G0 为 `PARTIAL`；当前只额外授权使用虚构 fixture 的 Phase 1 离线脚手架。
负责人随后允许继续其中的离线只读汇总与周期诊断切片；这些切片不改变 Gate 或外部
授权。负责人又允许把周期诊断接入本地 Web 原型；该接入只使用固定开发代理与 fixture，
不启动正式 Web 阶段。当前又允许 Web 先从本地列表选择 fixture 账户，再请求所选账户
周期结果；现又允许在该账户下读取并导航 fixture Campaign、Ad Set 和 Ad，但周期指标
继续保留独立账户级范围。当前进一步允许对已验证 fixture 对象显式加载对象级周期
结果；这些切片仍不构成需求接受或实现证据，也不授权真实账户。
当前继续允许在已验证 Campaign 或 Ad Set 下显式读取直接子对象拆解，并要求两期四项
可加指标与父对象完全对账；该切片不选择赢家，也不扩大任何外部权限。
当前还允许为已验证 Campaign、Ad Set 或 Ad 显式加载 3–31 日固定 fixture 趋势，
一次只展示固定 9 项指标中的一项；该切片不解释趋势，也不改变 Gate 或外部权限。
当前进一步允许为已验证 Campaign 或 Ad Set 加载全部直接子对象的同期日趋势，并逐日
验证四项可加指标与父对象一致；结果按稳定 ID 展示，不排名、不判断赢家或解释趋势。
当前还允许对一个已验证 fixture 账户运行全层级离线数据质量报告；只有唯一粒度、完整
覆盖、统一口径、对象层级和三层逐日汇总全部通过才返回结果。该报告不评价广告表现，
也不形成 Gate 或真实 Meta 数据证据。
当前进一步要求把该通过结果作为本地 Web 指标分析的强制 preflight；账户、分析日期、
对象、指标口径和响应快照必须匹配，否则分析保持锁定或拒绝结果。凭证只存在页面内存，
不构成认证、授权、Gate 或真实数据证据。
当前还允许把已通过 preflight 的 comparison 或直接子对象拆解派生为确定性只读 JSON，
由负责人手动带入 Codex `facebook-ads-analysis` 会话。该输入不保存、不自动上传，也不
构成分析结论、建议、真实数据或外部授权。
当前进一步允许把已通过 preflight 的对象趋势或直接子对象趋势派生为 schema v2 手动
输入；完整固定 9 项日值和逐日父子对账仍只是 fixture 事实，不解释趋势或形成建议。
当前还允许显式调用仓库级 `facebook-ads-analysis`，对该 schema v2 fixture 输入先做
确定性校验，再生成区分事实、有限非因果推断和未知项的只读草稿。它不连接真实账户、
不排名、不应用业务阈值、不生成优化动作，也不改变任何 Gate 或外部授权。
当前进一步允许用五种固定 fixture 黄金场景、精确草稿契约和确定性评分器回归该 Skill；
评分只验证结构、证据和值、未知项、直接子对象覆盖和安全边界，不调用模型或外部工具。
五个不含黄金草稿的独立 Codex 会话测试包和手动结果评分器已经完成执行；最终 5/5
Case 均为 8/8，两项首次拒绝在收紧 Skill 后由全新会话重测通过。隔离协议仍只是操作者
声明，不能声称通用模型质量通过。
当前开发轨道还包含显式调用、fixture-only 的 `facebook-ads-creative`、Campaign
Builder、Daily Brief、Optimization 和 Change Management。五项已完成 schema v1、
确定性 preflight、不可执行草稿契约，并通过固定正反输入、CLI 文件安全和十一组黄金
草稿的 8/8 评分，状态为 `LOCAL_FIXTURE_VALIDATED`。`FWD-FBW-001`–`005` 五个无黄金
答案代表性独立会话最终均为 8/8：首次两项通过、三项拒绝，收紧契约后三项由新的无历史
会话复测通过。操作者声明的隔离协议未被技术独立验证，因此这些结果不形成产品、通用
模型、版权、Meta 审核、真实对象、审批、执行或 Gate 证据。
当前还完成两条 fixture-only 跨 Skill 手动交接链：Creative→Campaign Builder 与
Optimization→Change Management。校验器会拒绝范围或复制值漂移，并把预算、排期、
政策、审批等不可推导字段保留为人工输入；它不调用模型、不保存到 Web，也不形成外部
集成或 Gate 证据。
当前已完成 MVP 需求和 ADR 复核：42 项需求中 32 项为 `ACCEPTED`、10 项为 `DRAFT`；
ADR-001、ADR-002、ADR-004、ADR-006 已接受，ADR-003、ADR-005 保持草案。这不会改变
G0、运行时状态或任何外部授权。

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
- [离线控制平面脚手架](technical/offline-phase-1-scaffold.md)
- [离线只读分析](technical/offline-read-only-analysis.md)
- [离线周期对比与诊断](technical/offline-period-comparison-and-diagnostics.md)
- [离线 Web 分析接入](technical/offline-web-analysis-integration.md)
- [离线 Web 账户上下文](technical/offline-web-account-context.md)
- [离线广告对象层级](technical/offline-ad-object-hierarchy.md)
- [离线对象级分析](technical/offline-object-level-analysis.md)
- [离线直接子对象拆解](technical/offline-direct-child-breakdown.md)
- [离线对象日趋势](technical/offline-object-daily-trend.md)
- [离线直接子对象日趋势](technical/offline-direct-child-daily-trend.md)
- [离线数据质量报告](technical/offline-data-quality-report.md)
- [离线分析质量 Preflight](technical/offline-analysis-quality-preflight.md)
- [离线 Codex 分析证据包](technical/offline-codex-evidence-bundle.md)
- [离线 Codex 趋势证据包](technical/offline-codex-trend-evidence.md)
- [离线 Codex 分析 Skill](technical/offline-codex-analysis-skill.md)
- [离线 Codex 分析草稿评测](technical/offline-codex-analysis-evals.md)
- [离线 Codex 独立会话前向评测](technical/offline-codex-session-forward-test.md)
- [离线 Codex 素材 Skill](technical/offline-codex-creative-skill.md)
- [离线 Codex 工作流 Skills](technical/offline-codex-workflow-skills.md)
- [离线 Codex 工作流 Skills 独立会话前向评测](technical/offline-codex-workflow-session-forward-test.md)
- [离线 Codex 跨 Skill 手动工作流](technical/offline-codex-cross-skill-workflows.md)
- [本地控制平面 Runbook](runbooks/local-control-plane.md)

### 数据控制平面

- [系统架构](technical/architecture.md)
- [领域与数据模型](technical/domain-and-data.md)
- [Meta 接入与同步](technical/meta-integration-and-sync.md)
- [数据与迁移规范](standards/data-and-migrations.md)

### Codex 与 MCP

- [Codex Skills](technical/codex-skills.md)
- [离线 Codex 分析证据包](technical/offline-codex-evidence-bundle.md)
- [离线 Codex 趋势证据包](technical/offline-codex-trend-evidence.md)
- [离线 Codex 分析 Skill](technical/offline-codex-analysis-skill.md)
- [离线 Codex 分析草稿评测](technical/offline-codex-analysis-evals.md)
- [离线 Codex 独立会话前向评测](technical/offline-codex-session-forward-test.md)
- [离线 Codex 素材 Skill](technical/offline-codex-creative-skill.md)
- [离线 Codex 工作流 Skills](technical/offline-codex-workflow-skills.md)
- [离线 Codex 工作流 Skills 独立会话前向评测](technical/offline-codex-workflow-session-forward-test.md)
- [离线 Codex 跨 Skill 手动工作流](technical/offline-codex-cross-skill-workflows.md)
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
| 需求 | [需求索引](requirements/README.md) | 32 项 `ACCEPTED`；10 项 `DRAFT` |
| 技术设计 | [技术索引](technical/README.md) | `DRAFT` |
| 工程规范 | [规范索引](standards/README.md) | 治理已接受，实施规范为候选 |
| 架构决策 | [ADR 索引](decisions/README.md) | ADR-001、002、004、006 `ACCEPTED`；ADR-003、005 `DRAFT` |
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
