---
name: facebook-ads-creative
description: Validate manually supplied facebook-ads-creative-context/v1 fixture-only JSON and turn it into a reviewable creative brief, copy variants, visual directions, asset risks, and human-review checklist. Use only when the user explicitly invokes $facebook-ads-creative or asks to draft Meta/Facebook ad creative from a validated offline fixture context. Do not use for live or customer data, internet asset search, image/video generation, campaign configuration, policy-approval promises, performance guarantees, or ad writes.
---

# Facebook Ads Creative

把完整的 schema v1 离线 fixture 素材上下文转换为可人工评审的创意简报和受控变体草稿。
先安全失败地校验来源、权利、声明和护栏，再生成文本与视觉方向；不搜索、生成或上传
实际素材。`agents/openai.yaml` 固定 `allow_implicit_invocation: false`，必须显式调用。

## 适用边界

只接受由用户手动提供的 `facebook-ads-creative-context/v1` JSON，且必须满足：

- `artifact_type: CODEX_CREATIVE_INPUT` 与 `source_kind: FIXTURE`；
- `scenario_id: SC-01`，所有范围和素材引用都是 `fixture-*`；
- 外部搜索、图片生成、效果保证、审核保证、外部写入和持久化全部关闭；
- handoff 目标为 `facebook-ads-creative` 与 `ASSET_CENTER`；
- 不包含 Token、Authorization Header、客户数据、真实账户或任意 URL。

以下请求立即停止并说明本 Skill 不适用：

- 真实商品、客户、账户、落地页或未脱敏素材；
- 从网络寻找、下载、改编或上传素材；
- 直接生成图片、视频或调用第三方模型和供应商；
- 保证 Meta 审核通过、保证广告效果或隐藏 AI/素材来源；
- Campaign、Ad Set、Ad 配置、发布、预算、受众或状态操作。

## 执行流程

### 1. 确认并校验输入

要求完整 JSON 或本机 fixture 文件路径。输入缺失时只询问缺失的素材上下文，不询问
登录、Token、真实账户或客户信息。

输入是文件时，从仓库根目录运行。文件必须位于当前仓库目录内且不能是符号链接：

```text
node .agents/skills/facebook-ads-creative/scripts/validate-context.mjs <context.json>
```

也可通过标准输入传入：

```text
node .agents/skills/facebook-ads-creative/scripts/validate-context.mjs -
```

脚本退出码 `1` 或 `preflight.status: REJECTED` 时停止。退出码 `2` 且状态为 `BLOCKED`
时只形成阻断草稿，不生成文案变体或视觉方向。不能执行脚本时，完整应用
[素材输入契约](references/creative-context-contract.md)；不能逐项确认就停止。

### 2. 建立素材事实

只使用输入直接提供的商品信息、已批准信息点、受众描述、品牌限制、版位、来源素材和
变体控制项。不得打开或推断站外信息，不得把素材名称、颜色或个人经验当作效果证据。

每个文案和视觉方向都必须引用一个或多个输入 JSON path。只允许使用
`product.approved_messages` 中已有且带 fixture evidence ref 的信息点；不得补充价格、
折扣、稀缺性、健康功效、认证或比较性声明。

输出映射必须保持精确：`creative_brief.product_message` 等于
`product.approved_messages[*].message` 按输入顺序用 `；` 连接的原文，不增加商品名、
前后缀或标点。brief 与 copy variant 的 `source_fact_paths` 只能列出对应
`$.product.approved_messages[N]`；visual direction 的 `source_fact_paths` 只能列出对应
`$.source_assets[N]`。其他输入事实可以影响措辞，但不得混入这些受限证据路径数组。

### 3. 处理权利和阻断项

把 preflight 的 blockers、warnings 和 source asset 状态原样带入最终草稿。

- 任一素材权利为 `UNCONFIRMED`、`PROHIBITED` 或来源为 `UNKNOWN` 时，输出
  `BLOCKED`，`copy_variants` 和 `visual_directions` 为空。
- 已批准信息点为空、固定项缺失或品牌必需词与禁用词冲突时同样阻断。
- `READY` 只表示 fixture 输入足以起草，不表示 Meta 政策、版权或实际可投放性通过。

### 4. 生成受控变体

仅在 `READY` 时按 `variant_request.count` 生成一一对应的文案和视觉方向。所有变体只
改变 `controlled_variable`，并明确保留 `fixed_elements`。不得自行增加第二个测试变量。

- 文案保持为 `DRAFT`，包括 primary text、headline、description 和 CTA label。
- 视觉方向只描述构图、主体、格式和素材引用，不调用图片或视频工具。
- 使用稳定的 `fixture-creative-variant-NN` 引用，不排名、不选择赢家。
- 不声称变体会提升 CTR、转化、审核通过率或其他广告结果。

### 5. 输出稳定草稿

读取[素材草稿输出契约](references/creative-draft-contract.md)，输出一个 JSON 代码块。
顶层字段按契约顺序固定。原输入 `unknowns` 必须原样保留；附加缺口只能使用
`TASK_*` code。

始终保持：

- `creative_mode: OFFLINE_FIXTURE_DRAFT`；
- `human_review.required: true`；
- `handoff.target_state: DRAFT`；
- `handoff.external_write: false`、`handoff.persisted: false`；
- `external_write: false`；
- 无搜索、生成素材、发布、预算/状态动作或自动 Web 交接字段。

## 完成检查

在返回前确认：

1. 输入结构和敏感信息检查已通过，preflight 状态未被改写。
2. 每个创意信息点都能追溯到批准消息或 fixture 素材路径。
3. 变体数量正确，只改变一个变量，固定项未漂移且没有排名。
4. 权利、来源、AI 标记、未知项和人工检查均完整保留。
5. 没有执行搜索、图片/视频生成、外部调用、持久化或广告写入。

本 Skill 已通过仓库内固定 fixture 的输入、CLI 安全失败和输出契约确定性测试。独立
Codex 会话仍为 `NOT_RUN`，因此不得把本地测试解释为模型质量、真实素材、版权、Meta
审核或效果验证。
