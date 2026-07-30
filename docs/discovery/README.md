---
doc_id: DISC-INDEX
type: index
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Product Discovery

本目录是在需求和技术设计前验证产品定义的唯一事实源。项目负责人已确认内部试点的
目标用户范围、问题与价值假设、产品形态、三个核心场景和 MVP 边界；这些结论仍为
`DRAFT`，且不代表真实用户、可用性、外部市场或广告效果验证。

## 当前记录状态

```yaml
research_status: IN_PROGRESS
discovery_mode: OWNER_DIRECTED_PRODUCT_DEFINITION
required_user_interviews: 0
owner_decisions_recorded: 19
scenario_reviews_completed: 3
design_spec_review: APPROVED
```

这些字段记录研究工作，不复制或扩大[项目状态与授权](../project/status-and-authorizations.md)。
`DG0` 当前结果只在[产品定义与 DG0](product-definition.md)中维护。

## 输出边界

本轮 Product Discovery 只允许形成：

- 明确的通用产品定位、支持用户类别和经验层级。
- 1–3 个核心 Job-to-be-Done。
- 问题、现有替代方案、价值主张和产品内容地图。
- 对话式、Web 工作台和混合式三种低保真方案的比较结论。
- `MVP`、`LATER`、`REJECTED` 功能清单。
- 内部试点成功指标、非目标和限制。

本轮不得宣称已验证外部客户、代理商、SaaS、多租户、定价或商业模式。

## 阅读与执行顺序

1. [发现问题](discovery-questions.md)：维护 `DQ-01`–`DQ-08`。
2. [产品定义确认计划](research-plan.md)：确定负责人决策、场景、质量和停止条件。
3. [访谈指南](interview-guide.md)：仅在未来另行启动真实用户研究时使用。
4. [证据登记](evidence-log.md)：只保存脱敏 `EVD-*`。
5. [候选解决方案](solution-hypotheses.md)：保存旧基线，不把它当作事实。
6. [产品形态验证](product-shape-validation.md)：使用相同任务比较三种形态。
7. [内部试点产品设计](../superpowers/specs/2026-07-30-facebook-ads-assistant-design.md)：
   汇总已确认的交互、场景、权限、失败处理和功能边界。
8. [DG0 低保真原型](prototypes/README.md)：使用同任务故事板完成三形态比较。
9. [产品定义与 DG0](product-definition.md)：综合证据并由项目负责人确认。

## 下一步执行

[DG0 原型验证计划](../superpowers/plans/2026-07-30-dg0-prototype-validation.md)只覆盖
三种低保真形态的同任务故事板、脱敏走查、确定性评分和 Gate 更新。它不包含运行时代码、
真实 Meta 接入、Cloudflare 资源或部署。

## 执行规则

- 当前只收集产品负责人对定位、范围、优先级、行为、非目标和安全边界的明确决策。
- 不询问或保存项目负责人的个人投放经历。
- 至少建立 3 个不含真实账户或客户数据的代表性端到端场景。
- 三种产品形态必须使用相同场景进行比较，不能用功能愿望替代任务验证。
- 负责人决策和场景评审必须登记 `EVD-*`；没有决定时保持 `UNRESOLVED`。
- 负责人决策不得被表述为真实用户或市场验证。
- 代表性场景少于 3 个、场景评审少于 3 次或任一核心 Gate 条件不满足时，`DG0`
  必须为 `PARTIAL`。
- `DG0` 未通过时，需求、ADR、技术和实现型规范不得转为 `ACCEPTED`。

## 启动与完成

研究启动语句和允许动作以[项目状态与授权](../project/status-and-authorizations.md)为准。
完成研究不自动启动原 Phase 0，也不构成外部访问、部署或 Meta 写授权。
