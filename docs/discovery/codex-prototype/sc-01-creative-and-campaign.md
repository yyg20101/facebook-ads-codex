---
doc_id: DISC-CODEX-PROTOTYPE-SC-01
type: reference
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# SC-01：素材与广告创建上下文包

## 任务

Codex 辅助负责人从商品、目标和素材约束形成：

1. 可人工评审的素材简报和变体方向。
2. `Campaign`、`Ad Set`、`Ad` 结构化配置草案。
3. 发布前检查输入和仍需负责人补充的阻断项。

结果手动交接到 Web 的素材中心和广告创建流程。Codex 不创建 Web 对象，也不发布
Meta 广告。

## 必读上下文

- [项目章程](../../project/charter.md)
- [产品设计](../../superpowers/specs/2026-07-30-meta-ads-operations-platform-design.md)
- [安全策略](../../../SECURITY.md)
- [术语表](../../glossary.md)
- [Codex Skills 候选设计](../../technical/codex-skills.md)

本场景使用候选 Skill：

- `facebook-ads-creative`
- `facebook-ads-campaign-builder`

## 示例输入

```yaml
scenario_id: SC-01
workspace_alias: 星桥电商
ad_account_alias: DEMO-001
product:
  name: 夏日轻装系列
  category: 女装
  landing_page: https://example.invalid/summer
objective: 销售
audience:
  country: 中国大陆
  age: 18-44
budget:
  amount: 10000
  currency: CNY
  period: DAILY
schedule:
  start: 2025-05-20
  end: 2025-05-27
asset:
  id: AST-001
  name: 夏日轻装_主图_01
  source: 品牌拍摄
  commercial_rights: UNCONFIRMED
known_constraints:
  - 不保证审核通过
  - 当前没有 Meta 写授权
```

这些值全部是固定原型数据，不代表真实商品、账户、预算或投放决定。

## 事实、推断和未知

| 分类 | 示例 | 处理 |
| --- | --- | --- |
| `FACT` | 目标为销售、预算为 `CNY 10000 DAILY` | 原样保留并注明来源 |
| `INFERENCE` | 生活方式画面可能更适合通勤受众 | 标记为需测试的创意假设 |
| `UNKNOWN` | 商业使用权、Pixel 事件、首期支持字段 | 阻断，不猜测默认值 |

## 期望输出

```yaml
creative_brief:
  product_message: 轻盈、透气、适合夏日通勤
  audience_context: 18-44 岁中国大陆受众
  variants:
    - id: CV-01
      primary_variable: 画面主题
      direction: 生活方式
      human_review:
        - 模特与商品表达
        - 素材来源和商业使用权
campaign_draft:
  campaign:
    objective: SALES
  ad_set:
    conversion_location: WEBSITE
    optimization_event: UNKNOWN
    budget:
      amount: 10000
      currency: CNY
      period: DAILY
  ad:
    asset_id: AST-001
    primary_text: 轻盈透气，夏日出行更自在。
    headline: 夏日轻装系列
preflight_input:
  blockers:
    - 素材商业使用权待确认
    - Pixel 事件未选择
  warnings:
    - 受众范围较宽
handoff:
  web_area: 广告创建
  target_state: DRAFT
  external_write: false
```

## Web 交接检查

- 素材中心保存来源、权利、生成标记、规格和版本。
- 广告创建保存三个对象层级，不把自然语言段落当作完整广告配置。
- `UNKNOWN` 保持为空并形成 `BLOCKER`。
- 负责人修复阻断项后，Web 才允许建立人工确认请求。
- 即使检查通过，当前状态仍是本地原型，不表示 Meta 已创建或发布。
