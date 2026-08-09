---
doc_id: TECH-OFFLINE-WEB-ACCOUNT-CONTEXT
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线 Web 账户上下文选择切片

> 候选实现：本切片响应项目负责人再次“继续下一阶段”的指令，只在既有本地 Web 分析
> 链路前增加 fixture 账户发现与选择。它不接受 `FR-001`、`FR-005`、`FR-011`、候选
> Cloudflare 架构或正式接口，不构成 Phase 1、Phase 3 或任何 Gate 证据。

## 目标与范围

允许实现：

- Web 先从固定 Workspace 的本机 Worker 读取最多 10 个 fixture 广告账户。
- 用户只能从已验证的响应列表选择账户，再选择基线与当前周期并请求 comparison。
- 页面显示账户引用、币种、时区、数据截至时间和 fixture 日级行数。
- 切换账户或重新读取列表时中止未完成请求并清除旧 comparison，避免错配上下文。
- 分别展示账户列表与 comparison 的 loading、empty、error 和 success 状态。

禁止增加手工账户 ID 输入、用户提供的 Workspace、远程 API 基址、真实账户、认证替代、
Meta 请求、CORS、Secret、写操作、部署或自动优化。

## 本地请求顺序

```text
GET /offline-api/v1/workspaces/ws_fixture_01/ad-accounts
  -> user selects one returned fixture account
  -> GET /offline-api/v1/workspaces/ws_fixture_01/ad-accounts/{selected_id}/comparison
```

`ws_fixture_01` 和 `/offline-api/` 仍由浏览器代码固定。`selected_id` MUST 来自本次通过
契约验证的账户列表，不提供自由文本或 URL 参数入口。ID 继续使用固定 allowlist，并通过
`encodeURIComponent` 进入相对同源路径。

该流程沿用[离线 Web 分析接入](offline-web-analysis-integration.md)的 Vite 固定代理、
production 关闭、本机 Host、GET-only 和 fixture 护栏；本切片不修改 Worker 路由或
Wrangler 配置。

## 账户列表信任检查

列表响应在进入组件状态前 MUST 验证：

- 顶层成功 envelope、`items`、context、warnings 和分页字段结构。
- `workspaceId=ws_fixture_01`、`sourceKind=FIXTURE`。
- 每个账户 ID 合法且唯一，账户数量不超过 10。
- 每个账户包含非空引用、币种、时区、`sourceKind=FIXTURE`、数据截至时间和非负行数。
- warnings 同时包含 `FIXTURE_DATA_ONLY` 与 `NO_EXTERNAL_CONNECTION`。
- `nextCursor=null` 且 `truncated=false`。

任何条件不满足都返回页面级 `INVALID_RESPONSE`，不得显示手工账户字段或使用静态故事
账户回退。

## Comparison 绑定检查

除既有 fixture、覆盖、无阈值和非因果检查外，comparison 成功响应 MUST 与下列请求
上下文一致：

- 响应账户 ID、账户引用、币种和时区与当前所选列表项一致。
- context 的 Workspace 和广告账户 ID 与请求一致。
- metric context 的币种和时区与所选账户一致。
- 响应的两个 requested range 与用户提交的四个日期一致。

不一致时 MUST 拒绝展示，不能把一个账户或周期的结果呈现在另一个选择下。

## React 状态边界

- 账户和 comparison 使用独立的判别联合状态，不把派生的当前账户复制为第二份状态。
- 当前账户在 render 中由列表和 `selectedAccountId` 派生，不使用 effect 同步。
- 网络请求只由显式按钮或表单事件触发；同一面板一次只保留一个活动
  `AbortController`。
- 重新读取账户、切换账户或组件卸载 MUST 中止旧请求并清除旧结果。
- 当前只有一个面板实例和显式请求，不增加缓存或后台 revalidation；未来出现共享查询
  后再评审 SWR 等去重方案。

## 验证

自动测试至少覆盖：

- 先请求固定账户列表路径，再使用所选账户 ID 请求 comparison。
- 列表错误、缺少信任 warning 和超出/重复账户等不可信响应安全失败。
- comparison 错误、warning 缺失和账户错配安全失败。
- loading、零基线、账户元数据、指标和非因果诊断继续正确显示。
- TypeScript、production build、Worker runtime、文档和敏感信息检查通过。

本地浏览器验证 MUST 在桌面和移动端完成“读取账户 → 选择账户 → 加载周期对比”，并
检查页面身份、关键 DOM、错误 overlay、控制台、横向溢出和截图。验证后停止 Worker 与
Vite。本切片完成后 G0 仍为 `PARTIAL`，不得据此进入正式 Phase 1 或 Phase 3。

后续获准的[离线广告对象层级](offline-ad-object-hierarchy.md)在所选账户与周期表单之间
增加独立导航。再后续获准的[离线对象级分析](offline-object-level-analysis.md)增加独立
对象 comparison，但仍复用并验证本文的账户绑定，不允许对象跨账户。

2026-08-06 本地验证完成：账户列表与所选账户 comparison 均返回 `200`；13 项原型测试、
production build、桌面 `1536 × 1024` 和移动端 `430 × 932` 交互通过。两个尺寸均显示
6 个指标和非因果诊断，无控制台告警、框架错误层或横向溢出；验证后端口已停止。
