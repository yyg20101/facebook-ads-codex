---
doc_id: REQ-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 需求文档

本目录保存产品发现完成后可能进入设计的需求候选项。`DG0` 已通过，但 Phase 0 事实、
需求映射、验收条件和技术落点尚未逐项复核，因此当前 `FR-*`、`NFR-*`、`SEC-*`
仍全部为 `DRAFT`，不能作为实现授权或已确认需求。

| 文档 | 事实源范围 | 状态 |
| --- | --- | --- |
| [产品需求](product.md) | 用户、问题、范围、场景和成功结果 | `DRAFT` |
| [功能需求](functional.md) | 旧基线中的候选系统行为 `FR-*` | `DRAFT` |
| [非功能需求](non-functional.md) | 候选质量与安全实现 `NFR-*`、`SEC-*` | `DRAFT` |
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
