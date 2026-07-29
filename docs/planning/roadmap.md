---
doc_id: PLAN-ROADMAP
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 实施路线图

## 当前状态

```text
Documentation baseline
  -> READY_FOR_PHASE_0
  -> Phase 0 not started
  -> No runtime code
  -> No deployment authorization
  -> No Meta write authorization
```

授权事实以[项目状态与授权](../project/status-and-authorizations.md)为准。

## 阶段总览

| 阶段 | 依赖 | 主要结果 | Gate |
| --- | --- | --- | --- |
| Phase 0：业务与权限确认 | 无 | 业务、KPI、权限、数据范围和账户决策 | G0 |
| Phase 1：数据控制平面 | G0 | Worker、D1、R2、同步、质量和 staging 验证 | G1 |
| Phase 2：MCP 与只读分析 | G1 | Remote MCP、分析 Skill 和只读 MVP | G2 |
| Phase 3：网页控制台 | G1 | RBAC、配置、图表、同步状态和审计 | G3 |
| Phase 4：审批式写操作 | G2、G3、独立授权 | 状态机、网页审批和有限 Meta 写入 | G4 |
| Phase 5：有限自动化 | G4、经批准 Dry Run | 规则边界、熔断、白名单和审计自动化 | G5 |

Phase 2 与 Phase 3 可在 G1 后部分并行，但权限和租户测试不能跳过。

## Phase 0：业务与权限确认

任务：

- `P0-01` 确认自有或客户 Meta 广告账户业务模型。
- `P0-02` 确认 Meta Business、账户数量和预估数据量。
- `P0-03` 确认投放目标、主 KPI 和主转化事件。
- `P0-04` 确认币种、时区和归因政策。
- `P0-05` 确认历史回填和数据保留期。
- `P0-06` 确认网页用户、角色、认证和审批权。
- `P0-07` 确认 `cf-primary` 域名、套餐、账单和资源所有权。
- `P0-08` 创建 Meta App 和只读授权路径。

使用 [Phase 0 问卷](phase-0-questionnaire.md)收集决定和脱敏证据。

## Phase 1：Cloudflare 数据控制平面

- `P1-01` 创建 TypeScript Worker 和本地环境。
- `P1-02` 创建 D1 migration 和租户约束。
- `P1-03` 创建 R2、Queues、Workflows 的 staging 配置。
- `P1-04` 实现加密后的 Meta connection 存储。
- `P1-05` 实现 Meta 只读客户端、分页、限流和错误分类。
- `P1-06` 实现增量同步、7 日回补和历史 backfill。
- `P1-07` 实现数据质量检查和同步状态。
- `P1-08` 添加单元、集成和 fixture 测试。

## Phase 2：Remote MCP 与 Codex 只读分析

- `P2-01` 实现 MCP 认证和用户到 Workspace 映射。
- `P2-02` 实现全部只读工具。
- `P2-03` 实现分页、限制、错误 envelope 和安全日志。
- `P2-04` 创建 `facebook-ads-analysis` Skill。
- `P2-05` 创建 `facebook-ads-daily-brief` Skill。
- `P2-06` 创建代表性分析和拒绝场景测试。

G2 完成后形成只读 MVP。

## Phase 3：精简网页控制台

- `P3-01` 实现用户认证和 RBAC。
- `P3-02` 实现连接、账户绑定和指标配置。
- `P3-03` 实现 dashboard 和同步状态。
- `P3-04` 实现 recommendations 和 audit。
- `P3-05` 实现 accessibility、响应式和 E2E 测试。

## Phase 4：审批式写操作

启动依赖：G2、G3、Meta 管理权限和项目负责人单独授权。

- `P4-01` 实现 change request schema 和状态机。
- `P4-02` 实现 `before_hash`、过期和策略校验。
- `P4-03` 实现网页批准与拒绝。
- `P4-04` 实现内部变更申请工具。
- `P4-05` 实现只接受 ID 的外部执行工具。
- `P4-06` 实现暂停、启用和预算变更适配器。
- `P4-07` 实现 before/after 快照、审计和反向变更。
- `P4-08` 在测试资产或批准的低风险资产上验证。

## Phase 5：有限自动化

启动依赖：G4 和项目负责人批准的 Dry Run 周期。

- `P5-01` 将确定性规则引擎与模型建议分离。
- `P5-02` Dry Run 记录“建议执行但未执行”的结果。
- `P5-03` 比较建议、实际结果和人工判断。
- `P5-04` 只开放批准的操作白名单。
- `P5-05` 实现自动熔断和告警。

## 阶段执行规则

每个阶段开始前：

1. 阅读项目章程、授权状态、安全政策和阶段文档。
2. 检查工作区和既有变更。
3. 核对依赖、需求、任务、Gate 和未决问题。
4. 只实施当前阶段并运行规定测试。
5. 记录结果、证据、限制和下一 Gate。

Gate 条件及完成定义见[Gate 与证据](gates-and-evidence.md)。
