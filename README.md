# Facebook Ads Codex

面向 Meta/Facebook 广告全流程运营平台的产品发现与后续实现项目。

> 项目负责人已确认业务产品主体是完整 Web 运营平台，前期 AI 助手使用独立 Codex
> 会话、上下文、信息文档和 Skills。正确产品形态的本地交互原型和 Codex 场景包已
> 完成并由负责人默认验收；`DG0` 为 `PASS`，Phase 0 已进入文档确认。Cloudflare、
> MCP 和运行时架构仍为候选方案。
>
> 当前阶段和授权以[项目状态与授权](docs/project/status-and-authorizations.md)为准。

## 当前目标

本轮已经完成内部试点产品定义，当前目标是完成 Phase 0 业务与权限事实确认：

- `DG0` 已通过，`DQ-08` 已关闭，产品定义状态为 `ACCEPTED`。
- `BQ-01`–`BQ-12` 已全部回答；账户实际数据量、上下文和 Cloudflare 事实仍待单独授权
  后验证。
- 已按 `MVP` 能力复核需求：42 项中 32 项 `ACCEPTED`、10 项 `DRAFT`；ADR-001、
  ADR-002、ADR-004、ADR-006 已接受，ADR-003、ADR-005 继续等待技术事实和替代方案。
- G0 当前为 `PARTIAL`。负责人已允许 Phase 1 离线脚手架，但 G0 通过前不进入正式
  Phase 1，不访问真实 Meta/Cloudflare，也不开发可连接真实数据的业务运行时。
- 固定虚构数据的离线只读汇总、周期对比诊断、本地 Web 接入、账户列表选择、三层广告
  对象导航、对象级周期分析和直接子对象拆解切片已获准；它们不代表真实账户或真实
  对象分析可用，也不构成正式 Phase 1、Phase 2 或 Phase 3。对象日趋势切片也只允许
  对固定 fixture 一次展示一项指标，不解释趋势。直接子对象日趋势进一步逐日验证四项
  可加指标与父对象一致，但不对任何子对象排名或选择赢家。离线数据质量报告进一步
  要求账户与全部对象的粒度、覆盖、上下文、层级和逐日汇总全量通过，但不评价广告表现。
  本地 Web 现在还把该通过结果作为指标分析 preflight；超出账户、日期、对象或快照边界
  的分析保持锁定或被拒绝。当前可信 comparison 还可派生为确定性只读 JSON，由负责人
  手动带入 Codex；对象和直接子对象趋势现也可派生 schema v2 输入，完整日值与逐日
  对账不构成趋势解释。Web 不保存、上传或解释这些输入；显式调用项目级
  `facebook-ads-analysis` 后可生成分层只读草稿，但仍不排名、不生成优化动作或外部写入。
  五种固定黄金场景现可对该草稿做确定性 8/8 契约评分；此过程不调用模型或外部工具。
  五个无黄金答案的独立会话测试包及结果评分器也已准备；真实全新会话尚未执行，因此
  前向评测状态仍为 `NOT_RUN`，不能据此宣称模型质量已经验证。fixture-only
  `facebook-ads-creative`、Campaign Builder、Daily Brief、Optimization 和 Change
  Management 已完成显式指令、schema v1、确定性 preflight 和不可执行草稿契约，并已
  通过固定输入、CLI 安全失败与十一组黄金草稿评分，状态为
  `LOCAL_FIXTURE_VALIDATED`。五个独立全新 Codex 会话仍为 `NOT_RUN`，因此这不构成模型、
  真实账户、Meta 政策、审批或执行能力验证。

固定范围和治理边界见[项目章程](docs/project/charter.md)，研究流程见
[产品发现入口](docs/discovery/README.md)。

## 已确认产品形态

| 层 | 职责 |
| --- | --- |
| Web 运营平台 | 业务对象、状态、素材、广告创建与管理、图表、操作和审计 |
| Codex 会话 | 前期 AI 生成、解释、诊断和建议，使用上下文、信息文档和 Skills |
| 后续受控工具 | 经独立评审后提供实时数据、保存对象和受控 Meta 操作 |

既有[技术文档](docs/technical/README.md)只保存候选方案，不能作为实施依据。
候选状态只在[候选解决方案登记](docs/discovery/solution-hypotheses.md)中维护。

## 文档导航

| 入口 | 用途 |
| --- | --- |
| [项目文档](docs/README.md) | 权威矩阵、任务阅读路径和完整导航 |
| [项目状态与授权](docs/project/status-and-authorizations.md) | 当前阶段和授权事实源 |
| [产品发现](docs/discovery/README.md) | 发现问题、研究、证据、形态验证和 DG0 |
| [产品设计](docs/superpowers/specs/2026-07-30-meta-ads-operations-platform-design.md) | 全流程 Web 平台与 Codex 辅助形态设计 |
| [原型计划](docs/superpowers/plans/2026-07-30-full-web-platform-prototype.md) | 正确产品形态的完整原型实施与验收 |
| [本地交互原型](prototype/README.md) | 启动方式、页面范围、流程和验收证据 |
| [Codex 场景包](docs/discovery/codex-prototype/README.md) | 三个场景的上下文、Skill 契约和 Web 交接 |
| [需求文档](docs/requirements/README.md) | 产品、功能、质量、角色、指标和追踪 |
| [技术文档](docs/technical/README.md) | 仅供比较的候选架构和实现方案 |
| [工程规范](docs/standards/README.md) | 代码、接口、数据、安全、测试和发布规则 |
| [ADR](docs/decisions/README.md) | 已接受与候选长期架构决策 |
| [路线图](docs/planning/roadmap.md) | Product Discovery、Phase 0–5 和 Gate |
| [Meta 只读验证](docs/runbooks/meta-read-connection.md) | 后续本地填入凭据、授权、验证和撤销流程 |
| [离线控制平面脚手架](docs/technical/offline-phase-1-scaffold.md) | 当前获准的 Worker、D1、fixture 与测试边界 |
| [离线只读分析](docs/technical/offline-read-only-analysis.md) | 本机 fixture 账户与指标汇总切片 |
| [离线周期诊断](docs/technical/offline-period-comparison-and-diagnostics.md) | 等长周期变化与非因果诊断模式 |
| [离线 Web 分析接入](docs/technical/offline-web-analysis-integration.md) | 本地原型读取 fixture 结果的边界与验证 |
| [离线 Web 账户上下文](docs/technical/offline-web-account-context.md) | 从本地列表选择 fixture 账户并绑定周期结果 |
| [离线广告对象层级](docs/technical/offline-ad-object-hierarchy.md) | Campaign、Ad Set、Ad 的 fixture 父级约束与本地导航 |
| [离线对象级分析](docs/technical/offline-object-level-analysis.md) | 已验证 fixture 对象的指标、周期对比与 Web 范围绑定 |
| [离线直接子对象拆解](docs/technical/offline-direct-child-breakdown.md) | Campaign/Ad Set 直接子对象变化与父子汇总对账 |
| [离线对象日趋势](docs/technical/offline-object-daily-trend.md) | Campaign、Ad Set、Ad 的固定日值与单指标本地趋势 |
| [离线直接子对象日趋势](docs/technical/offline-direct-child-daily-trend.md) | Campaign/Ad Set 的直接子级多序列日值与逐日父子对账 |
| [离线数据质量报告](docs/technical/offline-data-quality-report.md) | fixture 全账户主体日数据的完整性、一致性与层级汇总核验 |
| [离线分析质量 Preflight](docs/technical/offline-analysis-quality-preflight.md) | 用内存质量凭证锁定本地指标分析范围和响应快照 |
| [离线 Codex 分析证据包](docs/technical/offline-codex-evidence-bundle.md) | 把当前可信 fixture 结果整理为 Codex 手动分析输入 |
| [离线 Codex 趋势证据包](docs/technical/offline-codex-trend-evidence.md) | 把当前可信对象与直接子对象日趋势整理为 schema v2 手动输入 |
| [离线 Codex 分析 Skill](docs/technical/offline-codex-analysis-skill.md) | 显式校验 schema v2 fixture 并生成 FACT/INFERENCE/UNKNOWN 草稿 |
| [离线 Codex 分析草稿评测](docs/technical/offline-codex-analysis-evals.md) | 用五类黄金场景检查草稿证据绑定和安全边界 |
| [离线 Codex 独立会话前向评测](docs/technical/offline-codex-session-forward-test.md) | 准备五类无答案会话包并评分手动返回草稿 |
| [离线 Codex 素材 Skill](docs/technical/offline-codex-creative-skill.md) | 校验 fixture 素材上下文并形成待人工评审的文案与视觉方向草稿 |
| [离线 Codex 工作流 Skills](docs/technical/offline-codex-workflow-skills.md) | Campaign 草稿、事实日报、证据化优化和不可执行变更草稿 |
| [安全策略](SECURITY.md) | 安全政策、威胁和报告范围 |
| [贡献指南](CONTRIBUTING.md) | 变更和评审流程 |

## 本地原型

原型只使用固定虚构数据，不包含真实登录、Meta 连接或外部写入；数据分析页可选连接
本机 fixture Worker：

```bash
npm install
npm run prototype:dev
```

打开命令输出的本地地址。运行完整检查：

```bash
npm run check
```

开始任何工作前：

1. 阅读[项目文档入口](docs/README.md)中的通用阅读清单。
2. 确认[项目状态与授权](docs/project/status-and-authorizations.md)允许目标动作。
3. 检查并保留工作区已有变更。
4. 只实施当前明确授权的阶段。

当前 Phase 0 只开展文档事实确认；唯一例外是已批准的固定虚构数据离线脚手架、只读
分析、本地 Web 账户上下文、对象层级导航、对象级分析和直接子对象拆解切片。真实
对象日趋势、直接子对象逐日对账和全层级数据质量报告也属于同一固定 fixture 例外。
本地分析质量 preflight 只在该例外内约束指标入口和响应，不代表认证或真实授权。
离线 Codex 证据包及趋势扩展只整理当前 fixture 输入，不代表趋势解释、分析结论、建议
或任何外部授权。
项目级分析 Skill 只处理手动 schema v2 fixture，输出仍是候选只读草稿，不代表真实
数据、通用分析有效性、优化授权或 Gate 通过。
确定性草稿评测只证明固定黄金案例满足已提交契约，不代表真实模型、真实账户或用户价值
已经验证。
独立会话前向评测当前只完成材料与评分器自测；五个全新会话均未执行，状态为 `NOT_RUN`。
素材 Skill 当前只完成开发产物，未运行配置、测试或会话验证；它不搜索、生成或上传
实际素材，也不代表 Meta 审核、版权或广告效果结论。
Campaign Builder、Daily Brief、Optimization 和 Change Management 同样只完成
fixture-only 开发产物；它们不代表对象已创建、数据已刷新、建议已批准或变更可执行。
Meta/Cloudflare 访问、资源创建、部署和广告写操作仍须另行明确授权。

## Phase 0 本地准备

仓库已提供不含真实值的配置模板和离线校验工具。以后需要验证 G0 时，在本地复制模板、
设置 `600` 权限并直接用编辑器填值：

```bash
cp config/p0-readiness.example.env config/p0-readiness.local.env
chmod 600 config/p0-readiness.local.env
npm run p0:config:check
```

本地配置已被 Git 忽略。Token、App ID、广告账户 ID、Cloudflare 标识和域名不得发送到
聊天或提交到仓库。`npm run p0:meta:verify` 只有在项目负责人另行明确授权、且授权事实源
已更新后才能执行；详细流程见 [Meta 只读验证](docs/runbooks/meta-read-connection.md)。

## 文档校验

安装开发依赖后运行：

```bash
npm run docs:check
```

该命令检查 Markdown、内部链接、元数据、稳定 ID、发现状态、需求追踪和常见敏感信息。

## 核心安全边界

- Token、Authorization Header、密钥、个人信息和客户数据不得进入仓库或研究证据。
- 未经明确授权，不得访问 Meta/Cloudflare 资源或创建、修改广告对象。
- 任何候选方案都不得把客户端或模型输入当作授权证据。
- 后续外部写能力必须先形成已接受的产品、安全和审批设计。

完整政策见 [SECURITY.md](SECURITY.md)。
