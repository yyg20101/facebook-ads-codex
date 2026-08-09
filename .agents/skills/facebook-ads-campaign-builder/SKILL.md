---
name: facebook-ads-campaign-builder
description: Validate manually supplied facebook-ads-campaign-context/v1 fixture-only JSON and turn it into reviewable Campaign, Ad Set, and Ad drafts with explicit blockers and unknown fields. Use only when the user explicitly invokes $facebook-ads-campaign-builder or asks to structure an offline Meta/Facebook campaign fixture. Do not use for live or customer data, Meta connectivity, publishing, budget or status writes, policy-approval promises, or performance guarantees.
---

# Facebook Ads Campaign Builder

把完整的 schema v1 离线 fixture 投放上下文转换为可人工评审的 Campaign、Ad Set 和 Ad
三层草稿。先执行安全失败的确定性预检，再整理字段；本 Skill 不创建、发布或修改任何
Meta 对象。`agents/openai.yaml` 固定 `allow_implicit_invocation: false`，必须显式调用。

## 适用边界

只接受用户手动提供的 `facebook-ads-campaign-context/v1` JSON，且必须满足：

- `artifact_type: CODEX_CAMPAIGN_DRAFT_INPUT`、`source_kind: FIXTURE`；
- `scenario_id: SC-01`，全部范围、素材和落地页引用均为固定 fixture ref；
- Meta 连接、发布、政策通过保证、外部写入、持久化和跳过审批全部关闭；
- handoff 目标为 `facebook-ads-campaign-builder` 与 `CAMPAIGN_DRAFTS`；
- 不包含 Token、Authorization Header、真实账户、客户信息、URL 或请求追踪值。

以下请求立即停止并说明本 Skill 不适用：

- 真实账户、像素、事件源、受众、素材、客户数据或生产响应；
- 连接 Meta、校验真实账户字段、创建/发布对象或改变预算、状态和排期；
- 保证审核通过、保证投放效果或绕过素材权利与人工确认；
- 用缺失字段的猜测值替代 `UNRESOLVED` 或删除 blocker。

## 执行流程

### 1. 校验完整上下文

要求完整 JSON 或仓库内的本机 fixture 文件路径。文件不能是符号链接：

```text
node .agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs <context.json>
```

也可通过标准输入传入：

```text
node .agents/skills/facebook-ads-campaign-builder/scripts/validate-context.mjs -
```

脚本退出码 `1` 或 `preflight.status: REJECTED` 时停止。退出码 `2` 且状态为 `BLOCKED`
时只形成阻断输出。无法执行脚本时，逐项应用
[投放草稿输入契约](references/campaign-context-contract.md)；无法确认完整契约就停止。

### 2. 保留事实与未知项

只使用输入明确给出的目标、转化位置、优化事件、计费事件、预算、排期、受众、版位、
素材、文案和落地页引用。所有值都只是 fixture 草稿事实，不代表对应 Meta 枚举、账户
能力或实时可用性已经校验。

- 不自行选择目标、优化事件、预算、受众或版位；
- 不把 `known_constraints` 或个人经验改写成平台事实；
- 输入 `unknowns` 原样保留，新增缺口仅使用 `TASK_*` code；
- 不推断货币、时区、事件配置、素材权利或审核状态。

### 3. 应用安全阻断

下列任一条件使 `preflight.status` 为 `BLOCKED`：

- 目标、转化位置、优化事件、计费事件、预算周期或币种为 `UNRESOLVED`；
- 排期无效、必需字段未列入 `supported_fields`；
- 素材来源未知、商业权利未确认或素材审查未通过；
- 落地页域名审查未通过；
- 任一守卫允许连接、发布、外部写入、持久化或跳过审批。

`READY` 只说明 fixture 字段足以形成草稿，不表示 Meta 接口、政策、账户权限、事件或
投放效果已经验证。

### 4. 形成三层草稿

仅在 `READY` 时整理三个对象，保持输入字段，不补充真实 API 参数：

1. `campaign_draft`：名称、目标、购买类型和特殊广告类别；
2. `ad_set_draft`：转化位置、优化/计费事件、预算、排期、受众和版位；
3. `ad_draft`：素材引用、文本字段、CTA 与落地页 fixture 引用。

三个 `fields` 必须使用精确映射：Campaign 完整复制 `context.campaign`，Ad Set 完整复制
`context.ad_set`，Ad 只复制 `context.ad` 并追加
`destination_ref: context.landing_page.destination_ref`。`asset_ref` 只参与 preflight 和
来源审查，不得复制进 `ad_draft.fields`；`$.asset` 保留在 `source_fact_paths` 也不改变
这一字段集合。

三个对象都必须为 `claim_type: DRAFT`、`state: DRAFT`，并列出 source fact paths。
`BLOCKED` 时三个对象均为 `null`。

### 5. 输出稳定 JSON

读取[投放草稿输出契约](references/campaign-draft-contract.md)，输出一个 JSON 代码块，
顶层字段和顺序不得变化。始终保持：

- `campaign_mode: OFFLINE_FIXTURE_DRAFT`；
- `human_review.required: true`；
- `handoff.target_state: DRAFT`；
- `handoff.external_write: false`、`handoff.persisted: false`；
- `external_write: false`。

不得增加 Meta payload、endpoint、真实 object ID、发布状态、审批结果或执行按钮语义。

## 完成检查

1. 输入结构、fixture 来源和敏感字段检查通过。
2. blocker、warning、unknown 和支持字段缺口没有被隐藏。
3. 三层对象只包含输入事实，且无额外默认值或业务推荐。
4. 素材权利、落地页、政策与人工评审边界清晰。
5. 没有连接、持久化、发布、预算/状态写入或外部调用。

本 Skill 已通过仓库内固定 fixture 的输入、CLI 安全失败和输出契约确定性测试。独立
Codex 会话仍为 `NOT_RUN`，因此不得把本地测试解释为模型质量、真实账户字段兼容、
Meta 政策或对象创建能力。
