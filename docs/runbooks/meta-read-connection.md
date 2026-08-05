---
doc_id: RUNBOOK-META-READ-CONNECTION
type: runbook
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-05
---

# Meta 只读连接验证

## 元数据

- 环境：`local`
- 状态：`DRAFT`
- 所有者：`project_owner`
- 审批者：`project_owner`
- 最近验证：`NEVER`
- 关联任务/Gate：`P0-02`、`P0-04`、`P0-08`、`G0`

本文只验证可重复建立的临时 Meta 只读路径，不是业务运行时、持续同步或 production
连接说明。真实验证完成前，本 Runbook MUST 保持 `DRAFT`。

## 权限与安全边界

- 只使用临时 User Access Token 和 `ads_read`。
- MUST NOT 请求 `ads_management`，也不需要 App Secret 或 System User Token。
- MUST NOT 在聊天、Git、截图、命令行参数或 Shell 历史中传递真实值。
- MUST NOT 使用真实 ID 拼接任意 Graph path；只允许工具内固定的版本化 GET 请求。
- MUST NOT 执行 Meta 写操作、创建 Cloudflare 资源或调用 Cloudflare API。
- 真实请求前，[授权事实源](../project/status-and-authorizations.md)中的只读验证授权必须为
  `true`；缺少授权时工具必须安全失败。

## 用户后续准备

项目负责人在本机完成以下步骤，真实值不得进入仓库：

1. 创建或选择 Meta App，并确认 Marketing API 可用。
2. 创建只含 `ads_read` 的临时 User Access Token。
3. 从 Ads Manager 确认首期允许访问的 1–10 个广告账户。
4. 从 Cloudflare Dashboard 确认逻辑主账户、目标域名和套餐；Zone ID 没有时可留作可选项。
5. 复制配置模板并限制文件权限：

   ```text
   cp config/p0-readiness.example.env config/p0-readiness.local.env
   chmod 600 config/p0-readiness.local.env
   ```

6. 直接用本地编辑器填写 `config/p0-readiness.local.env`。不得把值作为命令参数传入。

本阶段不保存持续有效的 Token。如果未来需要 System User 或服务端凭据，必须另行评审
Token 模型、Secret 存储和撤销方案。

## 前置检查

1. 确认当前分支和工作区不包含本地配置文件：

   ```text
   git check-ignore config/p0-readiness.local.env
   git status --short
   ```

2. 从 [Meta 官方 Marketing API Workspace](https://www.postman.com/meta/facebook-marketing-api/overview?sideView=agentMode)
   复核固定 API 版本。当前模板为 `v25.0`；版本变化时必须先更新模板、工具和测试。
3. 运行离线配置检查：

   ```text
   npm run p0:config:check
   ```

4. 检查输出只包含配置状态、数量和布尔值，不含实际 Token、ID 或域名。
5. 获得项目负责人明确的本次 Meta 只读验证授权，并更新授权事实源。

任一检查失败 MUST 停止，不得通过跳过字段、扩大权限或手工修改结果继续。

## 只读验证

执行：

```text
npm run p0:meta:verify
```

工具固定验证：

- `ads_read` 已授予。
- Token 可列出广告账户，且本地 allowlist 中每个账户均可见。
- 账户状态、币种、时区可读取。
- Campaign、Ad Set 和 Ad 的数据量可归入脱敏区间。
- Campaign 目标、Ad Set 归因上下文和最近 7 天 Insights 样本可读取。

最近 7 天只是有界连接测试，不是产品默认历史范围。工具只输出 `AA-NN` 别名、数据量
区间、字段存在性和错误分类，不输出原始指标或响应。

## 成功、部分成功与失败

只有以下条件同时满足时才能形成 `G0: PASS` 证据：

- `ads_read` 明确为 granted。
- 至少一个且不超过十个 allowlist 账户成功验证。
- 账户上下文、对象列表和 Insights 样本均返回合法结构。
- 没有未完成分页、权限错误、限流耗尽、超时或字段不兼容。
- 输出和仓库未出现 Secret、真实 ID、对象名称、精确指标或原始响应。

任何账户不可见、返回结构不兼容或请求只完成部分范围时，结果 MUST 为 `FAIL` 或
`PARTIAL`，G0 继续保持未通过。

## 撤销与清理

验证结束后，无论成功或失败都必须：

1. 在 Meta 侧撤销临时 Token。
2. 删除本地配置文件，或至少清空其中的 Token。
3. 将授权事实源中的只读验证授权恢复为 `false`。
4. 检查 Git 状态和仓库历史中没有本地配置或 Secret。
5. 只把脱敏摘要登记到 [Phase 0 问卷](../planning/phase-0-questionnaire.md)和
   [Gate 证据](../planning/gates-and-evidence.md)。

## 证据记录

证据使用 [Gate 证据格式](../planning/gates-and-evidence.md#证据格式)，至少记录 commit、
本地环境、API 版本、验证账户数量、字段存在性、对象数量区间、结果和限制。

`meta_read_access_available=true` 表示只读路径已成功验证且可以按本 Runbook 重新配置，
不表示仓库或本机持续保存有效 Token。

## 验证记录

- 最近真实验证日期：`NEVER`
- 当前结果：`NOT_EXECUTED`
- 原因：尚未提供本地账户配置，也未授权真实 Meta 请求。
