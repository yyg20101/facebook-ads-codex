---
doc_id: REQ-FUNCTIONAL
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 功能需求

以下条目是旧基线迁移来的候选功能，不代表已确认的用户需求或 MVP。所有条目在 `DG0`
前保持 `DRAFT`；只有进入[产品定义](../discovery/product-definition.md)的 `MVP` 功能才可
派生或恢复为已接受需求。

## FR-001：列出授权工作空间和广告账户

- 状态：`DRAFT`
- 候选阶段：Phase 2
- 依赖：`DQ-01`、`DQ-07`
- 要求：系统 MUST 只返回认证用户有权访问的 Workspace 和 Meta Ad Account。
- 验收：跨 Workspace 或伪造对象 ID 的请求被拒绝，响应包含数据新鲜度。

## FR-002：同步广告对象层级

- 状态：`DRAFT`
- 候选阶段：Phase 1
- 依赖：`DQ-06`、`DQ-07`
- 要求：系统 MUST 同步 Ad Account、Campaign、Ad Set 和 Ad 及其层级关系。
- 验收：对象可追溯到 Workspace、连接和父级；缺失父级会触发质量告警。

## FR-003：保存日粒度 Insights

- 状态：`DRAFT`
- 候选阶段：Phase 1
- 依赖：`DQ-06`
- 要求：系统 MUST 保存账户、Campaign、Ad Set 和 Ad 的日粒度指标及口径上下文。
- 验收：重复同步不会生成重复逻辑行，每行可追溯至 `sync_run_id`。

## FR-004：公开数据状态

- 状态：`DRAFT`
- 候选阶段：Phase 1–2
- 依赖：`DQ-06`、`DQ-08`
- 要求：API、MCP 和控制台 MUST 显示同步时间、错误、覆盖截止时间和稳定状态。
- 验收：数据过期或同步失败时，Codex 不输出无警告的确定性业务结论。

## FR-005：执行周期对比与驱动诊断

- 状态：`DRAFT`
- 候选阶段：Phase 2
- 依赖：`DQ-02`、`DQ-05`、`DQ-06`
- 要求：Codex MUST 能按账户、Campaign、Ad Set 和 Ad 分解 KPI 变化。
- 验收：结果包含范围、口径、证据、驱动分解、置信度和下一步检查。

## FR-006：生成每日简报

- 状态：`DRAFT`
- 候选阶段：Phase 2
- 依赖：`DQ-02`、`DQ-06`
- 要求：系统 MUST 能生成只报告实质变化的每日简报。
- 验收：无重要变化时明确输出“无须处理”；数据异常优先于优化建议。

## FR-007：生成有证据的优化建议

- 状态：`DRAFT`
- 候选阶段：Phase 2
- 依赖：`DQ-05`、`DQ-08`
- 要求：每项建议 MUST 包含目标、事实、动作、影响方向、风险、反证条件和证据。
- 验收：数据量或口径不足时只建议继续观察或收集数据，不把相关性表述为因果。

## FR-008：创建内部变更申请

- 状态：`DRAFT`
- 候选阶段：Phase 4
- 依赖：`DQ-07`、`DQ-08`
- 要求：Codex MAY 草拟并提交结构化内部变更申请，但 MUST NOT 直接生成任意 Meta 写请求。
- 验收：申请包含目标、schema 校验后的 patch、理由和证据，不产生外部副作用。

## FR-009：网页审批变更

- 状态：`DRAFT`
- 候选阶段：Phase 4
- 依赖：`DQ-07`、`DQ-08`
- 要求：批准和拒绝 MUST 由具备权限的用户在网页控制台完成。
- 验收：Codex 工具确认不能替代网页审批；审批身份、时间和决定写入审计。

## FR-010：执行已批准变更

- 状态：`DRAFT`
- 候选阶段：Phase 4
- 依赖：`DQ-07`、`DQ-08`
- 要求：外部写工具只能接受 `change_request_id`，并加载已批准的不可变 payload。
- 验收：未批准、过期、状态变化、策略失败或重复的请求不能产生外部写入。

## FR-011：提供精简控制台

- 状态：`DRAFT`
- 候选阶段：Phase 3–4
- 依赖：`DQ-07`
- 要求：控制台 MUST 支持连接、账户绑定、指标配置、同步状态、建议、审批、审计和 Emergency stop。
- 验收：网页不显示 Token、不直连 Meta API，用户只能看到授权 Workspace。

## FR-012：独立执行后台任务

- 状态：`DRAFT`
- 候选阶段：Phase 1
- 依赖：`DQ-06`、`DQ-08`
- 要求：同步、回补、健康检查、重试和数据稳定更新 MUST 独立于 Codex 客户端。
- 验收：Codex 离线时后台任务仍按计划执行并记录状态。

## FR-013：记录安全审计事件

- 状态：`DRAFT`
- 候选阶段：Phase 1–4
- 依赖：`DQ-08`
- 要求：认证、连接、同步、建议、审批、执行和 Emergency stop 变化 MUST 产生脱敏审计事件。
- 验收：事件包含 actor、target、request、时间和脱敏元数据，普通业务流程不能修改。

## FR-014：按阶段开放能力

- 状态：`DRAFT`
- 候选阶段：全部
- 依赖：`DQ-08`
- 要求：能力 MUST 按 `READ_ONLY -> ADVISORY -> APPROVAL_REQUIRED -> BOUNDED_AUTONOMY` 开放。
- 验收：任何 Gate 或实现都不能绕过独立的生产部署和 Meta 写授权。

## FR-015：生成原始快照和导出

- 状态：`DRAFT`
- 候选阶段：Phase 1+
- 依赖：`DQ-06`、`BQ-09`
- 要求：系统 SHOULD 保存脱敏的不可变原始响应和按需生成导出。
- 验收：保留期、删除机制和导出访问策略在 `BQ-09` 关闭后确定。

## FR-016：接入外部转化数据

- 状态：`DRAFT`
- 候选阶段：Post-MVP
- 依赖：`DQ-06`、`BQ-05`
- 要求：系统 MAY 接入 Pixel、Conversions API、CRM 或线下转化数据。
- 验收：数据源、身份匹配、隐私、保留期和指标影响必须先形成独立需求。
