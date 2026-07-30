---
doc_id: STD-API-ERRORS
type: standard
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# API 与错误规范

> 候选实现规范：HTTP、MCP、响应结构和写操作契约尚未选定；`DG0` 通过未接受这些
> 接口，不构成当前实现要求。

## Schema-first

- 每个 HTTP endpoint 和 MCP 工具必须定义输入、输出和错误 schema。
- 未知字段默认拒绝或显式忽略，不能进入 Meta payload。
- ID、日期范围、指标、breakdown、筛选器、游标和操作必须 allowlist。
- 服务端重新解析 Workspace 和对象权限，不信任传入角色。

## 响应

- 成功响应包含 `ok`、`data`、`context`、`warnings`、分页和截断信息。
- 错误响应包含稳定 `code`、面向读者的 `message` 和 `retryable`。
- 数据结果必须携带币种、时区、归因、新鲜度和同步批次等必要上下文。
- 不兼容口径、过期数据或部分结果通过 warning 或明确错误表达。

## 错误分类

错误码至少区分：

- 认证失败与权限拒绝。
- Workspace 或对象不存在。
- 输入 schema 或范围超限。
- 数据口径缺失、不兼容或过期。
- Meta 权限、限流、瞬时和永久错误。
- 同步部分失败。
- 审批状态、TTL、策略、对象变化和 Emergency stop。
- 内部暂时不可用。

错误不得泄漏其他租户是否存在，也不得包含 Token、Authorization Header、
原始认证响应或内部堆栈。

## 分页与限制

- 列表和 Insights 使用有界页大小和不透明游标。
- 日期跨度、结果行数、并发、breakdown 和筛选器数量必须有上限。
- 截断时返回 `truncated: true` 和可继续的游标或缩小范围提示。
- 不允许客户端通过组合参数绕过单项限制。

## 幂等与写操作

- 内部状态写入应接受或生成稳定幂等键。
- 外部写入只接受 `change_request_id`，不接受任意 payload。
- 超时后的重试必须先查询既有执行结果。
- 成功外部副作用不能因响应丢失而重复执行。

## 版本

- Meta API 版本固定在配置中并有回归证据。
- 破坏性 MCP/HTTP 契约变化必须记录影响、迁移和兼容策略。
- 不使用静默字段重解释代替版本或明确契约变更。
