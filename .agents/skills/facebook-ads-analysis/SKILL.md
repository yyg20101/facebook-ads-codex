---
name: facebook-ads-analysis
description: Validate and analyze manually supplied facebook-ads-offline-analysis-context/v2 fixture-only JSON for Meta/Facebook Ads. Use when the user explicitly invokes $facebook-ads-analysis or asks to turn a validated offline evidence bundle into a read-only FACT / INFERENCE / UNKNOWN draft. Do not use for live Meta data, arbitrary exports, optimization recommendations, rankings, causal claims, or ad writes.
---

# Facebook Ads Analysis

把本仓库生成的 schema v2 离线 fixture 证据转换为可核验的只读分析草稿。先安全失败地
验证输入，再严格区分直接事实、有限推断和未知项；不连接真实账户，也不生成执行建议。
`agents/openai.yaml` 固定 `allow_implicit_invocation: false`，必须由用户显式调用。

## 适用边界

只接受完整的 `facebook-ads-offline-analysis-context/v2` JSON，且必须同时满足：

- `artifact_type: CODEX_ANALYSIS_INPUT`；
- `source_kind: FIXTURE`；
- `quality_evidence.status: PASS`；
- 所有 guardrail 保持输入契约规定的安全值；
- `codex_handoff.intended_skill: facebook-ads-analysis`；
- 由用户手动提供，不主动从 Web、Meta、MCP、浏览器存储或外部地址获取。

以下请求必须停止并说明本 Skill 不适用：

- 真实 Meta 数据、任意导出或 schema v1/未知 schema；
- 排名、赢家判断、业务阈值、预算或状态动作；
- 因果结论、效果保证或未经证据支持的主 KPI；
- 自动上传、持久化、外部写入或广告创建、修改、暂停、删除；
- Token、Authorization Header、客户数据或其他敏感信息。

## 执行流程

### 1. 确认输入

要求用户提供完整 JSON 或本机文件路径。输入缺失时只询问这一项，不询问 Token、账户
登录或真实 ID。不要通过网络补齐未知值。

### 2. 运行确定性校验

输入是文件时，解析本 `SKILL.md` 所在目录并运行：

```text
node scripts/validate-context.mjs <context.json>
```

也可通过标准输入传入 JSON：

```text
node scripts/validate-context.mjs -
```

脚本退出码非零时立即停止，不输出部分分析。输入直接粘贴在会话中且不便运行脚本时，
逐项应用 [离线分析契约](references/offline-analysis-contract.md)；不能完整验证就返回
`UNKNOWN`，不得假设它已通过 preflight。

### 3. 建立事实层

只把输入直接支持的数值、范围、口径、质量状态、确定性 pattern 和父子对账写为
`FACT`。每条 `FACT` 必须带一个或多个精确 JSON evidence path。

- comparison 使用 `fact_evidence.baseline`、`current` 和 `changes`。
- daily trend 使用完整 `fact_evidence.daily_items`，不能只看首尾或当前图表指标。
- direct children 保持输入顺序，并只在结构化字段中写
  `driver_decomposition.ranking_applied: false`。
- `observed_patterns` 是确定性数字模式，不是原因。

不要把颜色、曲线外观、序列位置、对象名称或当前展示指标解释成表现排名或主 KPI。
所有自然语言字段（包括 `statement` 和 `alternative_explanations`）不得出现“排名”、
“赢家”、“最佳”、“优于”及其英文对应词，即使是否定这些行为。需要说明直接子对象
顺序时，只写“按稳定 fixture 对象 ID 输入顺序完整列出”；安全布尔值由结构化字段表达。

### 4. 形成有限推断

只有当一个结论能链接至少一条 `FACT` 时才写 `INFERENCE`。每条推断必须包含：

- `supporting_evidence_paths`；
- `confidence: LIKELY | HYPOTHESIS`；
- 至少一个 `alternative_explanation` 或明确说明证据不足；
- 非因果措辞。

不得引入输入之外的行业基准、阈值、实时账户事实或站外转化。不能安全推断时，保持
`INFERENCE` 为空，并把缺口放入 `UNKNOWN`。

### 5. 保留未知项

原输入的全部 `unknowns` 必须原样保留。再补充回答当前问题所需但输入未提供的事实，
例如投放目标、业务成功阈值、真实账户验证或外部转化质量。不得用通用经验填空。

### 6. 输出稳定草稿

先读取[分析草稿输出契约](references/analysis-draft-contract.md)。输出必须满足其中的精确
字段、证据值绑定、直接子对象覆盖、原始未知项保留和安全措辞规则；契约与下列摘要冲突
时停止，不自行选择更宽松解释。

输出一个 JSON 代码块，字段顺序如下：

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

约束如下：

- `analysis_mode` 固定为 `OFFLINE_FIXTURE_DRAFT`。
- `executive_answer.claim_type` 只能是 `FACT`、`INFERENCE` 或 `UNKNOWN`。
- `evidence[*].claim_type` 固定为 `FACT`；每个 `evidence_path` 必须同时携带与输入完全
  一致的 `evidence_value`。
- `counter_evidence` 只能引用现有 `FACT` 或标记为 `UNKNOWN`。
- `driver_decomposition.ranking_applied` 固定为 `false`；直接子对象必须按输入顺序完整覆盖。
- 不得在任何自然语言字段中复述 `ranking_applied` 的语义；只保留结构化布尔值，并以
  “按稳定 fixture 对象 ID 输入顺序完整列出”描述对象顺序。
- `missing_data[*].claim_type` 固定为 `UNKNOWN`；输入未知项必须原样保留，新增项使用
  `TASK_*`。
- `confidence` 只能是 `CONFIRMED`、`LIKELY`、`HYPOTHESIS` 或 `NOT_ASSESSED`。
- `limitations` 固定为 `FIXTURE_DATA_ONLY`、`NO_EXTERNAL_CONNECTION`、
  `NON_CAUSAL_ANALYSIS`、`NO_OPTIMIZATION_ACTIONS`。
- `external_write` 固定为 `false`。
- 不得增加 `recommended_actions`、`write_parameters`、`winner` 或自动交接字段。

需要验证已经存在的本地候选草稿时，把 `context` 与 `draft` 组成内存或临时 envelope，
运行 `node scripts/evaluate-draft.mjs -`。评测失败时只返回拒绝结果，不修补事实、不降级
契约，也不把输入或草稿保存到仓库。

## 完成检查

在返回前确认：

1. 输入已完整校验，且没有敏感字段或未知顶层字段。
2. 每条事实都有路径及对应原值，每条推断都有事实、置信度和替代解释。
3. 原始未知项没有被删除或改写成事实。
4. 直接子对象已按稳定 ID 输入顺序完整覆盖；自然语言没有禁用词、阈值、因果、优化
   动作或真实数据声明，安全状态只由结构化字段表达。
5. 草稿满足 8 项确定性评测，`external_write: false`，且没有执行或提议任何外部调用。
