---
doc_id: PLAN-GATES
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Gate 与验证证据

Gate 是阶段结果的证据门槛，不是权限授权。

## DG0：内部试点产品定义

- 完成 3–5 名内部用户问题访谈，且至少 3 名有效。
- 至少 3 名参与者提供同一核心任务的近期实例。
- 至少 3 名参与者确认重复成本、风险或明显低效。
- `DQ-01`–`DQ-08` 已由证据解决，或有不影响试点的明确延期理由。
- 至少 3 名参与者使用相同任务比较三种产品形态。
- 选定形态的关键任务完成率不低于 80%。
- 数据可信度、审批或广告写操作的关键误解为零。
- 用户、问题、价值、形态、内容、MVP、非目标和试点指标由负责人确认。
- 结论限定为内部试点，不包含未经验证的外部市场声明。

完整检查和当前结果以[产品定义](../discovery/product-definition.md)为准。任一核心条件
不满足时必须为 `PARTIAL`，不得进入 G0。

## G0：业务与只读接入条件

- 前置条件：DG0 已通过，且 Phase 0 已被项目负责人单独启动。
- 所有 `BQ-01`–`BQ-12` 有明确答案和所有者。
- 业务模型、主 KPI、主转化事件、归因和账户范围已确认。
- 主 Cloudflare 账户事实已确认。
- 测试环境能只读列出至少一个 Meta 广告账户。
- 未部署 production，未授权 Meta 写操作。

## G1：数据控制平面

G1–G5 均为旧候选方案 Gate。`DG0` 后必须根据选定产品形态重新评审，未被选择的 Gate
不得继续执行。

- staging 能同步至少一个授权广告账户。
- 重复同步不产生重复逻辑数据。
- Token 不出现在日志、明文数据库、R2 或错误响应。
- 花费、展示和点击在统一口径下与 Ads Manager 对齐。
- 数据差异阈值来自 Phase 0，不使用临时猜测。
- migration、回补、失败恢复和质量检查有证据。

## G2：Remote MCP 与只读分析

- Codex 能完成账户、Campaign、Ad Set 和 Ad 分析。
- 每项结论包含范围、新鲜度、口径、证据和置信度。
- 跨 Workspace 请求被拒绝。
- 只读工具没有外部写副作用。
- 数据不足或过期时 Codex 不编造确定性结论。

G2 完成后形成只读 MVP。

## G3：授权网页控制台

- 用户只能看到授权 Workspace。
- 页面与 MCP 使用同一业务查询和授权层。
- Token 和敏感错误不出现在浏览器。
- 连接、配置、同步状态、建议、审计和安全设置流程完成 E2E。
- accessibility 和响应式检查通过。

## G4：审批式写操作

启动前要求 G2、G3、Meta 管理权限和独立写授权。

- 未批准、过期、对象变化、策略失败或重复请求不能执行。
- Codex 不能绕过网页审批。
- 同一幂等键最多产生一次成功外部操作。
- before/after 快照和审计可追溯。
- 失败可解释、不会无限重试，并能使用反向申请恢复。
- Emergency stop 已验证。

## G5：有限自动化

- Dry Run 周期和结果由项目负责人审核。
- 预算、账户和操作边界由确定性代码执行。
- `max_budget_change_pct`、`max_account_daily_spend`、`allowed_operations`
  和 `approval_ttl_minutes` 均已明确配置。
- Emergency stop、熔断和告警已测试。
- 任一策略缺失都会安全失败。

## Definition of Done

以下完成定义同样属于候选方案，不能替代 `DG0` 形成的内部试点完成定义。

### Read-only MVP

- G0、G1、G2 完成。
- Codex 能稳定分析已授权账户。
- 数据可追溯到口径和同步批次。
- 同步不依赖 Codex 在线。
- 不存在 production Meta 写工具。
- 租户和关键安全测试通过。

### Approval-required MVP

- G3、G4 完成。
- 网页审批不可绕过。
- 写操作可预览、可审计、幂等、可失效。
- Emergency stop 有效。
- production 写能力经过独立授权。

### Bounded autonomy

- G5 完成。
- Dry Run 经项目负责人审阅。
- 预算和账户边界由确定性代码执行。
- 自动操作具有停止条件、告警和审计。

## 证据格式

每条 Gate 证据必须记录：

```yaml
evidence_id: E-NNN
gate: G0
requirements: []
tasks: []
commit: git-sha
environment: local | staging | production
date: YYYY-MM-DD
owner: role-or-user
method: command-or-reviewed-procedure
expected: statement
actual: statement
result: PASS | FAIL | PARTIAL
limitations: []
artifact_refs: []
```

不得在证据中保存 Token、Authorization Header、客户数据或未脱敏生产响应。
Product Discovery 用户证据使用独立的 `EVD-*` 契约，见
[证据登记](../discovery/evidence-log.md)，不得用 Gate 执行证据替代用户研究。
