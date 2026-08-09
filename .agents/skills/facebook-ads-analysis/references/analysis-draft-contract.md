# 分析草稿输出契约

本契约只约束已通过 `validate-context.mjs` 的
`facebook-ads-offline-analysis-context/v2` fixture 输入。它不允许连接真实数据、补充
业务阈值、判断赢家、解释因果、生成优化动作或执行外部写入。

## 顶层结构

输出必须是一个 JSON 对象，字段按以下顺序出现且不得增减：

```json
{
  "analysis_mode": "OFFLINE_FIXTURE_DRAFT",
  "source_schema_version": "facebook-ads-offline-analysis-context/v2",
  "analysis_kind": "ACCOUNT_COMPARISON",
  "scope_and_freshness": {},
  "executive_answer": {},
  "evidence": [],
  "counter_evidence": [],
  "driver_decomposition": {},
  "missing_data": [],
  "confidence": "CONFIRMED",
  "limitations": [
    "FIXTURE_DATA_ONLY",
    "NO_EXTERNAL_CONNECTION",
    "NON_CAUSAL_ANALYSIS",
    "NO_OPTIMIZATION_ACTIONS"
  ],
  "external_write": false
}
```

- `source_schema_version`、`analysis_kind` 和 `scope_and_freshness` 必须与输入完全一致。
- `limitations` 必须按示例顺序保留全部四项。
- `external_write` 固定为 `false`。

## Executive answer

`executive_answer` 必须且只能包含：

```text
claim_type
statement
supporting_evidence_paths
confidence
alternative_explanations
```

规则：

| `claim_type` | Evidence paths | `confidence` | Alternative explanations |
| --- | --- | --- | --- |
| `FACT` | 至少一项 | `CONFIRMED` | 空数组 |
| `INFERENCE` | 至少一项 | `LIKELY` 或 `HYPOTHESIS` | 至少一项 |
| `UNKNOWN` | 空数组 | `NOT_ASSESSED` | 空数组 |

Executive 使用的每个路径还必须在 `evidence[*].evidence_paths` 中出现。推断只能描述输入
事实之间的非因果关系；不得使用“导致”“归因于”“优于”“赢家”或预算、状态、出价、
受众调整措辞。

## Evidence 与 counter evidence

每个 `evidence` 项必须且只能包含：

```json
{
  "claim_type": "FACT",
  "code": "STABLE_FACT_CODE",
  "statement": "输入直接支持的事实。",
  "evidence_paths": ["$.fact_evidence.point_count"],
  "evidence_values": [
    {
      "path": "$.fact_evidence.point_count",
      "value": 3
    }
  ]
}
```

- `evidence_paths` 使用以 `$.` 开头的精确 JSON path。
- 只允许引用 `scope_and_freshness`、`quality_evidence`、`fact_evidence`、
  `observed_patterns`、`driver_inputs`、`unknowns` 或 `warnings`。
- `evidence_values` 必须与路径同序、一一对应，值与输入路径的值完全一致。
- `evidence` 至少一项，全部 `code` 唯一。

`counter_evidence` 使用相同字段。其 `claim_type` 可为 `FACT` 或 `UNKNOWN`；`UNKNOWN`
必须使用空的路径和值数组，不能把“没有数据”伪装成反证事实。

## Driver decomposition

固定结构：

```json
{
  "kind": "NONE",
  "ranking_applied": false,
  "items": []
}
```

- `kind` 必须与 `input.driver_inputs.kind` 一致。
- `NONE` 的 `items` 必须为空。
- `DIRECT_CHILDREN` 或 `DIRECT_CHILDREN_DAILY` 必须按输入顺序完整覆盖每个子对象。
- 每项只能包含 `object_ref`、`statement`、`evidence_paths`、`evidence_values`，并至少引用
  对应的 `$.driver_inputs.items[n]` 路径。
- 不得增加分数、名次、赢家或阈值。

## Missing data

`missing_data` 中的前 N 项必须与输入 `unknowns` 的 N 项完全一致，包括顺序、`code` 和
`statement`。回答当前问题还缺少其他事实时，才可在末尾增加：

```json
{
  "claim_type": "UNKNOWN",
  "code": "TASK_ADDITIONAL_UNKNOWN",
  "statement": "当前问题缺少的事实。"
}
```

新增项的 `code` 必须使用 `TASK_*`，不得删除、改写或升级原始未知项。

## 确定性评测

`scripts/evaluate-draft.mjs` 只验证输入与候选草稿，不生成分析、不调用模型或工具，也不
读写外部系统。命令接收包含 `context` 和 `draft` 的 JSON envelope：

```text
node scripts/evaluate-draft.mjs <evaluation-case.json>
node scripts/evaluate-draft.mjs -
```

通过时返回固定 8/8 检查；失败时只返回 `INVALID_OFFLINE_ANALYSIS_CONTEXT` 或
`INVALID_OFFLINE_ANALYSIS_DRAFT`、首个失败路径、原因和 `external_write: false`。
仓库黄金场景位于 `evals/facebook-ads-analysis/`，统一命令为 `npm run skill:eval`。
