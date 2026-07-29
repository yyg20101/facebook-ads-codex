---
doc_id: DISC-INDEX
type: index
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Product Discovery

本目录是在需求和技术设计前验证产品定义的唯一事实源。当前只固定 Meta/Facebook
广告问题领域；目标用户、问题、价值、产品形态、内容、功能和技术方案均未确认。

## 当前记录状态

```yaml
research_status: NOT_STARTED
participant_target: 3-5
minimum_valid_participants: 3
```

这些字段记录研究工作，不复制或扩大[项目状态与授权](../project/status-and-authorizations.md)。
`DG0` 当前结果只在[产品定义与 DG0](product-definition.md)中维护。

## 输出边界

本轮 Product Discovery 只允许形成：

- 一个有证据支持的内部试点用户角色。
- 1–3 个核心 Job-to-be-Done。
- 问题、现有替代方案、价值主张和产品内容地图。
- 对话式、Web 工作台和混合式三种低保真方案的比较结论。
- `MVP`、`LATER`、`REJECTED` 功能清单。
- 内部试点成功指标、非目标和限制。

本轮不得宣称已验证外部客户、代理商、SaaS、多租户、定价或商业模式。

## 阅读与执行顺序

1. [发现问题](discovery-questions.md)：维护 `DQ-01`–`DQ-08`。
2. [研究计划](research-plan.md)：确定参与者、顺序、质量和停止条件。
3. [访谈指南](interview-guide.md)：先收集近期行为，再讨论期待。
4. [证据登记](evidence-log.md)：只保存脱敏 `EVD-*`。
5. [候选解决方案](solution-hypotheses.md)：保存旧基线，不把它当作事实。
6. [产品形态验证](product-shape-validation.md)：使用相同任务比较三种形态。
7. [产品定义与 DG0](product-definition.md)：综合证据并由项目负责人确认。

## 执行规则

- 参与者由项目负责人协调，Codex 不自行联系、邀请或安排人员。
- 问题访谈必须先于原型展示，避免候选方案诱导回答。
- 同一参与者可以参加两个阶段，但原型反馈不能反向改写问题访谈证据。
- 研究材料使用 `P-NN` 别名；姓名、联系方式、录音、原始转录和客户数据不得入库。
- 结论必须链接一个或多个 `EVD-*`；没有证据时保持 `UNRESOLVED`。
- 少于三名有效参与者或任一核心 Gate 条件不满足时，`DG0` 必须为 `PARTIAL`。
- `DG0` 未通过时，需求、ADR、技术和实现型规范不得转为 `ACCEPTED`。

## 启动与完成

研究启动语句和允许动作以[项目状态与授权](../project/status-and-authorizations.md)为准。
完成研究不自动启动原 Phase 0，也不构成外部访问、部署或 Meta 写授权。
