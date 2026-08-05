# AGENTS.md

本文件适用于整个仓库，只保存 Codex 和其他实现代理必须遵守的简短约束。

## 开始前必读

任何工作必须先阅读：

1. [`docs/README.md`](docs/README.md)
2. [`docs/project/charter.md`](docs/project/charter.md)
3. [`docs/project/status-and-authorizations.md`](docs/project/status-and-authorizations.md)
4. [`SECURITY.md`](SECURITY.md)
5. Product Discovery 期间阅读
   [`docs/discovery/README.md`](docs/discovery/README.md)
6. 文档入口中与当前任务对应的需求、技术和规范文档

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
3. 给出可验证的执行计划，只实施当前阶段；`DG0` 前不得把候选方案当作需求。
4. 按风险运行测试、安全检查和数据验证。
5. 记录完成项、失败、证据、限制和下一 Gate。
6. 发现文档冲突时停止受影响工作，不选择更宽松解释。

项目负责人已允许在 G0 `PARTIAL` 时开发 Phase 1 离线脚手架。该例外只覆盖固定虚构
fixture、本地 Worker/D1、migration、类型和测试；不得据此访问外部系统、部署、实现
真实 Meta 同步或把候选架构标记为已接受。

负责人随后允许继续固定虚构数据的离线只读分析切片。该例外只增加带 `/offline/`
前缀的账户列表、日期校验、指标汇总和上下文响应；接口必须限制为本机且不得伪装为
已认证、公开或连接 Meta 的能力。

## 文档规则

- 按 [`docs/standards/documentation.md`](docs/standards/documentation.md)维护元数据、
  状态、ID、链接和权威边界。
- 当前授权值只能链接状态文档，不能复制成第二份事实源。
- 需求变化同步更新验收条件和追踪矩阵；架构变化使用 ADR。
- 产品发现未知事实写 `UNRESOLVED` 并关联 `DQ-*`；原 Phase 0 业务事实关联
  `BQ-*`，不得猜测默认值。
- 原始访谈、姓名、联系方式、录音和客户数据不得进入仓库，只保存使用参与者别名的
  脱敏证据。
- 不得写入 Token、账号凭据、Authorization Header、客户数据或未脱敏生产响应。

## 安全不变量

- 不得把 Token、密钥、个人信息、客户数据或生产响应写入仓库。
- 不信任模型或客户端传入的身份、账户、对象、权限或角色。
- 未经项目负责人明确授权，不得访问外部资源、部署或执行 Meta 写操作。
- 候选架构不得削弱 [`SECURITY.md`](SECURITY.md)；实现型安全控制只有在产品与架构
  接受后才能成为实施要求。
