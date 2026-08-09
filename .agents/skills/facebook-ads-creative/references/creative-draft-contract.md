# 素材草稿输出契约

最终输出是可人工评审的 fixture-only JSON 草稿，不是图片、视频、广告对象、政策批准或
效果保证。本契约已纳入确定性黄金草稿评分；独立 Codex 会话验证仍未执行。

## 顶层顺序

```text
creative_mode
source_schema_version
scenario_id
scope
preflight
creative_brief
copy_variants
visual_directions
asset_risks
unknowns
human_review
handoff
limitations
external_write
```

不得增减顶层字段。固定值：

```yaml
creative_mode: OFFLINE_FIXTURE_DRAFT
source_schema_version: facebook-ads-creative-context/v1
scenario_id: SC-01
external_write: false
```

## Preflight

`preflight` 必须原样使用确定性校验器结果，至少包含：

- `status: READY | BLOCKED`；
- `facts`：输入事实路径和值；
- `blockers` 与 `warnings`；
- `assets_generated: false`；
- `recommendations_generated: false`；
- `external_write: false`。

`BLOCKED` 时 `creative_brief` 为 `null`，`copy_variants` 和 `visual_directions` 为空。

## Creative brief

`READY` 时：

```yaml
creative_brief:
  claim_type: DRAFT
  communication_goal: PRODUCT_CONSIDERATION
  product_message: 仅使用批准信息点形成的消息
  audience_context: 输入受众的忠实摘要
  placement_context:
    - FEED
    - STORY
  controlled_variable: COPY_HOOK
  fixed_elements:
    - PRODUCT_MESSAGE
  source_fact_paths:
    - $.product.approved_messages[0]
```

不得把 brief 写成表现预测、政策结论或 Campaign 配置。

## 文案和视觉方向

每个 copy variant：

```yaml
variant_ref: fixture-creative-variant-01
claim_type: DRAFT
primary_text: 待人工评审的文本
headline: 待人工评审的标题
description: 待人工评审的描述
call_to_action_label: 了解更多
controlled_variable_value: 场景切入 A
fixed_elements:
  - PRODUCT_MESSAGE
source_fact_paths:
  - $.product.approved_messages[0]
human_review_required: true
```

每个 visual direction：

```yaml
variant_ref: fixture-creative-variant-01
claim_type: DRAFT
concept: 只描述画面方向
composition: 只描述构图
format_notes:
  - FEED 与 STORY 需分别人工适配
source_asset_refs:
  - fixture-asset-01
controlled_variable_value: 场景切入 A
fixed_elements:
  - PRODUCT_MESSAGE
source_fact_paths:
  - $.source_assets[0]
asset_generated: false
human_review_required: true
```

两个数组长度必须与 `variant_request.count` 相同，并按 variant_ref 一一对应。不得排名、
选择赢家、引入第二变量或声称已经生成素材。

## 风险、未知项与人工检查

`asset_risks` 每项包含稳定 code、`INFO | WARNING | BLOCKER`、可空的 asset_ref、statement
和 `blocking`。权利不明或禁止使用必须为 `BLOCKER`。

输入 `unknowns` 必须原样、按顺序保留；新增项只能追加且 code 使用 `TASK_*`。

```yaml
human_review:
  required: true
  checklist:
    - ASSET_RIGHTS_AND_SOURCE
    - CLAIM_SUBSTANTIATION
    - BRAND_CONSISTENCY
    - META_POLICY_REVIEW
    - PLACEMENT_ADAPTATION
```

## Handoff 与限制

```yaml
handoff:
  mode: MANUAL_CONTEXT
  target_web_area: ASSET_CENTER
  target_state: DRAFT
  external_write: false
  persisted: false
limitations:
  - FIXTURE_DATA_ONLY
  - NO_EXTERNAL_SEARCH
  - NO_IMAGE_GENERATION
  - NO_META_POLICY_APPROVAL
  - NO_PERFORMANCE_GUARANTEE
  - NO_EXTERNAL_WRITE
external_write: false
```

不得增加搜索结果、下载地址、图片/视频二进制、模型或供应商调用、Campaign 字段、
发布状态、推荐预算、写操作参数或自动 Web 保存字段。
