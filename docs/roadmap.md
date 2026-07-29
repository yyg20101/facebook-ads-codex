# 实施路线图

> **权威级别：派生说明。**
>
> 本文依据执行规范 `v1.0.0` 整理，最后复核日期为 2026-07-29。任务、依赖和
> Gate 的规范性定义以
> [`FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md`](FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md)
> 第 18–20 节为准。

## 当前状态

```text
Documentation baseline
  -> Phase 0 not started
  -> No runtime code
  -> No production deployment authorization
  -> No Meta write authorization
```

## 阶段总览

| 阶段 | 依赖 | 主要结果 | Gate |
| --- | --- | --- | --- |
| Phase 0：业务与权限确认 | 无 | 业务模型、KPI、权限、数据范围和主账户决策 | `G0` |
| Phase 1：数据控制平面 | `G0` | Worker、D1、R2、同步、质量检查和 staging 验证 | `G1` |
| Phase 2：MCP 与只读分析 | `G1` | Remote MCP、分析 Skill 和只读 MVP | `G2` |
| Phase 3：网页控制台 | `G1` | RBAC、配置、图表、同步状态和审计界面 | `G3` |
| Phase 4：审批式写操作 | `G2`、`G3`、独立授权 | 变更状态机、网页审批和有限 Meta 写入 | `G4` |
| Phase 5：有限自动化 | `G4`、经批准 Dry Run | 规则边界、熔断、白名单和审计自动化 | `G5` |

Phase 2 与 Phase 3 可以在 `G1` 后部分并行，但权限和租户测试不能跳过。

## Phase 0 下一步

Phase 0 需要完成：

- 确认管理自有还是客户 Meta 广告账户。
- 确认账户规模、目标、主 KPI、主转化事件和归因口径。
- 确认币种、时区、历史回填和保留期。
- 确认网页用户、角色、登录方式和审批权。
- 确认 Cloudflare 主账户、域名、套餐和生产所有权。
- 创建 Meta App 并建立只读授权路径。

使用 [`planning/phase-0-questionnaire.md`](planning/phase-0-questionnaire.md)
收集答案和证据。

## Gate 结果

| Gate | 可交付能力 | 不能推导出的授权 |
| --- | --- | --- |
| `G0` | 业务和只读接入条件确认 | 生产部署、Meta 写操作 |
| `G1` | staging 数据同步和数据质量验证 | 外部广告写入 |
| `G2` | Codex 只读分析 MVP | 网页审批、Meta 写操作 |
| `G3` | 授权网页控制台 | Meta 写操作 |
| `G4` | 审批式有限写操作 | 自动化写操作 |
| `G5` | 有边界自动化 | 超出白名单或预算边界的操作 |

## 阶段执行规则

每个阶段开始前必须：

1. 完整读取执行规范。
2. 检查并保留已有工作。
3. 核对依赖和 Gate。
4. 给出简短计划及可验证完成条件。
5. 只实施当前阶段。
6. 运行规定的测试和审计。
7. 记录完成项、证据、未完成项和下一 Gate。

当前启动 Phase 0 的明确语句为：

```text
按照 docs/FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md 开始执行 Phase 0。
```
