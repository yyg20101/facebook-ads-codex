---
doc_id: DISC-EVIDENCE
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 产品发现证据登记

本页只保存脱敏研究证据。当前尚未开展访谈或任务测试，因此没有有效 `EVD-*` 记录。

## 证据字段

每条证据必须包含：

```yaml
evidence_id: EVD-NNN
date: YYYY-MM-DD
participant_alias: P-NN
participant_role: sanitized-role
method: PROBLEM_INTERVIEW | PROTOTYPE_TEST | OWNER_DECISION
evidence_type: FACT | INFERENCE | COUNTEREVIDENCE
recent_example: sanitized-summary
finding: sanitized-summary
linked_questions: []
linked_tasks: []
confidence: LOW | MEDIUM | HIGH
limitations: []
```

`OWNER_DECISION` 只能确认内部试点范围、成功指标和治理边界，不能替代用户问题或行为证据。

## 证据记录

| Evidence ID | 日期 | 参与者别名 | 方法 | 类型 | 关联问题 | 发现 | 置信度 | 限制 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 禁止内容

- 姓名、邮箱、电话、微信、部门中可识别个人的组合信息。
- 录音、视频、逐字稿、会议链接或身份映射。
- 客户名称、广告账户 ID、Campaign 名称或未脱敏指标。
- Token、Cookie、Authorization Header、Secret 或真实 API 响应。
- 将推断改写成参与者事实，或删除不支持候选方案的反证。

发现不安全材料时不得复制到仓库，应停止处理并请项目负责人先完成脱敏。
