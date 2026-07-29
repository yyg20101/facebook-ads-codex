---
doc_id: TECH-DOMAIN-DATA
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 领域与数据模型

> 候选设计：Workspace、D1、R2、同步粒度和数据实体尚未被产品证据选择，`DG0` 前
> 不构成数据契约或实施授权。

## 领域层级

```text
User
  -> Workspace
      -> Meta Connection
          -> Meta Business
              -> Meta Ad Account
                  -> Campaign
                      -> Ad Set
                          -> Ad
```

审批领域独立关联 Workspace、广告账户和目标对象：

```text
Recommendation
  -> Change Request
      -> Change Approval
      -> Change Execution
      -> Audit Event
```

## D1 概念表

MVP 至少需要：

```text
users
workspaces
workspace_members
meta_connections
meta_businesses
meta_ad_accounts
campaigns
ad_sets
ads
insights_daily
sync_runs
sync_errors
recommendations
change_requests
change_approvals
change_executions
audit_logs
deployment_targets
system_settings
```

实际列、索引、外键和 migration 在 Phase 1 技术设计中确定。所有业务表 MUST 包含
或可通过强制关系解析到 `workspace_id`。

## Insights 粒度

MVP 保存：

```text
date x ad_account
date x campaign
date x ad_set
date x ad
```

地域、年龄、性别、版位和设备等 breakdown SHOULD 按需查询或单独物化，
不得默认生成全部组合。

每行 Insights MUST 包含或可关联：

- `workspace_id`
- `meta_ad_account_id`
- `level`
- `object_id`
- `date_start`
- `date_stop`
- `currency`
- `timezone_name`
- `attribution_spec`
- `api_version`
- `sync_run_id`
- `fetched_at`
- `stability_status`

指标公式和比较限制见[指标与报告](../requirements/metrics-and-reporting.md)。

## 数据稳定状态

```text
PROVISIONAL -> RECONCILING -> STABLE
```

当前日以及归因回补窗口内的数据不得标记为 `STABLE`。状态变化必须基于同步范围、
时间和质量检查，而不是只根据单次任务成功。

## R2 对象布局

```text
raw/{workspace_id}/{ad_account_id}/{api_version}/{date}/{sync_run_id}.json.gz
exports/{workspace_id}/{generated_at}/{export_id}.json.gz
audit-snapshots/{workspace_id}/{change_request_id}/{before|after}.json
```

原始响应 SHOULD 不可变。对象不得包含 Token、Authorization Header、用户会话或
未要求保存的个人数据。

## 同步幂等键

逻辑幂等键 SHOULD 基于：

```text
workspace_id
+ meta_ad_account_id
+ level
+ object_id
+ date_start
+ breakdown_key
+ attribution_spec_hash
+ api_version
```

外部变更使用独立的稳定幂等键并关联 `change_request_id`。

## 数据质量

至少检查：

- 主键、唯一约束和重复行。
- 负花费、负展示等非法值。
- 币种、时区、归因或 API 版本缺失。
- Campaign 层级关系断裂。
- 分页不完整和同步范围缺口。
- 同一幂等键出现不一致内容。
- 当日数据相对历史基线的异常差异。

## 保留与删除

原始数据、指标、导出、审计和快照的保留期均为 `UNRESOLVED`，由 `BQ-09`
决定。实施前必须定义合法删除、审计例外、导出权限和删除证据，不得用临时默认值替代。
