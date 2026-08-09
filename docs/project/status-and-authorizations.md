---
doc_id: GOV-STATUS
type: governance
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-09
---

# 项目状态与授权

本文是当前阶段、运行模式和授权布尔值的唯一事实源。其他文档只能链接本文，
不得复制这些值并形成第二份状态。

## 当前状态

```yaml
project_version: 1.0.0
delivery_state: READY_FOR_PHASE_0
current_phase: PRODUCT_DISCOVERY_COMPLETE
operation_mode: READ_ONLY
runtime_implementation_available: false
meta_read_validation_authorized: false
offline_phase_1_scaffold_authorized: true
offline_read_only_analysis_authorized: true
offline_period_diagnostics_authorized: true
offline_web_analysis_integration_authorized: true
offline_web_account_context_authorized: true
offline_ad_object_hierarchy_authorized: true
offline_object_level_analysis_authorized: true
offline_direct_child_breakdown_authorized: true
offline_object_daily_trend_authorized: true
offline_direct_child_daily_trend_authorized: true
offline_data_quality_report_authorized: true
offline_analysis_quality_preflight_authorized: true
offline_codex_evidence_bundle_authorized: true
offline_codex_trend_evidence_authorized: true
offline_codex_analysis_skill_authorized: true
offline_codex_analysis_evals_authorized: true
offline_codex_session_forward_test_kit_authorized: true
offline_codex_creative_skill_development_authorized: true
offline_codex_remaining_skills_development_authorized: true
offline_codex_skill_development_queue_complete: true
offline_codex_skill_validation_authorized: true
offline_codex_skill_local_validation_complete: true
production_deployment_authorized: false
meta_write_operations_authorized: false
```

`READY_FOR_PHASE_0` 表示项目负责人已接受完整 Web 运营平台与独立 Codex 前期助手的
内部试点产品定义，`DG0` 已通过。负责人随后明确要求继续下一步，因此 Phase 0 的文档
确认已在[问卷](../planning/phase-0-questionnaire.md)中启动。该状态不代表 G0 已通过，
也不授权真实 Meta/Cloudflare 访问、业务运行时、部署或广告写操作。

`BQ-01`–`BQ-12` 已全部回答。Phase 0 仍为进行中，因为账户实际数据量、广告上下文、
Cloudflare 事实和 Meta 只读路径尚未在获得单独授权后验证。

项目负责人于 2026-08-09 指示按推荐继续，完成已确认 MVP 到需求和 ADR 的逐项复核。
当前 42 项需求中 32 项为 `ACCEPTED`、10 项保持 `DRAFT`；ADR-001、ADR-002、
ADR-004、ADR-006 为 `ACCEPTED`，ADR-003、ADR-005 保持 `DRAFT`。这些状态只确认需求
语义和有限决策范围，依据是既有产品证据与 Phase 0 决定，不来自 fixture 实现；它们不
改变 G0 `PARTIAL`、`runtime_implementation_available: false` 或任何外部授权布尔值。

下文按时间保存的离线授权记录中，“不接受某需求或 ADR”表示对应 fixture 切片本身不
构成产品证据、接受依据或 Gate 证据；它不覆盖本次基于既有产品证据完成的当前状态。
需求和 ADR 的实时状态分别以[需求追踪矩阵](../requirements/traceability.md)和
[ADR 索引](../decisions/README.md)为准。

`meta_read_validation_authorized: false` 表示仓库可以维护本地校验工具和不可用占位配置，
但当前不得执行真实 Meta 请求。项目负责人未来必须在本地填入配置并明确授权一次只读
验证，本文同步改为 `true` 后，验证命令才允许访问 Meta；验证结束后必须恢复为 `false`。

项目负责人于 2026-08-05 决定暂时跳过真实配置，并明确批准继续离线脚手架工作。
`offline_phase_1_scaffold_authorized: true` 仅允许使用虚构 fixture 的本地 Worker、D1
migration、类型、测试和文档；G0 因缺少真实只读证据保持 `PARTIAL`，项目没有进入正式
Phase 1。该授权不允许替换任何真实 ID、连接外部系统、创建云资源或部署。

项目负责人随后指示“继续下一步，跳过配置”。
`offline_read_only_analysis_authorized: true` 将该指令限定为第二个可逆离线切片：允许在
前述脚手架中使用固定虚构数据实现账户列表、日期范围校验、指标汇总和口径上下文读取。
这些 `/offline/` 接口不构成公开 API、认证实现、正式 Phase 1 或 G1 证据。

项目负责人于 2026-08-06 指示“继续下一阶段”。
`offline_period_diagnostics_authorized: true` 将该指令限定为第三个可逆离线切片：允许对
两个等长、不重叠且完整覆盖的 fixture 周期计算指标变化，并输出不含因果断言的确定性
诊断模式。该授权不允许猜测业务阈值、生成可执行优化动作或扩大任何外部权限。

项目负责人随后再次指示“继续下一阶段”。
`offline_web_analysis_integration_authorized: true` 将该指令限定为第四个可逆离线切片：
允许本地 Vite 原型通过固定开发代理读取前述 fixture comparison 接口，并展示加载、
错误、口径、变化和非因果诊断状态。该授权不允许增加远程 API 基址、CORS 开放面、
真实数据、认证替代、部署或写操作，也不启动正式 Phase 3。

项目负责人随后又指示“继续下一阶段”。
`offline_web_account_context_authorized: true` 将该指令限定为第五个可逆离线切片：允许
Web 从固定 Workspace 的本机 Worker 读取最多 10 个 fixture 账户，只从已验证列表选择
账户，再加载其周期对比。该授权不允许手工账户 ID、远程基址、真实账户、认证替代、
部署或写操作，也不接受 `FR-001`、`FR-005`、`FR-011`。

项目负责人随后再次指示“继续下一阶段”。
`offline_ad_object_hierarchy_authorized: true` 将该指令限定为第六个可逆离线切片：允许为
已验证 fixture 账户保存并读取最多 50 个 Campaign、Ad Set 和 Ad，验证父级关系，并在
本地 Web 中导航对象。对象选择不改变既有账户级 comparison，也不允许对象级指标、手工
对象 ID、真实同步、外部访问、部署或写操作；该切片不接受 `FR-002`、`FR-005`、
`FR-011`。

项目负责人于 2026-08-07 再次指示“继续”。
`offline_object_level_analysis_authorized: true` 将该指令限定为第七个可逆离线切片：
允许为已验证 fixture Campaign、Ad Set 和 Ad 增加三日固定指标、层级汇总一致性检查、
对象级等长周期对比与 Web 显式加载。账户级分析继续保留；该授权不允许任意指标、业务
阈值、因果结论、自动建议执行、真实同步、外部访问、部署或写操作，也不接受
`FR-002`、`FR-005`、`FR-011`。

项目负责人随后再次指示“继续”。
`offline_direct_child_breakdown_authorized: true` 将该指令限定为第八个可逆离线切片：
允许在已验证 fixture Campaign 或 Ad Set 下，对直接子对象执行同周期变化拆解，并验证
花费、展示、点击和转化在基线及当前周期都与父对象完全对账。结果只按稳定对象 ID 展示，
不选择赢家、不应用业务阈值、不生成因果结论或执行建议；该授权仍不接受候选需求、真实
同步、外部访问、部署或写操作。

项目负责人随后确认趋势设计并指示“继续”。
`offline_object_daily_trend_authorized: true` 将该指令限定为第九个可逆离线切片：允许为
已验证 fixture Campaign、Ad Set 和 Ad 读取连续 3–31 日数据，并在本地 Web 中从固定
9 项指标一次选择一项展示。请求必须完整覆盖且口径一致；结果只陈述数值和上下文，不
应用阈值、排名、趋势解释、因果结论或执行建议。该授权仍不接受候选需求或 ADR，不
允许真实同步、外部访问、部署或写操作。

项目负责人随后再次指示“继续下一阶段”。
`offline_direct_child_daily_trend_authorized: true` 将该指令限定为第十个可逆离线切片：
允许为已验证 fixture Campaign 或 Ad Set 读取全部直接子对象的连续 3–31 日日趋势，
并逐日验证花费、展示、点击和转化与父对象完全对账。结果只按稳定对象 ID 展示，不
排名、不选择赢家、不应用阈值、不解释趋势、不生成因果结论或执行建议；Ad 叶子不得
发起该读取。该授权仍不接受候选需求或 ADR，不允许真实同步、外部访问、部署或写操作。

项目负责人于 2026-08-07 再次指示“继续下一阶段”。
`offline_data_quality_report_authorized: true` 将该指令限定为第十一个可逆离线切片：允许
在一个已验证 fixture 账户下，对账户与全部 Campaign、Ad Set、Ad 的 3–31 日数据执行
主粒度唯一、逐日覆盖、统一报告上下文、对象层级和三层逐日可加指标汇总核验。任一检查
失败必须拒绝整份报告；通过结果只证明该 fixture 可用于后续本地分析，不评价广告表现、
不应用业务阈值、不声明因果，也不形成 Gate 证据。该授权不允许真实同步、外部访问、
部署或写操作。

项目负责人于 2026-08-08 再次指示“继续下一阶段”。
`offline_analysis_quality_preflight_authorized: true` 将该指令限定为第十二个可逆离线
切片：允许把同一 fixture 账户的全量通过质量报告转换为仅存于 Web 内存的分析
preflight 凭证。账户、日期、对象、指标口径、稳定状态、获取时间和同步批次必须与凭证
一致；未通过、超出覆盖范围或响应快照不一致时必须拒绝分析。该授权不增加 Worker
接口，不接受候选需求或 ADR，不允许真实数据、外部访问、部署或写操作，也不形成 Gate
证据。

项目负责人随后再次指示“继续下一阶段”。
`offline_codex_evidence_bundle_authorized: true` 将该指令限定为第十三个可逆离线切片：
允许把当前已通过 preflight 的账户、对象 comparison 或直接子对象拆解，在本地 Web
内派生为确定性、只读、脱敏的 JSON 输入上下文，供负责人手动带入 Codex
`facebook-ads-analysis` 会话。上下文不得包含随机请求 ID，不得持久化、自动上传、生成
分析结论或执行建议；本切片不增加 Worker 接口，不接受候选需求或 ADR，不允许真实
数据、外部访问、部署或写操作，也不形成 Gate 证据。

项目负责人随后再次指示“继续下一阶段”。
`offline_codex_trend_evidence_authorized: true` 将该指令限定为第十四个可逆离线切片：
允许把当前已通过 preflight 的对象日趋势或直接子对象日趋势，在本地 Web 内派生为
schema v2 的确定性只读 JSON，供负责人手动带入 `facebook-ads-analysis` 会话。产物
必须包含完整固定 9 项日值，直接子对象必须按稳定 ID 且逐日与父对象对账；不得解释
趋势、排名、持久化、自动上传、生成结论或执行建议。本切片不增加 Worker 接口，不
接受候选需求或 ADR，不允许真实数据、外部访问、部署或写操作，也不形成 Gate 证据。

项目负责人随后再次指示“继续下一阶段”。
`offline_codex_analysis_skill_authorized: true` 将该指令限定为第十五个可逆离线切片：
允许在仓库 `.agents/skills/` 中实现仅显式调用的 `facebook-ads-analysis`，读取负责人
手动提供且通过安全校验的 schema v2 fixture JSON，并输出区分 `FACT`、`INFERENCE`
和 `UNKNOWN` 的只读分析草稿。Skill 必须拒绝真实数据声明、未知 schema、敏感字段、
preflight 或对账失败，不得应用业务阈值、排名、因果解释、优化动作、持久化、自动
传输或外部写入。本切片不增加 Web、Worker、HTTP、MCP、Meta 或数据库接口，不接受
`FR-005`、`NFR-002`、任何 ADR 或候选架构，也不形成 G2/G3 证据。

项目负责人随后再次指示“继续下一阶段”。
`offline_codex_analysis_evals_authorized: true` 将该指令限定为第十六个可逆离线切片：
允许为五种 schema v2 `analysis_kind` 建立固定脱敏黄金场景、精确最终草稿契约和本地
确定性评分器，验证证据路径和值、未知项、直接子对象覆盖、非因果措辞与无外部副作用。
本切片不调用任何模型 API，不增加 Web、Worker、HTTP、MCP、Meta 或数据库接口，不
修改 production prompt 或模型设置，不接受 `FR-005`、`NFR-002`、任何 ADR 或候选
架构，也不形成通用分析质量、G2/G3 或外部授权证据。

项目负责人于 2026-08-09 再次指示“继续下一阶段”。
`offline_codex_session_forward_test_kit_authorized: true` 将该指令限定为第十七个可逆
离线切片：允许把五种固定 fixture 输入整理为不含黄金草稿的全新 Codex 会话测试包，
并提供只接收操作者草稿和协议声明的确定性评分器。本切片只准备评测材料和验证评分
链路；当前不启动另一个 Codex/模型会话，不调用模型 API，不把黄金草稿作为会话输出，
也不持久化运行输入或结果。它不增加 Web、Worker、HTTP、MCP、Meta 或数据库接口，
不接受 `FR-005`、`NFR-002`、任何 ADR 或候选架构，不形成模型质量、G2/G3 或外部
授权证据。

项目负责人随后要求“目前都只进行所有的开发任务，配置与测试均放在开发结束后”。
`offline_codex_creative_skill_development_authorized: true` 将当前指令限定为第十八个可逆
离线开发切片：允许创建仅显式调用的 `facebook-ads-creative`、fixture-only 输入
preflight、创意简报和受控文本/视觉方向草稿契约。该授权不允许执行 Skill、运行测试、
配置模型或外部环境、搜索或生成真实素材、读取真实商品/客户/账户数据、调用供应商、
连接 Web/Meta/MCP、持久化、部署或写操作。开发产物在后续配置与测试完成前必须保持
`IMPLEMENTED_UNVERIFIED`；完成后也只能按证据标记为 `LOCAL_FIXTURE_VALIDATED`，不得
据此接受 `FR-*`、`NFR-*`、ADR 或形成 G2/G3 证据。

项目负责人随后明确回复“批准”，确认此前列出的四个剩余 Skill 开发范围。
`offline_codex_remaining_skills_development_authorized: true` 仅允许开发显式调用、
fixture-only 的 `facebook-ads-campaign-builder`、`facebook-ads-daily-brief`、
`facebook-ads-optimization` 和 `facebook-ads-change-management`，以及各自确定性输入
preflight 和只读草稿契约。该授权不允许执行 Skill、运行测试或会话验证、配置模型或
外部环境、调用 Web/Meta/MCP、读取真实数据、持久化、提交审批、执行变更、部署或写入。
四个产物在后续配置与测试阶段前必须保持 `IMPLEMENTED_UNVERIFIED`；完成后也只能按
证据标记为 `LOCAL_FIXTURE_VALIDATED`，不能据此接受 `FR-*`、`NFR-*`、ADR，或形成
G2/G3/G4 证据。

截至 2026-08-09，四个目录均已形成显式调用说明、discovery 元数据、schema v1 输入
契约、稳定输出契约和确定性本地 preflight 代码。它们在开发队列完成时的 fixture
测试、结构校验、会话验证、全仓回归与 CI 调整均为 `NOT_RUN`；后续本地验证结果见下文，
该历史开发记录不扩大本节授权。

`offline_codex_skill_development_queue_complete: true` 只表示当前明确授权的 Creative 与
其余四个 Skill 开发切片均已形成开发产物。它不表示配置或测试已经开始，也不自动授权
运行 Skill、修改 CI、启动模型会话或访问外部系统；后续验证阶段须由负责人继续发起并
单独记录结果。

项目负责人此前要求在开发结束后统一进行配置与测试，本次持续目标继续要求完成并验证
全部开发任务。`offline_codex_skill_validation_authorized: true` 将后续阶段限定为仓库内
固定 fixture 的 validator 执行、Skill 结构快速校验、确定性正反测试、输出契约评分、
文档检查、构建、全仓回归和相同本地命令的 CI 配置。该授权不允许自动启动独立 Codex
或模型会话，不调用模型 API，不读取真实数据，不连接 Web/Meta/MCP，不部署、不持久化
运行输入或结果，也不提交、批准或执行变更。

`offline_codex_skill_local_validation_complete: true` 表示 2026-08-09 已完成以下仓库内
确定性证据：六个 Skill 目录通过官方结构快速校验；五个本轮 Skill 覆盖就绪、安全
非就绪和拒绝输入；CLI 覆盖敏感字段、未知字段、外部 guardrail、路径越界、符号链接、
过大输入和无效 JSON；十一组黄金草稿均获得 8/8；`npm run skill:check` 的 105 项测试、
文档检查、Phase 0 测试、Worker 类型与 67 项测试、Web 原型 81 项测试及 production
build 均通过。该值只允许状态写为 `LOCAL_FIXTURE_VALIDATED`。独立 Codex 会话仍为
`NOT_RUN`，不构成模型质量、真实数据、Meta/Cloudflare、产品需求、Gate、部署或写操作
验证。

`runtime_implementation_available: false` 指没有可连接真实业务数据或外部系统的业务
运行时。使用固定虚构数据的 Product Discovery 原型、离线 Worker、只读汇总、周期
诊断、广告对象层级、对象级分析和直接子对象拆解切片不构成业务运行时可用。
固定对象日趋势切片同样不构成业务运行时可用。
固定直接子对象日趋势与逐日父子对账同样不构成业务运行时可用。
固定 fixture 数据质量报告同样不构成业务运行时可用或真实数据正确性证据。
固定 fixture 分析质量 preflight 同样不构成认证、授权、业务运行时或 Gate 证据。
固定 fixture Codex 证据包同样只构成手动分析输入，不是分析输出、真实数据证明、
认证、授权、业务运行时或 Gate 证据。
固定 fixture Codex 趋势证据包同样只扩展手动输入范围，不是趋势解释、效果评价、
认证、授权、业务运行时或 Gate 证据。
固定 fixture Codex 分析 Skill 同样只生成离线分析草稿，不是通用分析有效性、真实
账户结论、优化价值、认证、授权、业务运行时或 Gate 证据。
固定 fixture Codex 草稿评测同样只验证已提交黄金场景和输出安全契约，不是模型质量、
真实账户结论、用户价值、认证、授权、业务运行时或 Gate 证据。
固定 fixture 独立会话前向评测包同样只证明材料隔离和评分链路可重复；在五个全新会话
真正执行前，其状态保持 `NOT_RUN`，不是模型、产品、认证、授权、业务运行时或 Gate
证据。
固定 fixture 素材 Skill 当前仅有未经执行的开发产物；它不是已生成素材、Meta 政策
审核、商业使用权结论、模型质量、产品能力、业务运行时或 Gate 证据。
其余四个固定 fixture Skill 已形成但仍只是未经执行的草稿开发产物；Campaign 草稿、
日报、优化候选和变更申请草稿都不是 Meta 对象、实时状态、已批准动作、已执行变更、
产品能力、业务运行时或 Gate 证据。

## 当前允许

以下条目记录累计授权上限。当前 Skill 开发队列已完成，后续本地确定性验证阶段现已
启动；模型会话和外部系统验证仍不在当前范围内。

- 阅读、审查和维护项目文档。
- 制定实施计划。
- 依据已接受的产品定义回答 `BQ-01`–`BQ-12`，维护 Phase 0 决策、需求映射和脱敏证据。
- 重新评审候选需求、ADR、技术文档和后续 Gate，但不得把评审等同于实施授权。
- 开发、启动和验证只使用固定虚构数据的本地 Product Discovery 前端原型，以及
  不连接外部系统的 Codex 上下文包和 Skill 契约。
- 在项目负责人另行明确范围后，准备不接触真实账户的本地验证材料。
- 维护不包含真实值的 Phase 0 配置模板、离线测试和安全失败的 Meta 只读验证工具。
- 开发和测试只使用固定虚构数据、无外部请求且默认不可部署的 Phase 1 离线脚手架。
- 在离线脚手架中实现仅限本机、只读、固定虚构数据的账户列表和指标汇总切片。
- 在前述离线读取边界内实现等长周期对比、完整覆盖检查、指标变化和非因果诊断模式。
- 在本地 Web 原型中通过固定 Vite 开发代理展示前述 fixture 周期结果和安全失败状态。
- 在同一本地 Web 原型中先读取并验证 fixture 账户列表，再从列表选择账户执行周期对比。
- 在已验证 fixture 账户下读取并导航 Campaign、Ad Set 和 Ad 父级关系；周期指标继续
  支持独立账户级分析。
- 对已验证 fixture 对象显式加载等长周期指标与非因果诊断，并验证 Campaign、Ad Set、
  Ad 的每日汇总与账户级 fixture 一致。
- 对已验证 fixture Campaign 或 Ad Set 显式加载直接子对象周期拆解，并验证两期四项
  可加指标都与父对象一致；不得据此选择赢家或生成执行动作。
- 对已验证 fixture Campaign、Ad Set 或 Ad 显式加载连续 3–31 日趋势，一次只展示固定
  9 项指标中的一项；不得解释趋势、设置业务阈值、排名或生成执行动作。
- 对已验证 fixture Campaign 或 Ad Set 显式加载全部直接子对象的连续 3–31 日日趋势，
  逐日验证四项可加指标与父对象一致；只按稳定 ID 展示，不排名或解释趋势。
- 对一个已验证 fixture 账户显式运行 3–31 日全层级数据质量报告；只有唯一粒度、完整
  覆盖、统一上下文、完整层级和三层逐日对账全部通过时才返回结果，不评价广告表现。
- 在同一本地 Web 页面中，只对被上述通过结果覆盖的账户、日期和对象开放指标分析；
  分析响应的口径与快照必须再次匹配，凭证只能保存在页面内存中。
- 在同一本地 Web 页面中，把当前通过 preflight 的 comparison 或直接子对象拆解派生为
  确定性只读 JSON，明确分层 `FACT` 与 `UNKNOWN`，供负责人手动带入 Codex；不得保存、
  自动上传、生成结论或执行建议。
- 在相同边界内，把当前通过 preflight 的对象趋势或直接子对象趋势派生为 schema v2
  只读 JSON；必须包含完整固定 9 项日值，稳定保持子对象顺序并逐日对账，不得解释趋势
  或把当前图表指标当作主 KPI。
- 显式调用仓库级 `facebook-ads-analysis`，只读取手动提供且通过本地校验的 schema v2
  fixture JSON，输出带证据路径的事实、有限非因果推断和未知项；不生成优化动作。
- 使用五种固定 fixture 黄金场景对 `facebook-ads-analysis` 最终草稿执行本地确定性
  评测；只验证结构、证据绑定、未知项、直接子对象覆盖和安全边界，不调用模型。
- 准备五种不含期望答案的 `facebook-ads-analysis` 全新会话测试包，并对操作者手动返回
  的固定 fixture 草稿执行确定性评分；当前不得自动启动模型或把准备状态记为已执行。
- 开发显式调用的 `facebook-ads-creative`、fixture-only 输入 preflight 和人工评审草稿
  契约；本轮只允许写开发产物，不执行配置、测试、搜索、素材生成或外部交接。
- 在相同只开发边界内完成 `facebook-ads-campaign-builder`、
  `facebook-ads-daily-brief`、`facebook-ads-optimization` 和
  `facebook-ads-change-management` 的 fixture-only 指令、确定性 preflight 与只读草稿
  契约；不得提交、批准或执行任何变更。
- 对 Creative 与其余四个 Skill 运行仓库内 fixture 正反测试、结构校验、输出契约评分、
  文档检查、构建和全仓回归，并把同一本地命令接入 CI；不得启动模型或访问外部系统。

## 当前禁止

- 开发可连接真实数据、真实账户或云资源的 Phase 1 运行时代码；已明确授权的离线脚手架
  除外。
- 在没有单独授权时执行 `P0-08`、访问真实账户或验证真实 Meta 只读接入。
- 在没有单独授权和全新会话执行条件时，自动启动另一个 Codex/模型会话、调用模型 API
  或把本地黄金草稿记作独立会话结果。
- 部署 staging 或 production Cloudflare 资源。
- 创建 Meta App，或访问 Meta/Cloudflare 账户与真实业务数据。
- 创建、修改或删除 Meta 广告对象。
- 调整广告预算、状态、排期、受众、出价或创意。
- 创建、读取或轮换生产密钥。
- 邀请、删除或修改 Cloudflare/Meta 成员权限。

## 阶段转换记录

2026-07-30，项目负责人指示“先默认通过”，作为对当前内部试点产品定义、完整 Web
原型和 Codex 场景包的负责人验收，记录为 `DG0: PASS`。同一指令中的“继续下一步”
作为单独启动 Phase 0 文档确认的决定。证据见
[产品定义](../discovery/product-definition.md)和
[Phase 0 问卷](../planning/phase-0-questionnaire.md)。

本次转换后的项目状态为：

```yaml
delivery_state: READY_FOR_PHASE_0
current_phase: PRODUCT_DISCOVERY_COMPLETE
```

Phase 0 的 `BQ-01`–`BQ-12` 已完成负责人确认。`P0-02`、`P0-04`、`P0-07` 的外部
事实验证以及 `P0-08`、真实 Meta 只读验证和任何 Cloudflare 操作仍须项目负责人另行
明确授权；`DG0`、问卷完成或文档合并均不会扩大外部权限。

2026-08-05，项目负责人指示“先跳过配置，继续下一阶段”，并确认按推荐范围执行。
该决定登记为对 Phase 1 离线脚手架的有限授权，不豁免 G0、不改变当前阶段，也不授权
Meta/Cloudflare 访问、真实凭据、部署或任何写操作。

同日，项目负责人再次指示“继续下一步，跳过配置”。该决定登记为对离线只读分析
切片的有限授权：允许 fixture 账户列表、日期验证、上下文兼容检查和指标汇总；仍不
允许认证替代、真实同步、外部读取、远程资源、部署或写操作。

2026-08-06，项目负责人指示“继续下一阶段”。该决定登记为对离线周期对比与诊断
切片的有限授权：允许在完整、等长、上下文兼容的 fixture 周期之间计算变化并匹配
确定性模式；仍不接受候选需求或架构，也不授权真实数据、阈值猜测、因果结论、自动
优化、外部访问、部署或写操作。

同日，项目负责人再次指示“继续下一阶段”。该决定登记为对离线 Web 分析接入的有限
授权：允许本地 Vite 原型通过固定代理请求 fixture comparison 并展示可信边界；仍不
接受 `FR-005`、`FR-011` 或候选架构，不形成 G1/G2/G3 证据，也不授权真实接口、认证、
外部访问、部署或写操作。

同日，项目负责人又指示“继续下一阶段”。该决定登记为对离线 Web 账户上下文选择的
有限授权：允许固定 Workspace 账户列表、已验证列表选择和所选账户 comparison 绑定；
仍不接受 `FR-001`、`FR-005`、`FR-011`，不形成 Gate 证据，也不授权手工 ID、真实账户、
外部访问、部署或写操作。

同日，项目负责人再次指示“继续下一阶段”。该决定登记为对离线广告对象层级切片的
有限授权：允许顺序 D1 migration、固定 fixture 层级、只读 `/objects` 路由和本地 Web
导航；仍不接受 `FR-002`、`FR-005`、`FR-011`，不形成 Gate 证据，也不授权对象级指标、
真实同步、外部访问、部署或写操作。

2026-08-07，项目负责人再次指示“继续”。该决定登记为对离线对象级分析切片的有限
授权：允许在已验证 fixture 层级内增加固定对象指标、汇总一致性检查、本机对象
comparison 和 Web 显式加载；仍不接受候选需求或架构，不形成 Gate 证据，也不授权
真实数据、阈值猜测、因果结论、自动优化、外部访问、部署或写操作。

同日，项目负责人随后再次指示“继续”。该决定登记为对离线直接子对象拆解切片的有限
授权：允许在 Campaign 和 Ad Set 下比较直接子对象并进行父子汇总对账；仍不接受候选
需求或架构，不形成 Gate 证据，也不授权对象排名、业务阈值、因果结论、执行建议、真实
数据、外部访问、部署或写操作。

同日，项目负责人确认对象日趋势设计并指示“继续”。该决定登记为对离线对象日趋势
切片的有限授权：允许在完整且口径一致的固定 fixture 数据上读取 3–31 个连续日点，并
在本地 Web 中切换固定单指标展示；仍不接受候选需求或架构，不形成 Gate 证据，也不
授权趋势解释、阈值、排名、因果结论、执行建议、真实数据、外部访问、部署或写操作。

同日，项目负责人再次指示“继续下一阶段”。该决定登记为对离线直接子对象日趋势的
有限授权：允许在完整且口径一致的固定 fixture Campaign 或 Ad Set 下读取全部直接
子对象连续日点，并逐日与父对象对账；仍不接受候选需求或架构，不形成 Gate 证据，也
不授权排名、赢家判断、趋势解释、阈值、因果结论、执行建议、真实数据、外部访问、
部署或写操作。

同日，项目负责人又指示“继续下一阶段”。该决定登记为对离线数据质量报告的有限授权：
允许在固定 fixture 的账户与全部对象日数据上执行稳定、可自动化的完整性、一致性和
层级汇总检查，并在本地 Web 显式展示通过证据；仍不接受候选需求或架构，不形成 Gate
证据，也不授权广告效果评分、业务阈值、因果结论、真实数据、外部访问、部署或写操作。

2026-08-08，项目负责人再次指示“继续下一阶段”。该决定登记为对离线分析质量
preflight 的有限授权：允许在本地 Web 中用通过的数据质量快照锁定账户、日期、对象和
分析响应上下文；仍不接受候选需求或架构，不形成 Gate 证据，也不授权真实数据、认证
替代、外部访问、部署或写操作。

同日，项目负责人随后再次指示“继续下一阶段”。该决定登记为对离线 Codex 证据包的
有限授权：允许从当前 preflight 支持的 comparison 或直接子对象拆解生成可重复的
手动输入 JSON；仍不接受 `FR-005` 或候选架构，不形成分析结论或 Gate 证据，也不授权
持久化、自动传输、真实数据、外部访问、部署或写操作。

同日，项目负责人再次指示“继续下一阶段”。该决定登记为对离线 Codex 趋势证据包的
有限授权：允许复用当前对象及直接子对象趋势成功响应，生成完整固定日值的手动输入
JSON；仍不接受 `FR-005`、`NFR-002` 或候选架构，不形成趋势解释、分析结论或 Gate
证据，也不授权持久化、自动传输、真实数据、外部访问、部署或写操作。

同日，项目负责人再次指示“继续下一阶段”。该决定登记为对离线 Codex 分析 Skill 的
有限授权：允许项目级 Skill 对 schema v2 fixture 手动输入执行确定性校验并生成分层
只读草稿；仍不接受 `FR-005`、`NFR-002` 或候选架构，不形成通用分析验证或 Gate
证据，也不授权隐式触发、真实数据、外部访问、自动交接、部署或写操作。

同日，项目负责人再次指示“继续下一阶段”。该决定登记为对离线 Codex 分析草稿评测
切片的有限授权：允许用五种固定 fixture 黄金场景和精确草稿契约执行本地确定性回归；
仍不接受 `FR-005`、`NFR-002` 或候选架构，不形成模型、真实账户或 Gate 证据，也不
授权模型 API、真实数据、外部访问、自动交接、部署或写操作。

2026-08-09，项目负责人再次指示“继续下一阶段”。该决定登记为对离线 Codex 独立
会话前向评测准备切片的有限授权：允许建立五个无期望答案测试包、手动执行协议和确定性
结果评分器；真实会话执行状态保持 `NOT_RUN`。该决定不授权自动启动模型、模型 API、
读取黄金答案、持久化运行结果、真实数据、外部访问、自动交接、部署或写操作。

同日，项目负责人再次指示继续下一阶段，并要求先完成全部开发任务，把配置与测试统一
放到开发结束后。该决定登记为离线 Codex 素材 Skill 的开发授权：允许写入 Skill 指令、
fixture-only schema、确定性 preflight 和只读草稿契约；所有执行、测试、会话验证、
运行环境配置和外部集成当时保持延期，产物当时状态为 `IMPLEMENTED_UNVERIFIED`。

项目负责人随后明确回复“批准”，确认在 fixture-only、显式调用、无外部访问或写入、
配置与测试延期的边界下开发其余四个聚焦 Skill。该决定只覆盖 Campaign/Ad Set/Ad
配置草稿、事实日报、证据化优化候选和不可执行变更申请草稿；不授权运行 Skill、模型、
Web/Meta/MCP 集成、真实数据、持久化、审批提交、执行、部署或正式阶段转换。

开发队列完成后，本次持续目标继续要求完成并验证所有开发任务。该决定登记为本地 Skill
验证阶段：允许固定 fixture validator、结构快速校验、确定性正反测试、输出契约评分、
文档/构建/全仓回归和 CI 配置；独立模型会话、模型 API、真实数据、外部连接、持久化、
部署和任何广告写操作继续禁止。

同日，本地验证阶段已按上述边界完成，五个本轮 Skill 状态更新为
`LOCAL_FIXTURE_VALIDATED`。该完成记录不改变独立会话 `NOT_RUN`、G0 `PARTIAL`、
`runtime_implementation_available: false`、production 部署禁止或 Meta 写操作禁止。

## 阶段启动检查

Codex 开始任何阶段前 MUST：

1. 阅读[项目章程](charter.md)、本文、[安全策略](../../SECURITY.md)及该阶段阅读清单。
2. 检查工作区，保留用户已有工作。
3. 核对阶段依赖、任务、Gate、`DQ-*`、`BQ-*` 和未决问题。
4. 给出本阶段计划及可验证完成条件。
5. 只实施当前已授权阶段。
6. 运行该阶段要求的测试和安全检查；若项目负责人明确延期，记录 `NOT_RUN`、原因和
   后续验证任务，不得声明通过。
7. 记录完成项、未完成项、验证证据和下一 Gate。

## 授权变化

Meta 只读验证、生产部署和 Meta 写操作是相互独立的授权，不得相互推导。任何授权扩大必须：

1. 获得项目负责人明确指令。
2. 更新本文中的对应值和日期。
3. 更新受影响的需求、ADR、Gate、风险和测试。
4. 在变更日志中说明影响。

文档变更、阶段完成、PR 合并或部署工具可用都不构成授权。
