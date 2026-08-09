---
doc_id: TECH-OFFLINE-DIRECT-CHILD-BREAKDOWN
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线直接子对象拆解切片

> 候选实现：本切片响应项目负责人再次“继续”的指令，只在已验证 fixture Campaign
> 或 Ad Set 下拆解直接子对象的周期变化。它不接受 `FR-002`、`FR-003`、`FR-005`、
> `FR-011` 或候选 Cloudflare 架构，不构成正式 Phase 1、Phase 2、Phase 3 或 Gate
> 证据。

## 目标与范围

允许实现：

- Campaign 只拆解直接 Ad Set，Ad Set 只拆解直接 Ad。
- 复用对象级 comparison 的等长、不重叠、1–31 日完整周期规则。
- 为父对象和每个直接子对象计算相同的原始及派生指标变化。
- 在基线和当前周期分别验证花费、展示、点击和转化的子对象汇总等于父对象。
- Web 通过单独按钮显式加载拆解，持续保留账户级和对象级 comparison 入口。

禁止增加 Ad 的伪子级、素材归因、breakdown、任意指标、赢家排序、业务阈值、因果推断、
建议执行、真实 Meta 同步、外部请求、远程基址、CORS、认证替代、Secret、部署或写操作。

## 本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /objects/{object_id}/children-comparison
    ?baseline_start=YYYY-MM-DD&baseline_stop=YYYY-MM-DD
    &current_start=YYYY-MM-DD&current_stop=YYYY-MM-DD
```

接口继承既有本机 Host、GET-only、固定 ID allowlist、fixture 开关、完整层级和日期限制。
父对象必须来自同一 Workspace 与账户的完整 `/objects` 响应，且级别只能是 `CAMPAIGN`
或 `AD_SET`。未知对象、跨 Workspace 或账户错配返回 `NOT_FOUND`；Ad 叶子返回
`NO_CHILD_OBJECTS`；不完整层级整体失败。

服务端必须：

1. 只选择 `parent_object_id` 精确等于父对象 ID 的直接子对象。
2. 最多返回 10 个直接子对象并按对象 ID 稳定排序；该限制不是产品容量承诺。
3. 并行读取父对象和每个直接子对象的两个周期，但保持有界对象容量。
4. 对每一组数据执行完整覆盖、口径兼容和非因果 comparison 校验。
5. 验证所有子对象四项可加指标在两个周期都与父对象完全一致。
6. 任一对象缺数据、覆盖不完整、口径冲突或汇总不一致时整体安全失败，不返回部分结果。

## 成功响应

成功响应包含：

- `data.account` 与 `data.parent`：已验证的 fixture 账户和父对象。
- `data.baseline`、`data.current`、`data.changes`：父对象的周期结果。
- `data.items[]`：直接子对象、两个周期及其指标变化；不得包含服务端赢家标签。
- `data.reconciliation`：固定四项可加指标，以及两个周期均为 `true` 的父子对账结果。
- `context.childObjectLevel` 与 `childCount`：直接子级和实际返回数量。
- `comparisonPolicy.thresholdsApplied=false`、`causalClaims=false`、
  `rankingApplied=false`。
- `sourceKind=FIXTURE`、`FIXTURE_DATA_ONLY` 与 `NO_EXTERNAL_CONNECTION`。

派生指标只对各对象自身原始汇总计算，不能跨对象相加。对账只覆盖
`spendMinorUnits`、`impressions`、`clicks` 和 `conversions`。

## Web 信任边界

拆解请求只能由当前已验证层级中选定的 Campaign 或 Ad Set 触发。客户端必须重新验证：

- 账户、父对象、全部子对象、Workspace 和父子级别精确匹配。
- 子对象 ID 和外部引用唯一，且每项 `parentObjectId` 都等于当前父对象 ID。
- 请求周期、口径、完整覆盖、对账结果、fixture warnings 和三项禁用策略都有效。
- 返回顺序严格按对象 ID 升序，且页面明确说明顺序不代表表现优先级。

任何错配显示 `INVALID_RESPONSE`，不得回退为静态故事、对象 comparison 或部分结果。
切换账户、重新读取层级、改变父对象或日期必须清除旧拆解并中止旧请求。选中 Ad 时按钮
禁用并解释其没有本切片定义的直接子对象。

## 验证

自动测试至少覆盖：

- Campaign 返回两个 Ad Set，Ad Set 返回两个 Ad，顺序稳定且父子绑定正确。
- 两个周期的四项可加指标分别与父对象完全对账。
- Ad 叶子、未知对象、跨 Workspace、非法参数、缺数据、覆盖缺口和口径冲突安全失败。
- 人为制造父子汇总不一致时返回 `INCOMPATIBLE_OBJECT_ROLLUP`，不返回部分列表。
- Web 拒绝父对象、子级、顺序、对账、warning 或策略标记错配。
- 页面持续显示 fixture、无外部连接、无阈值、非因果、无排名和未执行边界。
- 文档、类型、Workers runtime、组件测试和 production build 通过。

本地浏览器目标流程为“读取账户 → 读取层级 → 选择 Campaign → 加载直接子对象拆解 →
确认两个 Ad Set 及父子对账 → 选择 Ad 并确认按钮禁用”。必须检查页面身份、关键 DOM、
请求路径、控制台、错误层和横向溢出；无法执行的移动视口必须明确记录为未验证。

## 本地验证结果

2026-08-07 已完成：72 份文档校验、14 项 Phase 0 测试、36 项 Workers runtime 测试、
23 项原型测试、严格类型检查和 production build 全部通过。本机端到端流程验证了：

- 账户列表和 7 个对象层级读取返回 `200`。
- Campaign 拆解返回 2 个直接 Ad Set，Ad Set 拆解返回 2 个直接 Ad，三次
  `children-comparison` 均返回 `200`。
- 两期花费、展示、点击和转化的父子对账均通过，页面显示稳定 ID 顺序和无排名边界。
- Ad 叶子禁用拆解入口，同时保留账户级和对象级 comparison 入口。
- `1280 × 720` 与 `430 × 932` 均无页面横向溢出、Vite 错误层、业务错误层或控制台
  警告/错误；验证后 `8791` 与 `5173` 均无监听进程。

该记录只证明固定 fixture、本机契约和两个视口下的交互可重复，不验证真实 Meta 数据、
真实权限、诊断正确性、用户价值或正式阶段完成。

本切片完成后 G0 仍为 `PARTIAL`。真实对象数据、动态指标选择、诊断有效性和正式产品
分析能力仍依赖 G0、接受后的需求与 ADR、真实只读证据及项目负责人另行启动。
