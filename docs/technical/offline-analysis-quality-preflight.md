---
doc_id: TECH-OFFLINE-ANALYSIS-QUALITY-PREFLIGHT
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-08
---

# 离线分析质量 Preflight

本文定义第十二个可逆离线候选切片：把既有
[离线数据质量报告](offline-data-quality-report.md)的全量通过结果作为本地 Web 指标分析
的强制 preflight。它不增加 Worker 路由，不接受任何候选需求或 ADR，也不构成真实数据
质量、分析有效性或 Gate 证据。

## 交互顺序

本地数据分析页按以下顺序工作：

1. 从固定 Workspace 读取并选择 fixture 账户。
2. 为 3–31 日范围运行数据质量 preflight。
3. 读取并导航 Campaign、Ad Set 和 Ad 层级。
4. 加载账户、对象或直接子对象周期对比。
5. 加载对象日趋势。
6. 加载直接子对象日趋势。

对象层级读取只用于选择上下文，可以在 preflight 前执行。所有指标读取入口在没有覆盖
目标范围的通过凭证时禁用；处理函数仍执行同样检查，不能只依赖按钮状态。

## 内存凭证

数据质量响应通过严格契约校验后，Web 在内存中建立
`OfflineDataQualityAttestation`，包含：

- 固定 `workspaceId`、fixture `accountId` 和核验起止日期；
- 报告中完整、稳定排序的 `objectIds`；
- 币种、时区、点击口径、转化事件、归因哈希和 API 版本；
- `stabilityStatus`、`fetchedAt` 和有序 `syncRunIds`；
- 本次质量请求的 `requestId` 与固定 `sourceKind: FIXTURE`。

凭证不得写入 URL、`localStorage`、持久化状态或 Worker。新账户、质量日期变化、新质量
请求、质量请求失败或页面卸载都会使旧凭证失效。

## 解锁条件

分析请求只有同时满足以下条件才允许发出：

- Workspace、账户、币种和时区与凭证完全一致；
- 每个分析周期都是合法日期范围，并完全位于凭证覆盖范围内；
- 对象级读取的对象 ID 存在于凭证的完整对象集合；
- 直接子对象读取的父对象同样存在于凭证对象集合；
- 账户变化或重新运行 preflight 时，正在执行的 comparison 请求被中止，旧结果被清除。

未满足前置条件时使用本地错误码 `QUALITY_PREFLIGHT_REQUIRED`，不得请求 Worker、回退到
旧结果或构造静态分析。

## 响应绑定

即使请求已发出，返回结果也必须与凭证再次对照：

- Workspace、账户、`sourceKind` 和六项指标口径完全一致；
- 单周期趋势的稳定状态、获取时间和同步批次完全一致；
- comparison 与直接子对象 comparison 的 baseline 和 current 两个快照都与凭证一致。

任一响应上下文或快照不一致时使用 `INVALID_RESPONSE` 拒绝结果。质量凭证只证明同一组
fixture 快照通过结构检查，不证明指标表现、因果关系或建议正确。

## 不变量

- 继续只允许 `127.0.0.1` 开发代理和同源 `/offline-api/` 相对路径。
- production 构建继续不渲染整个离线入口。
- 不新增 CORS、远程基址、认证替代、真实账户、真实同步、外部访问或写操作。
- 不应用业务阈值，不排名，不选择赢家，不解释趋势，不生成可执行优化动作。
- 通过 preflight 不改变 G0 `PARTIAL`，也不满足 G1、G2 或 G3。

## 验证

- 客户端测试覆盖账户、日期、对象、口径和快照绑定。
- 组件测试覆盖 preflight 前锁定、覆盖范围外重新锁定、重新核验失效和响应快照错配拒绝。
- 账户、对象、直接子对象 comparison 以及两类趋势都必须保留处理函数级防线。
- 浏览器验证必须覆盖桌面与移动视口、production 入口关闭、无控制台告警、无页面横向
  溢出和本地端口停止。

2026-08-08 的验证结果为：80 份规范文档、14 项 Phase 0、67 项 Worker 和 73 项原型
测试全部通过，production build 通过；本机五类分析请求成功，桌面与移动视口无控制台
告警或页面横向溢出，production 入口关闭，三个本地端口已停止。该记录仍只是候选
fixture 控制流证据。
