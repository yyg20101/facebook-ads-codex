# Offline Control-plane Worker

这是 G0 为 `PARTIAL` 时获准创建的本地离线脚手架，只使用固定虚构 fixture。它不包含
Meta 客户端、真实 Token、Cloudflare 资源标识、认证实现、同步任务或部署能力。

当前 HTTP 路由包括：

```text
GET /healthz
GET /offline/v1/workspaces/{workspace_id}/ad-accounts
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/objects
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/objects/{object_id}/comparison
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/objects/{object_id}/children-comparison
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/objects/{object_id}/trend
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/objects/{object_id}/children-trend
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/data-quality
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/summary
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/comparison
```

objects 不接受 query 参数，只返回最多 50 个 fixture Campaign、Ad Set 和 Ad，并验证
父级关系。summary 必须提供 `date_start` 与 `date_stop`；comparison 必须提供等长、
不重叠的基线和当前日期范围。对象 comparison 只接受完整层级中已验证的 fixture 对象，
并显式返回对象范围。children-comparison 只接受 Campaign 或 Ad Set，返回最多 10 个
按 ID 稳定排序的直接子对象，并要求两期花费、展示、点击和转化都与父对象完全对账；
它不提供排名、阈值或因果结论。trend 只接受已验证 Campaign、Ad Set 或 Ad，以及唯一
的 `date_start`、`date_stop`；范围必须是连续 3–31 日且完整覆盖。它固定返回 9 项日级
指标，但不应用阈值、排名、趋势解释或执行建议。children-trend 只接受 Campaign 或
Ad Set，原子返回父对象与最多
10 个直接子对象的同期日值，逐日对账四项可加指标；它按稳定 ID 返回，不排名、不选择
赢家或解释趋势。data-quality 对账户和全部对象执行 3–31 日主体日唯一性、连续覆盖、
统一上下文、完整层级和三层逐日汇总检查；任一失败时不返回部分报告，也不评价表现。
所有 `/offline/` 路径只读取固定虚构数据，并且只接受
本机或测试 Host；它们不是公开 API，也没有替代 production 认证。其他路径安全返回
`404`，其他方法返回 `405`。

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
[离线只读分析设计](../../docs/technical/offline-read-only-analysis.md)和
[离线周期诊断](../../docs/technical/offline-period-comparison-and-diagnostics.md)，以及
[离线广告对象层级](../../docs/technical/offline-ad-object-hierarchy.md)和
[离线对象级分析](../../docs/technical/offline-object-level-analysis.md)，以及
[离线直接子对象拆解](../../docs/technical/offline-direct-child-breakdown.md)。
对象日趋势契约见
[离线对象日趋势](../../docs/technical/offline-object-daily-trend.md)。
直接子对象日趋势契约见
[离线直接子对象日趋势](../../docs/technical/offline-direct-child-daily-trend.md)。
数据质量报告契约见
[离线数据质量报告](../../docs/technical/offline-data-quality-report.md)。
