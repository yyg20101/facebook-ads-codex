---
doc_id: STD-LOGGING
type: standard
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 日志与可观测性规范

> 候选实现规范：日志字段、服务指标和告警范围依赖后续架构，`DG0` 通过未接受本文为
> 运行要求；禁止记录敏感信息的政策继续有效。

## 结构化日志

服务端日志 SHOULD 包含：

```text
timestamp
level
service
environment
request_id
operation
workspace_id_or_hash
target_type
result
error_code
duration_ms
```

只记录诊断所需的最小字段。Workspace 标识是否哈希由环境和访问控制决定。

## 禁止内容

日志、错误、trace 和告警 MUST NOT 包含：

- Authorization Header、Cookie 或完整请求体。
- Meta/OAuth Token、根密钥或解密后的凭据。
- 未脱敏的第三方认证响应。
- 客户个人数据或可重用攻击载荷。
- production 内部堆栈的公开返回。

## 关联

- HTTP、MCP、同步、Workflow、Meta 请求和审计通过 `request_id` 或稳定关联 ID 串联。
- 同步事件包含 `sync_run_id`、广告账户作用域和数据范围。
- 变更事件包含 `change_request_id`、审批、执行和快照引用。
- 日志 ID 不能替代业务审计事件。

## 指标

最低指标：

- 同步新鲜度、持续时间、成功/失败和缺口。
- Meta 限流、使用量和重试。
- 行数、重复、非法值和层级断裂。
- MCP/HTTP 请求量、延迟、错误和截断。
- 变更状态、过期、STALE、失败和重放拒绝。
- Emergency stop 状态。

## 告警

- 告警必须可操作，包含影响、作用域、首次时间和 Runbook。
- 告警合并不能隐藏不同 Workspace 的安全影响。
- 数据质量问题和系统可用性问题使用不同分类。
- 不为尚未配置的 SLO 编造阈值；容量与性能阈值等待 `BQ-02`。
