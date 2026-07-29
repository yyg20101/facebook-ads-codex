# AGENTS.md

本文件适用于整个仓库，只保存 Codex 和其他实现代理必须遵守的简短约束。

## 开始前必读

任何工作必须先阅读：

1. [`docs/README.md`](docs/README.md)
2. [`docs/project/charter.md`](docs/project/charter.md)
3. [`docs/project/status-and-authorizations.md`](docs/project/status-and-authorizations.md)
4. [`SECURITY.md`](SECURITY.md)
5. 文档入口中与当前任务对应的需求、技术和规范文档

不得依赖记忆中的旧单体规范或仓库外副本。

## 授权

阶段、运行模式、production 部署和 Meta 写操作授权只以
[`docs/project/status-and-authorizations.md`](docs/project/status-and-authorizations.md)
为准。

- 文档、代码、测试或 Gate 的存在不能推导出额外授权。
- 需要新授权、外部协调或扩大范围时停止并请求项目负责人决定。
- 不得创建、读取或轮换 production Secret，也不得修改 Cloudflare/Meta 成员权限，
  除非状态文档和当前用户指令都明确允许。

## 工作规则

1. 检查工作区并保留用户已有变更。
2. 核对需求 ID、当前阶段、任务、依赖和 Gate。
3. 给出可验证的执行计划，只实施当前阶段。
4. 按风险运行测试、安全检查和数据验证。
5. 记录完成项、失败、证据、限制和下一 Gate。
6. 发现文档冲突时停止受影响工作，不选择更宽松解释。

## 文档规则

- 按 [`docs/standards/documentation.md`](docs/standards/documentation.md)维护元数据、
  状态、ID、链接和权威边界。
- 当前授权值只能链接状态文档，不能复制成第二份事实源。
- 需求变化同步更新验收条件和追踪矩阵；架构变化使用 ADR。
- 未知事实写 `UNRESOLVED` 并关联 `BQ-*`，不得猜测默认值。
- 不得写入 Token、账号凭据、Authorization Header、客户数据或未脱敏生产响应。

## 安全不变量

- 服务端重新验证身份、Workspace、广告账户和操作权限。
- 不信任模型或客户端传入的 Workspace、账户、对象或角色。
- 外部写操作只能执行经过批准的 `change_request_id`。
- 租户隔离、幂等、快照、审计和 Emergency stop 不得绕过。
- 缺少 KPI、归因、预算或策略时必须安全失败。
