---
doc_id: TECH-OFFLINE-OBJECT-LEVEL-ANALYSIS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线对象级分析切片

> 候选实现：本切片响应项目负责人再次“继续”的指令，只为已验证 fixture Campaign、
> Ad Set 和 Ad 增加固定日级指标、周期对比和 Web 显式加载。它不接受 `FR-002`、
> `FR-005`、`FR-011`、候选 Cloudflare 架构或正式接口，不构成 Phase 1、Phase 2、
> Phase 3 或任何 Gate 证据。

## 目标与范围

允许实现：

- 为既有 1 个 Campaign、2 个 Ad Set 和 4 个 Ad 保存 2026-08-02 至 2026-08-04 的固定
  虚构日级花费、展示、点击和转化。
- 每天验证 Campaign、全部 Ad Set 和全部 Ad 各层汇总都与账户级 fixture 完全一致。
- 对已通过完整层级验证的一个对象执行两个等长、不重叠周期的指标对比。
- 复用既有覆盖、口径、零分母、变化计算和确定性非因果诊断规则。
- 在 Web 中保留账户级按钮，并为当前已验证对象增加单独的显式加载按钮。

禁止增加用户提供的对象 ID、任意指标、业务阈值、因果推断、自动优化或建议执行、真实
Meta 同步、外部请求、CORS、远程 API 基址、认证替代、Secret、部署或广告写操作。

## 数据与一致性

对象指标继续使用初始 `insights_daily` schema，`object_level` 只允许 `CAMPAIGN`、
`AD_SET` 或 `AD`，`object_ref` 必须等于已验证 `meta_ad_objects.external_object_ref`。
本切片不增加 schema migration；它只扩展固定 fixture。

每个自然日必须满足以下等式，且四项原始指标分别验证：

```text
ACCOUNT = CAMPAIGN 汇总 = 全部 AD_SET 汇总 = 全部 AD 汇总
```

账户列表中的 `insightRowCount` 和 `dataThrough` 只统计 `object_level=ACCOUNT`，对象行不得
放大账户级行数或改变既有账户 comparison。对象数据缺失不能由父级或账户数据回填，
层级汇总一致也不能证明真实 Meta 数据正确。

## 本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /objects/{object_id}/comparison
    ?baseline_start=YYYY-MM-DD&baseline_stop=YYYY-MM-DD
    &current_start=YYYY-MM-DD&current_stop=YYYY-MM-DD
```

接口继承既有本机 Host、GET-only、固定 ID allowlist、fixture 开关和 1–31 日周期限制。
请求对象必须先由同一 Workspace 与账户的完整 `/objects` 结果验证；对象不存在、账户
错配或跨 Workspace 都返回同一 `NOT_FOUND`。对象层级超限或不兼容时，分析整体失败。

对象指标查询使用固定 SQL 与绑定参数，同时约束 Workspace、账户、对象级别、对象外部
引用和日期。缺少任一周期返回 `DATA_UNAVAILABLE`，覆盖不完整返回
`INCOMPLETE_PERIOD_COVERAGE`，指标口径不一致返回 `INCOMPATIBLE_METRIC_CONTEXT`。

成功响应在既有 comparison 数据上增加：

- `data.object`：经过验证的完整 fixture 对象。
- `context.objectId`、`objectLevel`、`parentObjectId`：与请求对象精确绑定。
- `thresholdsApplied=false`、`causalClaims=false`、`sourceKind=FIXTURE`。
- `FIXTURE_DATA_ONLY` 与 `NO_EXTERNAL_CONNECTION` warnings。

## Web 信任边界

对象 comparison 只能由当前已验证层级选择触发。客户端必须再次验证：

- 账户、对象全部字段和 Workspace 与当前选择一致。
- 对象 ID、级别和父级上下文与请求一致。
- 请求周期、指标口径、完整覆盖、fixture warnings 和非因果策略均有效。

任何错配显示 `INVALID_RESPONSE`，不得回退到账户级或静态故事结果。切换账户、重新读取
层级或改变对象必须清除旧结果并中止旧 comparison。页面同时保留“加载所选账户对比”
和“加载所选对象对比”，避免对象选择静默改变分析范围。

## 验证

自动测试至少覆盖：

- 24 条总 Insights 中 3 条账户行和 21 条对象行，且三层每天四项指标完全对齐。
- Campaign、Ad Set 和 Ad 的对象级汇总与成功 comparison。
- 非法参数、未知对象、跨 Workspace、层级错误、无数据和不完整覆盖安全失败。
- 对象响应错配、fixture warning 缺失和当前选择变化时拒绝旧结果。
- 对象级结果明确显示范围，并持续保留非因果、无阈值和未执行边界。
- 文档、类型、Workers runtime、组件测试和 production build。

本地浏览器目标流程为“读取账户 → 读取层级 → 选择 Ad → 加载对象级对比 → 再确认账户级
按钮仍存在”。必须检查页面身份、关键 DOM、请求路径、控制台、错误层和横向溢出；当前
浏览器运行时无法提供的移动视口继续明确记录为未验证。

2026-08-07 验证结果：全仓检查通过，包括 71 份文档、14 项 Phase 0 测试、31 项
Worker 测试、20 项原型测试和 production build。本机 `127.0.0.1` 流程依次读取账户、
7 个对象并选择 `fixture-ad-01`；对象 comparison 返回 `200`，页面显示对象范围、完整
周期覆盖、6 项指标和 2 条非因果诊断，同时保留账户级加载按钮。`1280 × 720` 下无
控制台告警、错误层或横向溢出。当前浏览器运行时不能调整视口，因此本切片的移动端视觉
复验仍未执行，不得从 production build 或既往移动验收推导为通过；验证后 Worker 与
Vite 端口均已停止。

本切片完成后 G0 仍为 `PARTIAL`。真实对象指标、用户权限、诊断有效性和正式产品分析
能力仍依赖 G0、接受后的需求与 ADR、真实只读证据和项目负责人另行启动。
