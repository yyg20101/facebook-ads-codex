---
doc_id: REQ-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 需求文档

本目录定义系统需要解决的问题、行为、质量属性和验收条件。

| 文档 | 事实源范围 | 状态 |
| --- | --- | --- |
| [产品需求](product.md) | 用户、问题、范围、场景和成功结果 | `DRAFT` |
| [功能需求](functional.md) | 可观察系统行为 `FR-*` | 混合状态 |
| [非功能需求](non-functional.md) | 质量与安全要求 `NFR-*`、`SEC-*` | 混合状态 |
| [角色与权限](roles-and-permissions.md) | 角色能力和审批权限 | `DRAFT` |
| [指标与报告](metrics-and-reporting.md) | 指标公式、口径和输出上下文 | `DRAFT` |
| [追踪矩阵](traceability.md) | 需求到设计、测试和 Gate | `DRAFT` |

## 状态规则

- `ACCEPTED`：需求语义已经确认，可作为后续设计约束。
- `DRAFT`：存在 Phase 0 业务事实或验收阈值未确认。
- `UNRESOLVED`：只用于具体字段或问题，不得作为默认值实施。

文档状态与单项需求状态可以不同。所有 `ACCEPTED` 需求必须在
[追踪矩阵](traceability.md)中拥有技术落点和验证方式。

## 变更规则

- 新需求使用下一个连续 ID，不得复用或重新编号。
- 删除的需求标记 `SUPERSEDED` 并保留替代关系。
- 不得用技术文档改变需求含义。
- `BQ-*` 只能在 [Phase 0 问卷](../planning/phase-0-questionnaire.md)中定义。
- 未解决的 `BQ-*` 必须安全失败，不得转换为宽松默认值。
