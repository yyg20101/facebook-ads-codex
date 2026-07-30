---
doc_id: DISC-CODEX-SKILL-CONTRACTS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Codex 候选 Skill 契约

本页定义 Product Discovery 原型所需的最小 Skill 行为。Skill 名称、目录、工具和输出
schema 仍是候选设计；本页不授权创建凭据、实时连接或外部写工具。

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

## `facebook-ads-analysis`

### Analysis 输入

- 对象、日期、比较范围、时区、归因、指标和数据新鲜度。
- 数据质量、同步状态和允许的下钻维度。

### Analysis 输出

- `scope_and_freshness`
- `executive_answer`
- `evidence`
- `counter_evidence`
- `missing_data`
- `driver_decomposition`
- `confidence`

### Analysis 停止条件

- 数据过期、不完整或范围不一致到无法回答。
- 请求把相关性直接表述为因果。
- 请求使用未提供的实时账户、站内或客户数据。

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

## Web 手动交接

前期交接 MUST：

1. 由负责人复制结构化输出。
2. Web 重新校验对象、必填字段和状态。
3. Web 保存输出来源为 `CODEX_MANUAL_HANDOFF`。
4. 负责人在 Web 中单独确认或审批。
5. Web 持续显示当前没有外部写入。

手动交接不能证明未来 MCP 或 API 方案可用；后续自动保存和写操作需要独立技术与安全
评审。
