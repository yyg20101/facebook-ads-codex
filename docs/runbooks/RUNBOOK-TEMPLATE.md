---
doc_id: TEMPLATE-RUNBOOK
type: template
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# Runbook 模板

复制后替换 front matter、标题和所有 `TBD`。

## 元数据

- 环境：`local | staging | production`
- 状态：`DRAFT`
- 所有者：`TBD`
- 审批者：`TBD`
- 最近验证：`NEVER`
- 关联需求/Gate：`TBD`

## 目的与触发

说明问题、触发信号和不适用场景。

## 权限与安全边界

- 所需最小权限。
- 禁止操作。
- Secret 和敏感数据处理。
- 必须停止并请求批准的条件。

## 前置检查

列出环境、状态、备份、Emergency stop 和依赖检查。

## 操作步骤

对每一步记录命令或界面操作、预期输出和失败判定。示例只能使用不可用占位值。

## 验证

列出成功标准、业务检查、日志/指标和审计事件。

## 恢复

说明回滚或前向修复。外部广告变化必须使用新的反向变更申请。

## 证据

记录日期、执行者、环境、commit、脱敏结果和 artifact 引用。

## 验证记录

在目标环境实际完成前保持 `DRAFT`，不得填写虚假验证日期。
