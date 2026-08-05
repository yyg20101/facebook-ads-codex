---
doc_id: RUNBOOK-LOCAL-CONTROL-PLANE
type: runbook
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-05
---

# 本地离线控制平面

## 元数据

- 环境：`local`
- 状态：`DRAFT`
- 所有者：`project_owner`
- 审批者：`project_owner`
- 最近验证：2026-08-05
- 关联任务/Gate：`P1-PREP-01`–`P1-PREP-05`；不计入 G1

## 目的与触发

本 Runbook 用于安装、检查和手工启动只包含虚构 fixture 的 Worker/D1 脚手架及已批准
的离线只读分析切片。它不适用于 staging、production、真实 Meta 数据或 Cloudflare
远程资源。

## 权限与安全边界

- [授权事实源](../project/status-and-authorizations.md)必须允许离线脚手架。
- MUST NOT 执行 `wrangler login`、`wrangler deploy` 或任何 remote D1 命令。
- MUST NOT 替换 Wrangler 中的本地占位 ID、增加 route 或写入 Secret。
- MUST NOT 把真实 ID、Token、响应或广告数据放入 fixture。
- 命令只能操作仓库、依赖缓存和本地 Miniflare 状态。

## 前置检查

1. 使用 Node.js `20.18.1` 或更高版本。
2. 确认当前状态仍禁止 deployment 和 Meta 写操作。
3. 确认 `services/control-plane-worker/wrangler.jsonc` 保持本地占位数据库 ID，且没有 route。
4. 安装锁定依赖：

   ```text
   npm ci
   ```

## 自动验证

执行：

```text
npm run worker:check
```

成功条件：

- Wrangler 生成类型与配置一致。
- Worker 与测试 TypeScript 严格检查通过。
- Workers runtime 中所有测试通过。
- D1 migration 和 fixture 可重复应用。
- 没有网络请求、真实凭据、部署或远程资源副作用。

## 手工本地启动

只有需要查看健康响应时才执行：

```text
npm run worker:db:migrate:local
npm run worker:db:seed:local
npm run worker:dev
```

仅请求本机显示的 `/healthz` 或
[离线只读分析设计](../technical/offline-read-only-analysis.md)列出的 `/offline/` 路径。
不得向其他设备暴露端口，也不得增加设计外的业务数据路由。

## 失败与恢复

- 类型不一致：重新执行 `npm run worker:types`，审查生成差异后再测试。
- migration 失败：保留错误，检查初始 schema 和 fixture；不得跳过失败或连接远程 D1。
- 本地状态污染：停止 Worker，重新创建本地模拟状态后重跑 migration；不得修改远程资源。
- 依赖审计失败：评估受影响链并更新锁定版本，不运行强制破坏性修复。

## 证据

记录 commit、Node/Wrangler/Vitest 版本、执行命令、测试数量、结果和限制。证据不得包含
本机路径以外的用户信息、Secret、真实账户或未脱敏响应。

## 验证记录

- 2026-08-05：使用 Node.js 24.18.0、Wrangler 4.119.0 和 Vitest 4.1.0 完成全量检查；
  基础脚手架的 5 项 Worker runtime/D1 测试通过，本地 migration 成功，虚构 seed
  连续执行两次成功。
- 2026-08-05：扩展后的 2 个测试文件、15 项 Worker 测试通过；重建本地 fixture D1 后，
  `/healthz`、账户列表和三日指标汇总均返回 `200`。服务仅绑定 `127.0.0.1`，未访问
  外部系统。文档仍为 `DRAFT`，因为候选 API、架构和正式 Phase 1 尚未接受。
