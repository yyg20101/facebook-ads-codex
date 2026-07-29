---
doc_id: TEMPLATE-TEST-PLAN
type: template
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# Test Plan 模板

## 元数据

- 状态：`DRAFT`
- 所有者：`TBD`
- 需求：`TBD`
- 目标环境：`TBD`
- Gate：`TBD`

## 风险与范围

列出最重要的业务、安全、租户、数据和恢复风险，以及不在本轮验证的内容。

## 测试矩阵

| ID | Requirement | Level | Scenario | Expected | Evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | TBD | unit/integration/e2e/security | TBD | TBD | TBD |

## Fixture 与环境

说明数据来源、脱敏、账户权限、依赖和清理。

## 负向与失败测试

覆盖越权、无效输入、限流、重试、部分失败、重放、过期、Emergency stop 和恢复。

## 执行与结果

记录 commit、命令、日期、执行者、通过/失败、缺陷和 artifact。

## Gate 建议

只能根据实际证据给出 `PASS`、`FAIL` 或 `PARTIAL`，不得推测。
