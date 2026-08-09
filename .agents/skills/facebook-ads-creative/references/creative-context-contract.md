# 素材输入契约

`facebook-ads-creative` 只接受完整、手动提供且不含真实数据的
`facebook-ads-creative-context/v1` JSON。本契约已纳入固定 fixture 自动测试；独立
Codex 会话和真实数据验证均未执行。

## 顶层字段

字段必须且只能按下列集合出现：

```text
schema_version
artifact_type
source_kind
scenario_id
scope
product
communication_goal
audience
placements
brand
source_assets
variant_request
known_constraints
unknowns
guardrails
codex_handoff
```

固定值：

```yaml
schema_version: facebook-ads-creative-context/v1
artifact_type: CODEX_CREATIVE_INPUT
source_kind: FIXTURE
scenario_id: SC-01
```

## 范围与商品

```yaml
scope:
  workspace_ref: ws_fixture_01
  account_ref: fixture-ad-account-01
  product_ref: fixture-product-01
product:
  name: 虚构夏日轻装
  category: 虚构服饰
  offer: 轻量通勤服饰信息，不包含价格或折扣
  approved_messages:
    - message: 轻盈面料，适合夏日通勤场景
      evidence_ref: fixture-product-claim-01
  prohibited_claims:
    - 保证效果
```

- 所有 ref 必须是固定 fixture 引用。
- `approved_messages` 可以为空；为空时 preflight 必须 `BLOCKED`。
- 生成内容只能使用批准消息，不得推断价格、折扣、稀缺性、认证、功效或比较性结论。
- 本 schema 不接受落地页 URL；开发期不得访问任意地址补充商品事实。

## 受众、版位与品牌

```yaml
communication_goal: PRODUCT_CONSIDERATION
audience:
  locations:
    - FIXTURE-CN
  age_min: 18
  age_max: 44
  notes:
    - 虚构通勤场景受众
placements:
  - FEED
  - STORY
brand:
  tone:
    - CLEAR
    - RELAXED
  required_terms:
    - 夏日轻装
  prohibited_terms:
    - 保证
```

这些值是创意上下文，不是 Meta API 配置。Skill 不得据此创建受众、版位或 Ad Set。

## 来源素材

每项 source asset 必须包含：

```yaml
asset_ref: fixture-asset-01
media_type: IMAGE
source_type: OWNED
commercial_rights: CONFIRMED
ai_generated: false
generation_disclosure_required: false
notes:
  - 固定虚构品牌拍摄素材
```

枚举：

- `media_type`：`IMAGE`、`VIDEO`、`CAROUSEL`、`TEXT_ONLY`。
- `source_type`：`OWNED`、`LICENSED`、`GENERATED`、`UNKNOWN`。
- `commercial_rights`：`CONFIRMED`、`UNCONFIRMED`、`PROHIBITED`。

`UNKNOWN`、`UNCONFIRMED` 或 `PROHIBITED` 必须形成 blocker。改编素材不能清除来源、
权利或 AI 生成标记。

## 变体请求

```yaml
variant_request:
  count: 3
  controlled_variable: COPY_HOOK
  fixed_elements:
    - PRODUCT_MESSAGE
    - AUDIENCE
    - PLACEMENT
```

`count` 范围为 1–5。`controlled_variable` 只能是 `COPY_HOOK`、`VISUAL_HOOK`、`FORMAT`、
`CTA` 或 `OFFER_PRESENTATION`。固定项为空时必须阻断；生成数量必须与 count 完全一致。

## 未知项与护栏

每个未知项必须为：

```yaml
claim_type: UNKNOWN
code: META_POLICY_REVIEW_NOT_RUN
statement: 当前 fixture 未执行 Meta 政策审核。
```

code 必须唯一且使用大写下划线格式。护栏必须精确为：

```yaml
guardrails:
  fixture_data_only: true
  external_search_allowed: false
  image_generation_allowed: false
  policy_approval_guaranteed: false
  performance_guaranteed: false
  external_write: false
  persisted: false
codex_handoff:
  intended_skill: facebook-ads-creative
  mode: MANUAL_CONTEXT
  context_only: true
  target_web_area: ASSET_CENTER
```

任何 Token、密钥、Authorization、cookie、真实账户/客户字段、请求追踪值、任意 URL、
外部工具调用或写入意图都必须拒绝。
