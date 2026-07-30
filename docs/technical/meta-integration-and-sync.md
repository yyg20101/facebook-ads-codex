---
doc_id: TECH-META-SYNC
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Meta 接入与同步

> 候选设计：Meta 接入、Token 路径、同步和回补尚未完成 Phase 0 与安全评审；
> `DG0` 通过未授权创建 App、访问账户或将本文作为实施依据。

## 权限阶段

只读阶段候选权限：

```yaml
required_permissions:
  - ads_read
operation_mode: READ_ONLY
```

审批式管理阶段候选权限：

```yaml
candidate_permissions:
  - ads_management
operation_mode: APPROVAL_REQUIRED
```

如果管理客户账户，Phase 0 必须确认 Advanced Access、App Review 和业务验证要求。
Page、Instagram、创意或其他资产权限必须按功能增量申请。

## Token 模型

- 少量自有 Business 的 System User Token MAY 保存为 Cloudflare Secret。
- 多客户 OAuth Token MUST 加密后保存，不能以明文进入 D1。
- 加密租户 Token 的根密钥 MUST 位于 Secrets Store 或 Worker Secret。
- 解密只在服务端当前调用所需时间内发生。
- 必须支持撤销、过期检测、权限健康检查和密钥轮换。
- Token 不得进入 R2、日志、错误、浏览器、Skill 或工具参数。

## API 客户端

- Graph/Marketing API 版本 MUST 显式固定。
- 版本升级必须先完成 staging 回归测试。
- 客户端必须处理分页、限流、权限错误、瞬时失败和部分失败。
- 大范围或复杂 Insights 查询 SHOULD 使用异步报表任务。
- 必须记录使用量响应头、退避状态、请求 ID 和脱敏错误分类。
- 自动重试必须有上限并保持幂等。

客户端接口只能暴露允许的业务操作，不能接收任意 Graph path。

## 同步策略

```yaml
intraday_sync:
  cadence: 30-60 minutes
  scope:
    - spend
    - impressions
    - clicks
    - account_and_object_status

daily_reconciliation:
  cadence: daily
  trailing_window_days: 7
  purpose: capture_attribution_and_delayed_conversion_updates

initial_backfill:
  implementation_default_days: 180
  configured_days: UNRESOLVED
  execution: batched_async
```

`implementation_default_days` 不是保留政策或已确认业务值。实际历史范围由 `BQ-08`
确定，保留期由 `BQ-09` 确定。

## 同步流程

1. 解析经过授权的 Workspace、连接和广告账户。
2. 创建带范围、API 版本和幂等信息的 `sync_run`。
3. 分页或启动异步 Insights Job。
4. 保存脱敏原始响应。
5. 标准化对象和指标并执行幂等写入。
6. 执行层级、范围和指标质量检查。
7. 更新数据稳定状态、新鲜度和同步结果。
8. 对可重试失败使用有界 Queue/Workflow 重试。

部分失败必须保留已完成范围与缺失范围，不能把不完整同步标记为成功。

## 安全与失败边界

- Meta 响应、游标和错误均视为不可信输入并通过 schema 校验。
- 广告账户 ID 必须与服务端 Workspace 绑定核对。
- 连接失效或权限不足时停止对应账户同步，不扩大 Token 权限。
- 日内同步和回补由 Cloudflare 调度，不依赖 Codex Scheduled Task。
- 当前[授权状态](../project/status-and-authorizations.md)不允许创建真实 Meta 连接或执行 API 验证。
