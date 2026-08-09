---
doc_id: DISC-CODEX-SKILL-CONTRACTS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# Codex 候选 Skill 契约

本页定义 Product Discovery 原型所需的最小 Skill 行为。Skill 名称、目录、工具和输出
schema 仍是候选设计；本页不授权创建凭据、实时连接或外部写工具。

`facebook-ads-analysis` 已在单独授权的固定 fixture 离线切片中落地并完成确定性验证；
它位于 `.agents/skills/facebook-ads-analysis/`。`facebook-ads-creative`、Campaign
Builder、Daily Brief、Optimization 和 Change Management 五项 fixture-only 开发产物
随后完成，并通过本地固定输入、CLI 安全失败与黄金草稿契约验证，状态为
`LOCAL_FIXTURE_VALIDATED`；共同边界见
[离线 Codex 工作流 Skills](../../technical/offline-codex-workflow-skills.md)。这些目录都不
代表真实数据接口、产品能力或长期技术方案已被接受。后续固定
[草稿评测](../../technical/offline-codex-analysis-evals.md)只回归该 Skill 的 JSON 契约，
不代表模型回答、真实账户或产品价值已经验证。
后续[独立会话前向评测](../../technical/offline-codex-session-forward-test.md)已完成五个
无黄金答案 Case 的最终 8/8；隔离协议只由操作者声明，不代表通用模型质量。
Creative 与其余四个工作流 Skill 的
[独立会话前向评测](../../technical/offline-codex-workflow-session-forward-test.md)也已完成
五个最终 8/8；三项首次拒绝经契约收紧后仅在全新会话复测通过，结论同样只限固定
fixture。

## 通用契约

每个 Skill MUST：

- 声明适用任务和不适用任务。
- 先确认允许读取的上下文和数据范围。
- 区分 `FACT`、`INFERENCE` 和 `UNKNOWN`。
- 在关键输入缺失时提出最少必要问题。
- 输出稳定、可验证、可手动带入 Web 的结构。
- 显示数据时间、限制、人工检查和外部写入状态。
- 在没有工具证据时使用 `external_write: false`。

每个 Skill MUST NOT：

- 保存 Token、账户凭据、身份映射或客户敏感数据。
- 暴露任意 URL、任意 Graph API、任意 SQL 或动态工具调用。
- 根据自然语言推断用户角色、Workspace 所有权或审批状态。
- 把生成内容、建议或用户确认转换成未经审批的 Meta 写请求。

## `facebook-ads-creative`

### Creative 输入

- 商品或服务、目标、受众、版位和品牌限制。
- 允许使用的素材及来源、权利和生成标记。
- 变体目标和需要控制的主要变量。

### Creative 输出

- `creative_brief`
- `copy_variants`
- `visual_directions`
- `asset_risks`
- `human_review`

### Creative 停止条件

- 素材权利或允许来源不明。
- 请求保证审核通过或广告效果。
- 请求隐藏 AI 生成、来源或商业使用限制。

当前离线开发实现见
[离线 Codex 素材 Skill](../../technical/offline-codex-creative-skill.md)。它只接受
`facebook-ads-creative-context/v1` fixture JSON，不执行网络素材搜索、图片/视频生成、
外部保存或 Meta 操作。它已通过本地固定 fixture 契约验证，代表性独立会话最终为 8/8，
但隔离仅由操作者声明且范围只限一个 fixture Case；不得声称模型、版权、Meta 审核或
真实素材工作流已经验证。

## `facebook-ads-campaign-builder`

### Campaign Builder 输入

- 投放目标、转化位置、受众、预算、排期、版位、素材和落地页。
- 当前支持字段说明和发布前检查规则。

### Campaign Builder 输出

- `campaign_draft`
- `ad_set_draft`
- `ad_draft`
- `preflight_input`
- `unknown_fields`

### Campaign Builder 停止条件

- 优化事件、预算币种、排期或关键素材权利缺失。
- 请求声称已经创建或发布 Meta 对象。
- 请求绕过 `BLOCKER`、人工确认或后续审批。

当前离线开发实现只接受 `facebook-ads-campaign-context/v1` fixture JSON，输出三层
`DRAFT`；关键枚举未确认、素材权利或审查不满足时必须 `BLOCKED`。本地确定性测试已
通过，代表性独立会话最终为 8/8。

## `facebook-ads-daily-brief`

### Daily Brief 输入

- 报告日期、数据新鲜度和质量检查。
- 固定只读 delivery/review 汇总、上游明确标记的重要事件和待查看事项。

### Daily Brief 输出

- `headline`
- `data_status`
- `material_changes`
- `review_status`
- `today_items`
- `no_action_required`

### Daily Brief 停止条件

- 请求读取实时账户、刷新数据、发送通知或建立定时任务。
- 请求从普通数值波动自行推导阈值、因果、排名或优化动作。
- 数据过期、失败或质量检查失败时仍请求评价广告表现。

当前离线开发实现只接受 `facebook-ads-daily-brief-context/v1` fixture JSON。数据问题强制
`DATA_ISSUE`；数据正常且无重要事项时固定“无须处理”。它默认且实际都不创建 change
request，当前状态为 `LOCAL_FIXTURE_VALIDATED`；代表性独立会话最终为 8/8。

## `facebook-ads-analysis`

### Analysis 输入

- 对象、日期、比较范围、时区、归因、指标和数据新鲜度。
- 数据质量、同步状态和允许的下钻维度。
- 当前离线原型可由[离线 Codex 分析证据包](../../technical/offline-codex-evidence-bundle.md)
  及其[趋势扩展](../../technical/offline-codex-trend-evidence.md)提供 fixture-only 手动输入；
  该包不是 Skill 输出、趋势解释或真实账户证据。
- 当前项目级实现只接受 schema v2 完整 JSON，必须先通过
  [离线 Skill 校验](../../technical/offline-codex-analysis-skill.md)，不得自动读取 Web。

### Analysis 输出

- `scope_and_freshness`
- `executive_answer`
- `evidence`
- `counter_evidence`
- `missing_data`
- `driver_decomposition`
- `confidence`

当前固定 fixture 切片额外要求所有事实携带 JSON evidence path，推断提供替代解释，
每个 evidence path 携带与输入一致的原值，原始未知项按顺序全部保留；不得输出
`recommended_actions`，且 `external_write` 固定为 `false`。五种 `analysis_kind` 的
固定黄金场景和 8 项安全检查见
[离线 Codex 分析草稿评测](../../technical/offline-codex-analysis-evals.md)。
独立会话 Case、期望隔离、操作者声明和最终 `PASS` 状态见
[离线 Codex 独立会话前向评测](../../technical/offline-codex-session-forward-test.md)。

### Analysis 停止条件

- 数据过期、不完整或范围不一致到无法回答。
- 请求把相关性直接表述为因果。
- 请求使用未提供的实时账户、站内或客户数据。
- 输入包声称已执行写操作、已连接真实数据，或缺少 preflight、fixture 和非因果边界。
- schema、指标公式、日期覆盖、父子对账、敏感字段或 guardrail 任一校验失败。

## `facebook-ads-optimization`

### Optimization 输入

- 诊断报告或测试计划、证据、干扰因素和安全边界。
- 允许的建议类型和验证周期。

### Optimization 输出

- `recommended_actions`
- `test_plan`
- `test_conclusion`
- `stop_conditions`
- `next_review`

### Optimization 停止条件

- 样本或有效性不足；此时返回 `INCONCLUSIVE` 或继续观察。
- 请求自动暂停、修改预算、改变状态或绕过审批。
- 请求制造测试赢家或删除不利证据。

当前离线开发实现只接受 `facebook-ads-optimization-context/v1` fixture JSON。tracking、
测试期间配置、allocation、sample 或 comparison window 任一不满足时强制
`INCONCLUSIVE`；此时只允许继续观察、收集数据、起草下一测试和请求人工评审。证据有效
时才可形成受限 `PROPOSE_*` 非执行候选；所有建议固定 `automatic_action: false`。当前
状态为 `LOCAL_FIXTURE_VALIDATED`；代表性独立会话最终为 8/8。

## `facebook-ads-change-management`

### Change Management 输入

- 来自 `facebook-ads-optimization` 的结构化、待确认 fixture 动作。
- fixture 目标、一个受限语义 patch、证据、政策缺口和审批缺口。

### Change Management 输出

- `change_request_draft`
- `policy_gaps`
- `approval_requirements`
- `execution`
- `human_review`

### Change Management 停止条件

- 请求把自由文本或用户确认直接转换为 Meta 写入。
- 请求接受真实 object ID、change request ID、凭据、审批 token 或执行回执。
- 请求提交、审批、查询、执行、持久化或绕过政策与紧急停止。

当前离线开发实现只接受 `facebook-ads-change-context/v1` fixture JSON，只生成
`executable: false` 的本地 `DRAFT`。政策固定未评估、写入未授权、Web 审批未请求，
execution 固定 `NOT_AUTHORIZED`；状态为 `LOCAL_FIXTURE_VALIDATED`，代表性独立会话
最终为 8/8。

## Web 手动交接

未来实现 Web 手动交接时 MUST：

1. 由负责人复制结构化输出。
2. Web 重新校验对象、必填字段和状态。
3. Web 保存输出来源为 `CODEX_MANUAL_HANDOFF`。
4. 负责人在 Web 中单独确认或审批。
5. Web 持续显示当前没有外部写入。

手动交接不能证明未来 MCP 或 API 方案可用；后续自动保存和写操作需要独立技术与安全
评审。当前五个新增 Skill 只声明 handoff 语义，`persisted` 与 `external_write` 均固定为
false，不会自动保存到 Web。当前
[离线跨 Skill 手动工作流](../../technical/offline-codex-cross-skill-workflows.md)只验证
Creative→Campaign Builder 与 Optimization→Change Management 的 fixture 字段连续性；
它仍不执行 Web 导入、模型间自动调用、持久化或外部写入。
