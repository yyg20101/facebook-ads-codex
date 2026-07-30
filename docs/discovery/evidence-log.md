---
doc_id: DISC-EVIDENCE
type: planning
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 产品发现证据登记

本页只保存脱敏产品定义证据。3 个代表性场景、完整 Web 运营平台原型和 Codex 辅助
流程已由负责人默认验收，`DG0` 已通过。旧三形态故事板已被负责人判定为不符合产品
形态，不再作为当前基线。

## 证据字段

每条证据必须包含：

```yaml
evidence_id: EVD-NNN
date: YYYY-MM-DD
source_alias: project_owner | P-NN
source_role: project-owner | sanitized-role
method: PROBLEM_INTERVIEW | PROTOTYPE_TEST | OWNER_DECISION | SCENARIO_REVIEW
evidence_type: FACT | INFERENCE | COUNTEREVIDENCE
source_context: product-decision-or-sanitized-example
finding: sanitized-summary
linked_questions: []
linked_tasks: []
confidence: LOW | MEDIUM | HIGH
limitations: []
```

`OWNER_DECISION` 定义产品意图、范围、优先级和治理边界，但不证明真实用户行为或市场
需求。`SCENARIO_REVIEW` 验证负责人定义的任务覆盖和方案一致性，也不构成真实用户
可用性验证。`PROBLEM_INTERVIEW` 和 `PROTOTYPE_TEST` 只在未来另行启动用户研究时使用。

## 证据记录

| Evidence ID | 日期 | 参与者别名 | 方法 | 类型 | 关联问题 | 发现 | 置信度 | 限制 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EVD-001 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-01、DQ-02、DQ-05、DQ-08 | 产品必须是面向广泛 Meta 广告使用者的通用投放与数据分析助手，而不是围绕项目负责人个人经历定制；本轮不要求额外用户访谈。 | HIGH | 这是负责人定义的产品目标，不构成真实用户、可用性或市场验证。 |
| EVD-002 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-03、DQ-05、DQ-06 | 最终产品必须覆盖从投放前素材准备、广告创建到投放后数据分析的端到端流程，而不是只解决单一环节。 | HIGH | 写操作、优化、报告、协作和自动化深度仍为 UNRESOLVED。 |
| EVD-003 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-06、DQ-08 | 产品采用分阶段操作深度：MVP 先提供素材与配置辅助、广告草稿、只读分析和建议；最终产品再支持明确批准后的广告操作及规则约束下的有限自动优化。 | HIGH | 具体操作白名单、审批、预算限制和自动化规则仍为 UNRESOLVED；不构成当前 Meta 写授权。 |
| EVD-004 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-03、DQ-05、DQ-06 | MVP 采用轻量完整闭环：素材辅助、广告草稿、用户发布、只读数据获取、数据分析和优化建议必须在首个可用版本中串联。 | HIGH | 每个阶段的具体输入、输出、验收和产品形态仍为 UNRESOLVED。 |
| EVD-005 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-06、DQ-07 | MVP 首选 Web 工作台为主体，并在工作台内置对话助手处理素材辅助、分析解释和优化建议。 | HIGH | 仍需使用代表性场景与纯 Web、纯 Codex 方案进行可比评审。 |
| EVD-006 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-01、DQ-08 | 用户与账户范围分阶段：MVP 先支持个人广告主和小团队，最终扩展到代理商、多客户管理和隔离。 | HIGH | 具体经验层级、角色权限、团队规模和多客户隔离模型仍为 UNRESOLVED。 |
| EVD-007 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-03、DQ-06、DQ-08 | 素材能力分阶段：MVP 支持现有素材管理与适配、AI 文案与图片及测试变体；后续增加有商业授权的素材搜索、视频编辑和 AI 视频生成。 | HIGH | 具体模型、供应商、生成质量、版权证明和 Meta 政策检查流程仍为 UNRESOLVED。 |
| EVD-008 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-03、DQ-06、DQ-08 | 广告创建能力分阶段：MVP 支持常用投放目标的引导式配置、完整广告草稿和发布前检查；后续覆盖全部目标和高级配置。 | HIGH | 常用目标清单、字段、验证规则和高级配置边界须在 Phase 0 对照 Meta 官方接口确认。 |
| EVD-009 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-04、DQ-05、DQ-06 | 数据分析能力分阶段：MVP 支持看板、趋势对比、多维筛选、异常发现、原因诊断和可执行建议；后续增加预测、复杂归因、跨账户比较和高级模型。 | HIGH | MVP 指标、维度、异常规则、诊断证据和高级模型边界仍为 UNRESOLVED。 |
| EVD-010 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-03、DQ-05、DQ-06、DQ-08 | MVP 使用 3 个代表性端到端场景定义范围：从目标简报到广告草稿、从只读投放数据到诊断建议，以及从素材变体到测试结论。 | HIGH | 场景验收细节、三种产品形态的可比评审和真实用户可用性均未完成。 |
| EVD-011 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-05、DQ-08 | MVP 产品形态评审以选定方案完成至少 80% 的场景关键步骤为主要标准，并要求不存在数据口径、权限边界或 Meta 写操作方面的关键误解；效率和广告效果提升延后到具备真实数据的阶段验证。 | HIGH | 关键步骤清单和评分方式仍需随低保真方案定义；不证明真实环境中的效率或广告效果。 |
| EVD-012 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-01、DQ-06、DQ-07、DQ-08 | MVP 使用同一套工作台覆盖新手到熟练投手：默认提供引导式流程和解释，并允许熟练用户切换高级配置，不拆分为两个独立产品。 | HIGH | 高级配置的具体范围、角色权限和适配效果仍需场景评审；不构成真实用户可用性验证。 |
| EVD-013 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-06、DQ-07 | 比较对话主导、纯 Web 工作台和混合工作台的职责与取舍后，负责人选定 Web 工作台加内置对话助手作为 MVP 产品形态：工作台承载对象、状态、数据和控制，助手承载生成、解释、诊断和建议。 | HIGH | 当前是负责人基于方案取舍作出的选择，尚未完成 `SC-01`–`SC-03` 的逐项场景评审。 |
| EVD-014 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-06、DQ-07、DQ-08 | 负责人确认 MVP 整体结构：主导航包含总览、素材、广告草稿、数据分析和素材测试；内置助手使用当前页面上下文；默认引导且可切换高级模式；助手产出保存为可检查对象；全局显示账户、时间范围、数据新鲜度和权限；MVP 只生成草稿与建议。 | HIGH | 具体页面布局、字段、移动端细节和三个核心场景的逐项评审仍待完成。 |
| EVD-015 | 2026-07-30 | project_owner | SCENARIO_REVIEW | FACT | DQ-02、DQ-03、DQ-05、DQ-06、DQ-08 | 负责人确认 `SC-01`：从目标简报、素材变体和引导式配置生成结构化广告草稿，执行分级发布前检查，保存版本与发布清单，最后由用户在 Meta 手动发布；关键缺失和版权或政策风险不得静默绕过。 | HIGH | 这是脱敏场景的范围与流程评审；具体 Meta 目标、字段、规格和政策须在 Phase 0 对照官方资料验证，也不构成真实用户可用性验证。 |
| EVD-016 | 2026-07-30 | project_owner | SCENARIO_REVIEW | FACT | DQ-02、DQ-04、DQ-05、DQ-06、DQ-08 | 负责人确认 `SC-02`：从明确账户、对象、时间、基线和数据口径的只读投放数据出发，定位异常，展示支持与反证，形成带置信度、风险、验证周期和停止条件的行动建议，并保存可复查诊断报告；建议保持未执行。 | HIGH | 这是脱敏场景的范围与流程评审；指标、归因、数据可用性和诊断效果须在 Phase 0 及后续真实数据阶段验证，也不构成真实用户可用性验证。 |
| EVD-017 | 2026-07-30 | project_owner | SCENARIO_REVIEW | FACT | DQ-02、DQ-03、DQ-05、DQ-06、DQ-08 | 负责人确认 `SC-03`：从素材变体和测试假设形成带主要指标、保护指标、最小数据条件、复查时间和停止规则的测试计划，监测有效性，输出带证据与置信度的 `KEEP`、`STOP`、`ITERATE` 或 `INCONCLUSIVE` 建议，并保存素材表现记录。 | HIGH | 这是脱敏场景的范围与流程评审；统计门槛、投放条件和实际增量效果须在 Phase 0 及后续真实数据阶段验证，也不构成真实用户可用性验证。 |
| EVD-018 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-01、DQ-05、DQ-06、DQ-08 | 负责人确认 MVP 功能边界：混合工作台、基础工作区与角色、素材和 AI 变体、广告草稿与发布前检查、只读数据看板、证据化诊断、素材测试和基础审计进入 MVP；Meta 写操作、有限自动化、高级投放、视频、代理商和高级分析延后；未批准修改、无授权素材、结果保证和猜测性结论明确排除。 | HIGH | 这是产品范围决定；具体 Meta、AI、指标、权限和实现契约仍需 Phase 0 与后续设计确认。 |
| EVD-019 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-01、DQ-06、DQ-08 | 负责人确认 MVP 权限与可信度设计：`Owner` 管理工作区、成员、账户连接和全局设置；`Editor` 编辑产品对象但不管理成员或连接；`Viewer` 只读查看与导出。助手继承用户权限和数据范围；结果显示来源、范围、时间、口径、置信度与状态；审计区分人工和助手行为；任何角色都不能在 MVP 中执行 Meta 写操作。 | HIGH | 这是产品级权限定义；身份系统、字段级权限、审计保留和未来写审批仍需技术设计与安全评审。 |
| EVD-020 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-03、DQ-04、DQ-05 | 负责人确认产品问题与价值主张：候选用户目前在 Meta Ads Manager、素材或 AI 工具、表格或报表及沟通文档之间切换，导致素材、配置、数据结论和测试知识割裂；产品以一个保留人工控制的可信工作台连接广告草稿、证据化建议和素材测试知识。MVP 不替代 Meta 发布能力，也不承诺广告效果。 | HIGH | 当前替代方式、频率、严重度和业务影响是负责人确认的产品假设，尚未经过真实用户或真实任务验证。 |
| EVD-021 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-06、DQ-07、DQ-08 | 负责人确认 MVP 终端、失败和验收设计：采用桌面优先的响应式 Web，移动端覆盖查看、诊断、对话、审核和轻量修改；对象显示可理解状态；失败保留输入并说明影响和安全重试方式；不支持的 Meta 内容不得近似替代；设计验收要求三个场景关键步骤覆盖率至少 80% 且无关键权限或数据误解。 | HIGH | 真实任务完成率、节省时间、诊断准确率和广告效果必须延后到可用原型或真实试点验证。 |
| EVD-022 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-07、DQ-08 | 项目负责人整体审阅并通过《Facebook Ads 通用投放与分析助手产品设计》，确认其产品形态、三个场景、MVP 边界、权限、安全和延期限制准确。 | HIGH | 该记录产生时规范通过尚未替代正确形态的完整原型走查，因此 `DG0` 当时继续为 `PARTIAL`；不授权运行时代码、外部访问、部署或 Meta 写操作。 |
| EVD-023 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-02、DQ-05、DQ-06、DQ-07、DQ-08 | 负责人确认最终产品是以 Web 工作台为主体、覆盖素材、广告创建与发布、投放管理、数据分析和持续优化全流程的 Meta 广告运营平台；前期 AI 助手位于独立 Codex 会话，通过上下文、信息文档和 Skills 工作，Web 前期不需要内置聊天入口。 | HIGH | 这是产品形态和目标能力决定；不构成当前运行时实现、真实 Meta 接入、部署或写操作授权，具体首期 Meta 写能力仍须后续 Gate 确认。 |
| EVD-024 | 2026-07-30 | project_owner | OWNER_DECISION | COUNTEREVIDENCE | DQ-06、DQ-07、DQ-08 | 负责人明确拒绝以三种静态故事板作为产品形态验证，认为其没有表达完整广告运营平台，并指出此前将验证工具当作产品主线是错误的；旧 Web 内置助手假设因此不再有效。 | HIGH | 该反证否定旧原型和验证方法，不否定已确认的三个广告业务场景；该记录产生时 `DG0` 为 `PARTIAL`，需要正确形态的完整流程原型。 |
| EVD-025 | 2026-07-30 | project_owner | OWNER_DECISION | FACT | DQ-08 | 项目负责人指示当前产品定义、完整 Web 原型和 Codex 场景包“先默认通过”，确认三条核心流程的关键步骤覆盖达到当前负责人验收门槛，且当前表达不存在数据范围、审批、权限或 Meta 写操作边界的关键误解；`DG0` 记录为 `PASS` 并继续 Phase 0。 | HIGH | 这是负责人主导的内部试点定义验收，只证明当前产品基线获得负责人接受；未执行真实用户任务测试，不证明市场、可用性、效率、诊断准确率或广告效果，也不扩大任何外部权限。 |

## 禁止内容

- 姓名、邮箱、电话、微信、部门中可识别个人的组合信息。
- 录音、视频、逐字稿、会议链接或身份映射。
- 客户名称、广告账户 ID、Campaign 名称或未脱敏指标。
- Token、Cookie、Authorization Header、Secret 或真实 API 响应。
- 将推断改写成参与者事实，或删除不支持候选方案的反证。

发现不安全材料时不得复制到仓库，应停止处理并请项目负责人先完成脱敏。
