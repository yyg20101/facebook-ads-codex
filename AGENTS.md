# AGENTS.md

本文件适用于整个仓库，只保存简短执行约束。

## 唯一规范来源

开始任何工作前，必须完整读取：

- [`docs/FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md`](docs/FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md)

若 README、架构概览、路线图或其他派生文档与执行规范冲突，以执行规范为准并报告冲突。

## 当前授权

- 当前阶段为 Pre-Phase 0。
- 当前只允许阅读、分析、规划和用户明确要求的文档维护。
- 未经用户使用明确阶段启动语句，不得开始该阶段的实现。
- `production_deployment_authorized=false`：不得部署生产资源。
- `meta_write_operations_authorized=false`：不得创建、修改或删除 Meta 广告对象。
- 不得创建、轮换或读取生产密钥，也不得修改 Cloudflare/Meta 成员权限。

## 工作规则

1. 开始阶段前检查工作区并保留用户已有变更。
2. 核对当前阶段依赖、任务、Gate 和完成证据。
3. 每次只实施当前阶段，不提前开发后续阶段。
4. 运行与风险相称的测试和审计。
5. 记录完成项、未完成项、验证证据和下一 Gate。
6. 需要新授权、外部协调或扩大范围时停止并请求用户决定。

## 文档规则

- 执行规范是规范性文档；其余项目文档默认是派生说明或工作记录。
- 修改执行规范时必须递增版本、更新日期，并在 `CHANGELOG.md` 说明是否影响 ADR、
  接口、Gate 或安全边界。
- 派生文档不得重新定义更宽松的权限、安全策略或指标口径。
- 链接使用仓库相对路径；不要复制整份执行规范。
- 不得将 Token、账号凭据、Authorization Header 或未脱敏的客户数据写入文档。

## 安全不变量

- 服务端重新验证身份、工作空间、广告账户和操作权限。
- 不信任模型或客户端传入的 `workspace_id`、`ad_account_id` 或 `role`。
- 外部写操作只能执行已批准的 `change_request_id`，不能接受任意 Meta payload。
- 租户隔离、幂等、before/after 快照、审计和 Emergency stop 不得被绕过。
- 缺少 KPI、归因、预算或策略配置时必须安全失败，不得猜测宽松默认值。
