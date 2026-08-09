---
doc_id: REQ-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 需求文档

本目录保存产品发现完成后进入设计评审的需求。`DG0` 已通过，MVP 能力映射和 42 项需求
已逐项复核：32 项为 `ACCEPTED`，10 项因属于 `LATER`、缺少产品优先级、真实容量事实
或依赖未决架构而保持 `DRAFT`。需求接受只确认语义和验收约束，不是实现、Gate、部署
或外部访问授权。

| 文档 | 事实源范围 | 状态 |
| --- | --- | --- |
| [产品需求](product.md) | 用户、问题、范围、场景和 MVP 映射 | `ACCEPTED` |
| [功能需求](functional.md) | 已接受与候选系统行为 `FR-*` | `DRAFT`（混合状态） |
| [非功能需求](non-functional.md) | 已接受与候选质量及安全实现 `NFR-*`、`SEC-*` | `DRAFT`（混合状态） |
| [角色与权限](roles-and-permissions.md) | 角色能力和审批权限 | `DRAFT` |
| [指标与报告](metrics-and-reporting.md) | 指标公式、口径和输出上下文 | `DRAFT` |
| [追踪矩阵](traceability.md) | 需求到设计、测试和 Gate | `DRAFT` |

## 状态规则

- `ACCEPTED`：需求语义已经确认，可作为后续设计约束。
- `DRAFT`：产品价值证据、Phase 0 事实、验收阈值或实现边界尚未通过 Gate。
- `UNRESOLVED`：只用于具体字段或问题，不得作为默认值实施。

文档状态与单项需求状态可以不同。进入 Phase 0 后：

- 每项 `DRAFT` 需求必须依赖至少一个 `DQ-*` 或后续 `BQ-*`。
- 只有[产品定义](../discovery/product-definition.md)中分类为 `MVP` 的能力才可恢复或
  派生为已接受需求。
- `ACCEPTED` 需求必须具有 `EVD-*` 产品证据、验收条件、技术落点和验证方式。
- `DG0` 通过不自动接受旧需求；只有完成产品能力映射、Phase 0 事实确认和追踪证据的
  单项需求才能转为 `ACCEPTED`。

## 变更规则

- 新需求使用下一个连续 ID，不得复用或重新编号。
- 删除的需求标记 `SUPERSEDED` 并保留替代关系。
- 不得用技术文档改变需求含义。
- `DQ-*` 只能在[发现问题](../discovery/discovery-questions.md)中定义。
- `EVD-*` 只能在[发现证据](../discovery/evidence-log.md)中登记。
- `BQ-*` 只能在 [Phase 0 问卷](../planning/phase-0-questionnaire.md)中定义。
- 未解决的 `DQ-*` 或 `BQ-*` 不得转换为宽松默认值。
