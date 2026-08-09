---
doc_id: TECH-OFFLINE-CODEX-CREATIVE-SKILL
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 素材 Skill 开发切片

本文定义第十八个可逆离线候选切片：在仓库内开发仅可显式调用的
`facebook-ads-creative`，把负责人手动提供的固定虚构素材上下文先安全校验，再整理为
可人工评审的创意简报、文案变体和视觉方向。它只探索
[PF-003 与 PF-004](../discovery/product-definition.md#功能决策)，不表示产品功能、模型能力、
Meta 审核或真实素材工作流已经验证。

## 当前开发状态

```yaml
development_status: LOCAL_FIXTURE_VALIDATED
configuration_status: LOCAL_CHECKS_CONFIGURED
test_status: PASS
session_validation_status: NOT_RUN
external_connection: false
external_write: false
```

上述值只描述本开发产物，不复制或扩大[项目授权](../project/status-and-authorizations.md)。
项目负责人先要求完成开发，随后批准进入本地配置与测试。固定 fixture validator、Skill
结构、CLI 安全失败、黄金草稿评分、文档检查、全仓回归和 CI 命令均已完成；独立 Codex
会话没有运行。

## 项目级发现路径

```text
.agents/skills/facebook-ads-creative/
  SKILL.md
  agents/openai.yaml
  references/creative-context-contract.md
  references/creative-draft-contract.md
  scripts/validate-context.mjs
```

`SKILL.md` 规定适用范围、停止条件、事实来源和稳定输出顺序；`agents/openai.yaml` 只保存
发现元数据与 `allow_implicit_invocation: false` 安全策略，不包含模型、供应商、账户或
环境配置。Skill 不声明 MCP、Web、Meta 或其他外部工具依赖。

## 输入契约

只接受完整的 `facebook-ads-creative-context/v1` JSON，并固定为：

- `artifact_type: CODEX_CREATIVE_INPUT`、`source_kind: FIXTURE`、`scenario_id: SC-01`；
- `fixture-*` Workspace、账户、商品、证据和素材引用；
- 商品批准信息点、受众、版位、品牌约束、来源素材与单一受控变量；
- 权利、来源、AI 生成标记、未知项和全部关闭的外部护栏；
- `MANUAL_CONTEXT` 方式交给 `facebook-ads-creative`，目标 Web 区域仅作语义标记。

输入不得包含 URL、Token、Authorization Header、客户数据、真实账户标识、请求追踪、
外部工具调用或写入参数。完整字段和枚举见 Skill 内的
`references/creative-context-contract.md`。

## 确定性 Preflight

`scripts/validate-context.mjs` 是无第三方依赖的开发产物，只读取 JSON 并返回 preflight；
它已通过固定正反 fixture 和 CLI 安全失败测试，并按白名单检查：

1. 仓库内普通文件或标准输入、2 MB 上限、顶层与嵌套字段、固定 schema、fixture 引用
   和敏感字段；
2. 商品批准信息点、年龄范围、品牌必需词与禁用词；
3. 素材来源、商业使用权、AI 生成与披露状态；
4. 1–5 个变体、唯一受控变量和固定项；
5. unknown、guardrail 与手动 handoff 的精确值。

批准信息点或固定项为空、品牌词冲突、素材来源未知、权利未确认或禁止使用时返回
`BLOCKED`。`READY` 只表示 fixture 输入足以起草，不表示版权判断、Meta 政策审核、
实际可投放性或效果保证。

## 草稿输出边界

校验为 `READY` 后，Skill 才可按 `facebook-ads-creative-draft` 契约输出：

- 只使用 `product.approved_messages` 和明确的 fixture 素材路径形成创意简报；
- 生成 1–5 个一一对应的文案草稿与视觉方向，只改变一个受控变量；
- 保留固定项、来源路径、素材权利、AI 标记、unknown 和人工检查清单；
- 固定 `human_review.required: true`、`target_state: DRAFT` 和
  `external_write: false`；
- 不排名、不选赢家，不保证 CTR、转化、审核通过或其他广告结果。

本切片只生成文本和视觉描述，不搜索、下载、改编、生成或上传图片/视频，不创建
Campaign、Ad Set 或 Ad，也不保存到 Web。

## 本地验证结果与剩余项

本 Skill 已覆盖 `READY`、`BLOCKED` 和 `REJECTED` 输入，敏感字段、未知字段、外部
guardrail、路径越界、符号链接、过大输入与无效 JSON 拒绝，以及就绪/阻断黄金草稿的
8/8 输出契约评分。官方 Skill 结构快速校验、Markdown、内部链接、Worker、Web 原型和
production build 回归也已通过。

代表性全新 Codex 会话仍为 `NOT_RUN`，模型、图片生成供应商、成本、内容安全与真实素材
接入配置也未开始。`LOCAL_FIXTURE_VALIDATED` 只说明固定输入和确定性契约已验证；本切片
不接受新的 `FR-*`、`NFR-*`、ADR 或候选架构，不改变 G0 `PARTIAL`，也不授权真实数据、
外部访问、部署或广告写操作。
