---
doc_id: TECH-CODEX-SKILLS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# Codex Skills 设计

> 产品方向已确认前期 AI 助手使用 Codex 会话、上下文、信息文档和 Skills。本文中的
> 具体 Skill 划分、Remote MCP 和工具契约仍是候选设计；`DG0` 通过未接受这些技术
> 细节，也不构成实施授权。

## 前期工作方式

在没有 Remote MCP 或实时 API 的前期，Codex：

- 读取仓库中已确认的产品、指标、流程、安全和术语文档。
- 处理用户明确提供且允许使用的任务上下文和脱敏文件。
- 使用 Skills 约束流程、必要问题、输出结构和安全边界。
- 将结果输出为素材简报、广告配置、诊断报告、测试计划或变更建议。
- 在没有工具时明确说明无法获取实时数据、保存 Web 对象或执行 Meta 操作。

当前[离线 Codex 分析证据包](offline-codex-evidence-bundle.md)及其
[趋势扩展](offline-codex-trend-evidence.md)只为 `facebook-ads-analysis` 提供手动输入
上下文。它从当前 preflight 支持的 fixture comparison、拆解或趋势派生，不包含
`executive_answer`、置信度或建议；Codex 仍须按本页流程形成分析输出，并继续声明未
连接真实数据和 `external_write: false`。

第十五个可逆离线候选切片实现了仓库级
[`facebook-ads-analysis`](offline-codex-analysis-skill.md)。它位于
`.agents/skills/facebook-ads-analysis/`，只允许显式处理 schema v2 fixture 手动输入；
它的确定性测试与结构校验已经完成。
第十六个可逆离线候选切片进一步增加
[草稿确定性评测](offline-codex-analysis-evals.md)：五种固定黄金场景只检查最终 JSON 的
字段、证据和值、未知项、直接子对象覆盖和安全不变量，不调用模型或外部工具。
第十七个可逆离线候选切片再增加
[独立会话前向评测准备](offline-codex-session-forward-test.md)：五个测试包只包含任务与
fixture 上下文，期望草稿被隔离；当前只验证准备和评分链路，真实会话状态为 `NOT_RUN`。
第十八个可逆离线开发切片新增
[`facebook-ads-creative`](offline-codex-creative-skill.md)。它只接受 fixture-only 素材
上下文，先检查信息点、来源、权利和单变量约束，再形成待人工评审的文案与视觉方向；
本地固定 fixture 契约验证已通过，状态为 `LOCAL_FIXTURE_VALIDATED`，独立会话仍为
`NOT_RUN`。
第十九个可逆离线开发切片又补齐
[四个工作流 Skills](offline-codex-workflow-skills.md)：Campaign Builder、Daily Brief、
Optimization 和 Change Management 均只接受各自 schema v1 fixture 手动输入，先执行
确定性 preflight，再形成不可执行草稿。四项均已通过本地固定 fixture 契约验证，状态为
`LOCAL_FIXTURE_VALIDATED`，独立会话仍为 `NOT_RUN`。Remote MCP、真实数据分析、实际
素材生成、审批执行和 Meta 写入均未实现或授权。

## 候选 Skill 划分

前期使用聚焦 Skills，不创建单一巨型 Skill：

| Skill | 主要任务 | 当前离线开发状态 |
| --- | --- | --- |
| `facebook-ads-creative` | 素材简报、文案、图片方向、适配和测试变体 | `LOCAL_FIXTURE_VALIDATED` |
| `facebook-ads-campaign-builder` | Campaign、Ad Set、Ad 配置草案和发布前检查 | `LOCAL_FIXTURE_VALIDATED` |
| `facebook-ads-analysis` | 指标变化、对象下钻、异常与证据化诊断 | `VALIDATED`（仅固定 fixture 契约） |
| `facebook-ads-daily-brief` | 日报、待办、异常和审核失败摘要 | `LOCAL_FIXTURE_VALIDATED` |
| `facebook-ads-optimization` | 优化建议、素材测试和复查计划 | `LOCAL_FIXTURE_VALIDATED` |
| `facebook-ads-change-management` | 结构化变更建议、审批交接和状态解释 | `LOCAL_FIXTURE_VALIDATED` |

这些名称已经用于当前仓库离线开发产物，但仍不属于已接受的实时接口或长期运行架构。

## Skill 与工具边界

[ADR-003](../decisions/ADR-003-skills-and-mcp-boundary.md)保存以下候选边界：

- Skill 保存重复流程、指标定义、诊断顺序、输出格式和安全规则。
- 若后续引入 Remote MCP，由它提供实时数据、认证、授权和受控操作。
- Skill 不保存 Token、账户凭据或可绕过服务端授权的数据。

## 通用分析流程

### 1. 验证上下文

- 确认 Workspace、广告账户、日期和对比范围。
- 确认时区、币种、归因和主转化事件。
- 检查数据更新时间、同步错误和稳定状态。

### 2. 选择核心结果

根据投放目标和 Workspace 配置选择主 KPI。配置缺失时只提出最小必要问题。

### 3. 分解变化

```text
Outcome
  -> Spend / delivery
  -> Traffic cost: CPM
  -> Traffic response: CTR
  -> Click cost: CPC
  -> Conversion efficiency: CVR
  -> Conversion value / quality
```

### 4. 定位贡献

依次分析 Ad Account、Campaign、Ad Set 和 Ad；只有必要时才增加版位、地域、
设备或受众 breakdown。

### 5. 判断置信度

```text
CONFIRMED    数据直接支持
LIKELY       数据支持但存在其他解释
HYPOTHESIS   需要更多数据或实验
```

### 6. 输出建议

每项建议包含目标、事实、动作、影响方向、风险、反证条件、写操作需求和证据。
Codex MUST NOT 把相关性表述为因果关系。

## `facebook-ads-analysis`

触发：周期对比、指标变化原因、Campaign/Ad Set/Ad 诊断。

输出顺序：

```text
Scope and freshness
Executive answer
Evidence
Driver decomposition
Confidence
Recommended next checks
```

若输入来自 `facebook-ads-offline-analysis-context/v2`，Codex MUST 保留其中的 fixture、
范围、口径、快照和非因果边界，MUST NOT 把 `FACT` 输入直接改写为因果结论，也不得用
缺失的业务阈值补出赢家、预算动作或确定性建议。

趋势输入中的完整 9 项日值只表示固定 fixture 事实。Codex MUST NOT 因曲线方向、颜色、
序列顺序或 Web 当前展示指标推导排名、主 KPI、趋势原因或建议；直接子对象的逐日父子
对账只证明可加指标一致。

当前离线实现必须先运行确定性输入校验。最终草稿中的每条 `FACT` 必须引用 JSON path；
每个 path 必须携带与输入完全一致的原值。每条 `INFERENCE` 必须引用事实、标记
`LIKELY` 或 `HYPOTHESIS` 并给出替代解释；所有输入 `UNKNOWN` 必须按原顺序保留。
该实现不得输出 `recommended_actions`，不得隐式触发或连接 Web、Meta、MCP。完整候选
边界见[离线 Codex 分析 Skill](offline-codex-analysis-skill.md)，固定回归边界见
[离线 Codex 分析草稿评测](offline-codex-analysis-evals.md)，全新会话协议与真实执行状态见
[离线 Codex 独立会话前向评测](offline-codex-session-forward-test.md)。

## `facebook-ads-creative`

触发：寻找素材方向、编写文案、生成或修改素材说明、创建测试变体。

- 当前离线开发实现只接受 `facebook-ads-creative-context/v1` fixture JSON，且必须显式
  调用 `$facebook-ads-creative`。
- 先确定性校验商品批准信息点、目标、受众、版位、品牌限制、素材来源、商业使用权、
  AI 标记、固定项与唯一受控变量。
- 权利未确认、来源未知、固定项缺失或声明冲突时必须 `BLOCKED`，不得产生变体。
- 输出只包含可人工评审的创意简报、文案草稿和视觉方向，并标记来源路径、生成状态和
  风险；不执行网络搜索、图片/视频生成、上传或 Campaign 配置。
- 当前本地固定 fixture 契约验证已通过，独立会话仍为 `NOT_RUN`；完整边界见
  [离线 Codex 素材 Skill](offline-codex-creative-skill.md)。

## `facebook-ads-campaign-builder`

触发：创建 Campaign、Ad Set、Ad 草案或检查投放配置。

- 当前离线实现只接受 `facebook-ads-campaign-context/v1` fixture JSON，必须显式调用
  `$facebook-ads-campaign-builder`。
- 确定性校验目标、转化位置、优化/计费事件、预算、排期、受众、版位、素材、落地页、
  supported fields 和关闭的 guardrail。
- 关键枚举为 `UNRESOLVED`、素材来源/权利/审查或落地页审查不满足时必须 `BLOCKED`，
  不得猜测默认值。
- 只输出 Campaign、Ad Set、Ad 三层 `DRAFT` 和人工检查信息，不得声称已创建、发布或
  验证真实账户字段。
- 当前状态为 `LOCAL_FIXTURE_VALIDATED`，独立会话仍为 `NOT_RUN`；完整边界见
  [离线 Codex 工作流 Skills](offline-codex-workflow-skills.md)。

## `facebook-ads-daily-brief`

触发：日报、今日关注项、异常汇总。

- 当前离线实现只接受 `facebook-ads-daily-brief-context/v1` fixture JSON，必须显式调用
  `$facebook-ads-daily-brief`。
- 只报告输入中明确标记的 material events 和 open items；delivery/review 数字本身不能
  产生业务阈值、好坏或因果判断。
- 数据稳定且没有重要事项时明确说“无须处理”。
- 数据过期、失败或质量检查失败时进入 `DATA_ISSUE`，优先报告数据问题并禁止表现判断。
- 不创建定时任务、通知、优化建议或变更申请；当前状态为
  `LOCAL_FIXTURE_VALIDATED`，独立会话仍为 `NOT_RUN`。

## `facebook-ads-optimization`

触发：优化建议、预算/状态建议或测试计划。

- 当前离线实现只接受 `facebook-ads-optimization-context/v1` fixture JSON，必须显式调用
  `$facebook-ads-optimization`。
- 先校验 tracking、测试期间配置变化、allocation、sample 和 comparison window，再
  查看变体；任一不足时强制 `INCONCLUSIVE`。
- 每项建议必须逐项关联 fixture 证据；有效性不足时只能继续观察、收集数据、起草下一
  测试或请求人工评审，有效性完整时才可形成受限 `PROPOSE_*` 非执行候选。
- 所有建议固定为 `PENDING_CONFIRMATION`、`automatic_action: false`；不排名赢家、不
  猜测阈值、不声明未经支持的因果，也不执行预算或状态动作。
- 当前状态为 `LOCAL_FIXTURE_VALIDATED`，独立会话仍为 `NOT_RUN`；完整边界见
  [离线 Codex 工作流 Skills](offline-codex-workflow-skills.md)。

## `facebook-ads-change-management`

触发：把结构化优化动作整理成不可执行变更草稿，或解释政策和审批缺口。

- 当前离线实现只接受 `facebook-ads-change-context/v1` fixture JSON，必须显式调用
  `$facebook-ads-change-management`。
- 只接受来自 Optimization 的结构化 `PENDING_CONFIRMATION` 动作；自然语言确认不能
  直接成为写请求。
- 只形成带 fixture draft ref 的语义 `DRAFT`，不得把它声称为 `change_request_id`。
- 政策固定未评估、写入固定未授权、Web 审批固定未请求，execution 固定
  `NOT_AUTHORIZED`。
- 当前不提交、审批、查询或执行变更，不调用外部写工具；状态为
  `LOCAL_FIXTURE_VALIDATED`，独立会话仍为 `NOT_RUN`。未来即使引入工具确认，它也只能
  作为附加防线，不能替代
  网页业务审批和独立写授权。

## 定时报告

未来经独立评审后，Codex Scheduled Tasks MAY 生成日报、周报、异常摘要和审批提醒，
但 MUST NOT 成为唯一同步或生产执行机制。当前 Daily Brief 不包含定时配置、通知或真实
数据读取，Scheduled Tasks 尚未实现或授权。
