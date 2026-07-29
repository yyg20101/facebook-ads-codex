---
doc_id: DISC-PRODUCT-DEFINITION
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 内部试点产品定义与 DG0

## 当前状态

```yaml
definition_status: UNRESOLVED
dg0_status: NOT_EVALUATED
```

当前没有访谈、任务测试或项目负责人确认记录，不得填写推测性产品定义。

## 产品定义

| 项目 | 当前值 | 必需证据 |
| --- | --- | --- |
| 首要内部用户 | UNRESOLVED | DQ-01、EVD-* |
| 核心 Job-to-be-Done | UNRESOLVED | DQ-02–DQ-04、EVD-* |
| 问题陈述 | UNRESOLVED | DQ-03、DQ-04、EVD-* |
| 现有替代方案 | UNRESOLVED | DQ-03、EVD-* |
| 价值主张 | UNRESOLVED | DQ-05、EVD-* |
| 选定产品形态 | UNRESOLVED | DQ-07、三形态测试 EVD-* |
| 产品内容地图 | UNRESOLVED | DQ-06、DQ-07、EVD-* |
| 内部试点成功指标 | UNRESOLVED | DQ-08、用户证据和负责人确认 |
| 信任与权限边界 | UNRESOLVED | DQ-08、用户证据和安全政策 |

核心 Job-to-be-Done 限定为 1–3 个。每个结论必须说明反证、限制和淘汰其他选择的理由。

## 功能决策

| Product Feature ID | 功能/结果 | 分类 | 来源任务 | 证据 | 说明 |
| --- | --- | --- | --- | --- | --- |

分类限定为：

- `MVP`：内部试点完成核心任务不可缺少。
- `LATER`：有价值但不阻塞内部试点。
- `REJECTED`：无证据、价值不足或不适合当前范围。

只有 `MVP` 项可以派生或恢复为 `FR-*`。没有证据的旧功能必须保持 `DRAFT`，不能默认进入
`LATER`。

## 内部试点非目标

- 外部客户、代理商、SaaS、多租户和商业化验证。
- production 部署、真实 Meta 数据接入或广告写操作。
- 以内部样本推导市场规模、定价或外部购买意愿。
- 在产品形态确定前接受 Codex、Web、Cloudflare、MCP 或自动化架构。

## DG0 检查

| 条件 | 目标 | 当前 | 证据 |
| --- | --- | --- | --- |
| 有效问题访谈 | 3–5 名，且至少 3 名 | 0 | — |
| 重复近期任务 | 至少 3 名提供同一核心任务实例 | 未满足 | — |
| 重复问题成本 | 至少 3 名确认重复成本、风险或低效 | 未满足 | — |
| 发现问题 | DQ-01–DQ-08 已解决或有明确延期理由 | 未满足 | — |
| 可比形态测试 | 至少 3 名完成三个方案 | 0 | — |
| 关键任务完成率 | 选定形态不低于 80% | 未评估 | — |
| 关键安全误解 | 0 | 未评估 | — |
| 产品定义 | 用户、问题、形态、内容、MVP、非目标和指标完整 | 未满足 | — |
| 负责人确认 | 有日期和脱敏证据 | 未满足 | — |
| 外部市场声明 | 0 项未经验证声明 | 满足 | 本文范围限制 |

任一核心条件不满足时，`dg0_status` 只能是 `NOT_EVALUATED` 或 `PARTIAL`。

## 完成记录

- 决定：`UNRESOLVED`
- 日期：`UNRESOLVED`
- 确认者：`UNRESOLVED`
- 证据：`UNRESOLVED`
- 限制：仅内部试点，外部有效性未验证。

`DG0` 通过后必须同步更新项目状态、产品需求、功能需求、追踪矩阵、路线图和变更日志。
原 Phase 0 仍需单独启动。
