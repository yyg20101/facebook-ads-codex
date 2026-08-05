---
doc_id: PLAN-ROADMAP
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-05
---

# 实施路线图

## 当前状态

```text
Documentation baseline
  -> PRODUCT_DISCOVERY_COMPLETE
  -> Full-lifecycle Meta Ads Web platform direction confirmed
  -> Early AI entry confirmed as Codex context + docs + Skills
  -> Three representative scenarios reviewed
  -> Web and Codex workflow prototype accepted by project owner
  -> DG0 PASS
  -> Phase 0 document confirmation IN_PROGRESS
  -> BQ-01 through BQ-12 RESOLVED
  -> Credential-neutral local readiness tooling AVAILABLE
  -> G0 PARTIAL; real configuration DEFERRED
  -> Offline Phase 1 scaffold AUTHORIZED
  -> Offline read-only analysis slice AUTHORIZED
  -> External account facts and Meta read-only path NOT VERIFIED
  -> No real-data or external-service runtime
  -> No deployment authorization
  -> No Meta write authorization
```

授权事实以[项目状态与授权](../project/status-and-authorizations.md)为准。

## 阶段总览

| 阶段 | 依赖 | 主要结果 | Gate |
| --- | --- | --- | --- |
| Product Discovery | 无 | 内部用户、问题、形态、内容、MVP 和试点指标 | DG0 |
| Phase 0：业务与权限确认 | DG0 | 业务、KPI、权限、数据范围和账户决策 | G0 |
| Phase 1：数据控制平面 | G0 | Worker、D1、R2、同步、质量和 staging 验证 | G1 |
| Phase 2：Codex 与只读分析 | G1 | 上下文、聚焦 Skills、候选 Remote MCP 和只读分析 | G2 |
| Phase 3：Web 运营平台 | G1 | 素材、广告、图表、测试、RBAC、状态和审计 | G3 |
| Phase 4：审批式写操作 | G2、G3、独立授权 | 状态机、网页审批和有限 Meta 写入 | G4 |
| Phase 5：有限自动化 | G4、经批准 Dry Run | 规则边界、熔断、白名单和审计自动化 | G5 |

Phase 0–5 来自旧候选方案。`DG0` 通过后必须按实际产品定义重新评审这些阶段、组件和
Gate；当前表不构成实现承诺。

## Product Discovery

- `PD-01` 由项目负责人确认通用产品定位、支持用户和非目标。
- `PD-02` 确认广告投放、数据分析及相关能力的范围和优先级。
- `PD-03` 建立至少 3 个代表性端到端场景并登记脱敏 `EVD-*`。
- `PD-04` 使用完整 Web 原型和 Codex 辅助流程验证已选产品形态。
- `PD-05` 形成内部试点产品定义、内容地图和 `MVP`/`LATER`/`REJECTED` 功能。
- `PD-06` 评估 `DG0` 并由项目负责人确认。

`PD-01`–`PD-06` 已完成，`DG0` 由 `EVD-025` 记录为 `PASS`。执行记录见
[Product Discovery](../discovery/README.md)。

## Phase 0：业务与权限确认

启动前置条件已满足：`DG0` 为 `PASS`，项目状态为 `READY_FOR_PHASE_0`，项目负责人已
另行启动 Phase 0 文档确认。`BQ-01`–`BQ-12` 已全部回答；`P0-02`、`P0-04`、
`P0-07` 的外部事实仍待验证。在获得单独授权前不得执行 `P0-08` 或访问真实
Meta/Cloudflare 资源。

仓库已提供本地忽略配置模板、离线检查、固定 GET allowlist 的 Meta 验证工具和测试。
这些准备不包含真实值，不访问外部系统，也不改变 P0-02、P0-04、P0-07、P0-08 或 G0
的未完成状态。项目负责人决定暂时延期这些真实配置项，因此 G0 为 `PARTIAL`。实际步骤
见[Meta 只读连接验证 Runbook](../runbooks/meta-read-connection.md)。

任务：

- `P0-01` 确认自有或客户 Meta 广告账户业务模型。
- `P0-02` 确认 Meta Business、账户数量和预估数据量。
- `P0-03` 确认投放目标、主 KPI 和主转化事件。
- `P0-04` 确认币种、时区和归因政策。
- `P0-05` 确认历史回填和数据保留期。
- `P0-06` 确认网页用户、角色、认证和审批权。
- `P0-07` 确认 `cf-primary` 域名、套餐、账单和资源所有权。
- `P0-08` 在单独授权后创建 Meta App 和只读授权路径。

使用 [Phase 0 问卷](phase-0-questionnaire.md)收集决定和脱敏证据。

## Phase 1 离线准备轨道

这不是正式 Phase 1 阶段转换。项目负责人只授权在 G0 `PARTIAL` 时并行完成：

- `P1-PREP-01`：本地 TypeScript Worker 与生成的绑定类型。
- `P1-PREP-02`：Workspace 作用域的初始 D1 migration。
- `P1-PREP-03`：固定虚构 fixture，禁止真实账户、Token 或响应。
- `P1-PREP-04`：Workers runtime、D1 约束、类型和安全失败测试。
- `P1-PREP-05`：只运行离线检查、不含 Secret 或部署步骤的 CI。

该轨道不得实现 Meta 客户端、同步、R2、Queue、Workflow、认证、远程接口或 deployment。
实现边界见[离线控制平面脚手架](../technical/offline-phase-1-scaffold.md)。

## 离线只读分析切片

项目负责人在完成基础脚手架后指示继续下一步并再次跳过配置。本切片仍不属于正式
Phase 1，只允许：

- `P1-OFFLINE-READ-01`：从固定 fixture 列出 Workspace 作用域内的广告账户。
- `P1-OFFLINE-READ-02`：校验有界日期范围和固定 allowlist 参数。
- `P1-OFFLINE-READ-03`：汇总花费、展示、点击和转化，并正确处理零分母。
- `P1-OFFLINE-READ-04`：返回币种、时区、点击口径、转化事件、归因、版本、新鲜度和
  稳定状态。
- `P1-OFFLINE-READ-05`：验证跨 Workspace、口径冲突、无数据和非本机请求安全失败。

接口必须使用 `/offline/` 前缀、固定虚构数据和本机 Host，不提供认证替代、任意查询、
Meta 客户端、同步或写操作。详见
[离线只读分析设计](../technical/offline-read-only-analysis.md)。

`P1-OFFLINE-READ-01`–`P1-OFFLINE-READ-05` 已于 2026-08-05 使用本地 fixture 完成验证；
该结果不改变 G0 `PARTIAL`，也不把正式 Phase 1 任务标记为完成。

## Phase 1：Cloudflare 数据控制平面

以下任务只适用于 Product Discovery 和后续技术评审选择 Cloudflare 方案的情况：

正式任务仍依赖 G0 `PASS`；离线准备轨道完成不能把下列任务标为完成。

- `P1-01` 创建 TypeScript Worker 和本地环境。
- `P1-02` 创建 D1 migration 和租户约束。
- `P1-03` 创建 R2、Queues、Workflows 的 staging 配置。
- `P1-04` 实现加密后的 Meta connection 存储。
- `P1-05` 实现 Meta 只读客户端、分页、限流和错误分类。
- `P1-06` 实现增量同步、按账户与广告对象归因上下文回补和历史 backfill。
- `P1-07` 实现数据质量检查和同步状态。
- `P1-08` 添加单元、集成和 fixture 测试。

## Phase 2：Codex 与只读分析

产品已选择 Codex 作为前期 AI 入口；Remote MCP 仍须单独评审：

- `P2-01` 建立 Codex 上下文文档与 Skills 的加载和验证规则。
- `P2-02` 创建素材、广告创建、分析、日报、优化和变更管理 Skills。
- `P2-03` 如果通过 ADR 选择 Remote MCP，实现认证和用户到 Workspace 映射。
- `P2-04` 如果选择 MCP，实现只读工具、分页、限制、错误 envelope 和安全日志。
- `P2-05` 创建代表性生成、分析和拒绝场景测试。

G2 只证明 Codex 辅助能力；完整产品还必须满足 Web 产品 Gate。

## Phase 3：Web 运营平台

Web 已被选择为业务产品主体，具体实现仍依赖 `DG0`、G0 和技术评审：

- `P3-01` 实现用户认证和 RBAC。
- `P3-02` 实现素材中心、广告创建和广告管理的首期范围。
- `P3-03` 实现数据分析、测试与优化、连接和账户配置。
- `P3-04` 实现建议、审批交接、同步状态和审计。
- `P3-05` 实现 accessibility、响应式、跨模块对象关系和 E2E 测试。

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
