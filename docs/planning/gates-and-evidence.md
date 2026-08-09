---
doc_id: PLAN-GATES
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# Gate 与验证证据

Gate 是阶段结果的证据门槛，不是权限授权。

## DG0：内部试点产品定义

- 通用 Meta 广告全流程 Web 运营平台的定位由项目负责人确认。
- 支持用户类别、经验层级、核心能力和明确非目标完整。
- 至少 3 个代表性端到端场景包含任务、输入、流程、输出、异常和验收。
- `DQ-01`–`DQ-08` 已由证据解决，或有不影响试点的明确延期理由。
- 完整 Web 原型覆盖素材、广告创建与管理、数据分析和持续优化的跨模块关系。
- 三个场景均具有使用上下文、信息文档和 Skills 的 Codex 辅助流程。
- 已选产品形态的关键步骤覆盖率不低于 80%。
- 数据可信度、审批或广告写操作的关键误解为零。
- 用户、问题、价值、形态、内容、MVP、非目标和试点指标由负责人确认。
- 结论明确标注为负责人定义，不包含未经验证的真实用户或市场声明。

完整检查和当前结果以[产品定义](../discovery/product-definition.md)为准。任一核心条件
不满足时必须为 `PARTIAL`，不得进入 G0。

当前结果：

- 状态：`PASS`
- 日期：2026-07-30
- 决策者：`project_owner`
- 主要证据：`EVD-015`–`EVD-017`、`EVD-023`–`EVD-025`
- 限制：仅代表负责人接受内部试点产品定义；未验证真实用户、外部市场、效率或广告
  效果，不扩大任何外部权限。

## G0：业务与只读接入条件

- 前置条件：DG0 已通过，且 Phase 0 已被项目负责人单独启动。
- 所有 `BQ-01`–`BQ-12` 有明确答案和所有者。
- 业务模型、主 KPI、主转化事件、归因和账户范围已确认。
- 主 Cloudflare 账户事实已确认。
- 测试环境能只读列出至少一个 Meta 广告账户。
- 未部署 production，未授权 Meta 写操作。

`BQ-01`–`BQ-12` 已全部回答。项目负责人决定暂时跳过真实配置，因此当前 G0 为
`PARTIAL`：业务决策已完成，但 Cloudflare 实际事实与 Meta 只读证据仍缺失。真实 Meta
只读验证属于后续单独授权动作，不能从问卷、脚手架或测试通过推导。

本地配置模板、离线测试或验证工具通过不构成 Meta 接入证据。`meta_read_access_available`
表示按[只读验证 Runbook](../runbooks/meta-read-connection.md)成功验证了可重复建立的访问
路径；验证后必须撤销临时 Token，仓库不长期保存凭据。

G0 通过后项目状态转为 `READY_FOR_PHASE_1` / `PHASE_0_COMPLETE`，但运行时可用、
production 部署、Meta 只读验证和 Meta 写操作授权仍保持关闭。若任何真实验证条件失败，
G0 必须为 `PARTIAL` 或 `FAIL`，项目继续停留在 Phase 0。

负责人已单独允许在 G0 `PARTIAL` 时进行 Phase 1 离线准备。该例外只覆盖虚构 fixture、
本地 Worker/D1、类型、migration 和测试，不满足任何 G1 条件，也不允许 staging、
Cloudflare 资源、真实 Meta 客户端或同步。

负责人随后允许继续离线只读分析切片。fixture 账户列表、指标汇总、上下文兼容检查或
对应测试通过仍不形成 G0/G1 证据，不证明认证、Meta 数据正确性或真实广告分析有效。

负责人又允许离线周期对比与诊断切片。fixture 周期变化、覆盖检查和确定性模式通过只
证明本地计算可重复；它不证明真实数据可比、诊断原因正确、优化有效或 G2 已满足。

负责人随后允许离线 Web 分析接入切片。本地页面能够加载 fixture Worker、呈现指标与
安全边界，只证明本机演示链路可重复；它不证明认证、授权、真实数据正确性、可用性、
诊断效果或 G3 已满足。

负责人又允许离线 Web 账户上下文选择切片。从固定本地列表选择 fixture 账户并验证
comparison 绑定，只证明本机上下文传递与安全失败可重复；它不证明用户有权访问真实
账户、认证或授权已经实现，也不形成 G0、G1、G2 或 G3 证据。

负责人随后允许离线广告对象层级切片。固定 Campaign、Ad Set、Ad 的父级约束、本机
读取和 Web 导航通过，只证明 fixture 层级传递可重复；它不证明真实对象已同步、层级
完整、对象级指标可用、用户拥有对象权限或 G1/G2/G3 已满足。

负责人又允许离线对象级分析切片。固定对象指标、层级汇总对齐、本机对象 comparison
和 Web 范围绑定通过，只证明这组虚构数据与本地契约可重复；它不证明真实对象指标与
Ads Manager 一致、用户有权读取对象、诊断有效、优化有效或 G1/G2/G3 已满足。

负责人随后允许离线直接子对象拆解切片。固定 Campaign/Ad Set 直接子级、两期父子
汇总对账和 Web 展示通过，只证明这组虚构数据在本地契约中保持可加一致；稳定 ID 顺序
不是表现排名，也不证明真实层级完整、真实数据对账、原因诊断、优化有效或 G1/G2/G3
已满足。

负责人又允许离线对象日趋势切片。固定 Campaign、Ad Set、Ad 的连续三日真值、
3–31 日输入边界、完整性与口径校验和 Web 单指标切换通过，只能证明这组 fixture 与
本地契约可重复；它不证明真实趋势正确、Ads Manager 对账、用户授权、趋势原因、优化
价值或 G1/G2/G3 已满足。

负责人随后允许离线直接子对象日趋势切片。固定 Campaign→Ad Set 与 Ad Set→Ad 的
多序列日值、稳定 ID 顺序和每日四项可加指标父子对账，只能证明这组 fixture 在本地
组合契约中可重复；它不证明真实层级完整、真实数据逐日对账、任何子对象表现更好、
趋势原因、优化价值或 G1/G2/G3 已满足。

负责人随后允许离线数据质量报告切片。固定账户与全部对象的主体日唯一性、连续覆盖、
统一上下文、完整层级和三层逐日汇总检查通过，只能证明该 fixture 在本地候选契约中
可用于后续分析；它不证明真实 Meta 数据完整或正确、与 Ads Manager 对账、广告表现、
诊断有效、优化价值或 G1/G2/G3 已满足。

负责人随后允许离线分析质量 preflight 切片。质量通过后锁定同一 fixture 账户、日期、
对象、口径和快照，只能证明本地页面会阻止不受该凭证覆盖的指标请求或拒绝错配响应；
它不证明真实数据可信、用户已认证或获权、分析结论正确、广告效果改善或任何 Gate 已满足。

负责人随后允许离线 Codex 分析证据包切片。从当前 preflight 支持的 fixture comparison
派生确定性只读 JSON，只能证明手动分析输入可重复、受当前结果失效链约束且没有自动
外部副作用；它不证明 Codex 分析正确、真实数据可用、优化有效、用户已授权或 G2/G3
已满足。输入中的 `FACT` 仍只是 fixture 事实，`UNKNOWN` 不得被补成确定性结论。

负责人随后允许离线 Codex 趋势证据包切片。从当前 preflight 支持的对象或直接子对象
趋势派生 schema v2 JSON，只能证明完整固定日值、稳定顺序和逐日对账可重复传递；它
不证明趋势方向有业务意义、当前图表指标是主 KPI、子对象存在排名、Codex 分析正确或
任何 Gate 已满足。

负责人随后允许离线 Codex 分析 Skill 切片。项目级 Skill 对 schema v2 fixture 输入的
结构、公式、对账和护栏校验，以及 `FACT` / `INFERENCE` / `UNKNOWN` 分层，只能证明
候选离线工作流按约束拒绝或生成草稿；它不证明真实数据、因果解释、优化价值、通用分析
正确性、用户授权或 G2/G3 已满足。

负责人随后允许离线 Codex 分析草稿评测切片。五种固定黄金场景、精确输出契约和 8 项
确定性检查，只能证明已提交 fixture 草稿满足结构、证据和值、未知项、直接子对象和安全
边界；它不运行模型，不证明真实会话质量、真实账户结论、用户价值或 G2/G3 已满足。

负责人随后允许离线 Codex 独立会话前向评测准备切片。五个无黄金答案测试包、准备器、
操作者声明和确定性评分器只能证明测试材料与接收链路可重复；真实执行状态仍为
`NOT_RUN`。在五个 Case 确实由独立全新会话完成前，它不证明模型质量、触发行为、真实
账户结论、用户价值或 G2/G3 已满足，黄金草稿管道测试也不能成为替代证据。

2026-08-07 的本机验证覆盖 54 项 Worker、45 项原型测试、三日成功与 2/31 日边界、
未知对象、桌面和移动视口、无重复指标请求、对象变化清除、production 入口关闭及端口
停止。该记录是候选切片回归证据，不是 Gate 证据；G0 继续为 `PARTIAL`。

同日直接子对象日趋势扩展后的全仓验证覆盖 78 份规范文档、14 项 Phase 0、61 项
Worker 和 58 项原型测试及 production build。Campaign→Ad Set、Ad Set→Ad、多视口、
逐日父子对账、指标切换无新增请求、父对象变化清除、Ad 禁用、production 入口关闭和
端口停止均通过。该记录仍只是固定 fixture 候选切片回归证据，不是 Gate 证据；G0
继续为 `PARTIAL`。

同日离线数据质量报告扩展后的全仓验证覆盖 79 份规范文档、14 项 Phase 0、67 项
Worker 和 68 项原型测试及 production build。三日 HTTP 报告为 24/24 个主体日、
8 个主体、7 个对象和 7/7 项检查；两日与未知账户安全失败。桌面和移动视口、日期变化
清除、production 入口关闭、无控制台告警、无页面横向溢出和端口停止均通过。该记录
只证明固定 fixture 候选契约可重复，不是 Gate 证据；G0 继续为 `PARTIAL`。

2026-08-08 离线分析质量 preflight 扩展后的全仓验证覆盖 80 份规范文档、14 项
Phase 0、67 项 Worker 和 73 项原型测试及 production build。本机页面验证 preflight
前锁定、24/24 主体日与 7/7 检查通过后解锁、五类分析读取成功及日期编辑后重新锁定；
桌面和移动视口无控制台告警或横向溢出，production 入口关闭，三个端口停止。该记录只
证明固定 fixture 的本地控制流可重复，不是 Gate 证据；G0 继续为 `PARTIAL`。

同日离线 Codex 分析证据包扩展后的全仓验证覆盖 81 份规范文档、14 项 Phase 0、
67 项 Worker 和 78 项原型测试及 production build。桌面与移动浏览器验证账户级
fixture JSON、直接子对象稳定输入、请求 ID 排除、`FACT` / `UNKNOWN` 分层、全部关闭的
写入/建议/持久化护栏和日期编辑失效；production 入口关闭且三个本地端口已停止。该记录
只证明手动 fixture 输入可重复，不是 Codex 分析或 Gate 证据；G0 继续为 `PARTIAL`。

同日离线 Codex 趋势证据包扩展后的全仓验证覆盖 82 份规范文档、14 项 Phase 0、
67 项 Worker 和 81 项原型测试及 production build。桌面与移动浏览器验证对象及两层
直接子对象 schema v2 输入、完整 9 项日值、稳定顺序、逐日对账、请求追踪值排除、指标
切换不改变 JSON 和对象变化失效；production 入口关闭且三个本地端口已停止。该记录
只证明 fixture 趋势手动输入可重复，不是趋势解释、Codex 分析或 Gate 证据；G0 继续为
`PARTIAL`。

同日离线 Codex 分析 Skill 的首轮检查覆盖 11 项固定 fixture 正反测试和 Skill 结构快速
校验；comparison、直接子对象趋势、派生公式、逐日对账、schema v1、敏感请求字段、
stdin 与显式调用策略均被覆盖；统一检查还通过 83 份规范文档、14 项 Phase 0、67 项
Worker、81 项原型测试及 production build。该记录只证明离线候选输入处理边界，不是
通用分析或 Gate 证据；G0 继续为 `PARTIAL`。

同日离线 Codex 草稿评测检查覆盖五种黄金场景和 12 项正负草稿测试；与 11 项输入
Skill 测试合计 23 项。统一检查还通过 84 份规范文档、14 项 Phase 0、67 项 Worker、
81 项原型测试及 production build，官方 Skill 结构校验通过。该记录只证明固定 fixture
输出契约可重复，不是模型、真实账户、用户价值或 Gate 证据；G0 继续为 `PARTIAL`。

2026-08-09，独立会话前向评测准备链路通过 11 项专项测试，与既有输入和草稿契约测试
合计 34 项；统一检查通过 85 份规范文档、14 项 Phase 0、67 项 Worker、81 项原型测试
及 production build，Skill 结构快速校验通过。五个全新 Codex 会话实际执行数量仍为
0，状态为 `NOT_RUN`；该记录不是模型、用户价值或 Gate 证据，G0 继续为 `PARTIAL`。

## G1：数据控制平面

G1–G5 均为旧候选方案 Gate。`DG0` 后必须根据选定产品形态重新评审，未被选择的 Gate
不得继续执行。

- staging 能同步至少一个授权广告账户。
- 重复同步不产生重复逻辑数据。
- Token 不出现在日志、明文数据库、R2 或错误响应。
- 花费、展示和点击在统一口径下与 Ads Manager 对齐。
- 数据差异阈值来自 Phase 0，不使用临时猜测。
- migration、回补、失败恢复和质量检查有证据。

## G2：Remote MCP 与只读分析

- Codex 能完成账户、Campaign、Ad Set 和 Ad 分析。
- 每项结论包含范围、新鲜度、口径、证据和置信度。
- 跨 Workspace 请求被拒绝。
- 只读工具没有外部写副作用。
- 数据不足或过期时 Codex 不编造确定性结论。

G2 完成后只形成可验证的 Codex 只读辅助能力，不单独构成完整产品 MVP。

## G3：Web 运营平台

- 用户只能看到授权 Workspace。
- 页面与 MCP 使用同一业务查询和授权层。
- Token 和敏感错误不出现在浏览器。
- 素材、广告创建与管理、数据分析、测试、连接、同步状态、建议、审计和安全设置的
  首期范围完成 E2E。
- Web 能明确区分本地草稿、待确认、待审批、Meta 已生效和失败状态。
- accessibility 和响应式检查通过。

## G4：审批式写操作

启动前要求 G2、G3、Meta 管理权限和独立写授权。

- 未批准、过期、对象变化、策略失败或重复请求不能执行。
- Codex 不能绕过网页审批。
- 同一幂等键最多产生一次成功外部操作。
- before/after 快照和审计可追溯。
- 失败可解释、不会无限重试，并能使用反向申请恢复。
- Emergency stop 已验证。

## G5：有限自动化

- Dry Run 周期和结果由项目负责人审核。
- 预算、账户和操作边界由确定性代码执行。
- `max_budget_change_pct`、`max_account_daily_spend`、`allowed_operations`
  和 `approval_ttl_minutes` 均已明确配置。
- Emergency stop、熔断和告警已测试。
- 任一策略缺失都会安全失败。

## Definition of Done

以下完成定义同样属于候选方案，不能替代 `DG0` 形成的内部试点完成定义。

### Read-only MVP

- G0、G1、G2、G3 完成。
- Codex 能稳定分析已授权账户。
- Web 能完成首期素材、广告草稿、只读数据和测试流程。
- 数据可追溯到口径和同步批次。
- 同步不依赖 Codex 在线。
- 不存在 production Meta 写工具。
- 租户和关键安全测试通过。

### Approval-required MVP

- G3、G4 完成。
- 网页审批不可绕过。
- 写操作可预览、可审计、幂等、可失效。
- Emergency stop 有效。
- production 写能力经过独立授权。

### Bounded autonomy

- G5 完成。
- Dry Run 经项目负责人审阅。
- 预算和账户边界由确定性代码执行。
- 自动操作具有停止条件、告警和审计。

## 证据格式

每条 Gate 证据必须记录：

```yaml
evidence_id: E-NNN
gate: G0
requirements: []
tasks: []
commit: git-sha
environment: local | staging | production
date: YYYY-MM-DD
owner: role-or-user
method: command-or-reviewed-procedure
expected: statement
actual: statement
result: PASS | FAIL | PARTIAL
limitations: []
artifact_refs: []
```

不得在证据中保存 Token、Authorization Header、客户数据或未脱敏生产响应。
Product Discovery 用户证据使用独立的 `EVD-*` 契约，见
[证据登记](../discovery/evidence-log.md)，不得用 Gate 执行证据替代用户研究。
