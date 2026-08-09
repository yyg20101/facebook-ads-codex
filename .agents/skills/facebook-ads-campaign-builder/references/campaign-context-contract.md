# 投放草稿输入契约

`facebook-ads-campaign-builder` 只接受完整、手动提供且不含真实数据的
`facebook-ads-campaign-context/v1` JSON。本契约已纳入固定 fixture 自动测试；独立
Codex 会话和真实账户验证均未执行。

## 顶层字段

字段必须且只能按下列集合出现：

```text
schema_version
artifact_type
source_kind
scenario_id
scope
campaign
ad_set
ad
asset
landing_page
supported_fields
known_constraints
unknowns
guardrails
codex_handoff
```

固定值：

```yaml
schema_version: facebook-ads-campaign-context/v1
artifact_type: CODEX_CAMPAIGN_DRAFT_INPUT
source_kind: FIXTURE
scenario_id: SC-01
```

## 范围与 Campaign

```yaml
scope:
  workspace_ref: ws_fixture_01
  account_ref: fixture-ad-account-01
campaign:
  name: 虚构夏日轻装 Campaign
  objective: OUTCOME_SALES
  buying_type: AUCTION
  special_ad_categories:
    - NONE
```

`objective` 只能为 `OUTCOME_SALES`、`OUTCOME_TRAFFIC` 或 `UNRESOLVED`；`buying_type`
只能为 `AUCTION` 或 `UNRESOLVED`。特殊广告类别只接受 `NONE`、`CREDIT`、
`EMPLOYMENT`、`HOUSING`、`SOCIAL_ISSUES_ELECTIONS_POLITICS` 或 `UNRESOLVED`。
`UNRESOLVED` 必须形成 blocker。

## Ad Set

```yaml
ad_set:
  name: 虚构夏日轻装 Ad Set
  conversion_location: WEBSITE
  optimization_event: PURCHASE
  billing_event: IMPRESSIONS
  budget:
    amount_minor: 10000
    currency: CNY
    period: DAILY
  schedule:
    start_date: 2026-08-10
    end_date: 2026-08-17
  audience:
    locations:
      - FIXTURE-CN
    age_min: 18
    age_max: 44
    notes:
      - 固定虚构受众描述
  placements:
    - FEED
    - STORY
```

允许枚举：

- `conversion_location`：`WEBSITE`、`APP`、`MESSAGING`、`UNRESOLVED`；
- `optimization_event`：`PURCHASE`、`ADD_TO_CART`、`LANDING_PAGE_VIEW`、
  `LINK_CLICKS`、`UNRESOLVED`；
- `billing_event`：`IMPRESSIONS`、`LINK_CLICKS`、`UNRESOLVED`；
- `currency`：`CNY`、`USD`、`UNRESOLVED`；
- `period`：`DAILY`、`LIFETIME`、`UNRESOLVED`；
- `placements`：`FEED`、`STORY`、`REELS`。

预算使用正整数 minor unit；日期使用真实可解析的 `YYYY-MM-DD`，结束日期必须晚于开始
日期。这些枚举只定义 fixture 契约，不声明对应真实账户支持。

## Ad、素材与落地页

```yaml
ad:
  name: 虚构夏日轻装 Ad
  creative_ref: fixture-creative-01
  primary_text: 待人工评审的虚构广告正文
  headline: 待人工评审的虚构标题
  description: 待人工评审的虚构描述
  call_to_action: LEARN_MORE
asset:
  asset_ref: fixture-asset-01
  source_type: OWNED
  commercial_rights: CONFIRMED
  review_state: REVIEWED
landing_page:
  destination_ref: fixture-destination-01
  domain_review_state: REVIEWED
```

- `creative_ref` 必须与 `asset_ref` 都是 fixture ref；不得提供素材 URL。
- `source_type`：`OWNED`、`LICENSED`、`GENERATED`、`UNKNOWN`。
- `commercial_rights`：`CONFIRMED`、`UNCONFIRMED`、`PROHIBITED`。
- `review_state` 与 `domain_review_state`：`REVIEWED`、`PENDING`、`REJECTED`。
- 来源未知、权利未确认或审查未通过时必须阻断。
- CTA 只接受 `LEARN_MORE`、`SHOP_NOW`、`SIGN_UP` 或 `CONTACT_US`。

## 支持字段、未知项与护栏

`supported_fields` 是本草稿明确处理的语义字段列表，不是 Meta API 字段清单。至少包含：

```yaml
supported_fields:
  - campaign.objective
  - ad_set.conversion_location
  - ad_set.optimization_event
  - ad_set.billing_event
  - ad_set.budget
  - ad_set.schedule
  - ad_set.audience
  - ad_set.placements
  - ad.creative_ref
  - ad.primary_text
  - ad.headline
  - ad.call_to_action
  - landing_page.destination_ref
```

每个未知项必须为：

```yaml
claim_type: UNKNOWN
code: ACCOUNT_TIMEZONE_NOT_CONNECTED
statement: fixture 未连接真实账户，因此未验证账户时区。
```

code 必须唯一并使用大写下划线格式。护栏必须精确为：

```yaml
guardrails:
  fixture_data_only: true
  meta_connection_allowed: false
  publish_allowed: false
  policy_approval_guaranteed: false
  external_write: false
  persisted: false
  approvals_bypassed: false
codex_handoff:
  intended_skill: facebook-ads-campaign-builder
  mode: MANUAL_CONTEXT
  context_only: true
  target_web_area: CAMPAIGN_DRAFTS
```

任何凭据、真实账户/客户字段、URL、请求追踪值、外部工具调用、发布或写入意图都必须
拒绝。
