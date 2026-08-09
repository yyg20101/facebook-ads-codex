---
doc_id: TECH-OFFLINE-AD-OBJECT-HIERARCHY
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线广告对象层级切片

> 候选实现：本切片响应项目负责人再次“继续下一阶段”的指令，只在固定 fixture 账户下
> 增加 Campaign、Ad Set 和 Ad 的本地只读层级导航。它不接受 `FR-002`、`FR-005`、
> `FR-011`、候选 Cloudflare 架构或正式接口，不构成 Phase 1、Phase 3 或任何 Gate 证据。

## 目标与范围

允许实现：

- 使用顺序 D1 migration 保存固定虚构的 Campaign、Ad Set、Ad 及父级关系。
- 从一个已验证 fixture 账户读取最多 50 个对象；该上限只是本地测试护栏，不是产品
  容量决定。
- 返回对象级别、虚构外部引用、显示名、父对象、fixture 同步批次和获取时间。
- 在 Worker 和浏览器两侧验证 `Campaign -> Ad Set -> Ad` 父级关系、唯一 ID、账户绑定
  和 fixture 来源。
- 在本地 Web 数据分析页选择并查看对象上下文，但不把对象选择传入账户级周期比较。

本层级切片本身禁止增加对象级 Insights、真实账户、Meta 同步、用户提供的 Workspace
或对象 ID、远程 API 基址、CORS、认证替代、Secret、写操作、部署或自动优化。负责人
后续单独授权的 fixture 对象指标见[离线对象级分析](offline-object-level-analysis.md)；
该授权不改变 `/objects` 的只读层级职责。

## 数据模型

`0002_offline_ad_objects.sql` 新增 `meta_ad_objects`，只允许 `source_kind=FIXTURE`，并记录：

- `workspace_id`、`ad_account_id` 和内部对象 ID。
- `external_object_ref`、`object_level`、`display_name` 和 `parent_object_id`。
- `sync_run_id` 和 `fetched_at`。

外键保证账户、同步批次和父对象处于同一 Workspace 与广告账户。数据库约束保证 Campaign
没有父级，Ad Set 与 Ad 必须声明父级；读取层再验证 Ad Set 的父级确为 Campaign、Ad 的
父级确为 Ad Set。错误层级必须整体失败，不能返回局部树。

该表只服务当前 fixture 验证，不表示正式 Meta 对象 schema、同步策略或 D1 选型已接受。

## 本地接口

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}/objects
```

接口不接受 query 参数，继承既有本机 Host、固定 ID allowlist、GET-only、fixture 开关
和 Workspace/账户联合约束。查询使用固定 SQL 和绑定参数，最多读取 51 行以判断是否超过
50 个对象；超限返回 `CAPACITY_EXCEEDED`。

成功响应包含账户、扁平对象列表和实际 `campaigns`、`adSets`、`ads` 数量。扁平列表中的
父级引用是唯一层级事实，Web 只能在完整验证后派生树。资源不存在或跨 Workspace 均返回
相同 `NOT_FOUND`；父级缺失或级别不兼容返回 `INCOMPATIBLE_OBJECT_HIERARCHY`。

响应必须保留 `FIXTURE_DATA_ONLY`、`NO_EXTERNAL_CONNECTION`、`sourceKind=FIXTURE`、
`nextCursor=null` 和 `truncated=false`。接口不是公开 API，也不证明调用者拥有真实对象。

## Web 导航边界

浏览器请求顺序为：

```text
读取固定 Workspace 的 fixture 账户
  -> 从已验证列表选择账户
  -> 显式读取该账户的对象层级
  -> 选择 Campaign、Ad Set 或 Ad 查看本地上下文
```

客户端只使用 `/offline-api/` 相对路径，并通过 `encodeURIComponent` 编码已验证账户 ID。
账户改变时使用 keyed component 重建层级状态并中止旧请求，不用 effect 复制派生账户或
对象。浏览器再次计算唯一性、数量和父级关系；任何错配都显示 `INVALID_RESPONSE`，不得
回退到静态故事数据。

本切片完成时，对象选择只用于验证层级导航，既有 comparison 继续按所选广告账户和日期
请求。后续对象级切片新增独立按钮和独立路由；账户级按钮仍保留，对象选择不得静默改变
分析范围。

## 验证

自动测试至少覆盖：

- migration、fixture、账户作用域、七个对象和父级顺序。
- 非法参数、跨 Workspace、错误父级、超过本地上限和稳定错误 envelope。
- Web 固定相对路径、fixture warning、账户错配、孤儿对象和错误状态。
- Campaign、Ad Set、Ad 选择与详情呈现，以及现有账户级 comparison 回归。
- TypeScript、Workers runtime、production build、文档和敏感信息检查。

本地浏览器验证必须完成“读取账户 -> 读取层级 -> 选择 Ad -> 加载账户级周期对比”，并在
可用的目标视口检查页面身份、关键 DOM、网络、控制台、错误层和横向溢出。无法由当前
浏览器运行时提供的视口必须明确记录为未验证，不得用 production build 替代视觉证据。
验证后停止 Worker 与 Vite。本切片完成后 G0 继续为 `PARTIAL`，对象级 Insights 是后续
独立授权切片。

2026-08-06 自动验证通过：4 个 Worker 测试文件共 27 项、3 个原型测试文件共 18 项及
production build 通过；objects 与 comparison 本机端点均返回 `200`。浏览器在
`1280 × 720` 完成账户读取、7 个对象读取、Ad 选择和账户级 comparison，无控制台告警、
错误层或横向溢出。当前浏览器运行时不提供视口调整，且安全策略阻止临时移动容器，因此
本次 `430 × 932` 视觉复验未执行；该限制已保留，未被表述为通过。后续对象级分析是
独立候选切片，不把本次层级验证追溯改写为对象指标已通过。
