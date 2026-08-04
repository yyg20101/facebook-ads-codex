---
doc_id: GOV-STATUS
type: governance
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-05
---

# 项目状态与授权

本文是当前阶段、运行模式和授权布尔值的唯一事实源。其他文档只能链接本文，
不得复制这些值并形成第二份状态。

## 当前状态

```yaml
project_version: 1.0.0
delivery_state: READY_FOR_PHASE_0
current_phase: PRODUCT_DISCOVERY_COMPLETE
operation_mode: READ_ONLY
runtime_implementation_available: false
production_deployment_authorized: false
meta_write_operations_authorized: false
```

`READY_FOR_PHASE_0` 表示项目负责人已接受完整 Web 运营平台与独立 Codex 前期助手的
内部试点产品定义，`DG0` 已通过。负责人随后明确要求继续下一步，因此 Phase 0 的文档
确认已在[问卷](../planning/phase-0-questionnaire.md)中启动。该状态不代表 G0 已通过，
也不授权真实 Meta/Cloudflare 访问、业务运行时、部署或广告写操作。

`BQ-01`–`BQ-12` 已全部回答。Phase 0 仍为进行中，因为账户实际数据量、广告上下文、
Cloudflare 事实和 Meta 只读路径尚未在获得单独授权后验证。

`runtime_implementation_available: false` 指没有可连接真实业务数据或外部系统的业务
运行时。使用固定虚构数据、只在本地浏览器内改变状态的 Product Discovery 原型不构成
业务运行时可用。

## 当前允许

- 阅读、审查和维护项目文档。
- 制定实施计划。
- 依据已接受的产品定义回答 `BQ-01`–`BQ-12`，维护 Phase 0 决策、需求映射和脱敏证据。
- 重新评审候选需求、ADR、技术文档和后续 Gate，但不得把评审等同于实施授权。
- 开发、启动和验证只使用固定虚构数据的本地 Product Discovery 前端原型，以及
  不连接外部系统的 Codex 上下文包和 Skill 契约。
- 在项目负责人另行明确范围后，准备不接触真实账户的本地验证材料。

## 当前禁止

- 开发 Phase 1 或后续运行时代码。
- 在没有单独授权时执行 `P0-08`、访问真实账户或验证真实 Meta 只读接入。
- 部署 staging 或 production Cloudflare 资源。
- 创建 Meta App，或访问 Meta/Cloudflare 账户与真实业务数据。
- 创建、修改或删除 Meta 广告对象。
- 调整广告预算、状态、排期、受众、出价或创意。
- 创建、读取或轮换生产密钥。
- 邀请、删除或修改 Cloudflare/Meta 成员权限。

## 阶段转换记录

2026-07-30，项目负责人指示“先默认通过”，作为对当前内部试点产品定义、完整 Web
原型和 Codex 场景包的负责人验收，记录为 `DG0: PASS`。同一指令中的“继续下一步”
作为单独启动 Phase 0 文档确认的决定。证据见
[产品定义](../discovery/product-definition.md)和
[Phase 0 问卷](../planning/phase-0-questionnaire.md)。

本次转换后的项目状态为：

```yaml
delivery_state: READY_FOR_PHASE_0
current_phase: PRODUCT_DISCOVERY_COMPLETE
```

Phase 0 的 `BQ-01`–`BQ-12` 已完成负责人确认。`P0-02`、`P0-04`、`P0-07` 的外部
事实验证以及 `P0-08`、真实 Meta 只读验证和任何 Cloudflare 操作仍须项目负责人另行
明确授权；`DG0`、问卷完成或文档合并均不会扩大外部权限。

## 阶段启动检查

Codex 开始任何阶段前 MUST：

1. 阅读[项目章程](charter.md)、本文、[安全策略](../../SECURITY.md)及该阶段阅读清单。
2. 检查工作区，保留用户已有工作。
3. 核对阶段依赖、任务、Gate、`DQ-*`、`BQ-*` 和未决问题。
4. 给出本阶段计划及可验证完成条件。
5. 只实施当前已授权阶段。
6. 运行该阶段要求的测试和安全检查。
7. 记录完成项、未完成项、验证证据和下一 Gate。

## 授权变化

生产部署和 Meta 写操作是两个独立授权，不得相互推导。任何授权扩大必须：

1. 获得项目负责人明确指令。
2. 更新本文中的对应值和日期。
3. 更新受影响的需求、ADR、Gate、风险和测试。
4. 在变更日志中说明影响。

文档变更、阶段完成、PR 合并或部署工具可用都不构成授权。
