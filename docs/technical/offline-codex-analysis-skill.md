---
doc_id: TECH-OFFLINE-CODEX-ANALYSIS-SKILL
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 分析 Skill

本文定义第十五个可逆离线候选切片：在仓库内提供可由 Codex 显式调用的
`facebook-ads-analysis`，把负责人手动提供的 schema v2 fixture 证据先安全校验，再
整理为区分 `FACT`、`INFERENCE` 和 `UNKNOWN` 的只读分析草稿。它不是通用广告分析
验证、真实账户连接、优化建议、操作授权或 Gate 证据。

## 项目级发现路径

Skill 位于 `.agents/skills/facebook-ads-analysis/`。这是 Codex 当前用于仓库级 Skill
自动发现的路径；候选架构中的目标布局同步采用该目录。目录包含：

```text
.agents/skills/facebook-ads-analysis/
  SKILL.md
  agents/openai.yaml
  references/analysis-draft-contract.md
  references/offline-analysis-contract.md
  scripts/evaluate-draft.mjs
  scripts/validate-context.mjs
```

`agents/openai.yaml` 设置 `allow_implicit_invocation: false`。负责人必须显式使用
`$facebook-ads-analysis`，普通广告分析请求不能自动进入本离线流程。Skill 不声明 MCP
或其他外部工具依赖。

路径约定依据 [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills)；仓库仍以
本页和[项目授权](../project/status-and-authorizations.md)限制可用范围。

## 输入范围

`P2-OFFLINE-SKILL-01`：只接受完整的
`facebook-ads-offline-analysis-context/v2`、`CODEX_ANALYSIS_INPUT`、`FIXTURE` 手动
输入。支持账户 comparison、对象 comparison、直接子对象拆解、对象趋势和直接子对象
趋势五种 `analysis_kind`。

输入必须保留：

- `quality_evidence.status: PASS` 与完整 preflight 快照；
- 两个固定 fixture warning；
- 关闭真实连接、阈值、因果、排名、建议、写入和持久化的全部 guardrail；
- `facebook-ads-analysis` 手动 handoff 及三种声明标签；
- 四项固定 `UNKNOWN`，不得删除或升级为事实。

本切片不接受 schema v1、真实 Meta 导出、任意 JSON、Token、Authorization Header、
客户数据或请求追踪字段。

## 确定性校验

`P2-OFFLINE-SKILL-02`：`scripts/validate-context.mjs` 不联网、不写文件且无第三方依赖。
它在生成任何草稿前验证：

1. 顶层与嵌套字段白名单、schema、产物类型、fixture 引用和敏感键；
2. 质量状态、日期覆盖、口径、稳定状态、获取时间和同步批次；
3. comparison 完整、不重叠、变化值与两期指标一致；
4. trend 连续覆盖 3–31 日、固定 9 项指标和派生公式可重算；
5. 直接子对象唯一、保持稳定非排名顺序，且两期或逐日四项可加指标与父对象对账；
6. guardrail、handoff、unknown 和 warning 完整且未扩权。

任一条件失败都返回 `INVALID_OFFLINE_ANALYSIS_CONTEXT`、首个失败 JSON path 和原因，
退出码为非零；不得产生部分分析、静态回退或外部补数。

## Skill 输出边界

`P2-OFFLINE-SKILL-03`：确定性脚本只输出 `PASS` preflight、事实清单、原始未知项和
`INFERENCE: NOT_GENERATED`；它自身不解释广告结果。

Skill 在校验通过后才可形成最终草稿：

- `FACT` 只能来自输入数值、范围、口径、pattern 或确定性对账，每条都包含 JSON path；
- 每个事实路径还必须携带与输入完全一致的原值；
- `INFERENCE` 必须引用事实，置信度只能为 `LIKELY` 或 `HYPOTHESIS`，并提供替代解释；
- `UNKNOWN` 必须保留输入原项，并补充回答当前问题所缺事实；
- `driver_decomposition.ranking_applied` 和 `external_write` 固定为 `false`；
- 限制必须声明 `FIXTURE_DATA_ONLY`、`NO_EXTERNAL_CONNECTION` 和非因果边界。

输出不得包含 `recommended_actions`、赢家、业务阈值、预算/状态操作参数、自动 Web
交接或真实账户声明。缺少可安全推断的事实时允许 `INFERENCE` 为空，不得猜测。

最终字段、值绑定和负向检查由后续获准的
[离线 Codex 分析草稿评测](offline-codex-analysis-evals.md)固定；该评测不改变本页的输入
授权，也不调用模型或外部工具。
后续[独立会话前向评测](offline-codex-session-forward-test.md)只准备无黄金答案 Case 和
手动评分协议；五个全新会话尚未执行，不能反向把本 Skill 标记为模型质量已验证。

## 验证

`P2-OFFLINE-SKILL-04`：自动检查至少覆盖：

- comparison 与直接子对象 daily trend 成功输入；
- real-data guardrail、派生公式、父子逐日对账、敏感请求字段和 schema v1 失败；
- 标准输入模式不写文件，preflight 不生成推断或建议；
- Skill 无 TODO、显式调用策略和无外部 dependency；
- `skill-creator` 快速校验、Markdown、内部链接、文档状态与全仓回归。

本切片不增加或修改 Web、Worker、HTTP、D1、Meta 或 MCP 接口，不接受 `FR-005`、
`NFR-002`、任何 ADR 或候选架构，不改变 G0 `PARTIAL`，不授权真实数据、外部访问、
自动传输、部署、广告写操作或正式阶段转换。

## 当前验证结果

2026-08-08，Skill 结构通过 `skill-creator` 的 `quick_validate.py`；本页定义的 11 项固定 fixture
输入正反测试通过，覆盖五种 analysis kind、确定性 pattern、公式、逐日对账、schema、敏感
字段、stdin 与显式触发元数据。随后增加的 12 项草稿契约测试见
[离线 Codex 分析草稿评测](offline-codex-analysis-evals.md)。这些结果只证明本地候选工作流
能安全处理固定 schema v2 fixture，不是通用分析正确性、真实广告账户、优化价值或
G2/G3 证据。
