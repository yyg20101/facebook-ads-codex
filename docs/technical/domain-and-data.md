---
doc_id: TECH-DOMAIN-DATA
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 领域与数据模型

> 候选设计：Workspace、D1、R2、同步粒度和数据实体尚未通过需求与 ADR 评审；
> `DG0` 通过未选择这些实现，不构成数据契约或实施授权。

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

项目已确认需要持久化广告账户分析数据。无论最终采用何种存储实现，至少 MUST 保存
支持历史对比和分析复现所需的标准化指标及其账户、广告对象、日期、币种、时区、归因、
事件、版本、同步批次和数据截至时间上下文。

`BQ-09` 已确认以下滚动保留政策：

| 数据类别 | 保留期 | 起算字段 | 用途与限制 |
| --- | --- | --- | --- |
| 标准化日级指标及口径上下文 | 25 个月 | `date_stop` | 年度周期对比、趋势分析和修订识别；不得包含个人级广告受众数据 |
| 生成的分析、建议和报告元数据 | 25 个月 | `created_at` | 复盘分析依据和建议效果；引用的账户数据必须可追溯 |
| 脱敏原始 Meta API 响应 | 90 天 | `fetched_at` | 对账、解析修复和质量调查；MUST 去除 Token、Header 和非必要个人数据 |
| 同步运行、错误和诊断日志 | 180 天 | `created_at` | 数据完整性、失败调查和运行趋势；不得保存完整响应或 Secret |
| 审计事件、审批及变更前后快照 | 24 个月 | `created_at` | 安全审计、责任追踪和变更复核；业务流程不得修改 |
| 用户生成的临时导出 | 30 天 | `generated_at` | 短期下载与交付；到期自动删除 |

删除规则：

- 保留期到期后 MUST 由自动清理任务删除，并记录类别、范围、数量、执行时间和结果，
  不记录被删除的敏感内容。
- Meta 连接撤销、广告账户移除或有效删除请求发生时，MUST 立即停止同步并删除连接
  Token；临时导出和原始响应在 7 天内删除，标准化指标与分析结果在 30 天内删除。
- 脱敏审计事件和删除证据 MAY 继续保留至原 24 个月期限，但不得保留可恢复的广告数据、
  Token 或完整响应。
- 若适用法律、Meta 平台条款或有效数据主体请求要求更短期限，以更短期限为准；任何
  合法保留例外必须单独记录依据、范围、所有者和到期复核时间。
- 首期不得采集或持久化个人级广告受众、Lead 姓名、邮箱、电话或 CRM 身份数据。

该政策未接受 D1、R2 或本页其他候选实现；存储技术仍需在后续架构决策中确定。
