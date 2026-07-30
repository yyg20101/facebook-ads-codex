---
doc_id: DISC-CODEX-PROTOTYPE-SC-02
type: reference
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# SC-02：数据诊断与行动上下文包

## 任务

Codex 使用负责人明确提供的脱敏指标，解释“有点击、购买下降”的异常，并形成可保存的
诊断报告和待确认行动。Codex 不读取实时 Meta，不把相关性表述为因果，也不执行广告
调整。

## 必读上下文

- [项目章程](../../project/charter.md)
- [指标与报告](../../requirements/metrics-and-reporting.md)
- [Codex Skills 候选设计](../../technical/codex-skills.md)
- [安全策略](../../../SECURITY.md)

本场景使用候选 Skill：

- `facebook-ads-analysis`
- `facebook-ads-optimization`

## 示例输入

```yaml
scenario_id: SC-02
scope:
  workspace_alias: 星桥电商
  ad_account_alias: DEMO-001
  object_id: AD-002
  object_name: 夏日轻装_转化_02
  date_range: 2025-05-11/2025-05-17
  compare_to: PREVIOUS_7_DAYS
  timezone: Asia/Shanghai
  attribution: 7_DAY_CLICK_1_DAY_VIEW
  freshness:
    updated_at: 2025-05-17T08:42:00+08:00
    state: STABLE
metrics:
  spend: 3128.90
  ctr: 2.15
  purchases: 42
  cpa: 74.50
  roas: 2.47
observations:
  purchase_change_percent: -42.1
  ctr_vs_account_percent: 31
  landing_view_to_purchase_change_percent: -38
  cpm_state: STABLE
missing_data:
  - 站内结账失败日志
```

## 分析约束

Codex MUST：

1. 首先复述对象、日期、时区、归因和新鲜度。
2. 检查数据是否足以回答，缺失数据不能用推测值代替。
3. 按消耗、`CPM`、`CTR`、`CPC`、`CVR` 和价值分解变化。
4. 分别记录证据、反证和缺失数据。
5. 使用 `CONFIRMED`、`LIKELY` 或 `HYPOTHESIS` 表达置信度。
6. 将任何可能有副作用的建议标记为待确认。

## 期望输出

```yaml
diagnosis_report:
  id: DR-004
  scope:
    object_id: AD-002
    date_range: 2025-05-11/2025-05-17
    freshness: STABLE
  executive_answer: 有点击，购买下降
  impact: 过去 3 天购买下降 42%
  evidence:
    - CTR 2.15%，高于账户均值 31%
    - 落地页浏览到购买转化率下降 38%
  counter_evidence:
    - CPM 与频次保持稳定
  missing_data:
    - 站内结账失败日志
  confidence: LIKELY
  causal_claim: false
recommended_actions:
  - action: 检查落地页结账路径
    execution_state: PENDING_CONFIRMATION
  - action: 保留当前广告 24 小时收集样本
    execution_state: PENDING_CONFIRMATION
  - action: 创建素材替代测试
    execution_state: PENDING_CONFIRMATION
handoff:
  web_area: 数据分析
  save_as: Diagnosis Report
  external_write: false
```

## Web 交接检查

- Web 保留数据范围、新鲜度、证据、反证、缺失数据和置信度。
- 诊断报告状态为“建议 · 未执行”。
- 创建行动后状态为“待确认”，不得显示为 Meta 已生效。
- 行动链接回 `AD-002`、`AST-001` 和使用的指标范围。
- 后续数据过期或对象配置变化时，报告必须可被标记为过期。
