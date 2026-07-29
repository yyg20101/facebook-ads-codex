---
doc_id: TECH-API-MCP
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# API 与 Remote MCP 契约

## 认证与调用边界

- Production Remote MCP SHOULD 使用 OAuth；本地单用户开发 MAY 使用环境变量中的开发 Token。
- Token MUST NOT 出现在 URL query、Skill、仓库文件或 MCP 工具参数中。
- 服务端必须将认证主体映射为内部 `user_id` 后计算 Workspace 权限。
- MCP 初始化说明必须声明：读取可以自动执行，外部广告写入只能执行已批准的
  `change_request_id`。
- Codex 端对外部写工具使用最严格的逐工具确认，但该确认不替代网页审批。

## 通用读取响应

```json
{
  "ok": true,
  "data": {},
  "context": {
    "workspace_id": "ws_example",
    "meta_ad_account_id": "act_example",
    "currency": "USD",
    "timezone_name": "America/Los_Angeles",
    "attribution_spec": {},
    "data_through": "2026-07-28T23:59:59Z",
    "sync_run_id": "sync_example"
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

错误不得包含 Token、原始认证响应、内部堆栈或其他 Workspace 数据。

## 只读工具

### `list_workspaces`

- 输入：无业务作用域参数。
- 输出：认证用户可见的 Workspace。

### `list_ad_accounts`

- 输入：`workspace_id`。
- 输出：已授权广告账户和数据新鲜度。

### `get_account_summary`

- 输入：`workspace_id`、`ad_account_id`、`date_range`。
- 输出：规范指标、口径和同步上下文。

### `get_campaign_tree`

- 输入：`workspace_id`、`ad_account_id`、可选 `effective_status` 和 `cursor`。
- 输出：Campaign、Ad Set、Ad 层级和下一游标。

### `get_insights`

- 输入：
  - `workspace_id`
  - `ad_account_id`
  - `level: account | campaign | adset | ad`
  - `date_range`
  - allowlist 中的 `metrics`、`breakdowns`、`filters`
  - 可选 `cursor`
- 输出：有界 Insights 结果、上下文、warnings 和截断状态。

### `compare_periods`

- 输入：Workspace、广告账户、层级、当前范围、基线范围和指标。
- 输出：口径兼容的当前值、基线值和变化。

### `get_sync_status`

- 输入：`workspace_id` 和可选 `ad_account_id`。
- 输出：最近运行、错误、数据覆盖和稳定状态。

读取工具必须声明 read-only。服务端必须限制日期跨度、行数、breakdown、指标、筛选器
和并发；大结果必须分页或聚合。

## 内部状态写入工具

### `draft_change_request`

```yaml
external_side_effect: false
input:
  workspace_id: string
  ad_account_id: string
  operation: allowlisted_enum
  target:
    object_type: campaign | adset | ad
    object_id: string
  proposed_patch: schema_validated_object
  rationale: string
  evidence_refs: array
```

### `submit_change_request`

```yaml
external_side_effect: false
input:
  change_request_id: string
```

这些工具只写内部审批系统，不调用 Meta 写 API。

## 外部写入工具

### `execute_approved_change`

```yaml
external_side_effect: true
input:
  change_request_id: string
```

工具 MUST NOT 接受任意 Meta payload。服务端从数据库读取批准且不可变的 payload，
并在执行前验证：

1. 状态为 `APPROVED`。
2. 审批者真实且具有权限。
3. 审批未过期。
4. Emergency stop 未开启。
5. 当前对象与 `before_hash` 一致。
6. 操作符合预算、账户和白名单策略。
7. 幂等键未成功执行。
8. [当前授权](../project/status-and-authorizations.md)允许 Meta 写操作。

## 禁止工具

MCP 与 HTTP 均不得提供：

- 密钥读取。
- 成员邀请或权限管理。
- 任意 Meta Graph API、Cloudflare API、SQL 或 URL 请求。
- 广告对象硬删除。
- 绕过 Workspace 的平台级查询。

## Web HTTP 契约

控制台 HTTP API 与 MCP 使用同一身份映射、授权、领域查询、策略、错误码和审计层。
具体 endpoint 在 Phase 3 技术设计中定义；不得从页面路由反推未经审查的 API。
