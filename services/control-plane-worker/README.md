# Offline Control-plane Worker

这是 G0 为 `PARTIAL` 时获准创建的本地离线脚手架，只使用固定虚构 fixture。它不包含
Meta 客户端、真实 Token、Cloudflare 资源标识、认证实现、同步任务或部署能力。

当前 HTTP 路由包括：

```text
GET /healthz
GET /offline/v1/workspaces/{workspace_id}/ad-accounts
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/summary
```

summary 必须提供 `date_start` 与 `date_stop`。`/offline/` 路径只读取固定虚构数据，并且
只接受本机或测试 Host；它们不是公开 API，也没有替代 production 认证。其他路径安全
返回 `404`，其他方法返回 `405`。

## 本地检查

```text
npm run worker:types
npm run worker:check
```

如需手工启动本地模拟器，先应用 migration 和虚构 fixture：

```text
npm run worker:db:migrate:local
npm run worker:db:seed:local
npm run worker:dev
```

不得执行 `wrangler deploy`，也不得把本配置替换为真实 Cloudflare 资源。后续外部接入仍
依赖 G0、架构接受和项目负责人独立授权。详细边界见
[离线只读分析设计](../../docs/technical/offline-read-only-analysis.md)。
