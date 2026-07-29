---
doc_id: REF-GLOSSARY
type: reference
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 术语表

## 业务与租户

| 术语 | 定义 |
| --- | --- |
| Internal Participant | Product Discovery 的内部真实用户，以 `P-NN` 别名记录。 |
| User | 候选产品的用户；首要角色由 `DQ-01` 确定。 |
| Workspace | 候选多租户方案中的业务和授权边界，尚未接受。 |
| Meta Connection | 候选方案中连接 Meta 的授权关系及服务端凭据引用。 |
| Meta Business | Meta 业务资产容器，可包含多个广告账户。 |
| Meta Ad Account | Meta 广告账户，不等同于 Cloudflare 账户或 Workspace。 |
| Campaign | 广告系列，定义投放目标等上层属性。 |
| Ad Set | 广告组，通常承载受众、预算、排期、版位或出价。 |
| Ad | 广告，是创意与投放对象的末级实体。 |
| `cf-primary` | 候选 Cloudflare 方案的逻辑主账户；是否采用该方案及其归属均未确认。 |

## 数据与指标

| 术语 | 定义 |
| --- | --- |
| Insights | Meta 返回的广告表现数据。 |
| Sync Run | 一次可追踪的数据同步，拥有唯一 `sync_run_id`。 |
| Intraday Sync | 每 30–60 分钟执行的关键指标和状态同步。 |
| Daily Reconciliation | 每日对近期数据进行的归因回补。 |
| Backfill | 首次接入时分批拉取历史数据；范围由 BQ-08 决定。 |
| `PROVISIONAL` | 当前日或初步同步状态。 |
| `RECONCILING` | 位于归因回补窗口内。 |
| `STABLE` | 离开回补窗口并满足稳定条件。 |
| Primary KPI | Workspace 评价广告结果的主要指标。 |
| Primary Conversion Event | Workspace 明确选择的主转化事件。 |
| Attribution Spec | Meta 归因窗口及相关配置。 |
| Data Freshness | 数据截止时间、同步批次和稳定状态的组合。 |

## 分析与变更

| 术语 | 定义 |
| --- | --- |
| Recommendation | 包含事实、证据、置信度、风险和反证条件的建议。 |
| `CONFIRMED` | 结论由数据直接支持。 |
| `LIKELY` | 数据支持结论，但存在其他合理解释。 |
| `HYPOTHESIS` | 需要更多数据、实验或外部证据。 |
| Change Request | 包含目标、不可变 patch、理由和证据的结构化申请。 |
| `before_hash` | 申请生成时对象状态摘要，执行前用于检测变化。 |
| Approval TTL | 审批有效时长。 |
| Emergency Stop | 默认阻止所有 Meta 外部写操作的安全开关。 |
| Idempotency Key | 防止同一同步或外部操作重复成功的稳定键。 |

## 阶段、文档与权限

| 术语 | 定义 |
| --- | --- |
| Phase | 按依赖顺序实施的一组任务。 |
| Gate | 必须由证据满足的阶段完成门槛，不是授权。 |
| Product Discovery | 在技术设计前验证用户、问题、价值、形态、内容和 MVP 的阶段。 |
| `DG0` | 内部试点产品定义 Gate；通过后才可准备原 Phase 0。 |
| `DQ-*` | 产品发现问题的稳定编号。 |
| `EVD-*` | 仓库内脱敏研究证据的稳定编号。 |
| `READ_ONLY` | 仅允许读取和分析。 |
| `ADVISORY` | 可以生成建议和内部记录，但不执行 Meta 写入。 |
| `APPROVAL_REQUIRED` | 只能执行经过网页审批和工具确认的受控写入。 |
| `BOUNDED_AUTONOMY` | 在 Dry Run、白名单、预算和熔断边界内执行有限自动化。 |
| `DRAFT` | 文档或需求尚未完成确认。 |
| `ACCEPTED` | 已确认并可作为约束。 |
| `SUPERSEDED` | 已被另一文档或决策取代。 |
| `UNRESOLVED` | 尚未获得事实，不能以默认值替代。 |
