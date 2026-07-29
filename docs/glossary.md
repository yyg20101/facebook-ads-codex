# 术语表

> **权威级别：派生说明。**
>
> 本文依据执行规范 `v1.0.0` 整理。指标公式、状态机和权限定义以
> [`FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md`](FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md)
> 为准。

## 业务与租户

| 术语 | 定义 |
| --- | --- |
| User | 已认证的系统用户。 |
| Workspace | 本系统的主要业务与授权租户边界。 |
| Meta Connection | 工作空间连接 Meta 的授权关系及其服务端凭据引用。 |
| Meta Business | Meta 业务资产容器；可以包含多个广告账户。 |
| Meta Ad Account | Meta 广告账户，是广告数据的业务作用域，不等同于 Cloudflare 账户。 |
| Campaign | 广告系列，定义投放目标等上层属性。 |
| Ad Set | 广告组，通常承载受众、预算、排期、版位或出价设置。 |
| Ad | 广告，是创意与投放对象的末级实体。 |

## 数据与指标

| 术语 | 定义 |
| --- | --- |
| Insights | Meta 返回的广告表现数据。MVP 保存账户、Campaign、Ad Set 和 Ad 日粒度数据。 |
| Sync Run | 一次可追踪的数据同步执行，拥有唯一 `sync_run_id`。 |
| Intraday Sync | 每 30–60 分钟执行的日内关键指标和状态同步。 |
| Daily Reconciliation | 每日对最近 7 天数据进行的归因回补。 |
| Backfill | 首次接入时批量拉取历史数据；默认 180 天，最终范围由 Phase 0 决定。 |
| `PROVISIONAL` | 数据仍处于当前日或初步同步状态。 |
| `RECONCILING` | 数据位于归因回补窗口内。 |
| `STABLE` | 已离开回补窗口并满足稳定条件的数据。 |
| Primary KPI | 工作空间用于评价广告结果的主要指标，例如 ROAS、CPA 或 conversions。 |
| Primary Conversion Event | 工作空间明确选择的主要转化事件。未配置时不得给出确定性 ROAS/CPA 优化结论。 |
| Attribution Spec | Meta 归因窗口和相关配置。不同口径的数据不得直接比较。 |
| Data Freshness | 数据更新时间、覆盖截止时间、同步批次和稳定状态的组合。 |

## 分析与变更

| 术语 | 定义 |
| --- | --- |
| Recommendation | 有事实、证据、置信度、风险和反证条件的优化建议。 |
| `CONFIRMED` | 结论由数据直接支持。 |
| `LIKELY` | 数据支持结论，但仍存在其他合理解释。 |
| `HYPOTHESIS` | 需要更多数据、实验或外部证据验证。 |
| Change Request | 对目标对象、不可变 proposed patch、理由和证据的结构化变更申请。 |
| `before_hash` | 变更申请生成时目标对象状态的摘要；执行前用于检测对象是否已变化。 |
| Approval TTL | 审批的有效时长；超过后申请不能继续执行。 |
| Emergency Stop | 阻止所有 Meta 外部写操作的全局或工作空间安全开关，默认开启。 |
| Idempotency Key | 防止同一同步或外部操作重复成功的稳定键。 |

## 阶段与权限

| 术语 | 定义 |
| --- | --- |
| Phase | 按依赖顺序实施的一组任务。 |
| Gate | 阶段完成后必须由证据满足的进入条件。 |
| `READ_ONLY` | 仅允许读取和分析。 |
| `ADVISORY` | 可以生成建议和内部记录，但不执行 Meta 写操作。 |
| `APPROVAL_REQUIRED` | 只能执行经过网页审批和工具确认的受控写操作。 |
| `BOUNDED_AUTONOMY` | 在 Dry Run、白名单、预算和熔断边界内执行有限自动化。 |
| Codex Tool Approval | Codex 侧的附加工具确认，不能替代网页业务审批。 |
| Web Approval | 由具备权限的用户在网页控制台完成的业务审批。 |
