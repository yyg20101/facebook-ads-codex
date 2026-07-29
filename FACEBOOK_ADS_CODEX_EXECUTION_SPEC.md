---
spec_id: facebook-ads-codex-control-plane
title: Codex 驱动的 Facebook 广告管理与数据分析系统
version: 1.0.0
status: ready_for_execution_planning
language: zh-CN
created_at: 2026-07-29
primary_ai_agent: Codex
primary_cloudflare_account_id: 32b73e607476d0224c7ca40d28be1120
initial_operation_mode: READ_ONLY
production_deployment_authorized: false
meta_write_operations_authorized: false
---

# Codex 驱动的 Facebook 广告管理与数据分析系统

## 0. Codex 执行契约

本文档是本项目的需求与执行规范，也是后续 Codex 实施工作的主要事实来源。

规范词含义：

- `MUST`：必须满足，否则不得进入下一阶段。
- `MUST NOT`：禁止执行。
- `SHOULD`：默认应满足，只有记录明确理由后才能偏离。
- `MAY`：可选能力，不得阻塞 MVP。

### 0.1 当前授权范围

当前仅授权：

- 阅读和分析本规范。
- 制定实施计划。
- 在用户后续明确要求“开始执行”后，创建本地代码、测试和开发文档。
- 在用户后续授权只读访问后，调用 Meta 或 Cloudflare 的只读接口进行验证。

当前未授权：

- 部署任何生产 Cloudflare 资源。
- 创建、修改或删除 Meta 广告对象。
- 调整广告预算、状态、排期、受众、出价或创意。
- 创建或轮换生产密钥。
- 邀请、删除或修改 Cloudflare/Meta 成员权限。

`production_deployment_authorized=false` 或
`meta_write_operations_authorized=false` 时，Codex MUST 在对应动作前停止并请求明确授权。

### 0.2 后续执行启动语句

用户可以使用以下语句启动工作：

```text
按照 FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md 开始执行 Phase 0。
```

Codex 开始某阶段前 MUST：

1. 完整读取本文档。
2. 检查代码仓库和现有变更，保留用户已有工作。
3. 核对该阶段所有依赖和 Gate。
4. 给出简短执行计划及可验证的完成条件。
5. 只实施当前阶段，不提前开发后续阶段功能。
6. 运行该阶段要求的测试和审计。
7. 记录完成项、未完成项、证据和下一 Gate。

本文档是规范，不是生产部署授权。

## 1. 最终目标

构建一套以 Codex 为唯一 AI 决策与交互入口的 Facebook/Meta 广告管理系统，使 Codex 能够：

1. 安全读取多个 Meta 广告账户的数据。
2. 按统一指标口径分析 Campaign、Ad Set 和 Ad 表现。
3. 生成日报、异常说明和优化建议。
4. 将建议转换为可审计的变更申请。
5. 在人工审批后执行有限的广告管理操作。
6. 在满足长期验证条件后，执行受预算与策略限制的自动化。

### 1.1 成功结果

最终用户应能在 Codex 中发出以下请求：

```text
分析工作空间 X 最近 7 天 ROAS 下降的主要原因。
找出最近 3 天花费增加但转化没有增长的 Ad Set。
生成今天的广告账户日报，只汇报需要处理的问题。
为 Campaign Y 草拟一个预算调整方案，但不要执行。
执行已经在控制台批准的变更申请 CR-123。
```

每个分析结果 MUST 显示：

- 工作空间和 Meta 广告账户。
- 分析日期范围和对比范围。
- 币种、时区及归因口径。
- 数据更新时间和同步批次。
- 结论置信级别。
- 建议与证据的对应关系。

## 2. 不可变架构决策

以下决策在没有用户明确修改本规范前保持不变。

### ADR-001：Codex 是唯一 AI Agent

- Codex 负责理解、推理、分析、建议、报告和工具编排。
- Cloudflare MUST NOT 再实现第二个独立聊天 Agent 或重复的 LLM 决策系统。
- Cloudflare 只负责数据、认证、权限、任务执行、存储和审计。

### ADR-002：网页不是 AI 入口

网页控制台只负责：

- Meta 连接和账户配置。
- 数据图表和同步状态。
- 变更预览、批准与拒绝。
- 操作日志、权限和紧急停止。

日常分析和指令入口是 Codex。

### ADR-003：Skill 与 MCP 分工固定

- Skill 保存重复工作流程、指标定义、诊断顺序、输出格式和安全规则。
- Remote MCP 提供实时数据、认证、授权和受控操作。
- Skill MUST NOT 保存 Meta Token、Cloudflare Token 或其他密钥。
- MCP 服务端 MUST 重新验证工作空间、广告账户和操作权限，不能信任模型传入的账户 ID。

### ADR-004：Cloudflare 账户不等于 Meta 租户

- Cloudflare 账户表示部署和资源所有权边界。
- Meta 广告账户表示业务数据租户。
- 两者 MUST 独立建模，MUST NOT 建立默认一对一关系。

### ADR-005：单一主控制平面

MVP 的 Worker、Remote MCP、D1、R2、Queues、Workflows 和 Secrets
MUST 位于同一个主 Cloudflare 账户。

选定的主账户：

```yaml
name: "250770503@qq.com's Account"
account_id: "32b73e607476d0224c7ca40d28be1120"
role: primary_control_plane
deployment_status: blocked_until_explicit_authorization
```

### ADR-006：只读优先

系统必须按以下顺序开放能力：

```text
READ_ONLY
  -> ADVISORY
  -> APPROVAL_REQUIRED
  -> BOUNDED_AUTONOMY
```

不得跳过任何阶段。

## 3. 已核验的 Cloudflare 状态

截至 2026-07-29，身份 `250770503@qq.com` 可见以下账户：

| Logical name | Cloudflare account name | Account ID | 本项目用途 |
|---|---|---|---|
| `cf-primary` | `250770503@qq.com's Account` | `32b73e607476d0224c7ca40d28be1120` | 主控制平面 |
| `cf-wajie` | `Wajie20101@gmail.com's Account` | `feb35823ef25f093d318cbd1d90af73f` | 默认不部署；仅显式授权后作为隔离目标 |
| `cf-dwkboss` | `Dwkboss1688@gmail.com's Account` | `4dc81bcf6226b18f1fcfca50baf3e57c` | 默认不部署；仅显式授权后作为隔离目标 |

已知 Wrangler Profile：

```yaml
default:
  email: wajie20101@gmail.com
  visible_accounts:
    - feb35823ef25f093d318cbd1d90af73f

qq-main:
  email: 250770503@qq.com
  visible_accounts:
    - 32b73e607476d0224c7ca40d28be1120
    - feb35823ef25f093d318cbd1d90af73f
    - 4dc81bcf6226b18f1fcfca50baf3e57c
```

部署规则：

- Wrangler 配置 MUST 显式设置 `account_id`。
- CI/CD MUST 为每个 Cloudflare 账户使用独立、最小权限 API Token。
- CI/CD MUST NOT 依赖交互式 Profile 切换。
- `staging` 和 `production` 默认使用 `cf-primary` 内的独立资源。
- 未经用户明确授权，MUST NOT 向 `cf-wajie` 或 `cf-dwkboss` 部署。
- 如果未来需要跨账户硬隔离，每个账户必须拥有自己的 D1、R2、Queues、
  Workflows 和 Secrets；不得假设 Cloudflare 绑定可以跨账户共享。

## 4. 范围

### 4.1 MVP 范围

- 一个或多个工作空间。
- 多个 Meta Business 和广告账户。
- Campaign、Ad Set、Ad 及 Insights 读取。
- 账户、Campaign、Ad Set、Ad 层级的日粒度数据。
- 日内花费和关键指标更新。
- Codex 自然语言分析。
- 日报、周期对比、异常诊断和优化建议。
- 变更申请与人工审批框架。
- 完整审计日志。

### 4.2 后续范围

- 审批后的暂停、启用和预算变更。
- Campaign/Ad Set/Ad 草稿创建。
- 创意文本和素材表现分析。
- 有边界的自动预算与状态管理。
- CRM、Pixel、Conversions API 或线下转化数据接入。
- 其他广告平台。

### 4.3 非目标

MVP MUST NOT 实现：

- 自动创建 Meta Business 或广告账户。
- 自动修改账单、支付方式或账户消费上限。
- 无审批删除 Campaign、Ad Set、Ad 或素材。
- 客户名单、自定义受众等个人数据上传。
- 用 Codex Scheduled Task 代替服务端数据同步。
- 为每个 Meta 广告账户创建一个 Cloudflare 账户。
- 在浏览器端直接调用 Meta Marketing API。

## 5. 用户、工作空间与租户模型

### 5.1 逻辑层级

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

### 5.2 角色

| Role | 读取数据 | 创建建议 | 提交变更 | 审批变更 | 管理连接 |
|---|---:|---:|---:|---:|---:|
| `OWNER` | 是 | 是 | 是 | 是 | 是 |
| `ADMIN` | 是 | 是 | 是 | 是 | 是 |
| `OPERATOR` | 是 | 是 | 是 | 否 | 否 |
| `ANALYST` | 是 | 是 | 否 | 否 | 否 |
| `VIEWER` | 是 | 否 | 否 | 否 | 否 |

服务端 MUST 根据认证用户计算工作空间权限。Codex/MCP 参数中的
`workspace_id`、`ad_account_id` 或 `role` 不能作为授权证据。

### 5.3 多租户规则

- 所有业务表 MUST 包含 `workspace_id`。
- 所有查询 MUST 在服务端应用工作空间过滤。
- Meta 外部 ID MUST 与 `workspace_id` 组成唯一作用域。
- 任意跨工作空间查询 MUST 默认拒绝。
- 平台级汇总必须使用独立的显式权限。

## 6. 目标系统结构

```text
Codex
  |
  | loads focused Skills
  v
Cloudflare Remote MCP
  |
  +-- read tools --------> D1 normalized metrics
  +-- sync/status tools --> Queues / Workflows
  +-- draft tools -------> change_requests
  +-- execute tool ------> approved change executor
  |
  +----------------------> Meta Marketing API

Web Control Console
  |
  +-- account configuration
  +-- charts and freshness
  +-- approval / rejection
  +-- audit log / emergency stop

Storage
  +-- D1: relational state and normalized metrics
  +-- R2: immutable raw API snapshots and exports
  +-- Secrets Store / Worker Secrets: root secrets
```

### 6.1 MVP 技术选择

```yaml
language: TypeScript
runtime: Cloudflare Workers
web: React + Vite
api_and_mcp: one Worker project for MVP
relational_store: D1
raw_store: R2
async_processing:
  - Queues
  - Workflows
validation: schema-first runtime validation
tests:
  - unit
  - integration
  - end_to_end
```

MVP SHOULD 保持单体控制平面，除非出现明确的部署、权限或扩展需求，
不得提前拆分微服务。

### 6.2 建议仓库结构

```text
facebook-ads-codex/
  AGENTS.md
  README.md
  docs/
    FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md
    decisions/
    runbooks/
  apps/
    control-console/
  services/
    control-plane-worker/
      src/
        auth/
        domain/
        http/
        mcp/
        meta/
        sync/
        workflows/
        audit/
      migrations/
  skills/
    facebook-ads-analysis/
    facebook-ads-daily-brief/
    facebook-ads-optimization/
    facebook-ads-change-management/
  tests/
    fixtures/
    integration/
    e2e/
  wrangler.jsonc
```

执行时应将本文档复制到仓库的
`docs/FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md`，并让根目录 `AGENTS.md`
引用它。`AGENTS.md` 只保存简短执行约束，不复制整份规范。

## 7. Meta 接入要求

### 7.1 权限阶段

阶段一只读：

```yaml
required_permissions:
  - ads_read
operation_mode: READ_ONLY
```

阶段二管理：

```yaml
candidate_permissions:
  - ads_management
operation_mode: APPROVAL_REQUIRED
```

如果系统仅管理自己 Business 下的广告账户，先使用最小可行访问级别。
如果系统管理其他企业或客户广告账户，必须先确认 Meta Advanced Access、
App Review 和对应业务验证要求。

Page、Instagram、创意或其他资产需要的额外权限必须按具体功能增量申请，
不得在 MVP 一次性申请。

### 7.2 Token 处理

- 自有 Business 的少量 System User Token MAY 存储为 Cloudflare Secret。
- 多客户 OAuth Token MUST 加密后存入 D1。
- 用于加密租户 Token 的根密钥 MUST 存放在 Secrets Store 或 Worker Secret。
- 明文 Token MUST NOT 写入 D1、R2、日志、错误响应、浏览器或 Skill。
- Token 解密只能发生在服务端且仅持续当前调用所需时间。
- 必须支持 Token 撤销、过期检测和密钥轮换。

### 7.3 API 要求

- Meta Graph/Marketing API 版本 MUST 显式固定。
- 每次升级 MUST 先通过回归测试再进入生产。
- 必须处理分页、限流、重试、权限错误和部分失败。
- 大范围或复杂 Insights 请求 SHOULD 使用异步报表任务。
- 必须记录 Meta 使用量响应头和退避状态。
- 所有重试操作必须幂等。

## 8. 数据同步与存储

### 8.1 同步策略

```yaml
intraday_sync:
  cadence: 30-60 minutes
  scope:
    - spend
    - impressions
    - clicks
    - account_and_object_status

daily_reconciliation:
  cadence: daily
  trailing_window_days: 7
  purpose: capture attribution and delayed conversion updates

initial_backfill:
  default_days: 180
  configurable: true
  execution: batched_async
```

`default_days=180` 是实施默认值，不是业务保留政策。Phase 0 必须确认实际范围。

### 8.2 数据粒度

MVP 默认保存：

```text
date x ad_account
date x campaign
date x ad_set
date x ad
```

地域、年龄、性别、版位、设备等 breakdown SHOULD 按需查询或独立物化，
不得默认生成所有组合。

### 8.3 数据状态

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

`stability_status`：

```text
PROVISIONAL -> RECONCILING -> STABLE
```

当日及归因回补窗口内的数据不得标记为 `STABLE`。

### 8.4 D1 表

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

### 8.5 R2 对象路径

```text
raw/{workspace_id}/{ad_account_id}/{api_version}/{date}/{sync_run_id}.json.gz
exports/{workspace_id}/{generated_at}/{export_id}.json.gz
audit-snapshots/{workspace_id}/{change_request_id}/{before|after}.json
```

原始响应 SHOULD 不可变。不得将 Token、请求 Authorization Header
或用户会话信息写入对象。

### 8.6 幂等键

同步写入的逻辑幂等键 SHOULD 基于：

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

## 9. 指标语义

### 9.1 基础指标

| Metric | Canonical definition |
|---|---|
| `spend` | Meta 返回的广告花费，保留原账户币种 |
| `impressions` | 广告展示次数 |
| `reach` | 去重触达人数 |
| `link_clicks` | 明确采用链接点击口径，不与全部点击混用 |
| `ctr_link` | `link_clicks / impressions` |
| `cpc_link` | `spend / link_clicks` |
| `cpm` | `spend / impressions * 1000` |
| `conversions` | 配置的主转化事件数量 |
| `conversion_value` | 主转化事件的归因价值 |
| `cpa` | `spend / conversions` |
| `roas` | `conversion_value / spend` |
| `frequency` | `impressions / reach` |
| `spend_pacing` | 当前累计花费与计划进度的比率 |

零分母必须返回 `null`，不得返回 `0`、`Infinity` 或编造值。

### 9.2 口径规则

- 不同币种不得直接求和或比较。
- 不同时区不得在未转换前按自然日比较。
- 不同归因窗口不得直接比较 ROAS、CPA 或 conversions。
- `clicks` 与 `link_clicks` 不得混用。
- 主转化事件必须在工作空间配置中显式设置。
- Meta 平台归因结果不得表述为确定的真实增量因果效果。

### 9.3 KPI 选择

每个工作空间必须配置：

```yaml
campaign_objective: sales | leads | app | traffic | awareness | other
primary_kpi: roas | cpa | cpl | conversions | revenue | other
primary_conversion_event: null
currency_policy: no_cross_currency_aggregation
timezone_policy: ad_account_local_time
attribution_policy: null
```

`primary_conversion_event` 或 `attribution_policy` 未配置时，Codex MUST
指出缺失，不得生成确定性的 ROAS/CPA 优化结论。

## 10. Codex 分析流程

所有 Facebook 广告分析 Skill MUST 按以下顺序工作。

### Step 1：验证上下文

- 确认工作空间和广告账户。
- 确认日期范围和对比范围。
- 确认时区、币种和归因设置。
- 检查数据更新时间、同步错误和稳定状态。

### Step 2：选择核心结果

- 根据 Campaign objective 和工作空间配置选择主 KPI。
- 如果目标或主转化事件不明确，先提出最小必要问题。

### Step 3：分解变化

按以下树进行诊断：

```text
Outcome
  -> Spend / delivery
  -> Traffic cost: CPM
  -> Traffic response: CTR
  -> Click cost: CPC
  -> Conversion efficiency: CVR
  -> Conversion value / quality
```

### Step 4：定位贡献

依次检查：

1. 广告账户。
2. Campaign。
3. Ad Set。
4. Ad。
5. 必要时再检查版位、地域、设备和受众。

### Step 5：判断置信度

每项结论必须标记：

```text
CONFIRMED    数据直接支持
LIKELY       数据支持但存在其他解释
HYPOTHESIS   需要更多数据或实验验证
```

### Step 6：输出建议

每项建议必须包含：

- 目标对象。
- 观察到的事实。
- 建议动作。
- 预期影响方向。
- 风险和反证条件。
- 是否需要写操作。
- 对应证据引用。

Codex MUST NOT 把相关性描述成因果关系。

## 11. Codex Skills

MVP 使用四个聚焦 Skill，不创建单一巨型 Skill。

### 11.1 `facebook-ads-analysis`

触发：

- 周期对比。
- 指标变化原因。
- Campaign、Ad Set 或 Ad 表现诊断。

输出：

```text
Scope and freshness
Executive answer
Evidence
Driver decomposition
Confidence
Recommended next checks
```

### 11.2 `facebook-ads-daily-brief`

触发：

- 日报。
- 今日需要关注的问题。
- 异常汇总。

规则：

- 只报告实质变化。
- 没有重要变化时明确说“无须处理”。
- 默认不生成变更申请。

### 11.3 `facebook-ads-optimization`

触发：

- 优化建议。
- 预算、状态或测试计划建议。

规则：

- 先分析，再建议。
- 建议与证据一一对应。
- 未达到样本或数据质量要求时，只能建议继续观察或收集数据。

### 11.4 `facebook-ads-change-management`

触发：

- 草拟、提交、查询或执行变更。

规则：

- 只能创建结构化变更申请。
- 不得直接把自然语言转换为未经审批的 Meta 写请求。
- 执行时只能传入 `change_request_id`。

这些 Skill 稳定后 MAY 打包成一个 Codex Plugin，并在 Plugin 中声明
Remote MCP 依赖。

## 12. Remote MCP 工具契约

### 12.0 认证与调用边界

- 生产 Remote MCP SHOULD 使用 OAuth；本地单用户开发 MAY 使用来自环境变量的
  Bearer Token。
- Token MUST NOT 出现在 URL query、Skill、仓库文件或 MCP 工具参数中。
- 服务端必须将认证主体映射为内部 `user_id`，再计算其工作空间权限。
- Codex 端 SHOULD 将 MCP 默认审批模式配置为“写工具需确认”，并对
  `execute_approved_change` 使用最严格的逐工具审批。
- Codex 工具审批是附加防线，不能替代网页业务审批。
- MCP 初始化说明必须在开头明确：读取可自动执行，外部广告写入只能执行已批准的
  `change_request_id`。

### 12.1 通用响应

所有读取工具 SHOULD 返回：

```json
{
  "ok": true,
  "data": {},
  "context": {
    "workspace_id": "ws_...",
    "meta_ad_account_id": "act_...",
    "currency": "USD",
    "timezone_name": "America/Los_Angeles",
    "attribution_spec": {},
    "data_through": "2026-07-28T23:59:59Z",
    "sync_run_id": "sync_..."
  },
  "warnings": [],
  "next_cursor": null,
  "truncated": false
}
```

错误响应：

```json
{
  "ok": false,
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Reader-facing error message",
    "retryable": false
  }
}
```

错误响应 MUST NOT 包含 Token、Meta 原始认证响应或内部堆栈。

### 12.2 只读工具

```yaml
list_workspaces:
  purpose: list workspaces visible to the authenticated user

list_ad_accounts:
  input:
    workspace_id: string
  purpose: list authorized Meta ad accounts and data freshness

get_account_summary:
  input:
    workspace_id: string
    ad_account_id: string
    date_range: {from: YYYY-MM-DD, to: YYYY-MM-DD}

get_campaign_tree:
  input:
    workspace_id: string
    ad_account_id: string
    effective_status: optional_array
    cursor: optional_string

get_insights:
  input:
    workspace_id: string
    ad_account_id: string
    level: account | campaign | adset | ad
    date_range: {from: YYYY-MM-DD, to: YYYY-MM-DD}
    metrics: allowlisted_array
    breakdowns: allowlisted_array
    filters: allowlisted_array
    cursor: optional_string

compare_periods:
  input:
    workspace_id: string
    ad_account_id: string
    level: account | campaign | adset | ad
    current_range: {from: YYYY-MM-DD, to: YYYY-MM-DD}
    baseline_range: {from: YYYY-MM-DD, to: YYYY-MM-DD}
    metrics: allowlisted_array

get_sync_status:
  input:
    workspace_id: string
    ad_account_id: optional_string
```

要求：

- 读取工具必须声明为 read-only。
- 服务端必须限制日期跨度、行数、breakdown 和指标列表。
- 大结果必须分页或聚合，返回 `truncated`。
- 工具不得允许任意 SQL、任意 Graph API path 或任意 URL。

### 12.3 内部状态写入工具

```yaml
draft_change_request:
  external_side_effect: false
  input:
    workspace_id: string
    ad_account_id: string
    operation: enum
    target:
      object_type: campaign | adset | ad
      object_id: string
    proposed_patch: schema_validated_object
    rationale: string
    evidence_refs: array

submit_change_request:
  external_side_effect: false
  input:
    change_request_id: string
```

这些工具只写入内部审批系统，不调用 Meta 写接口。

### 12.4 外部写入工具

```yaml
execute_approved_change:
  external_side_effect: true
  input:
    change_request_id: string
```

`execute_approved_change` MUST NOT 接受任意 Meta payload。服务端必须从数据库加载
已经批准且未过期的不可变 payload。

工具执行前必须验证：

1. 状态为 `APPROVED`。
2. 审批者具有权限且不是系统伪造身份。
3. 审批未过期。
4. Emergency stop 未开启。
5. 当前 Meta 对象状态与 `before_hash` 一致。
6. 操作符合工作空间预算和策略限制。
7. 幂等键未被成功执行。

不得通过 MCP 提供：

- 密钥读取。
- 成员邀请或权限管理。
- 任意 Meta Graph API 请求。
- 任意 Cloudflare API 请求。
- 广告对象硬删除。

## 13. 变更审批状态机

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

状态转换规则：

- `DRAFT -> VALIDATED`：通过对象、权限、预算和 payload 校验。
- `VALIDATED -> AWAITING_APPROVAL`：由授权用户或 Codex 提交。
- `AWAITING_APPROVAL -> APPROVED/REJECTED`：只能在网页控制台完成。
- `APPROVED -> EXECUTING`：只能由 `execute_approved_change` 完成。
- `APPROVED -> STALE`：目标对象、预算、状态或审批期限发生变化。
- `EXECUTING -> SUCCEEDED/FAILED`：记录 Meta 请求结果和后状态。

### 13.1 操作矩阵

| 操作 | 初始模式 | 网页审批 | Codex 工具审批 | 自动化允许 |
|---|---|---:|---:|---:|
| 读取和分析 | `READ_ONLY` | 否 | 否 | 是 |
| 创建内部建议 | `ADVISORY` | 否 | 否 | 是 |
| 提交变更申请 | `APPROVAL_REQUIRED` | 后续审批 | 建议提示 | 是 |
| 暂停/启用 | `APPROVAL_REQUIRED` | 是 | 是 | 后期有条件 |
| 修改预算 | `APPROVAL_REQUIRED` | 是 | 是 | 后期有条件 |
| 创建/发布广告 | `APPROVAL_REQUIRED` | 是 | 是 | MVP 否 |
| 删除对象 | 不支持 | - | - | 否 |

### 13.2 策略限制

在以下值配置前，所有 Meta 写操作必须被阻止：

```yaml
max_budget_change_pct: null
max_account_daily_spend: null
allowed_operations: []
approval_ttl_minutes: null
emergency_stop: true
```

不得在代码中偷偷填入宽松默认值。

## 14. 网页控制台

MVP 页面：

```text
/connections
/workspaces
/ad-accounts
/dashboard
/sync
/recommendations
/changes
/changes/:id
/audit
/settings/safety
```

必须支持：

- 查看连接状态，但不显示 Token。
- 广告账户与工作空间绑定。
- 指标口径、主转化事件、币种和时区配置。
- 数据更新时间和同步错误。
- 变更前后差异。
- 批准、拒绝和取消。
- Emergency stop。
- 审计日志。

网页不得直接调用 Meta API。所有请求必须经过 Worker 服务端。

## 15. 定时任务

### 15.1 Cloudflare 定时任务

Cloudflare 负责：

- Meta 数据同步。
- 归因回补。
- Token/权限健康检查。
- 同步失败重试。
- 数据稳定状态更新。
- 审计保留和必要清理。

这些任务必须独立于 Codex 客户端是否在线。

### 15.2 Codex Scheduled Tasks

Codex 定时任务 MAY 负责：

- 每日广告简报。
- 周报。
- 异常摘要。
- 等待审批的变更提醒。

Codex 定时任务 MUST NOT 成为唯一的数据同步或生产执行机制。

建议日报任务：

```text
每天 09:00 调用 $facebook-ads-daily-brief。
仅分析已完成同步且数据状态有效的账户。
只汇报需要决策或调查的变化。
不得创建或执行 Meta 写操作。
如果数据过期或同步失败，优先报告数据问题。
```

## 16. 安全要求

### 16.1 必须满足

- 最小权限。
- 服务端租户隔离。
- 所有外部写操作双重审批。
- Token 加密与脱敏。
- 写操作幂等。
- Before/after 快照。
- 不可修改的审计事件。
- Emergency stop 默认开启。
- 日志禁止记录 Authorization Header 和请求体中的密钥字段。
- 生产与 staging 使用不同密钥和数据资源。

### 16.2 审计事件

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

### 16.3 恢复策略

- D1 schema migration 必须可回滚或提供前向修复。
- R2 原始数据不可依赖单个同步批次。
- 广告变更回滚通过新的反向变更申请完成。
- 不得把“删除”作为回滚机制。

## 17. 可观测性与数据质量

必须监控：

- 每个广告账户最后成功同步时间。
- 同步持续时间和失败率。
- Meta 限流和重试。
- 数据行数异常。
- 同一幂等键重复。
- 当日数据与过去基线的异常差异。
- MCP 工具延迟和错误率。
- 待审批、过期和失败变更数量。
- Emergency stop 状态。

数据质量检查：

- 主键和唯一约束。
- 重复行。
- 负花费、负展示等非法值。
- 货币和时区缺失。
- 归因配置变化。
- Campaign 层级关系断裂。
- 分页不完整。
- 同步范围缺口。

## 18. 实施阶段

### Phase 0：业务与权限确认

依赖：无。

任务：

- `P0-01` 确认管理自有还是客户 Meta 广告账户。
- `P0-02` 确认 Meta Business、广告账户数量和预估数据量。
- `P0-03` 确认 Campaign objective、主 KPI 和主转化事件。
- `P0-04` 确认币种、时区和归因政策。
- `P0-05` 确认历史回填与原始数据保留期。
- `P0-06` 确认网页用户和角色。
- `P0-07` 确认 `cf-primary` 域名、Workers 套餐和生产所有权。
- `P0-08` 创建 Meta App 和只读授权路径。

Gate `G0`：

```yaml
business_model_confirmed: true
primary_kpi_configured: true
meta_read_access_available: true
cloudflare_primary_account_confirmed: true
production_deploy_authorized: false
```

完成标准：

- 所有 blocking questions 有答案。
- 能在测试环境只读列出至少一个 Meta 广告账户。
- 未部署生产资源。

### Phase 1：Cloudflare 数据控制平面

依赖：`G0`。

任务：

- `P1-01` 创建 TypeScript Worker 项目和本地环境。
- `P1-02` 创建 D1 migration 和租户约束。
- `P1-03` 创建 R2、Queues、Workflows 的 staging 配置。
- `P1-04` 实现加密后的 Meta connection 存储。
- `P1-05` 实现 Meta 只读客户端、分页、限流和错误分类。
- `P1-06` 实现增量同步、7 日回补和历史 backfill。
- `P1-07` 实现数据质量检查和同步状态。
- `P1-08` 添加单元、集成和 fixture 测试。

Gate `G1`：

- staging 中能同步至少一个广告账户。
- 重复执行同一同步不会产生重复数据。
- Token 不出现在日志、数据库明文或错误响应。
- 花费、展示和点击在统一时间口径下与 Ads Manager 对齐。
- 数据差异阈值由 Phase 0 明确，不得临时猜测。

### Phase 2：Remote MCP 与 Codex 只读分析

依赖：`G1`。

任务：

- `P2-01` 实现 MCP 认证和用户到工作空间映射。
- `P2-02` 实现所有 12.2 只读工具。
- `P2-03` 实现分页、限制、错误 envelope 和安全日志。
- `P2-04` 创建 `facebook-ads-analysis` Skill。
- `P2-05` 创建 `facebook-ads-daily-brief` Skill。
- `P2-06` 创建代表性分析和拒绝场景测试。

Gate `G2`：

- Codex 能完成账户、Campaign、Ad Set 和 Ad 分析。
- 每个结论包含数据范围、新鲜度和口径。
- 跨工作空间请求被拒绝。
- 只读工具没有外部写副作用。
- 数据不足时 Codex 不编造结论。

此 Gate 完成后形成只读 MVP。

### Phase 3：精简网页控制台

依赖：`G1`，可与 Phase 2 部分并行，但不得跳过权限测试。

任务：

- `P3-01` 实现用户认证和 RBAC。
- `P3-02` 实现连接、账户绑定和指标配置页面。
- `P3-03` 实现 dashboard 和同步状态。
- `P3-04` 实现 recommendations 和 audit 页面。
- `P3-05` 实现 accessibility、响应式和 E2E 测试。

Gate `G3`：

- 用户只能看到授权工作空间。
- 页面数据与 MCP 数据使用相同业务查询层。
- Token 和敏感错误不出现在浏览器。

### Phase 4：审批式写操作

依赖：`G2`、`G3`、Meta 管理权限和用户单独授权。

启动前必须更新：

```yaml
meta_write_operations_authorized: true
operation_mode: APPROVAL_REQUIRED
```

任务：

- `P4-01` 实现 change request schema 和状态机。
- `P4-02` 实现 before hash、过期和策略校验。
- `P4-03` 实现网页批准/拒绝。
- `P4-04` 实现 `draft_change_request` 和 `submit_change_request`。
- `P4-05` 实现只接受 ID 的 `execute_approved_change`。
- `P4-06` 实现暂停、启用和预算变更适配器。
- `P4-07` 实现 Before/after 快照、审计和反向变更。
- `P4-08` 在 Meta 测试资产或低风险资产上验证。

Gate `G4`：

- 未批准、过期、状态变化或重复的请求无法执行。
- Codex 不能绕过网页审批。
- 同一幂等键最多产生一次成功外部操作。
- 失败操作可解释且不会自动无限重试。

### Phase 5：有限自动化

依赖：`G4` 和不少于用户批准的 Dry Run 周期。

启动前必须配置：

```yaml
operation_mode: BOUNDED_AUTONOMY
max_budget_change_pct: required_number
max_account_daily_spend: required_money
allowed_operations: required_non_empty_list
approval_ttl_minutes: required_number
emergency_stop: false
```

任务：

- `P5-01` 将规则引擎与模型建议分离。
- `P5-02` Dry Run 记录“建议执行但未执行”的结果。
- `P5-03` 比较 Dry Run 建议、实际结果和人工判断。
- `P5-04` 只开放用户批准的操作白名单。
- `P5-05` 实现自动熔断和告警。

Gate `G5`：

- Dry Run 结果经用户审核。
- 所有预算、操作和账户边界可验证。
- Emergency stop 已测试。
- 任何未配置策略都会安全失败。

## 19. 测试矩阵

### 19.1 单元测试

- KPI 公式和零分母。
- 币种、时区和归因口径校验。
- Meta 错误分类。
- 状态机非法转换。
- 预算和操作策略。
- Token 加密/解密和轮换。
- 幂等键生成。

### 19.2 集成测试

- Meta 分页和限流模拟。
- 异步 Insights Job。
- D1 transaction 和唯一约束。
- Queue 重试与死信处理。
- Workflow 恢复。
- MCP 用户到工作空间授权。
- R2 原始快照脱敏。

### 19.3 E2E 测试

- 连接 Meta -> 选择账户 -> 首次同步 -> Codex 分析。
- 同步失败 -> 控制台显示 -> Codex 报告数据问题。
- Codex 草拟变更 -> 网页拒绝 -> 无 Meta 调用。
- Codex 草拟变更 -> 网页批准 -> 对象变化 -> 请求变为 `STALE`。
- 批准请求 -> 执行一次 -> 重试不会重复修改。
- Emergency stop 开启 -> 所有 Meta 写操作安全失败并拒绝执行。

### 19.4 安全测试

- 水平越权。
- 跨工作空间 ID 枚举。
- 任意 Graph API path 注入。
- 任意 URL/SSRF。
- 日志和错误泄密。
- 重放执行。
- 审批者身份伪造。
- MCP 工具参数绕过。

## 20. Definition of Done

### Read-only MVP

- `G0`、`G1`、`G2` 完成。
- Codex 能稳定分析已授权广告账户。
- 数据可追溯到同步批次和口径。
- 数据同步不依赖 Codex 在线。
- 无生产 Meta 写工具。
- 关键安全和租户测试通过。

### Approval-required MVP

- `G3`、`G4` 完成。
- 网页审批不可绕过。
- 写操作可预览、可审计、幂等、可失效。
- Emergency stop 有效。
- 生产写能力经过用户单独授权。

### Bounded autonomy

- `G5` 完成。
- Dry Run 经用户审阅。
- 预算和账户边界由确定性代码执行，而不是只依赖模型提示。
- 所有自动操作有停止条件、告警和审计。

## 21. Blocking Questions

在开始 Phase 1 前必须回答：

1. 系统只管理你自己的 Meta Business，还是也管理客户账户？
2. 首批 Meta 广告账户数量是多少？
3. 主要投放目标是销售、线索、应用安装还是其他？
4. 主转化事件是什么？
5. 是否已有 Pixel、Conversions API 或 CRM 转化数据？
6. 广告账户包含哪些币种和时区？
7. 采用哪个 Meta 归因窗口作为标准口径？
8. 需要回填多少天历史数据？
9. 原始数据和审计数据保留多久？
10. 哪些用户拥有审批权？
11. 精简网页使用 Cloudflare Access，还是需要面向外部客户的登录系统？
12. `cf-primary` 是否确定为生产域名、账单和 Workers 资源所有者？

未回答的问题不会阻塞本文档交付，但会阻塞相应实施 Gate。

## 22. 官方参考

- OpenAI Codex Skills：
  <https://developers.openai.com/plugins/build/skills>
- OpenAI Model Context Protocol：
  <https://learn.chatgpt.com/docs/extend/mcp>
- OpenAI Plugins：
  <https://developers.openai.com/plugins/build/plugins>
- OpenAI Scheduled Tasks：
  <https://learn.chatgpt.com/docs/automations>
- Meta Marketing API 官方 Postman 文档：
  <https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi>
- Meta Insights API 官方 Postman 文档：
  <https://www.postman.com/meta/facebook-marketing-api/folder/zzd6d5p/insights-api>
- Cloudflare Wrangler 多账户说明：
  <https://developers.cloudflare.com/workers/wrangler/deprecations/>
- Cloudflare Service Bindings：
  <https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/>
- Cloudflare D1：
  <https://developers.cloudflare.com/d1/>
- Cloudflare R2：
  <https://developers.cloudflare.com/r2/how-r2-works/>
- Cloudflare Secrets Store：
  <https://developers.cloudflare.com/secrets-store/integrations/workers/>
- Cloudflare Workflows 与人工审批：
  <https://developers.cloudflare.com/agents/concepts/agentic-patterns/human-in-the-loop/>

## 23. 变更规则

修改本规范时：

1. 递增 `version`。
2. 在变更提交中说明修改的 ADR、接口、Gate 或安全边界。
3. 权限扩大必须由用户明确批准。
4. 不得通过实现代码暗中改变本文档定义的安全策略。
5. 实现与规范冲突时，Codex 必须停止并报告冲突，不能自行选择更宽松行为。
