---
doc_id: RUNBOOK-INDEX
type: runbook
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# Runbook 索引

仓库尚无可运行系统，因此没有 Runbook 可以声明为已验证或可用于 production。
当前只维护计划清单和[标准模板](RUNBOOK-TEMPLATE.md)。

## 计划清单

| Runbook | 最早阶段 | 目的 |
| --- | --- | --- |
| Local development | Phase 1 | 启动本地 Worker、依赖和 fixture |
| Staging deployment | Phase 1 | 部署和验证 staging 控制平面 |
| Meta read connection | Phase 1 | 建立、验证和撤销只读连接 |
| Sync recovery | Phase 1 | 处理分页、限流、队列、工作流和回补失败 |
| D1 migration recovery | Phase 1 | 回滚或前向修复 schema migration |
| Data discrepancy | Phase 1 | 排查系统指标与 Ads Manager 差异 |
| MCP access incident | Phase 2 | 处理认证、越权、延迟和错误率 |
| Token rotation/revocation | Phase 2 | 轮换根密钥或撤销租户 Token |
| Emergency stop | Phase 4 | 开启、验证和解除紧急停止 |
| Change execution failure | Phase 4 | 处理失败、STALE、重放和反向变更 |
| Security incident response | Phase 4 | 隔离、取证、通知和恢复 |

## 发布门槛

每份 Runbook 必须包含：

- 适用环境、权限、所有者和审批要求。
- 触发条件、前置检查和安全停止条件。
- 经过脱敏的命令或界面步骤。
- 预期输出和成功/失败判定。
- 回滚或前向修复路径。
- 审计事件和证据保存位置。
- 最近一次目标环境验证日期。

未经实际环境验证的 Runbook 只能标记为 `DRAFT`，不能作为操作授权。
