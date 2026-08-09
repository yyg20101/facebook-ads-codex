---
doc_id: TECH-OFFLINE-CODEX-EVIDENCE
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-08
---

# 离线 Codex 分析证据包

本文定义第十三个可逆离线候选切片：把本地 Web 中当前已通过
[分析质量 Preflight](offline-analysis-quality-preflight.md)的周期结果，整理为供负责人
手动带入 Codex `facebook-ads-analysis` 会话的确定性 JSON。它只是分析输入上下文，不是
Skill 输出、分析结论、真实账户证明、操作授权或 Gate 证据。

## 支持范围

本切片及其[趋势扩展](offline-codex-trend-evidence.md)只接受已经由严格客户端校验并与
同一内存凭证再次匹配的五类当前结果：

1. fixture 账户周期 comparison；
2. 已验证 fixture Campaign、Ad Set 或 Ad 的周期 comparison；
3. 已验证 fixture Campaign 或 Ad Set 的直接子对象周期拆解。
4. 已验证 fixture Campaign、Ad Set 或 Ad 的对象日趋势。
5. 已验证 fixture Campaign 或 Ad Set 的直接子对象日趋势。

选择、修改或重新核验账户、日期、对象、口径或快照后，页面必须先清除旧分析结果，
证据包随之消失，不能独立保留旧结果。

## 输出契约

当前固定 schema 版本为 `facebook-ads-offline-analysis-context/v2`；`v1` 已由第十四个
切片替代，不再作为当前输出。产物类型为 `CODEX_ANALYSIS_INPUT`，来源固定为
`FIXTURE`。顶层字段及用途如下：

| 字段 | 内容 | 信任边界 |
| --- | --- | --- |
| `scope_and_freshness` | Workspace、账户、分析主体、数据截止时间和指标口径 | 不包含用户身份或授权声明 |
| `quality_evidence` | 通过状态、凭证覆盖范围、对象数量和快照 | 只证明当前 fixture preflight 通过 |
| `fact_evidence` | comparison 的两期事实，或趋势的完整固定 9 项日值 | 固定标记为 `FACT` |
| `observed_patterns` | 已确认的确定性数字模式及证据路径 | `causal_claim: false`，不输出后续建议 |
| `driver_inputs` | 直接子对象周期或日值事实、顺序和父子对账 | 无拆解时为 `NONE`；始终无排名 |
| `unknowns` | 因果、业务阈值、真实账户和外部转化数据缺口 | 固定标记为 `UNKNOWN` |
| `guardrails` | fixture、阈值、因果、排名、建议、写入和持久化布尔值 | 所有扩大能力的值均安全关闭 |
| `codex_handoff` | 目标 Skill、手动模式和禁止用途 | 要求后续输出区分 `FACT`、`INFERENCE`、`UNKNOWN` |

证据包刻意不提供 `executive_answer`、`confidence`、`recommended_actions` 或广告写入参数。
这些属于后续 Codex 分析输出，不能由 Web 的确定性打包器冒充。

## 确定性与脱敏

`P2-OFFLINE-EVIDENCE-01`：相同凭证与相同业务响应必须产生字节一致的缩进 JSON。随机
comparison、趋势和质量请求追踪值不进入产物，因此重试不会改变证据包。

`P2-OFFLINE-EVIDENCE-02`：产物只使用固定 fixture 引用、展示标签、指标和口径，不包含
Token、Authorization Header、联系方式、客户数据、浏览器状态或内部请求追踪值。直接
子对象沿服务端验证后的稳定对象 ID 顺序映射，但不输出内部对象 ID，也不按表现重排。

## 失败关闭

构建器必须再次验证：

- 响应、账户、对象和警告均明确为 fixture，且包含 `NO_EXTERNAL_CONNECTION`；
- comparison 两个周期完整、不重叠，未应用阈值且不包含因果声明；
- 账户、日期和目标对象位于当前 `OfflineDataQualityAttestation` 覆盖范围；
- 币种、时区、点击口径、转化事件、归因、API 版本、稳定状态、获取时间和同步批次与
  preflight 快照完全一致；
- 对象 comparison 的对象绑定一致；直接子对象的父级、子对象数量、全部对象覆盖、稳定
  顺序、无排名标记和两期父子汇总对账均成立。
- 趋势日期、固定 9 项日值、派生公式、对象绑定和快照一致；直接子对象趋势还必须保持
  稳定顺序并逐日完成四项可加指标父子对账。

任一条件失败时返回 `INVALID_EVIDENCE_SOURCE`，页面只显示拒绝原因，不保留部分 JSON，
也不回退到静态故事数据。

## Web 交互

`P3-OFFLINE-EVIDENCE-01`：本地开发页面在 comparison 区域提供“步骤 7 · 手动交接”，
两类趋势在各自当前成功结果下提供独立交接。没有当前可信 comparison 时只显示锁定
状态；有结果时显示只读 JSON 文本框和 preflight、来源、声明分层、外部写入边界。

`P3-OFFLINE-EVIDENCE-02`：产物完全从当前成功响应派生，不建立第二份 React 状态，不用
Effect 同步派生值，不写入 URL、`localStorage`、`sessionStorage`、IndexedDB 或剪贴板，
也不自动请求 Codex、MCP 或任何远程端点。production 分支不渲染该入口。

负责人可以手动选择文本并放入独立 Codex 会话。后续 `facebook-ads-analysis` 必须依据
[Codex Skills](codex-skills.md)重新形成范围、事实、推断、未知项和置信度；不得把输入包
自身当作分析结论。

## 验证

自动检查至少覆盖：

- 请求 ID 变化不改变序列化结果，且两个请求 ID 均不出现在 JSON；
- 账户、对象、直接子对象和两类趋势形成正确的 `analysis_kind`；
- 对象未被凭证覆盖、快照不一致、子对象顺序错误时安全拒绝；
- 直接子对象保持稳定顺序、父子对账和 `ranking_applied: false`；
- 趋势包含完整 9 项日值，图表指标切换不改变 JSON；直接子对象趋势逐日对账；
- 页面只在当前可信结果存在时显示只读 JSON，日期变化立即清除；
- production 构建关闭入口，桌面与移动视口无控制台错误或页面横向溢出。

本切片不增加或修改任何 Worker、HTTP、D1、Meta 或 MCP 接口。完成实现和测试也不接受
`FR-005`、任何 ADR 或候选架构，不改变 G0 `PARTIAL`，不授权真实读取、自动上传、部署、
广告写操作或正式阶段转换。

## 当前验证结果

`P2-OFFLINE-EVIDENCE-01`–`P2-OFFLINE-EVIDENCE-02` 和
`P3-OFFLINE-EVIDENCE-01`–`P3-OFFLINE-EVIDENCE-03` 已于 2026-08-08 完成固定 fixture
验证。全仓检查覆盖 81 份规范文档、14 项 Phase 0、67 项 Worker 和 78 项原型测试及
production build。HTTP 健康、质量和 comparison 请求均返回 `200`；浏览器还验证账户
列表、对象层级和 Campaign→Ad Set 拆解均只使用既有本机路由。

`1280 × 720` 与 `430 × 932` 均完成 preflight 锁定/解锁、账户级 JSON、直接子对象
`driver_inputs`、日期编辑失效、无控制台告警和无页面横向溢出。production 预览不渲染
账户、质量或 Codex 证据包入口，`8791`、`5173`、`4173` 验证后均无监听。该结果只适用
固定 fixture，不改变项目阶段、需求状态、Gate 或外部权限。

同日第十四个切片把当前输出更新为 schema v2，并完成对象与直接子对象趋势扩展；验证
结果和新增边界见[离线 Codex 趋势证据包](offline-codex-trend-evidence.md)。
