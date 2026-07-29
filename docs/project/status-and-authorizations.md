---
doc_id: GOV-STATUS
type: governance
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 项目状态与授权

本文是当前阶段、运行模式和授权布尔值的唯一事实源。其他文档只能链接本文，
不得复制这些值并形成第二份状态。

## 当前状态

```yaml
project_version: 1.0.0
delivery_state: PRODUCT_DISCOVERY_REQUIRED
current_phase: PRE_DISCOVERY
operation_mode: READ_ONLY
runtime_implementation_available: false
production_deployment_authorized: false
meta_write_operations_authorized: false
```

`PRODUCT_DISCOVERY_REQUIRED` 表示产品用户、问题、形态、内容和功能尚未确认。
`DG0` 通过前不得启动原 Phase 0、Meta 接入或 Cloudflare 技术准备。

## 当前允许

- 阅读、审查和维护项目文档。
- 制定实施计划。
- 准备 Product Discovery 的问题、访谈、脱敏证据和低保真原型材料。
- 在项目负责人明确启动 Product Discovery 后，开展已协调的内部用户研究。

## 当前禁止

- 开发 Phase 1 或后续运行时代码。
- 启动原 Phase 0 或回答 `BQ-*` 作为产品定义替代品。
- 部署 staging 或 production Cloudflare 资源。
- 创建 Meta App，或访问 Meta/Cloudflare 账户与真实业务数据。
- 创建、修改或删除 Meta 广告对象。
- 调整广告预算、状态、排期、受众、出价或创意。
- 创建、读取或轮换生产密钥。
- 邀请、删除或修改 Cloudflare/Meta 成员权限。

## Product Discovery 启动语句

项目负责人可在参与者已经由负责人协调后使用以下明确语句启动研究：

```text
按照 docs/project/charter.md、docs/project/status-and-authorizations.md 和 docs/discovery/README.md 开始执行 Product Discovery。
```

开始后将状态更新为：

```yaml
delivery_state: PRODUCT_DISCOVERY_IN_PROGRESS
current_phase: PRODUCT_DISCOVERY
production_deployment_authorized: false
meta_write_operations_authorized: false
```

`DG0` 通过且项目负责人确认产品定义后，才能更新为：

```yaml
delivery_state: READY_FOR_PHASE_0
current_phase: PRODUCT_DISCOVERY_COMPLETE
```

更新状态不会自动启动原 Phase 0，也不会扩大任何外部权限。

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
