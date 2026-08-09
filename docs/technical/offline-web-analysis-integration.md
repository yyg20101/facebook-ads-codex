---
doc_id: TECH-OFFLINE-WEB-ANALYSIS
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线 Web 分析接入切片

> 候选实现：本切片响应项目负责人再次“继续下一阶段”的指令，只把本地 Web 原型连接到
> 已获准的 fixture 周期对比接口。它不接受 `FR-005`、`FR-011`、候选 Cloudflare 架构
> 或正式 Web 契约，不构成 Phase 1、Phase 3、G1、G2 或 G3 证据。

## 目标与范围

允许实现：

- 在数据分析页显式选择两个 fixture 日期周期并请求离线 comparison 接口。
- 在后续获准切片中先从固定 Workspace 读取 fixture 账户列表，并只从列表选择账户。
- 在另一后续获准切片中读取所选账户的 fixture 对象层级；对象导航不改变账户级
  comparison 请求。再后续的独立对象级切片增加显式对象按钮和单独路由，账户级按钮
  继续保留。
- 展示基线值、当前值、变化方向、不可计算原因、数据覆盖和指标口径。
- 展示 Worker 返回的确定性诊断模式，同时明确 `causalClaim=false`、未使用阈值且不会
  执行建议。
- 提供 `idle`、`loading`、`success` 和 `error` 状态，并在 Worker 未启动、响应错误或
  契约不可信时安全失败。
- 使用组件测试和本地浏览器验证桌面、移动端布局及一次真实本机交互。

禁止增加真实广告账户、认证替代、远程 API、Secret、任意 URL、Meta 请求、写操作、
部署配置或自动优化。

## 本地连接边界

Vite 开发服务器只在 `127.0.0.1` 提供 `/offline-api/` 代理，并将请求转发到固定目标
`http://127.0.0.1:8791`；代理把 `/offline-api/` 重写为 Worker 已有的 `/offline/`。
浏览器代码只请求同源相对路径，不接受用户提供的主机、协议或 API 基址。

该代理只存在于 `vite dev`。生产构建中的离线接入入口 MUST 关闭，不能把本地 fixture
路径误认为可部署 API。Worker 继续执行其本机 Host、GET-only、固定 ID、fixture 开关和
Workspace 护栏；本切片不为 Worker 增加 CORS 或公开路由。

## 客户端契约

客户端固定 `ws_fixture_01`，广告账户最初固定为 `aa_fixture_01`；后续
[账户上下文选择切片](offline-web-account-context.md)将账户来源收紧为本机 Worker 返回并
通过验证的最多 10 个 fixture 列表项，不增加手工 ID。四个日期使用 `URLSearchParams`
编码。每次加载由用户操作触发；重复请求会取消前一个未完成请求，组件卸载时也会取消
请求。

收到 JSON 后 MUST 在使用前验证：

- 顶层成功 envelope、周期、指标、变化、诊断和 context 结构。
- `sourceKind=FIXTURE`。
- warnings 同时包含 `FIXTURE_DATA_ONLY` 与 `NO_EXTERNAL_CONNECTION`。
- `thresholdsApplied=false` 与 `causalClaims=false`。
- 每条诊断都具有 `findingConfidence=CONFIRMED_PATTERN` 和 `causalClaim=false`。

HTTP 错误显示稳定错误码和脱敏说明；成功状态下的契约不满足任一信任条件时显示
`INVALID_RESPONSE`，不得回退到静态数据并伪装成 Worker 结果。

## 页面表达

离线结果 MUST 与原有 Product Discovery 静态故事数据明确分区。结果区至少显示：

- “固定虚构数据”“未连接 Meta”“只读”“不含因果结论”。
- 广告账户 fixture 别名、两个实际周期、覆盖状态、币种、时区、点击口径、转化事件和
  数据稳定状态。
- 花费、点击、转化、CTR、CVR 与 CPA 的基线、当前值和变化。
- 诊断模式、证据字段和后续检查项；后续检查不得显示为已执行动作。

页面不得声称已认证、已连接 Meta、已分析真实广告、已确定原因或已实施优化。

## 验证

自动测试至少覆盖：

- 请求使用固定同源路径；账户来自已验证列表，日期参数经过编码。
- loading、成功、Worker 错误和不可信响应状态。
- fixture、无外部连接、无阈值和非因果标识不可缺失。
- 指标格式、零基线不可比较和诊断后续检查的呈现。
- TypeScript、生产构建、Worker runtime 与文档校验继续通过。

本地浏览器验证至少覆盖桌面和移动端，检查标题、关键 DOM、控制台、网络成功状态、
加载交互和横向溢出。验证后必须停止两个本地进程。

本切片完成后 G0 仍为 `PARTIAL`。正式 Web 开发仍须 G0、技术评审、接受后的需求与 ADR
以及项目负责人另行启动；真实数据或 deployment 不得从本地演示推导。

对象级范围的额外客户端绑定和显式交互见
[离线对象级分析](offline-object-level-analysis.md)。
