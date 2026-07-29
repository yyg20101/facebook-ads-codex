---
doc_id: ADR-006
type: decision
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# ADR-006：能力只读优先并逐级开放

> 候选方案：本 ADR 尚未由用户问题和产品形态证据支持，`DG0` 前不具有约束力。

## 背景

Meta 写操作可能影响预算、投放和客户资产。数据质量、指标口径、权限和审批必须先经过
分阶段验证，不能在文档或代码存在时自动获得写能力。

## 决策

能力按以下顺序开放：

```text
READ_ONLY
  -> ADVISORY
  -> APPROVAL_REQUIRED
  -> BOUNDED_AUTONOMY
```

不得跳过阶段。生产部署与 Meta 写操作分别需要项目负责人明确授权。

## 后果

- Phase 1–2 可在没有写权限的情况下形成只读 MVP。
- Phase 4 必须同时满足 G2、G3、Meta 管理权限和独立写授权。
- Phase 5 还需要用户批准的 Dry Run、预算、白名单、TTL 和 Emergency stop 测试。

## 影响

- 关联需求：FR-003、FR-004、FR-010、FR-014、SEC-005、SEC-007、SEC-010。
- Gate：G0–G5 严格按依赖通过，Gate 本身不扩大授权。
