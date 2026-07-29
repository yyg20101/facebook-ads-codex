---
doc_id: TECH-AUTH-APPROVAL
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 认证、审批与审计

## 身份与授权

1. 身份提供方验证外部主体。
2. Worker 将主体映射为内部 `user_id`。
3. 服务端从 `workspace_members` 计算角色和权限。
4. 每次查询和写入重新校验 Workspace 与广告账户绑定。
5. 业务操作记录 actor、request 和目标。

认证方式由 `BQ-11` 决定，角色分配和审批者由 `BQ-10` 决定。候选能力矩阵见
[角色与权限](../requirements/roles-and-permissions.md)。

## 变更申请状态机

```text
DRAFT
  -> VALIDATED
  -> AWAITING_APPROVAL
  -> APPROVED
  -> EXECUTING
  -> SUCCEEDED

Terminal alternatives:
REJECTED
CANCELLED
STALE
FAILED
```

转换规则：

- `DRAFT -> VALIDATED`：对象、权限、预算和 payload 校验通过。
- `VALIDATED -> AWAITING_APPROVAL`：授权用户或 Codex 提交。
- `AWAITING_APPROVAL -> APPROVED/REJECTED`：只允许网页控制台中的授权用户完成。
- `APPROVED -> EXECUTING`：只允许 `execute_approved_change` 完成。
- `APPROVED -> STALE`：对象、预算、状态或审批期限变化。
- `EXECUTING -> SUCCEEDED/FAILED`：记录脱敏 Meta 结果和 after 状态。

非法状态转换必须被拒绝并记录安全上下文。

## 操作矩阵

| 操作 | 最早模式 | 网页审批 | Codex 工具确认 | 自动化 |
| --- | --- | ---: | ---: | ---: |
| 读取和分析 | `READ_ONLY` | 否 | 否 | 是 |
| 创建内部建议 | `ADVISORY` | 否 | 否 | 是 |
| 提交变更申请 | `APPROVAL_REQUIRED` | 后续审批 | 建议提示 | 是 |
| 暂停/启用 | `APPROVAL_REQUIRED` | 是 | 是 | 后期有条件 |
| 修改预算 | `APPROVAL_REQUIRED` | 是 | 是 | 后期有条件 |
| 创建/发布广告 | `APPROVAL_REQUIRED` | 是 | 是 | MVP 否 |
| 删除对象 | 不支持 | — | — | 否 |

## 写操作策略

以下值配置前，所有 Meta 写操作必须被阻止：

```yaml
max_budget_change_pct: UNRESOLVED
max_account_daily_spend: UNRESOLVED
allowed_operations: []
approval_ttl_minutes: UNRESOLVED
emergency_stop: true
```

不得在代码、部署配置或文档示例中填入宽松默认值。

## 审计事件

至少记录：

```text
user_login
meta_connection_created
meta_connection_revoked
ad_account_linked
sync_started
sync_completed
sync_failed
recommendation_created
change_drafted
change_submitted
change_approved
change_rejected
change_stale
change_execution_started
change_execution_succeeded
change_execution_failed
emergency_stop_changed
```

每个事件包含：

```text
event_id
workspace_id
actor_type
actor_id
action
target_type
target_id
request_id
created_at
sanitized_metadata
```

业务流程不得修改或删除已经写入的审计事件。

## 执行与恢复

- 执行前保存或引用 before 快照及 `before_hash`。
- 执行成功后保存 after 快照和 Meta 响应摘要。
- 同一幂等键最多产生一次成功外部副作用。
- 广告变更的恢复使用新的反向变更申请并重新审批。
- 失败不得自动无限重试，也不得通过删除审计记录“回滚”。
