---
doc_id: PLAN-ROADMAP
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 实施路线图

## 当前状态

```text
Documentation baseline
  -> PRODUCT_DISCOVERY_COMPLETE
  -> Full-lifecycle Meta Ads Web platform direction confirmed
  -> Early AI entry confirmed as Codex context + docs + Skills
  -> Three representative scenarios reviewed
  -> Web and Codex workflow prototype accepted by project owner
  -> DG0 PASS
  -> Phase 0 document confirmation IN_PROGRESS
  -> BQ-01 through BQ-12 RESOLVED
  -> MVP requirement review COMPLETE; 32 ACCEPTED / 10 DRAFT
  -> ADR review COMPLETE; ADR-001/002/004/006 ACCEPTED, ADR-003/005 DRAFT
  -> Credential-neutral local readiness tooling AVAILABLE
  -> G0 PARTIAL; real configuration DEFERRED
  -> Offline Phase 1 scaffold AUTHORIZED
  -> Offline read-only analysis slice AUTHORIZED
  -> Offline period comparison and diagnostics slice AUTHORIZED
  -> Offline Web analysis integration slice AUTHORIZED
  -> Offline Web account context selection slice AUTHORIZED
  -> Offline ad object hierarchy slice AUTHORIZED
  -> Offline object-level analysis slice AUTHORIZED
  -> Offline direct-child breakdown slice AUTHORIZED
  -> Offline object daily trend slice AUTHORIZED
  -> Offline direct-child daily trend slice AUTHORIZED
  -> Offline data quality report slice AUTHORIZED
  -> Offline analysis quality preflight slice AUTHORIZED
  -> Offline Codex evidence bundle slice AUTHORIZED
  -> Offline Codex trend evidence bundle slice AUTHORIZED
  -> Offline Codex analysis Skill VALIDATED
  -> Offline Codex analysis draft evals VALIDATED
  -> Offline Codex analysis forward test PASS; 5/5 at 8/8
  -> Offline Codex creative Skill LOCAL_FIXTURE_VALIDATED
  -> Offline Codex workflow Skills LOCAL_FIXTURE_VALIDATED
  -> Offline Codex Skill development queue COMPLETE
  -> Workflow Skill forward test PASS; 5/5 at 8/8
  -> External account facts and Meta read-only path NOT VERIFIED
  -> No real-data or external-service runtime
  -> No deployment authorization
  -> No Meta write authorization
```

授权事实以[项目状态与授权](../project/status-and-authorizations.md)为准。

## 阶段总览

| 阶段 | 依赖 | 主要结果 | Gate |
| --- | --- | --- | --- |
| Product Discovery | 无 | 内部用户、问题、形态、内容、MVP 和试点指标 | DG0 |
| Phase 0：业务与权限确认 | DG0 | 业务、KPI、权限、数据范围和账户决策 | G0 |
| Phase 1：数据控制平面 | G0 | Worker、D1、R2、同步、质量和 staging 验证 | G1 |
| Phase 2：Codex 与只读分析 | G1 | 上下文、聚焦 Skills、候选 Remote MCP 和只读分析 | G2 |
| Phase 3：Web 运营平台 | G1 | 素材、广告、图表、测试、RBAC、状态和审计 | G3 |
| Phase 4：审批式写操作 | G2、G3、独立授权 | 状态机、网页审批和有限 Meta 写入 | G4 |
| Phase 5：有限自动化 | G4、经批准 Dry Run | 规则边界、熔断、白名单和审计自动化 | G5 |

Phase 0–5 来自旧候选方案。`DG0` 通过后必须按实际产品定义重新评审这些阶段、组件和
Gate；当前表不构成实现承诺。

## Product Discovery

- `PD-01` 由项目负责人确认通用产品定位、支持用户和非目标。
- `PD-02` 确认广告投放、数据分析及相关能力的范围和优先级。
- `PD-03` 建立至少 3 个代表性端到端场景并登记脱敏 `EVD-*`。
- `PD-04` 使用完整 Web 原型和 Codex 辅助流程验证已选产品形态。
- `PD-05` 形成内部试点产品定义、内容地图和 `MVP`/`LATER`/`REJECTED` 功能。
- `PD-06` 评估 `DG0` 并由项目负责人确认。

`PD-01`–`PD-06` 已完成，`DG0` 由 `EVD-025` 记录为 `PASS`。执行记录见
[Product Discovery](../discovery/README.md)。

## Phase 0：业务与权限确认

启动前置条件已满足：`DG0` 为 `PASS`，项目状态为 `READY_FOR_PHASE_0`，项目负责人已
另行启动 Phase 0 文档确认。`BQ-01`–`BQ-12` 已全部回答；`P0-02`、`P0-04`、
`P0-07` 的外部事实仍待验证。在获得单独授权前不得执行 `P0-08` 或访问真实
Meta/Cloudflare 资源。

仓库已提供本地忽略配置模板、离线检查、固定 GET allowlist 的 Meta 验证工具和测试。
这些准备不包含真实值，不访问外部系统，也不改变 P0-02、P0-04、P0-07、P0-08 或 G0
的未完成状态。项目负责人决定暂时延期这些真实配置项，因此 G0 为 `PARTIAL`。实际步骤
见[Meta 只读连接验证 Runbook](../runbooks/meta-read-connection.md)。

任务：

- `P0-01` 确认自有或客户 Meta 广告账户业务模型。
- `P0-02` 确认 Meta Business、账户数量和预估数据量。
- `P0-03` 确认投放目标、主 KPI 和主转化事件。
- `P0-04` 确认币种、时区和归因政策。
- `P0-05` 确认历史回填和数据保留期。
- `P0-06` 确认网页用户、角色、认证和审批权。
- `P0-07` 确认 `cf-primary` 域名、套餐、账单和资源所有权。
- `P0-08` 在单独授权后创建 Meta App 和只读授权路径。

使用 [Phase 0 问卷](phase-0-questionnaire.md)收集决定和脱敏证据。

## Phase 1 离线准备轨道

这不是正式 Phase 1 阶段转换。项目负责人只授权在 G0 `PARTIAL` 时并行完成：

- `P1-PREP-01`：本地 TypeScript Worker 与生成的绑定类型。
- `P1-PREP-02`：Workspace 作用域的初始 D1 migration。
- `P1-PREP-03`：固定虚构 fixture，禁止真实账户、Token 或响应。
- `P1-PREP-04`：Workers runtime、D1 约束、类型和安全失败测试。
- `P1-PREP-05`：只运行离线检查、不含 Secret 或部署步骤的 CI。

该轨道不得实现 Meta 客户端、同步、R2、Queue、Workflow、认证、远程接口或 deployment。
实现边界见[离线控制平面脚手架](../technical/offline-phase-1-scaffold.md)。

## 离线只读分析切片

项目负责人在完成基础脚手架后指示继续下一步并再次跳过配置。本切片仍不属于正式
Phase 1，只允许：

- `P1-OFFLINE-READ-01`：从固定 fixture 列出 Workspace 作用域内的广告账户。
- `P1-OFFLINE-READ-02`：校验有界日期范围和固定 allowlist 参数。
- `P1-OFFLINE-READ-03`：汇总花费、展示、点击和转化，并正确处理零分母。
- `P1-OFFLINE-READ-04`：返回币种、时区、点击口径、转化事件、归因、版本、新鲜度和
  稳定状态。
- `P1-OFFLINE-READ-05`：验证跨 Workspace、口径冲突、无数据和非本机请求安全失败。

接口必须使用 `/offline/` 前缀、固定虚构数据和本机 Host，不提供认证替代、任意查询、
Meta 客户端、同步或写操作。详见
[离线只读分析设计](../technical/offline-read-only-analysis.md)。

`P1-OFFLINE-READ-01`–`P1-OFFLINE-READ-05` 已于 2026-08-05 使用本地 fixture 完成验证；
该结果不改变 G0 `PARTIAL`，也不把正式 Phase 1 任务标记为完成。

## 离线周期对比与诊断切片

项目负责人随后指示继续下一阶段。本切片仍不属于正式 Phase 1，只允许：

- `P1-OFFLINE-DIAG-01`：校验两个等长、按时间排序且互不重叠的 1–31 日周期。
- `P1-OFFLINE-DIAG-02`：验证每个周期日级覆盖完整且跨周期口径一致。
- `P1-OFFLINE-DIAG-03`：计算原始及派生指标的绝对变化、相对变化和方向。
- `P1-OFFLINE-DIAG-04`：基线为零或值缺失时返回可解释的不可计算状态。
- `P1-OFFLINE-DIAG-05`：输出不含因果断言、阈值猜测或执行动作的确定性模式。
- `P1-OFFLINE-DIAG-06`：验证跨 Workspace、无数据、覆盖缺口、口径变化和非法参数
  安全失败。

实现边界见
[离线周期对比与诊断](../technical/offline-period-comparison-and-diagnostics.md)。完成结果
不改变 G0 `PARTIAL`，不接受 `FR-005`，也不形成 G1/G2 证据。

`P1-OFFLINE-DIAG-01`–`P1-OFFLINE-DIAG-06` 已于 2026-08-06 使用固定 fixture 完成
本地验证；正式 Phase 1 和 Phase 2 任务仍未启动。

## 离线 Web 分析接入切片

项目负责人再次指示继续下一阶段。本切片不属于正式 Phase 3，只允许：

- `P3-OFFLINE-DEMO-01`：通过固定 Vite 开发代理连接本机 fixture Worker，不增加 CORS。
- `P3-OFFLINE-DEMO-02`：实现只接受固定 Workspace、账户和日期参数的类型安全客户端。
- `P3-OFFLINE-DEMO-03`：在数据分析页展示加载、错误、口径、覆盖、变化和诊断状态。
- `P3-OFFLINE-DEMO-04`：持续显示 fixture、无外部连接、无阈值、非因果和未执行边界。
- `P3-OFFLINE-DEMO-05`：完成组件、构建及桌面和移动端本地浏览器验证。

实现边界见[离线 Web 分析接入](../technical/offline-web-analysis-integration.md)。生产构建
必须关闭接入入口；完成结果不改变 G0 `PARTIAL`，不接受 `FR-005` 或 `FR-011`，也不
形成 G1/G2/G3 证据。

`P3-OFFLINE-DEMO-01`–`P3-OFFLINE-DEMO-05` 已于 2026-08-06 完成本地验证：固定代理
返回 `200`，组件测试、生产构建、桌面与移动端交互通过，页面无横向溢出或控制台告警。
正式 Phase 3 仍未启动。

## 离线 Web 账户上下文选择切片

项目负责人又指示继续下一阶段。本切片继续沿用前述本地 Web 边界，不属于正式 Phase 1
或 Phase 3，只允许：

- `P3-OFFLINE-CONTEXT-01`：通过固定同源路径读取最多 10 个 fixture 广告账户。
- `P3-OFFLINE-CONTEXT-02`：验证列表 envelope、Workspace、fixture、容量、唯一 ID 和
  无外部连接标记。
- `P3-OFFLINE-CONTEXT-03`：只允许从已验证列表选择账户，不提供手工账户或 Workspace
  输入。
- `P3-OFFLINE-CONTEXT-04`：将 comparison 响应绑定到所选账户、币种、时区和请求周期，
  错配时安全失败。
- `P3-OFFLINE-CONTEXT-05`：验证账户读取、选择、切换、错误、桌面和移动端完整交互。

实现边界见[离线 Web 账户上下文](../technical/offline-web-account-context.md)。完成结果不
改变 G0 `PARTIAL`，不接受 `FR-001`、`FR-005` 或 `FR-011`，也不形成任何 Gate 证据。

`P3-OFFLINE-CONTEXT-01`–`P3-OFFLINE-CONTEXT-05` 已于 2026-08-06 完成本地验证：
固定列表和 comparison 均返回 `200`，账户绑定负向测试、13 项原型测试、production
build 以及桌面和移动端交互通过；两个本地端口已停止。正式 Phase 3 仍未启动。

## 离线广告对象层级切片

项目负责人再次指示继续下一阶段。本切片在已验证 fixture 账户下增加只读层级和 Web
导航，不属于正式 Phase 1 或 Phase 3，只允许：

- `P1-OFFLINE-HIERARCHY-01`：用顺序 migration 保存 Workspace 与账户作用域内的
  Campaign、Ad Set、Ad 及父级关系。
- `P1-OFFLINE-HIERARCHY-02`：提供无 query 参数、最多 50 个对象的本机 fixture
  `/objects` 读取路由。
- `P1-OFFLINE-HIERARCHY-03`：验证唯一 ID、fixture 来源、同步批次、父级存在和正确
  层级；不完整结果整体失败。
- `P3-OFFLINE-HIERARCHY-01`：只从当前已验证账户加载对象，并在 Web 中导航三层对象。
- `P3-OFFLINE-HIERARCHY-02`：明确对象选择不改变账户级 comparison，不实现对象级指标。
- `P3-OFFLINE-HIERARCHY-03`：验证错误、错配、孤儿、容量、桌面和移动端完整交互。

实现边界见[离线广告对象层级](../technical/offline-ad-object-hierarchy.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-002`、`FR-005` 或 `FR-011`，也不形成任何 Gate 证据。

`P1-OFFLINE-HIERARCHY-01`–`P1-OFFLINE-HIERARCHY-03`、
`P3-OFFLINE-HIERARCHY-01` 和 `P3-OFFLINE-HIERARCHY-02` 已于 2026-08-06 使用固定
fixture 完成自动测试和桌面浏览器验证。`P3-OFFLINE-HIERARCHY-03` 为 `PARTIAL`：错误、
错配、孤儿、容量和桌面交互已验证，当前浏览器运行时无法调整到移动视口，移动端视觉复验
未执行。该限制不改变项目阶段或外部权限。

## 离线对象级分析切片

项目负责人于 2026-08-07 再次指示继续。本切片只在已验证 fixture 层级上增加显式对象
分析，不属于正式 Phase 1、Phase 2 或 Phase 3，只允许：

- `P1-OFFLINE-OBJECT-01`：为 7 个 fixture 对象增加三日固定日级指标，不修改 schema。
- `P1-OFFLINE-OBJECT-02`：验证每天 Campaign、Ad Set、Ad 各层的花费、展示、点击和
  转化汇总都与账户级数据一致。
- `P1-OFFLINE-OBJECT-03`：只对完整层级中已验证对象提供本机 fixture comparison，
  复用覆盖、口径和非因果诊断护栏。
- `P3-OFFLINE-OBJECT-01`：Web 同时保留账户级和对象级显式按钮，选择对象不得静默改变
  请求范围。
- `P3-OFFLINE-OBJECT-02`：验证对象字段、账户、Workspace、周期和响应 context 精确
  绑定，错配时安全失败。
- `P3-OFFLINE-OBJECT-03`：完成组件、构建和本地浏览器对象级交互验证，并保留未覆盖
  视口限制。

实现边界见[离线对象级分析](../technical/offline-object-level-analysis.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-002`、`FR-005` 或 `FR-011`，也不形成任何 Gate 证据。

`P1-OFFLINE-OBJECT-01`–`P1-OFFLINE-OBJECT-03`、`P3-OFFLINE-OBJECT-01` 和
`P3-OFFLINE-OBJECT-02` 已于 2026-08-07 通过自动测试和本机端到端验证。
`P3-OFFLINE-OBJECT-03` 为 `PARTIAL`：`1280 × 720` 已完成账户读取、7 个对象读取、Ad
选择和对象 comparison，且无控制台告警、错误层或横向溢出；当前浏览器运行时不能调整
到移动视口，本切片的移动端视觉复验未执行。该限制不改变项目阶段或外部权限。

## 离线直接子对象拆解切片

项目负责人于 2026-08-07 随后再次指示继续。本切片只对已验证 fixture Campaign 或
Ad Set 的直接子对象进行同周期拆解，不属于正式 Phase 1、Phase 2 或 Phase 3，只允许：

- `P1-OFFLINE-BREAKDOWN-01`：Campaign 只读取直接 Ad Set，Ad Set 只读取直接 Ad，
  最多 10 项并按对象 ID 稳定排序。
- `P1-OFFLINE-BREAKDOWN-02`：为父对象和每个直接子对象复用等长、不重叠、完整覆盖的
  两周期 comparison。
- `P1-OFFLINE-BREAKDOWN-03`：在基线和当前周期分别验证花费、展示、点击和转化的
  子对象汇总与父对象完全一致；任一失败时整体拒绝。
- `P3-OFFLINE-BREAKDOWN-01`：Web 使用独立按钮显式加载拆解，账户级和对象级入口继续
  保留，Ad 叶子禁用该入口。
- `P3-OFFLINE-BREAKDOWN-02`：页面显示父对象、直接子级、周期、口径和对账状态，且
  明确无排名、无阈值、非因果和未执行边界。
- `P3-OFFLINE-BREAKDOWN-03`：完成 Worker、严格客户端、组件、构建和本地浏览器完整
  交互验证，并如实记录无法覆盖的视口。

实现边界见
[离线直接子对象拆解](../technical/offline-direct-child-breakdown.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-002`、`FR-003`、`FR-005`、`FR-011` 或任何 ADR，也不形成
任何 Gate 证据。

`P1-OFFLINE-BREAKDOWN-01`–`P1-OFFLINE-BREAKDOWN-03` 和
`P3-OFFLINE-BREAKDOWN-01`–`P3-OFFLINE-BREAKDOWN-03` 已于 2026-08-07 完成。
全仓检查通过；本机浏览器在 `1280 × 720` 与 `430 × 932` 验证 Campaign→Ad Set、
Ad Set→Ad、Ad 叶子、父子对账、三个显式入口、无排名边界、控制台和横向溢出，两个
本地端口随后停止。该结果不改变项目阶段或外部权限。

## 离线对象日趋势切片

项目负责人于 2026-08-07 确认设计并指示继续。本切片只读取已验证 fixture Campaign、
Ad Set 或 Ad 的连续日值，不属于正式 Phase 1、Phase 2 或 Phase 3，只允许：

- `P1-OFFLINE-TREND-01`：使用固定 SQL 和绑定参数读取连续 3–31 日的对象数据，按日期
  升序返回固定 9 项指标。
- `P1-OFFLINE-TREND-02`：在返回前验证每日唯一连续覆盖、对象范围及币种、时区、点击
  口径、转化事件、归因和 API 版本一致；任一失败时整体拒绝。
- `P1-OFFLINE-TREND-03`：覆盖 3 日、31 日输入边界、数据缺失、重复日、口径冲突、
  跨作用域和零分母安全失败。
- `P3-OFFLINE-TREND-01`：Web 使用独立按钮显式加载当前已验证对象的趋势，不改变账户
  comparison、对象 comparison 或直接子对象拆解。
- `P3-OFFLINE-TREND-02`：一次只展示固定 9 项指标中的一项；本地切换不重新请求，并
  同时提供可访问图表和精确日值表。
- `P3-OFFLINE-TREND-03`：验证严格响应绑定、旧请求中止、错误不回退、构建和本地浏览器
  交互，且如实记录视口或运行环境限制。

实现边界见[离线对象日趋势](../technical/offline-object-daily-trend.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-003`、`FR-005`、`FR-011` 或任何 ADR，也不形成任何 Gate
证据。固定指标和默认花费视图不构成主 KPI 决策；本切片不得解释趋势、排名、应用业务
阈值、生成因果结论或执行建议。

`P1-OFFLINE-TREND-01`–`P1-OFFLINE-TREND-03` 和
`P3-OFFLINE-TREND-01`–`P3-OFFLINE-TREND-03` 已于 2026-08-07 完成。全仓检查通过，
包括 75 份文档、14 项 Phase 0、54 项 Worker 和 45 项原型测试及 production build。
本机 HTTP 验证三日请求为 `200`、两日为 `400`、合法 31 日缺少覆盖为 `409`、未知对象
为 `404`。浏览器在 `1280 × 720` 与 `430 × 932` 验证 Ad 趋势、CTR/报告转化/CPA
切换、精确日值表、对象变化清除、无额外指标请求、无控制台告警和页面横向溢出；表格
只在自身容器滚动。production 预览不渲染离线账户或趋势入口，三个本地端口随后停止。
该结果不改变项目阶段或外部权限。

## 离线直接子对象日趋势切片

项目负责人于 2026-08-07 再次指示继续下一阶段。本切片只组合既有固定对象趋势与直接
子对象父子对账，不属于正式 Phase 1、Phase 2 或 Phase 3，只允许：

- `P1-OFFLINE-CHILD-TREND-01`：为已验证 fixture Campaign 或 Ad Set 原子读取父对象和
  最多 10 个直接子对象的连续 3–31 日日值，Ad 叶子安全拒绝。
- `P1-OFFLINE-CHILD-TREND-02`：按稳定对象 ID 返回固定 9 项指标，并要求所有序列日期、
  账户、指标口径、稳定状态、新鲜度和同步批次一致。
- `P1-OFFLINE-CHILD-TREND-03`：逐日验证花费、展示、点击和转化的直接子对象总和等于
  父对象；覆盖、上下文或任一日汇总失败时整体拒绝。
- `P3-OFFLINE-CHILD-TREND-01`：Web 使用独立按钮显式加载，父对象、日期或账户变化
  清除旧结果，Ad 入口禁用。
- `P3-OFFLINE-CHILD-TREND-02`：用父对象参考线、稳定 ID 子对象序列和精确日值表一次
  展示一个固定指标；切换指标不重新请求。
- `P3-OFFLINE-CHILD-TREND-03`：页面明确无排名、无阈值、非因果、不解释趋势和不执行
  建议，并验证桌面、移动、production 入口和本地端口边界。

实现边界见
[离线直接子对象日趋势](../technical/offline-direct-child-daily-trend.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-003`、`FR-005`、`FR-011` 或任何 ADR，也不形成任何 Gate
证据。稳定 ID 顺序、颜色和父对象参考线均不代表表现排名或优化结论。

`P1-OFFLINE-CHILD-TREND-01`–`P1-OFFLINE-CHILD-TREND-03` 和
`P3-OFFLINE-CHILD-TREND-01`–`P3-OFFLINE-CHILD-TREND-03` 已于 2026-08-07 完成。
全仓检查通过，包括 78 份规范文档、14 项 Phase 0、61 项 Worker、58 项原型测试及
production build。HTTP 验证两类父子关系成功，以及 Ad、短日期和未知对象安全失败；
浏览器在 `1280 × 720` 与 `430 × 932` 验证稳定序列、逐日对账、指标切换不重新请求、
父对象变化清除、Ad 禁用、无控制台告警和无页面横向溢出。production 入口关闭，三个
本地端口随后停止。该结果不改变项目阶段或外部权限。

## 离线数据质量报告切片

项目负责人于 2026-08-07 再次指示继续下一阶段。本切片只组合既有 fixture 账户、对象
层级和日趋势读取，不属于正式 Phase 1、Phase 2 或 Phase 3，只允许：

- `P1-OFFLINE-QUALITY-01`：对一个已验证 fixture 账户的账户与全部对象读取连续 3–31
  日数据，主体日粒度必须唯一且完整。
- `P1-OFFLINE-QUALITY-02`：验证账户、对象、日期、币种、时区、点击口径、转化事件、
  归因、API 版本、稳定状态、获取时间和同步批次属于同一快照。
- `P1-OFFLINE-QUALITY-03`：验证对象父级完整，并逐日执行账户→Campaign、Campaign→
  Ad Set、Ad Set→Ad 的花费、展示、点击和报告转化对账。
- `P1-OFFLINE-QUALITY-04`：任一检查失败时整体拒绝，不返回部分通过、补零或静态回退。
- `P3-OFFLINE-QUALITY-01`：Web 以独立步骤显式加载，严格复核账户/日期绑定、固定七项
  检查、证据单位、策略和 warnings；账户或日期变化清除旧结果。
- `P3-OFFLINE-QUALITY-02`：页面明确结果不评价广告表现、不应用业务阈值、不声明因果、
  不生成建议且不形成 Gate 证据；production 构建继续关闭入口。

实现边界见[离线数据质量报告](../technical/offline-data-quality-report.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-002`、`FR-003`、`FR-004`、`FR-005`、任何 NFR 或 ADR，
也不形成 G1/G2/G3 证据。

`P1-OFFLINE-QUALITY-01`–`P1-OFFLINE-QUALITY-04` 和
`P3-OFFLINE-QUALITY-01`–`P3-OFFLINE-QUALITY-02` 已于 2026-08-07 完成。全仓检查
通过 79 份规范文档、14 项 Phase 0、67 项 Worker、68 项原型测试及 production build。
HTTP 验证三日成功、两日和未知账户安全失败；浏览器在 `1280 × 720` 与 `430 × 932`
验证 24/24 个主体日、7/7 项检查、日期变化清除、无控制台告警和无页面横向溢出。
production 入口关闭，三个本地端口随后停止。该结果不改变项目阶段或外部权限。

## 离线分析质量 Preflight 切片

项目负责人于 2026-08-08 再次指示继续下一阶段。本切片不增加 Worker 路由，只把既有
fixture 数据质量报告接入本地 Web 分析控制流，不属于正式 Phase 1、Phase 2 或 Phase 3，
只允许：

- `P3-OFFLINE-PREFLIGHT-01`：质量报告全量通过后生成仅存于页面内存的凭证，绑定账户、
  覆盖日期、完整对象 ID、六项指标口径、稳定状态、获取时间和同步批次。
- `P3-OFFLINE-PREFLIGHT-02`：账户、对象、直接子对象 comparison 与两类趋势，在请求前
  都必须验证账户、日期和对象被凭证覆盖；未覆盖时不得请求 Worker。
- `P3-OFFLINE-PREFLIGHT-03`：分析响应必须再次匹配凭证中的口径和快照；comparison 的
  baseline 与 current 两期都必须匹配，错配时拒绝结果。
- `P3-OFFLINE-PREFLIGHT-04`：账户、质量日期、新质量请求或失败使凭证失效，并中止活动
  comparison、清除旧结果；不得把凭证写入 URL 或浏览器持久化存储。
- `P3-OFFLINE-PREFLIGHT-05`：组件、客户端、production 构建、HTTP、桌面与移动浏览器
  和端口清理验证必须覆盖锁定、解锁、范围外重新锁定与快照错配。

实现边界见[离线分析质量 Preflight](../technical/offline-analysis-quality-preflight.md)。完成
结果不改变 G0 `PARTIAL`，不接受 `FR-002`–`FR-005`、任何 NFR 或 ADR，也不形成
G1/G2/G3 证据。

`P3-OFFLINE-PREFLIGHT-01`–`P3-OFFLINE-PREFLIGHT-05` 已于 2026-08-08 完成。全仓
检查通过，包括 80 份规范文档、14 项 Phase 0、67 项 Worker、73 项原型测试及
production build。本机 HTTP 与浏览器验证覆盖质量核验、账户/对象 comparison、直接
子对象拆解、对象/直接子对象趋势，preflight 前锁定、通过后解锁和日期编辑后重新锁定；
`1280 × 720` 与 `430 × 932` 无控制台告警或页面横向溢出。production 入口关闭，
`8791`、`5173`、`4173` 随后均无监听。该结果不改变项目阶段或外部权限。

## 离线 Codex 分析证据包切片

项目负责人于 2026-08-08 再次指示继续下一阶段。本切片不增加 Worker 路由，只把本地
Web 当前已通过 preflight 的 fixture comparison 或直接子对象拆解整理为手动 Codex
输入，不属于正式 Phase 1、Phase 2 或 Phase 3，只允许：

- `P2-OFFLINE-EVIDENCE-01`：定义固定版本的分析输入 schema，分层记录范围、新鲜度、
  质量凭证、事实、确定性模式、直接子对象输入、未知项和安全护栏。
- `P2-OFFLINE-EVIDENCE-02`：相同可信业务响应生成字节一致 JSON，不输出 comparison 或
  质量请求的随机 `requestId`，不包含真实凭据、客户数据或写参数。
- `P3-OFFLINE-EVIDENCE-01`：本地页面只对当前成功结果展示只读 JSON；没有 preflight、
  超出范围、对象未覆盖或快照错配时拒绝生成。
- `P3-OFFLINE-EVIDENCE-02`：账户、日期、对象或质量凭证变化沿用 comparison 失效链路
  清除证据包；不得持久化、自动上传、写剪贴板或请求 Codex/MCP。
- `P3-OFFLINE-EVIDENCE-03`：自动测试、production 构建、桌面/移动浏览器和端口清理
  验证确定性、拒绝边界、只读呈现和开发入口关闭。

实现边界见[离线 Codex 分析证据包](../technical/offline-codex-evidence-bundle.md)。完成结果
不改变 G0 `PARTIAL`，不接受 `FR-005`、`NFR-002`、任何 ADR 或候选架构，也不形成
Codex 分析结论、G2/G3 证据或任何外部授权。

`P2-OFFLINE-EVIDENCE-01`–`P2-OFFLINE-EVIDENCE-02` 和
`P3-OFFLINE-EVIDENCE-01`–`P3-OFFLINE-EVIDENCE-03` 已于 2026-08-08 完成。全仓检查
通过 81 份规范文档、14 项 Phase 0、67 项 Worker、78 项原型测试及 production build。
浏览器在 `1280 × 720` 与 `430 × 932` 验证 preflight 前锁定、通过后账户级上下文、
Campaign→Ad Set 稳定非排名 `driver_inputs` 和日期编辑后失效；无控制台告警或页面
横向溢出。production 入口关闭，三个本地端口随后停止。该结果不改变项目阶段或权限。

## 离线 Codex 趋势证据包切片

项目负责人于 2026-08-08 再次指示继续下一阶段。本切片不增加 Worker 路由，只把本地
Web 当前已通过 preflight 的对象或直接子对象趋势整理为手动 Codex 输入，不属于正式
Phase 1、Phase 2 或 Phase 3，只允许：

- `P2-OFFLINE-TREND-EVIDENCE-01`：把输入 schema 更新为 v2；comparison 明确使用
  `PERIOD_COMPARISON`，两类趋势使用 `DAILY_TREND` 和完整固定 9 项日值。
- `P2-OFFLINE-TREND-EVIDENCE-02`：重新验证趋势日期、派生公式、对象、口径和快照；
  直接子对象按稳定 ID 输出并逐日执行四项可加指标父子对账。
- `P3-OFFLINE-TREND-EVIDENCE-01`：两类趋势只在当前成功结果下方派生只读 JSON；图表
  指标切换不改变输入，日期、对象或凭证变化沿趋势失效链路清除。
- `P3-OFFLINE-TREND-EVIDENCE-02`：自动测试、production 构建、桌面/移动浏览器和端口
  清理验证确定性、请求追踪值排除、无排名/解释/建议和开发入口关闭。

实现边界见
[离线 Codex 趋势证据包](../technical/offline-codex-trend-evidence.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-005`、`NFR-002`、任何 ADR 或候选架构，也不形成趋势解释、
Codex 分析结论、G2/G3 证据或任何外部授权。

`P2-OFFLINE-TREND-EVIDENCE-01`–`P2-OFFLINE-TREND-EVIDENCE-02` 和
`P3-OFFLINE-TREND-EVIDENCE-01`–`P3-OFFLINE-TREND-EVIDENCE-02` 已于 2026-08-08
完成。全仓检查通过 82 份规范文档、14 项 Phase 0、67 项 Worker、81 项原型测试及
production build。浏览器在 `1280 × 720` 与 `430 × 932` 验证对象、Campaign→Ad Set
和 Ad Set→Ad 趋势输入、完整 9 项指标、稳定顺序、逐日对账、指标切换后 JSON 不变、
对象变化失效、无控制台告警和无页面横向溢出；production 不渲染离线趋势或证据面板，
三个本地端口随后停止。该结果不改变项目阶段、Gate、需求状态或外部权限。

## 离线 Codex 分析 Skill 切片

项目负责人于 2026-08-08 再次指示继续下一阶段。本切片不增加 Web 或 Worker 能力，只
允许仓库级 Codex Skill 处理上一切片的 schema v2 手动输入，不属于正式 Phase 1、
Phase 2 或 Phase 3，只允许：

- `P2-OFFLINE-SKILL-01`：在 Codex 仓库级发现目录创建显式调用的
  `facebook-ads-analysis`，不声明 MCP 或其他外部依赖。
- `P2-OFFLINE-SKILL-02`：确定性校验 schema、fixture/preflight 边界、日期、指标公式、
  comparison 变化、直接子对象对账、敏感字段和关闭的 guardrail；失败时不输出部分结果。
- `P2-OFFLINE-SKILL-03`：校验通过后只形成带路径的 `FACT`、有事实和替代解释的非因果
  `INFERENCE`、完整保留的 `UNKNOWN`；不得排名或生成优化动作。
- `P2-OFFLINE-SKILL-04`：固定 fixture 正反测试、Skill 元数据快速校验、文档检查与
  全仓回归必须通过；CI 对 Skill 或契约变化运行相同测试。

实现边界见[离线 Codex 分析 Skill](../technical/offline-codex-analysis-skill.md)。完成结果
不改变 G0 `PARTIAL`，不接受 `FR-005`、`NFR-002`、任何 ADR 或候选架构，也不形成
通用分析结论、G2/G3 证据或任何外部授权。

`P2-OFFLINE-SKILL-01`–`P2-OFFLINE-SKILL-04` 已于 2026-08-08 完成首轮本地验证：
官方结构快速校验通过，11 项 fixture 正反测试覆盖五种 analysis kind、pattern、公式、
逐日对账、schema、敏感字段、stdin 和显式调用策略。统一检查还通过 83 份规范文档、
14 项 Phase 0、67 项 Worker、81 项原型测试及 production build。当前结果只证明候选
离线处理链可重复，不是 Gate 证据。

## 离线 Codex 分析草稿评测切片

项目负责人于 2026-08-08 再次指示继续下一阶段。本切片不增加运行时或模型调用，只
允许把上一切片的最终 JSON 草稿契约变成可重复本地回归，不属于正式 Phase 1、Phase 2
或 Phase 3，只允许：

- `P2-OFFLINE-EVAL-01`：固定一个评测承诺，只检查草稿的输入忠实度和只读安全边界。
- `P2-OFFLINE-EVAL-02`：为五种 schema v2 `analysis_kind` 建立脱敏黄金场景，共用既有
  fixture 上下文，不包含真实账户、Token 或客户数据。
- `P2-OFFLINE-EVAL-03`：固定顶层字段、evidence path 与原值、未知项、直接子对象覆盖、
  confidence、limitations 和 `external_write: false` 的精确契约。
- `P2-OFFLINE-EVAL-04`：使用确定性评分器和正负回归拒绝 schema/范围漂移、伪造证据、
  删除未知项、遗漏子对象、排名、因果或可执行优化措辞；CI 运行同一检查。

实现边界见
[离线 Codex 分析草稿评测](../technical/offline-codex-analysis-evals.md)。完成结果不改变
G0 `PARTIAL`，不接受 `FR-005`、`NFR-002`、任何 ADR 或候选架构，也不形成模型质量、
真实账户、用户价值、G2/G3 或任何外部授权证据。

`P2-OFFLINE-EVAL-01`–`P2-OFFLINE-EVAL-04` 已完成本地验证：五种黄金场景和 12 项草稿
评测通过，与 11 项输入 Skill 测试合计 23 项；统一检查还通过 84 份规范文档、14 项
Phase 0、67 项 Worker、81 项原型测试及 production build，官方 Skill 结构校验通过。
当前结果只证明固定 fixture 草稿契约可重复，不是模型或 Gate 证据。

## 离线 Codex 独立会话前向评测切片

项目负责人于 2026-08-09 再次指示继续下一阶段。本切片不增加业务运行时或模型调用，
只允许建立未来全新 Codex 会话可直接使用的隔离测试材料和手动结果评分链路：

- `P2-OFFLINE-FWD-01`：固定一个会话承诺，五类 fixture 最终草稿仍须通过既有 8 项契约。
- `P2-OFFLINE-FWD-02`：建立 `FWD-FBA-001`–`FWD-FBA-005`，包内不含黄金草稿、期望
  evidence path 或期望答案。
- `P2-OFFLINE-FWD-03`：准备器只返回 `NOT_RUN`；评分器只重建固定上下文并接收操作者
  草稿与协议声明，不启动模型、不联网、不写结果。
- `P2-OFFLINE-FWD-04`：只有五个 Case 在独立全新会话中分别 8/8 且负责人确认，才能
  登记会话前向评测通过；评分器自测不得替代真实执行。

实现边界见
[离线 Codex 独立会话前向评测](../technical/offline-codex-session-forward-test.md)。当前
`forward_test_execution_status` 为 `PASS`；本切片不接受 `FR-005`、`NFR-002`、
任何 ADR 或候选架构，不形成模型质量、用户价值、G2/G3 或任何外部授权证据。

`P2-OFFLINE-FWD-01`–`P2-OFFLINE-FWD-04` 已执行。`001`、`002`、`004` 首次 8/8；
`003`、`005` 首次因自然语言含否定式禁用词被拒绝，Skill 修正后分别在全新会话中获得
8/8。最终 5/5 Case 通过，实际共运行 7 个独立会话；结果仅由操作者声明隔离协议，不是
真实数据、通用模型或 Gate 证据。

## 离线 Codex 素材 Skill 开发切片

项目负责人于 2026-08-09 再次指示继续下一阶段，并要求先完成所有开发任务，把配置与
测试统一放到开发结束后。本切片只开发固定虚构素材上下文到人工评审草稿的候选链路：

- `P2-OFFLINE-CREATIVE-01`：创建仅显式调用的 `facebook-ads-creative`，不声明 MCP、
  Web、Meta、模型或供应商依赖。
- `P2-OFFLINE-CREATIVE-02`：定义 `facebook-ads-creative-context/v1` 精确 schema，
  固定 fixture 引用、批准信息点、素材来源/权利、AI 标记、单变量和关闭的 guardrail。
- `P2-OFFLINE-CREATIVE-03`：实现无第三方依赖的确定性 preflight，权利、来源、信息点、
  固定项或品牌约束不满足时安全阻断。
- `P2-OFFLINE-CREATIVE-04`：定义创意简报、文案变体、视觉方向、风险、人工评审和手动
  Web 语义交接的稳定草稿契约；不搜索或生成实际素材。
- `P2-OFFLINE-CREATIVE-05`：开发队列完成后执行本地配置、fixture 正反测试、结构校验、
  输出评分、全仓回归与 CI 调整；这些确定性项目已完成，独立会话由后续切片单独治理。

实现边界见[离线 Codex 素材 Skill](../technical/offline-codex-creative-skill.md)。
`P2-OFFLINE-CREATIVE-01`–`P2-OFFLINE-CREATIVE-05` 的本地确定性项目已完成，状态为
`LOCAL_FIXTURE_VALIDATED`；后续代表性独立 Codex 会话最终为 8/8。本切片不接受新的
`FR-*`、`NFR-*`、ADR 或候选架构，不改变 G0 `PARTIAL`，不形成模型、版权、Meta 审核、
产品能力、G2/G3 或外部授权证据。

## 离线 Codex 工作流 Skills 开发切片

项目负责人随后明确批准在相同 fixture-only、只开发、配置与测试延期的边界内补齐其余
四个聚焦 Skill：

- `P2-OFFLINE-WORKFLOW-01`：建立四个仅显式调用的 Skill 目录与 discovery 元数据；均
  固定 `allow_implicit_invocation: false`，不声明 MCP、Web、Meta、模型或供应商依赖。
- `P2-OFFLINE-WORKFLOW-02`：实现 `facebook-ads-campaign-builder`、
  `facebook-ads-campaign-context/v1`、三层 `DRAFT` 契约和关键字段/素材/落地页 blocker。
- `P2-OFFLINE-WORKFLOW-03`：实现 `facebook-ads-daily-brief`、
  `facebook-ads-daily-brief-context/v1`、数据问题优先和“无须处理”的事实简报契约。
- `P2-OFFLINE-WORKFLOW-04`：实现 `facebook-ads-optimization`、
  `facebook-ads-optimization-context/v1`、有效性 preflight、`INCONCLUSIVE` 和不可执行
  测试建议契约。
- `P2-OFFLINE-WORKFLOW-05`：实现 `facebook-ads-change-management`、
  `facebook-ads-change-context/v1`、受限语义 patch、政策/审批缺口和
  `NOT_AUTHORIZED` 执行契约。
- `P2-OFFLINE-WORKFLOW-06`：开发结束后执行四项本地配置、fixture 正反测试、结构校验、
  输出评分、全仓回归与 CI 调整；这些确定性项目已完成，独立会话由后续切片单独治理。

`P2-OFFLINE-WORKFLOW-01`–`P2-OFFLINE-WORKFLOW-06` 的本地确定性项目已完成，统一状态为
`LOCAL_FIXTURE_VALIDATED`；后续四个代表性独立 Codex 会话最终均为 8/8。实现边界见
[离线 Codex 工作流 Skills](../technical/offline-codex-workflow-skills.md)。本切片不执行
Skill，不读取真实账户或客户数据，不连接 Web/Meta/MCP，不持久化，不提交审批，不执行
变更，也不创建任何外部资源。它不接受新的 `FR-*`、`NFR-*`、ADR 或候选架构，不改变
G0 `PARTIAL`，不形成产品能力、模型质量、Meta 审核、G2/G3/G4 或外部授权证据。

## 离线 Codex 工作流 Skills 独立会话前向评测切片

项目负责人于 2026-08-09 再次指示继续下一步。本切片只为五个已完成本地确定性验证的
Creative/工作流 Skill 建立隔离会话材料和一次性执行链路：

- `P2-OFFLINE-WF-FWD-01`：固定五个 Skill 各一个代表性 fixture 会话承诺；
- `P2-OFFLINE-WF-FWD-02`：建立 `FWD-FBW-001`–`FWD-FBW-005`，包内不含黄金草稿、
  期望答案或评分路径；
- `P2-OFFLINE-WF-FWD-03`：准备器只返回 `NOT_RUN`，评分器只接受标准输入、重建固定
  context 并复用现有 8 项契约；
- `P2-OFFLINE-WF-FWD-04`：五项独立新会话都获得 8/8 后才能登记 `PASS`；首次失败必须
  保留并在修正后用新的无历史会话重测。

实现边界见
[离线 Codex 工作流 Skills 独立会话前向评测](../technical/offline-codex-workflow-session-forward-test.md)。
测试包与 12 项专项回归已完成。五个首次会话中两项 8/8、三项被精确契约拒绝；收紧
Creative 信息点映射、Campaign Ad 字段和 Daily Brief 状态字段后，三项分别在全新会话
复测为 8/8，最终 5/5 `PASS`。隔离协议只由操作者声明，一次性授权已关闭。本切片不形成
产品、通用模型、版权、Meta 审核、真实对象、审批、执行或 Gate 证据，也不扩大任何
外部授权。

## 离线 Codex 跨 Skill 手动工作流切片

项目负责人于 2026-08-09 指示继续剩余开发任务。本切片只组合已有固定 fixture
context 与草稿，不调用模型或执行新的 Skill 会话：

- `P2-OFFLINE-CROSS-WORKFLOW-01`：定义
  `facebook-ads-cross-skill-workflow-bundle/v1`、固定阶段和关闭的 guardrail。
- `P2-OFFLINE-CROSS-WORKFLOW-02`：实现 Creative→Campaign Builder，精确复制已选
  文案、素材、受众和版位，并把 Campaign 配置、预算、排期、CTA 与审查保留为人工输入。
- `P2-OFFLINE-CROSS-WORKFLOW-03`：实现 Optimization→Change Management，只传递一个
  `PENDING_CONFIRMATION` 动作、证据和目标，patch、政策和审批仍须人工提供。
- `P2-OFFLINE-CROSS-WORKFLOW-04`：实现阶段草稿、范围、映射、人工输入、非持久化和
  无外部写入的 10 项确定性评分，以及只接受标准输入的安全失败 CLI。
- `P2-OFFLINE-CROSS-WORKFLOW-05`：接入统一 Skill 检查、CI 路径和文档治理。

`P2-OFFLINE-CROSS-WORKFLOW-01`–`05` 已完成。两条 bundle 均为 10/10，11 项专项测试
通过；Daily Brief 保持只读终点，Analysis 未被自动连接到 Optimization。实现边界见
[离线 Codex 跨 Skill 手动工作流](../technical/offline-codex-cross-skill-workflows.md)。本
切片不代表实际跨会话、Web 导入、Remote MCP、Meta、审批、执行或 G2/G3/G4 证据。

## Phase 1：Cloudflare 数据控制平面

以下任务只适用于 Product Discovery 和后续技术评审选择 Cloudflare 方案的情况：

正式任务仍依赖 G0 `PASS`；离线准备轨道完成不能把下列任务标为完成。

- `P1-01` 创建 TypeScript Worker 和本地环境。
- `P1-02` 创建 D1 migration 和租户约束。
- `P1-03` 创建 R2、Queues、Workflows 的 staging 配置。
- `P1-04` 实现加密后的 Meta connection 存储。
- `P1-05` 实现 Meta 只读客户端、分页、限流和错误分类。
- `P1-06` 实现增量同步、按账户与广告对象归因上下文回补和历史 backfill。
- `P1-07` 实现数据质量检查和同步状态。
- `P1-08` 添加单元、集成和 fixture 测试。

## Phase 2：Codex 与只读分析

产品已选择 Codex 作为前期 AI 入口；Remote MCP 仍须单独评审：

- `P2-01` 建立 Codex 上下文文档与 Skills 的加载和验证规则。
- `P2-02` 创建素材、广告创建、分析、日报、优化和变更管理 Skills。
- `P2-03` 如果通过 ADR 选择 Remote MCP，实现认证和用户到 Workspace 映射。
- `P2-04` 如果选择 MCP，实现只读工具、分页、限制、错误 envelope 和安全日志。
- `P2-05` 创建代表性生成、分析和拒绝场景测试。

当前六个仓库级离线 Skill 候选切片不能替代正式 `P2-01`–`P2-05`。六项只验证了固定
fixture 契约；两组代表性独立会话已完成，两条固定跨 Skill bundle 也已完成本地连续性
校验，但实际跨会话流程、Web/MCP 交接和外部集成测试尚未开始。

G2 只证明 Codex 辅助能力；完整产品还必须满足 Web 产品 Gate。

## Phase 3：Web 运营平台

Web 已被选择为业务产品主体，具体实现仍依赖 `DG0`、G0 和技术评审：

- `P3-01` 实现用户认证和 RBAC。
- `P3-02` 实现素材中心、广告创建和广告管理的首期范围。
- `P3-03` 实现数据分析、测试与优化、连接和账户配置。
- `P3-04` 实现建议、审批交接、同步状态和审计。
- `P3-05` 实现 accessibility、响应式、跨模块对象关系和 E2E 测试。

## Phase 4：审批式写操作

启动依赖：G2、G3、Meta 管理权限和项目负责人单独授权。

- `P4-01` 实现 change request schema 和状态机。
- `P4-02` 实现 `before_hash`、过期和策略校验。
- `P4-03` 实现网页批准与拒绝。
- `P4-04` 实现内部变更申请工具。
- `P4-05` 实现只接受 ID 的外部执行工具。
- `P4-06` 实现暂停、启用和预算变更适配器。
- `P4-07` 实现 before/after 快照、审计和反向变更。
- `P4-08` 在测试资产或批准的低风险资产上验证。

## Phase 5：有限自动化

启动依赖：G4 和项目负责人批准的 Dry Run 周期。

- `P5-01` 将确定性规则引擎与模型建议分离。
- `P5-02` Dry Run 记录“建议执行但未执行”的结果。
- `P5-03` 比较建议、实际结果和人工判断。
- `P5-04` 只开放批准的操作白名单。
- `P5-05` 实现自动熔断和告警。

## 阶段执行规则

每个阶段开始前：

1. 阅读项目章程、授权状态、安全政策和阶段文档。
2. 检查工作区和既有变更。
3. 核对依赖、需求、任务、Gate 和未决问题。
4. 只实施当前阶段并运行规定测试。
5. 记录结果、证据、限制和下一 Gate。

Gate 条件及完成定义见[Gate 与证据](gates-and-evidence.md)。
