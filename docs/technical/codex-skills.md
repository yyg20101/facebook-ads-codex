---
doc_id: TECH-CODEX-SKILLS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Codex Skills 设计

> 候选设计：Codex 和 Skills 尚未被产品形态测试选择，`DG0` 前不构成产品入口或
> 实施授权。

## 固定分工

根据 [ADR-003](../decisions/ADR-003-skills-and-mcp-boundary.md)：

- Skill 保存重复流程、指标定义、诊断顺序、输出格式和安全规则。
- Remote MCP 提供实时数据、认证、授权和受控操作。
- Skill 不保存 Token、账户凭据或可绕过服务端授权的数据。

MVP 使用四个聚焦 Skill，不创建单一巨型 Skill。

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

## `facebook-ads-daily-brief`

触发：日报、今日关注项、异常汇总。

- 只报告实质变化。
- 没有重要变化时明确说“无须处理”。
- 默认不创建变更申请。
- 数据过期或同步失败时优先报告数据问题。

## `facebook-ads-optimization`

触发：优化建议、预算/状态建议或测试计划。

- 先分析，再建议。
- 建议必须逐项关联证据。
- 样本或质量不足时只能继续观察或收集数据。

## `facebook-ads-change-management`

触发：草拟、提交、查询或执行变更。

- 只能创建结构化变更申请。
- 不能把自然语言直接转换为未经审批的 Meta 写请求。
- 执行时只能传入 `change_request_id`。
- 必须在调用外部写工具前要求最严格的 Codex 工具确认。

Codex 工具确认是附加防线，不能替代网页业务审批。

## 定时报告

Codex Scheduled Tasks MAY 生成日报、周报、异常摘要和审批提醒，但 MUST NOT
成为唯一同步或生产执行机制。日报默认只读取已经完成同步且状态有效的数据。
