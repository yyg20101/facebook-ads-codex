---
doc_id: TECH-INDEX
type: index
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-09
---

# 技术文档

本目录保存候选技术方案。`DG0` 已通过，产品方向已选择 Web 运营平台与前期 Codex
助手；但需求映射、Phase 0 事实和 ADR 尚未完成评审，因此技术内容只供后续比较，不得
作为实现依据，也不得表述为已选型、部署或验证。

| 文档 | 设计范围 |
| --- | --- |
| [系统架构](architecture.md) | 组件、责任、边界、拓扑和技术基线 |
| [领域与数据模型](domain-and-data.md) | 实体、D1、R2、指标粒度和幂等 |
| [Meta 接入与同步](meta-integration-and-sync.md) | 权限、Token、API、同步和回补 |
| [Codex Skills](codex-skills.md) | 前期上下文工作方式、六个候选聚焦 Skill 和输出 |
| [API 与 MCP 契约](api-and-mcp-contracts.md) | 认证、响应、工具和副作用边界 |
| [认证、审批与审计](auth-approval-and-audit.md) | RBAC、状态机、策略和审计 |
| [部署与运维](deployment-and-operations.md) | 环境、调度、可观测性和恢复 |
| [安全架构](security-architecture.md) | 资产、信任边界、威胁和控制 |
| [离线控制平面脚手架](offline-phase-1-scaffold.md) | 当前获准的本地 Worker、D1、fixture 和测试边界 |
| [离线只读分析](offline-read-only-analysis.md) | fixture 账户列表、指标汇总、口径和安全失败边界 |
| [离线周期对比与诊断](offline-period-comparison-and-diagnostics.md) | 等长周期变化、覆盖校验和非因果诊断模式 |
| [离线 Web 分析接入](offline-web-analysis-integration.md) | 固定 Vite 代理、类型安全客户端和本地页面状态 |
| [离线 Web 账户上下文](offline-web-account-context.md) | fixture 账户发现、列表选择和 comparison 上下文绑定 |
| [离线广告对象层级](offline-ad-object-hierarchy.md) | fixture Campaign、Ad Set、Ad 父级约束和本地导航 |
| [离线对象级分析](offline-object-level-analysis.md) | 已验证 fixture 对象的指标、周期对比和范围绑定 |
| [离线直接子对象拆解](offline-direct-child-breakdown.md) | Campaign/Ad Set 直接子对象周期变化与父子对账 |
| [离线对象日趋势](offline-object-daily-trend.md) | 已验证 fixture 对象的连续日值、固定单指标切换和完整性边界 |
| [离线直接子对象日趋势](offline-direct-child-daily-trend.md) | Campaign/Ad Set 直接子级的多序列日值与逐日父子对账 |
| [离线数据质量报告](offline-data-quality-report.md) | fixture 主体日粒度、覆盖、上下文、层级和三层逐日汇总核验 |
| [离线分析质量 Preflight](offline-analysis-quality-preflight.md) | 用内存凭证把通过的质量快照绑定到本地指标分析入口与响应 |
| [离线 Codex 分析证据包](offline-codex-evidence-bundle.md) | 从当前可信 comparison 派生确定性手动分析输入 JSON |
| [离线 Codex 趋势证据包](offline-codex-trend-evidence.md) | 从当前可信对象与直接子对象趋势派生 schema v2 手动输入 |
| [离线 Codex 分析 Skill](offline-codex-analysis-skill.md) | 校验 schema v2 fixture 并生成分层只读分析草稿 |
| [离线 Codex 分析草稿评测](offline-codex-analysis-evals.md) | 五类 fixture 黄金场景、精确草稿契约和确定性安全评分 |
| [离线 Codex 独立会话前向评测](offline-codex-session-forward-test.md) | 无黄金答案会话包、手动协议和结果评分链路 |
| [离线 Codex 素材 Skill](offline-codex-creative-skill.md) | fixture-only 素材上下文、权利 preflight 和人工评审草稿契约 |
| [离线 Codex 工作流 Skills](offline-codex-workflow-skills.md) | Campaign 草稿、事实日报、证据化优化和不可执行变更草稿契约 |

## 设计规则

- `DG0` 前只能维护候选方案，不能用技术可行性替代用户和问题证据。
- `DG0` 通过不自动接受技术方案；当前仍须完成需求、替代方案、安全和 ADR 评审。
- 技术设计必须引用需求 ID 和产品证据，不能自行改变需求。
- 长期或难以逆转的决策必须使用 ADR。
- 产品未知事实引用 `DQ-*`，后续业务值引用 `BQ-*`。
- 接口示例不得包含真实 Token、客户数据或账户标识。
- 实施后必须用测试和运行证据将对应设计状态从草案推进。

当前仓库包含离线控制平面脚手架、只读分析切片、本地 Web 接入和 fixture 账户上下文
选择，以及 fixture 广告对象层级导航，只证明候选技术可以在本地使用虚构数据运行；
当前对象级对比和直接子对象拆解也只验证同一 fixture 链路。它们不接受 Cloudflare
架构、不满足 G0/G1/G2/G3，也不构成外部访问或部署授权。
对象日趋势同样只验证 3–31 日输入、固定 9 项指标和本地呈现，不构成趋势解释或真实
数据有效性证据。
直接子对象日趋势只把上述日值与既有父子对账组合为原子 fixture 契约；稳定 ID 顺序和
颜色不代表排名、效果判断或优化建议。
离线数据质量报告进一步把稳定结构规则组合为全量通过才返回的候选契约；它不评价广告
效果、不使用业务阈值，也不构成真实数据质量或 Gate 证据。
离线分析质量 preflight 只在本地 Web 中把上述通过结果绑定到账户、日期、对象、口径与
响应快照；它不增加 Worker API，也不构成认证、真实授权、分析准确性或 Gate 证据。
离线 Codex 分析证据包只把当前受凭证覆盖的 comparison 或直接子对象拆解整理为手动
输入；它不持久化或自动上传，也不生成 Codex 结论、建议或任何外部副作用。
趋势扩展只增加完整固定 9 项日值和直接子对象逐日对账；它不解释曲线、选择主 KPI、
排名对象或改变任何外部权限。
离线 Codex 分析 Skill 只在显式调用和 schema v2 校验通过后形成带证据路径的候选草稿；
它不连接真实数据、不生成优化动作，也不构成 G2/G3 或通用分析有效性证据。
离线草稿评测只用固定黄金输入检查最终 JSON 的结构、证据绑定、未知项和安全不变量；
它不调用模型，不能证明模型回答质量、真实账户结论、用户价值或任何 Gate 已满足。
离线独立会话前向评测目前只准备五类无答案测试包和结果接收链路；在真实全新会话执行
前保持 `NOT_RUN`，不能把评分器自测或黄金草稿管道测试称为模型结果。
离线 Codex 素材 Skill 与四个工作流 Skill 已完成显式调用指令、fixture-only schema、
确定性 preflight 和不可执行草稿契约，并通过固定正反输入、CLI 安全失败和黄金草稿
输出评分，统一为 `LOCAL_FIXTURE_VALIDATED`。独立 Codex 会话仍为 `NOT_RUN`。它们不
搜索或生成实际素材，不连接 Web/Meta/MCP，不读取真实数据，不持久化、提交审批或执行
变更，也不构成版权、Meta 审核、模型质量、产品能力或 G2/G3/G4 证据。
