---
doc_id: DISC-CODEX-PROTOTYPE-SC-03
type: reference
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# SC-03：测试与持续优化上下文包

## 任务

Codex 辅助负责人检查素材测试是否可比较，形成 `KEEP`、`STOP`、`ITERATE` 或
`INCONCLUSIVE` 结论，并定义下一轮只改变一个主要变量的测试草案。

## 必读上下文

- [产品设计](../../superpowers/specs/2026-07-30-meta-ads-operations-platform-design.md)
- [指标与报告](../../requirements/metrics-and-reporting.md)
- [Codex Skills 候选设计](../../technical/codex-skills.md)
- [安全策略](../../../SECURITY.md)

本场景使用候选 Skill：

- `facebook-ads-optimization`

## 示例输入

```yaml
scenario_id: SC-03
test_plan:
  id: TP-007
  name: 生活方式 vs 产品静物
  hypothesis: 生活方式画面比产品静物降低单次购买成本
  primary_variable: 画面主题
  primary_metric: CPA
  guardrails:
    - CTR
    - NEGATIVE_FEEDBACK
  period: 2025-05-11/2025-05-17
  allocation_target: 50/50
validity:
  exposure_allocation_deviation_percent: 12
  tracking_state: STABLE
  mid_test_configuration_change: false
variants:
  - id: AST-001
    label: 生活方式
    spend: 4562.34
    ctr: 2.15
    purchases: 68
    cpa: 67.09
    roas: 3.89
  - id: AST-002
    label: 产品静物
    spend: 3128.90
    ctr: 1.76
    purchases: 42
    cpa: 74.50
    roas: 3.12
```

## 有效性规则

- 数据不足、追踪异常、无法控制主要变量或中途配置变化时返回
  `INCONCLUSIVE`。
- 曝光或消耗分配偏差 MUST 进入干扰因素，不能静默删除。
- 当前示例没有显著性检验，不得使用“证明”“显著获胜”或因果措辞。
- 结论不能自动暂停、启用、调整预算或修改广告。

## 期望输出

```yaml
test_conclusion:
  id: TC-007
  test_plan_id: TP-007
  conclusion: ITERATE
  confidence: LIKELY
  validity:
    state: VALID_WITH_WARNING
    warnings:
      - 曝光分配偏差 12%
  evidence:
    - 生活方式变体 CPA 为 CNY 67.09
    - 产品静物变体 CPA 为 CNY 74.50
  interference:
    - 曝光分配未完全达到 50/50
  statement: 保留生活方式方向，下一轮只测试首屏构图
  automatic_action: false
next_test:
  id: TP-008
  hypothesis: 更聚焦的首屏构图可以继续降低单次购买成本
  primary_variable: 首屏构图
  state: PREPARING
handoff:
  web_area: 测试与优化
  save_as:
    - Test Conclusion
    - Test Plan
  external_write: false
```

## Web 交接检查

- 结论链接回测试计划、两个素材变体和相关广告。
- Web 同时显示有效性、置信度、干扰因素和停止规则。
- `ITERATE` 只表示下一轮方向，不表示当前广告应自动调整。
- 下一轮计划保持“准备中”，预算、周期和最小数据条件仍需负责人确认。
