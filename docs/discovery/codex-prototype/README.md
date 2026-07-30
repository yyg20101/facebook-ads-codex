---
doc_id: DISC-CODEX-PROTOTYPE-INDEX
type: index
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Codex 前期辅助流程原型

本目录定义独立 Codex 会话如何辅助三个产品场景。它与
[完整 Web 原型](../../superpowers/plans/2026-07-30-full-web-platform-prototype.md)
共同验证产品分工：

- Web 保存业务对象、状态、关系、权限、检查、确认和审计。
- Codex 读取明确提供的上下文、信息文档和聚焦 Skills，生成结构化辅助结果。
- 前期由负责人手动把 Codex 输出带入对应 Web 对象。
- 当前没有 Remote MCP、实时 Meta 数据、Web 保存工具或受控写工具。

## 场景包

| 场景 | 上下文包 | 主要 Web 交接对象 |
| --- | --- | --- |
| `SC-01` | [素材与广告创建](sc-01-creative-and-campaign.md) | `Asset`、`Campaign Draft`、`Preflight Report` |
| `SC-02` | [数据诊断与行动](sc-02-analysis-and-action.md) | `Diagnosis Report`、待确认行动 |
| `SC-03` | [测试与持续优化](sc-03-test-and-optimization.md) | `Test Plan`、`Test Conclusion` |

聚焦 Skill 的候选输入、输出和禁止能力见
[Skill 契约](skill-contracts.md)。

## 通用执行顺序

每个场景 MUST：

1. 先列出正在使用的项目文档、用户提供事实、数据范围和更新时间。
2. 区分 `FACT`、`INFERENCE` 和 `UNKNOWN`。
3. 只提出完成任务所需的最小问题，不猜测关键配置。
4. 按场景输出稳定结构，不把建议描述成 Web 已保存或 Meta 已执行。
5. 明确列出人工检查、Web 交接对象和下一步。
6. 保留不确定性、反证和阻断项。

## 通用禁止

Codex MUST NOT：

- 声称已读取实时 Meta、账户状态、审核结果或生产数据。
- 声称已在 Web 保存对象，除非未来受控工具返回成功证据。
- 声称已创建、发布、暂停、调整或删除 Meta 广告对象。
- 接收或保存 Token、Cookie、`Authorization` Header 或客户敏感数据。
- 把会话中的自然语言确认当作业务授权、审批或外部写许可。
- 保证审核通过、广告效果、诊断正确或测试获胜。

本目录只提供 Product Discovery 原型，不使候选 Skill 或工具契约成为已接受实现。
