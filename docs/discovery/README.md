---
doc_id: DISC-INDEX
type: index
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Product Discovery

本目录是在需求和技术设计前验证产品定义的唯一事实源。项目负责人已确认产品是完整
Meta 广告 Web 运营平台，前期 AI 助手使用独立 Codex 会话、上下文、信息文档和
Skills。三个核心场景和初步 MVP 边界仍为 `DRAFT`，不代表真实用户、可用性、外部市场
或广告效果验证。对应本地 Web 交互原型和 Codex 场景包已经实现，但尚未由项目负责人
完成 Gate 走查。

## 当前记录状态

```yaml
research_status: IN_PROGRESS
discovery_mode: OWNER_DIRECTED_PRODUCT_DEFINITION
required_user_interviews: 0
owner_decisions_recorded: 21
scenario_reviews_completed: 3
product_shape_decision: CONFIRMED
design_spec_review: READY_FOR_OWNER_WALKTHROUGH
prototype_implementation_status: COMPLETE
browser_qa_status: PASS
```

这些字段记录研究工作，不复制或扩大[项目状态与授权](../project/status-and-authorizations.md)。
`DG0` 当前结果只在[产品定义与 DG0](product-definition.md)中维护。

## 输出边界

本轮 Product Discovery 只允许形成：

- 明确的通用产品定位、支持用户类别和经验层级。
- 1–3 个核心 Job-to-be-Done。
- 问题、现有替代方案、价值主张和产品内容地图。
- 完整 Web 业务产品与独立 Codex 前期助手的形态和职责分工。
- `MVP`、`LATER`、`REJECTED` 功能清单。
- 内部试点成功指标、非目标和限制。

本轮不得宣称已验证外部客户、代理商、SaaS、多租户、定价或商业模式。

## 阅读与执行顺序

1. [发现问题](discovery-questions.md)：维护 `DQ-01`–`DQ-08`。
2. [产品定义确认计划](research-plan.md)：确定负责人决策、场景、质量和停止条件。
3. [访谈指南](interview-guide.md)：仅在未来另行启动真实用户研究时使用。
4. [证据登记](evidence-log.md)：只保存脱敏 `EVD-*`。
5. [候选解决方案](solution-hypotheses.md)：保存候选技术方向及其证据状态。
6. [产品形态验证](product-shape-validation.md)：定义 Web 平台与 Codex 的职责分工。
7. [全流程产品设计](../superpowers/specs/2026-07-30-meta-ads-operations-platform-design.md)：
   汇总信息架构、业务对象、核心流程、权限和失败处理。
8. [完整 Web 原型计划](../superpowers/plans/2026-07-30-full-web-platform-prototype.md)：
   实现已选产品形态和独立 Codex 辅助流程。
9. [Codex 辅助流程原型](codex-prototype/README.md)：定义三个场景的上下文、Skill、
   结构化输出和 Web 手动交接。
10. [产品定义与 DG0](product-definition.md)：综合证据并由项目负责人确认。

## 下一步执行

下一步由项目负责人按照[本地交互原型](../../prototype/README.md)连续走查三个 Web
场景，并对照 [Codex 场景包](codex-prototype/README.md)确认两层产品分工、关键步骤
覆盖率和关键误解。旧三形态静态故事板不再使用。该工作仍不包含业务运行时、真实 Meta
接入、Cloudflare 资源或部署。

## 执行规则

- 当前只收集产品负责人对定位、范围、优先级、行为、非目标和安全边界的明确决策。
- 不询问或保存项目负责人的个人投放经历。
- 至少建立 3 个不含真实账户或客户数据的代表性端到端场景。
- 产品原型必须表达完整 Web 运营流程和 Codex 辅助边界，不能用孤立说明卡替代任务验证。
- 负责人决策和场景评审必须登记 `EVD-*`；没有决定时保持 `UNRESOLVED`。
- 负责人决策不得被表述为真实用户或市场验证。
- 代表性场景少于 3 个、场景评审少于 3 次或任一核心 Gate 条件不满足时，`DG0`
  必须为 `PARTIAL`。
- `DG0` 未通过时，需求、ADR、技术和实现型规范不得转为 `ACCEPTED`。

## 启动与完成

研究启动语句和允许动作以[项目状态与授权](../project/status-and-authorizations.md)为准。
完成研究不自动启动原 Phase 0，也不构成外部访问、部署或 Meta 写授权。
