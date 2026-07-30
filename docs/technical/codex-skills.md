---
doc_id: TECH-CODEX-SKILLS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
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

## 候选 Skill 划分

前期使用聚焦 Skills，不创建单一巨型 Skill：

| Skill | 主要任务 |
| --- | --- |
| `facebook-ads-creative` | 素材简报、文案、图片方向、适配和测试变体 |
| `facebook-ads-campaign-builder` | Campaign、Ad Set、Ad 配置草案和发布前检查 |
| `facebook-ads-analysis` | 指标变化、对象下钻、异常与证据化诊断 |
| `facebook-ads-daily-brief` | 日报、待办、异常和审核失败摘要 |
| `facebook-ads-optimization` | 优化建议、素材测试和复查计划 |
| `facebook-ads-change-management` | 结构化变更建议、审批交接和状态解释 |

具体名称和数量在 Skill 实施计划中确认，不属于当前已接受接口。

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

## `facebook-ads-creative`

触发：寻找素材方向、编写文案、生成或修改素材说明、创建测试变体。

- 先确认商品、目标、受众、版位、品牌限制和素材权利。
- 网络素材只能使用明确允许的来源，不得把搜索结果默认视为可商用。
- 输出必须标记来源、生成方式、规格和需要人工检查的风险。

## `facebook-ads-campaign-builder`

触发：创建 Campaign、Ad Set、Ad 草案或检查投放配置。

- 明确区分目标、受众、预算、排期、版位、素材和追踪字段。
- 关键字段缺失时提出最小必要问题，不猜测默认值。
- 输出是结构化草案或检查报告，不得声称已在 Meta 创建或发布。

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
