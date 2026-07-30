---
doc_id: REQ-PRODUCT
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 产品需求

本页只定义产品需求从发现证据进入需求体系的条件。实际产品定义以
[内部试点产品定义](../discovery/product-definition.md)为准，当前为 `DRAFT`，
`DG0` 尚未通过。

## 固定问题领域

- 产品必须解决 Meta/Facebook 广告相关工作中的真实问题。
- 第一轮只验证内部试点，不推导外部客户、代理商、SaaS 或商业模式。
- 任何产品结论不得超出[项目章程](../project/charter.md)和安全政策。

## 当前发现状态

| 产品事实 | 状态 | 来源 |
| --- | --- | --- |
| 首要内部用户 | DRAFT | DQ-01 |
| 核心任务与问题 | DRAFT | DQ-02–DQ-04 |
| 价值主张 | DRAFT | DQ-05 |
| 最小产品内容 | DRAFT | DQ-06 |
| Web 产品主体与前期 Codex 助手形态 | DRAFT | DQ-07 |
| 内部试点范围、指标和信任边界 | UNRESOLVED | DQ-08 |
| MVP 功能清单 | DRAFT | 产品定义与 EVD-* |

旧基线中的用户、日报、诊断、建议、控制台、审批和自动化均已迁入
[候选解决方案](../discovery/solution-hypotheses.md)，不能在没有证据时恢复为产品事实。

## 进入需求体系的条件

`DG0` 通过后必须：

1. 将产品定义中的 `MVP` 功能映射到既有或新增 `FR-*`。
2. 将不受支持的旧需求保持 `DRAFT` 或标记 `SUPERSEDED`，不得静默删除。
3. 为每项拟接受需求登记 `EVD-*`、验收条件和追踪关系。
4. 根据选定产品形态重新评审角色、指标、非功能需求、技术文档和 ADR。
5. 将外部市场、商业化和多租户假设继续标记为未验证。

## 后续 Phase 0

`BQ-01`–`BQ-12` 只在 `DG0` 通过后确认账户范围、KPI、归因、数据、权限和基础设施。
这些问题不用于选择首要用户、核心问题或产品形态。
