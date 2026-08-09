---
doc_id: TECH-OFFLINE-CODEX-ANALYSIS-EVALS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 分析草稿评测

本文定义第十六个可逆离线候选切片：为仓库级 `facebook-ads-analysis` 建立五种固定
fixture 黄金场景、精确最终草稿契约和确定性本地评分器。它只验证已知输入与候选 JSON
草稿之间的结构、证据和安全边界，不调用模型 API，不代表通用广告分析、真实账户、用户
价值、优化效果或 Gate 已验证。

## 单一评测承诺

`P2-OFFLINE-EVAL-01`：本切片只评测一个用户可见承诺：Skill 在接收已通过校验的 schema
v2 fixture 后，最终 JSON 草稿必须忠实绑定输入证据、保留未知项、完整覆盖直接子对象，
并保持非因果、无排名、无优化动作和无外部写入。

不在本切片评测：

- Skill 自动触发、自然语言风格或真实会话的主观质量；
- 模型、prompt、Remote MCP、Web 自动交接或工具调用；
- 真实 Meta 指标、账户授权、广告效果或业务阈值；
- 建议质量、优化价值、广告写操作或用户任务完成率。

这些内容需要未来独立授权、实际应用路径和相应证据，不能由固定黄金草稿推导。

## 评测资产

```text
.agents/skills/facebook-ads-analysis/
  references/analysis-draft-contract.md
  scripts/evaluate-draft.mjs
evals/facebook-ads-analysis/
  fixture-contexts.mjs
  golden-cases.mjs
tests/
  facebook-ads-analysis-evals.test.mjs
```

- Skill reference 是输出字段与安全规则的权威契约。
- `fixture-contexts.mjs` 提供与既有输入校验测试共用的固定、脱敏 schema v2 上下文。
- `golden-cases.mjs` 保存可审查的代表问题和预期草稿，不包含 Token、真实 ID 或客户数据。
- `evaluate-draft.mjs` 不联网、不写文件、无第三方运行时依赖，只比较输入与候选草稿。
- Vitest 负责黄金场景和负向回归；GitHub Actions 运行同一 `skill:check`。

## 五种黄金场景

`P2-OFFLINE-EVAL-02`：每种受支持的 `analysis_kind` 恰有一个基础黄金场景：

| Case | `analysis_kind` | 必须验证的重点 |
| --- | --- | --- |
| `EVAL-FBA-001` | `ACCOUNT_COMPARISON` | 两期账户事实和变化值路径 |
| `EVAL-FBA-002` | `OBJECT_COMPARISON` | 对象范围绑定和对象周期事实 |
| `EVAL-FBA-003` | `DIRECT_CHILD_BREAKDOWN` | 稳定子对象顺序、两期父子对账和完整覆盖 |
| `EVAL-FBA-004` | `OBJECT_DAILY_TREND` | 连续日值、固定指标和范围绑定 |
| `EVAL-FBA-005` | `DIRECT_CHILD_DAILY_TREND` | 全部直接子对象日值和逐日父子对账 |

场景只使用 `fixture-*`、固定日期和固定指标。黄金草稿用于锁定产品安全承诺，不是对某个
模型回答的离线冒充；当前没有模型 target adapter，也不要求 API key 或本地服务。

## 最终草稿契约

`P2-OFFLINE-EVAL-03`：顶层字段按以下顺序固定且不得增减：

```text
analysis_mode
source_schema_version
analysis_kind
scope_and_freshness
executive_answer
evidence
counter_evidence
driver_decomposition
missing_data
confidence
limitations
external_write
```

核心约束：

1. schema、分析类型和范围/新鲜度必须与输入完全一致。
2. 每条 `FACT` 必须携带 `$.` evidence path 与同序原值；伪造路径或值必须拒绝。
3. Executive 引用的每条路径必须同时在 `evidence` 中落地。
4. `INFERENCE` 只能为 `LIKELY` 或 `HYPOTHESIS`，必须有事实路径和替代解释。
5. 输入 `UNKNOWN` 必须原样、按顺序保留；附加缺口只能使用 `TASK_*`。
6. 直接子对象必须按输入顺序完整覆盖，`ranking_applied` 固定为 `false`。
7. `limitations` 固定包含 fixture、无外连、非因果和无优化动作四项。
8. `external_write` 固定为 `false`；任何建议、赢家、排名、Token、请求 ID 或工具调用字段
   必须拒绝。

详细字段见 Skill 的
[分析草稿输出契约](../../.agents/skills/facebook-ads-analysis/references/analysis-draft-contract.md)。

## 确定性评分

评分器通过时固定返回 8/8：

```text
INPUT_CONTEXT_VALID
OUTPUT_SCHEMA_EXACT
SCOPE_BOUND
FACTS_GROUNDED
UNKNOWN_COVERAGE
DRIVER_COVERAGE
CLAIM_BOUNDARIES
SIDE_EFFECTS_DISABLED
```

评分器不会给无效草稿部分分数；任一项失败即安全拒绝，并返回首个失败路径。原因是当前
切片的全部检查均为结构与安全不变量，不存在可接受的“部分满足”。失败响应不回显完整
输入、不生成修补建议，也不访问外部数据。

本地命令：

```text
npm run skill:eval
npm run skill:check
```

`skill:eval` 只执行草稿评测；`skill:check` 同时运行输入校验与草稿评测全部回归。

## 负向矩阵

`P2-OFFLINE-EVAL-04`：自动测试至少拒绝：

- source schema、`analysis_kind` 或范围漂移；
- 不存在的 evidence path 或与路径不一致的 evidence value；
- Executive 路径未在事实集合落地；
- 删除、重写或用非 `TASK_*` 增加未知项；
- 缺失直接子对象或启用排名；
- `recommended_actions` 等禁止字段；
- 因果、排名或预算/状态执行措辞；
- `external_write: true`。

标准输入 CLI 还必须验证通过与安全拒绝 envelope，且不在仓库写入运行输入或结果。

## 授权与后续

本切片不增加或修改 Web、Worker、HTTP、D1、Meta、MCP 或模型接口，不修改 production
prompt、模型配置或用户数据路径。它不接受 `FR-005`、`NFR-002`、任何 ADR 或候选架构，
不改变 G0 `PARTIAL`，也不形成 G2/G3 证据。

后续[离线 Codex 独立会话前向评测](offline-codex-session-forward-test.md)已经准备手动
fresh-session target 和脱敏 Case，但实际执行仍须独立全新会话。当前状态为 `NOT_RUN`；
不得把本地确定性黄金草稿或评分管道自测伪装为模型质量基线。

## 当前验证结果

2026-08-08，五种黄金场景和 12 项草稿评测通过；与 11 项输入 Skill 测试合计 23 项。
统一检查还通过 84 份规范文档、14 项 Phase 0、67 项 Worker、81 项原型测试及
production build；`skill-creator` 官方快速结构校验通过。该结果只证明固定 fixture 和
确定性输出契约可重复，不是模型、真实账户、用户价值、优化效果或 G2/G3 证据。
