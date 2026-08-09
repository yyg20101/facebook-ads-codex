---
doc_id: TECH-OFFLINE-DATA-QUALITY-REPORT
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线数据质量报告

## 文档定位

本文记录第十一个可逆离线候选切片。它只验证固定 fixture 是否满足后续本地分析所需的
稳定结构规则，不构成被接受的产品需求、ADR、正式 Phase 1/2/3、真实数据质量结论或
Gate 证据。当前阶段和授权只以[项目状态与授权](../project/status-and-authorizations.md)为准。

## 固定接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /data-quality?date_start=YYYY-MM-DD&date_stop=YYYY-MM-DD
```

- 只接受已验证 fixture Workspace 与账户，日期必须是连续 3–31 个 UTC 自然日。
- 一次读取账户与该账户最多 50 个 Campaign、Ad Set、Ad 的同一日期范围。
- 账户和对象读取并行开始，但只有全部主体都成功后才构建报告。
- 不接受指标、阈值、排序、breakdown、远程基址或任意查询参数。
- 任一检查失败时拒绝整个响应，不返回部分通过、补零或静态回退。

## 数据集与检查

当前数据集粒度固定为 `SUBJECT_DAY`：一个账户或广告对象在一个 UTC 自然日恰有一行。
成功响应按固定顺序返回七项 `PASS` 检查：

| Code | 稳定规则 | 证据单位 |
| --- | --- | --- |
| `PRIMARY_GRAIN_UNIQUE` | 每个主体日期恰有一行 | `ROWS` |
| `DAILY_COVERAGE_COMPLETE` | 所有主体覆盖请求中的每一天 | `SUBJECT_DAYS` |
| `REPORTING_CONTEXT_CONSISTENT` | 账户、币种、时区、点击口径、事件、归因、API 版本、稳定状态、获取时间与同步批次一致 | `ROWS` |
| `OBJECT_HIERARCHY_COMPLETE` | ID/引用唯一，Campaign→Ad Set→Ad 父级有效 | `OBJECTS` |
| `ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP` | 每日 Campaign 合计等于账户 | `PARENT_DAYS` |
| `CAMPAIGN_TO_AD_SET_DAILY_ROLLUP` | 每个 Campaign 的每日 Ad Set 合计等于父级 | `PARENT_DAYS` |
| `AD_SET_TO_AD_DAILY_ROLLUP` | 每个 Ad Set 的每日 Ad 合计等于父级 | `PARENT_DAYS` |

逐日汇总只使用花费、展示、点击和报告转化四项可加指标；派生指标不得加总。`null` 与零
保持不同语义，任一子级缺值都不能通过非空父级对账。所有加法必须保持安全整数。

## 错误与原子性

| 条件 | 结果 |
| --- | --- |
| 日期少于 3 日、超过 31 日、倒序、重复或包含未知参数 | `400 INVALID_ARGUMENT` |
| 未知或跨 Workspace 账户 | `404 NOT_FOUND` |
| 任一主体无数据 | `404 DATA_UNAVAILABLE` |
| 缺日、重复主体日或非日粒度 | `409 INCOMPLETE_PERIOD_COVERAGE` |
| 报告上下文或快照不一致 | `409 INCOMPATIBLE_METRIC_CONTEXT` |
| 对象父级或趋势对象绑定不完整 | `409 INCOMPATIBLE_OBJECT_HIERARCHY` |
| 任一层级任一天的可加指标不对账 | `409 INCOMPATIBLE_OBJECT_ROLLUP` |

失败响应不泄漏 SQL、内部路径、其他 Workspace 是否存在或部分数据。路由继续受本机 Host、
`GET`、fixture 开关、固定 SQL 和绑定参数限制。

## Web 信任边界

本地 Web 使用独立“步骤 6”显式加载，账户来自已验证 fixture 列表。严格客户端在渲染前
重新验证账户和日期绑定、对象 ID 唯一稳定顺序、对象计数、主体日行数、七项检查顺序与
证据单位、指标上下文、同步批次、warnings 和全部策略布尔值。账户或日期变化会中止旧
请求并清除旧证据。

成功策略固定为：

```yaml
minimumDays: 3
maximumDays: 31
allChecksRequired: true
performanceEvaluationApplied: false
businessThresholdsApplied: false
causalClaims: false
gateEvidence: false
sourceKind: FIXTURE
```

页面只说明这组虚构数据可安全进入后续本地分析，不评价广告表现、不判断赢家、不解释
原因、不生成建议，也不把本地自动测试表述为真实 Meta 或 Gate 证据。production 构建
继续关闭整个离线入口。

## 验证范围

自动测试覆盖成功报告、3–31 日输入边界、跨作用域、缺日、重复粒度、口径冲突、层级
错配、逐日汇总失败、严格客户端账户绑定、证据数量、策略边界、错误原样传递和旧证据
清除。全仓命令为 `npm run check`，本地 HTTP 与浏览器步骤见
[本地控制平面 Runbook](../runbooks/local-control-plane.md)。

2026-08-07 本地验收中，`npm run check` 通过 79 份规范文档、14 项 Phase 0、67 项
Worker 和 68 项原型测试及 production build。三日 HTTP 请求返回 `200` 与 24/24 个
主体日、8 个主体、7 个对象和 7/7 项检查；两日输入返回 `400`，未知账户返回 `404`。
`1280 × 720` 与 `430 × 932` 浏览器均完成显式加载，日期键盘变更会清除旧证据，页面
无横向溢出或控制台告警。production 预览只显示“接入关闭”，且不渲染 fixture 账户或
数据质量按钮；验收后 `8791`、`5173`、`4173` 均无监听。

即使本切片全部通过，真实账户授权、Meta 数据完整性、Ads Manager 对账、延迟分区、
数据修订、广告分析准确性和优化价值仍未验证；G0 继续保持 `PARTIAL`。
