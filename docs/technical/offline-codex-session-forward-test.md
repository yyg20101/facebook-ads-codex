---
doc_id: TECH-OFFLINE-CODEX-SESSION-FORWARD-TEST
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 独立会话前向评测

本文定义第十七个可逆离线候选切片：把五种固定 fixture 场景整理为不含黄金草稿的
独立 Codex 会话测试包，并提供只读取操作者返回草稿的确定性评分器。本切片只准备和
验证测试链路，不自动启动另一个 Codex 会话，不调用模型 API，也不把静态黄金草稿
冒充独立会话结果。

当前执行状态为 `NOT_RUN`。原因是本轮没有启动全新 Codex 会话或模型 target；专项
自动测试通过只代表测试包隔离、固定上下文重建和评分链路可重复。当前授权边界仍只以
[项目状态与授权](../project/status-and-authorizations.md)为准。

## 单一评测承诺

`P2-OFFLINE-FWD-01`：未来在全新 Codex 会话中显式调用 `$facebook-ads-analysis` 时，
对五种已提交 schema v2 fixture 输入生成的最终 JSON 草稿应通过既有 8 项确定性契约，
且测试会话不得看到黄金草稿、连接外部系统或把输入/输出写入仓库。

本切片不评测：

- 隐式触发、真实 Meta 数据、真实账户授权或外部客户数据；
- 模型版本对比、主观文风、广告效果、业务阈值或优化建议质量；
- Web 自动交接、MCP、Cloudflare、部署或任何广告写操作；
- G0、G2、G3、通用模型质量或用户价值。

## 评测资产

```text
evals/facebook-ads-analysis/
  session-cases.mjs
scripts/
  prepare-facebook-ads-analysis-forward-test.mjs
  score-facebook-ads-analysis-forward-test.mjs
tests/
  facebook-ads-analysis-forward-test.test.mjs
```

`P2-OFFLINE-FWD-02`：`session-cases.mjs` 为五种 `analysis_kind` 各提供一个自然语言任务
和完整脱敏上下文，编号为 `FWD-FBA-001`–`FWD-FBA-005`。生成的测试包不包含 `draft`、
黄金 Case ID、期望 evidence path 或期望答案；协议明确禁止会话读取黄金草稿、草稿回归
测试和评分器源码。

| Case | `analysis_kind` | 会话任务 |
| --- | --- | --- |
| `FWD-FBA-001` | `ACCOUNT_COMPARISON` | 账户周期事实 |
| `FWD-FBA-002` | `OBJECT_COMPARISON` | Campaign 周期事实 |
| `FWD-FBA-003` | `DIRECT_CHILD_BREAKDOWN` | Campaign 到 Ad Set 的直接子对象事实 |
| `FWD-FBA-004` | `OBJECT_DAILY_TREND` | Campaign 连续日级事实 |
| `FWD-FBA-005` | `DIRECT_CHILD_DAILY_TREND` | 直接子对象逐日事实与父子汇总 |

## 准备测试输入

先查看用例，不启动模型：

```text
npm run skill:forward-test:list
```

按 Case 生成单个会话包：

```text
npm run skill:forward-test:prepare -- FWD-FBA-001
```

准备器固定返回 `execution_status: NOT_RUN`。它只向标准输出写 JSON，不创建结果文件、
网络连接或模型调用。真正执行时必须在仓库根目录开启全新 Codex 会话，只提供生成包中的
`prompt` 与 `context`，显式调用 Skill，并且不得让测试会话读取协议列出的评测资产。

该做法遵循 OpenAI 的
[Save workflows as skills](https://learn.chatgpt.com/use-cases/reusable-codex-skills)建议：
在后续任务中实际调用 Skill，观察错误后再更新。当前 Skill 是仓库代码工作流，不使用
面向 Mac UI 操作录制的 Record & Replay 代替会话测试。

## 接收和评分结果

`P2-OFFLINE-FWD-03`：评分器只接受下列内存或标准输入 envelope：

```json
{
  "case_id": "FWD-FBA-001",
  "draft": {},
  "protocol_attestation": {
    "fresh_session": true,
    "explicit_skill_invocation": true,
    "expected_output_seen": false,
    "golden_assets_read": false,
    "external_connections_used": false,
    "input_or_output_persisted": false
  }
}
```

运行：

```text
npm run skill:forward-test:score -- -
```

评分器根据 `case_id` 重建已提交 fixture，不接受调用者替换上下文。随后复用
`evaluate-draft.mjs` 校验 schema、范围、事实路径与原值、未知项、子对象覆盖、措辞和
`external_write: false`。任一协议声明或草稿契约失败即返回 `REJECTED`，不产生部分分数。

`protocol_attestation` 是操作者声明，评分结果必须保持
`attestation_independently_verified: false`。这可以记录测试纪律，但不能技术证明会话
确实全新或没有读取其他文件；因此单个 8/8 结果也不能独立建立模型质量证据。

## 通过规则与真实状态

`P2-OFFLINE-FWD-04`：只有五个 Case 都由独立全新会话执行、分别获得 8/8、没有协议
偏离，并由负责人确认，未来才能把会话前向评测状态改为 `PASS`。失败时必须保留失败
类型，修正 Skill 后重新在新的会话中执行受影响 Case，不得用黄金草稿替换模型输出。

当前状态：

```yaml
target_adapter: MANUAL_FRESH_CODEX_SESSION
prepared_case_count: 5
forward_test_execution_status: NOT_RUN
independent_session_results_recorded: 0
```

这些字段只说明本页评测工作，不复制或扩大项目授权。当前没有独立会话输出、模型质量
结论或 Gate 证据。

## 本地验证

```text
npm run skill:forward-test:check
npm run skill:check
```

专项测试验证五类用例、期望隔离、未知 Case、安全声明、错误 Case 绑定、标准输入评分、
安全拒绝及无模型/网络/写入客户端。它使用黄金草稿只验证评分管道能够识别一个已知合格
对象；该测试不会把黄金草稿标记为独立会话回答。

本切片不增加或修改 Web、Worker、HTTP、D1、Meta、MCP 或模型接口，不接受 `FR-005`、
`NFR-002`、任何 ADR 或候选架构，不改变 G0 `PARTIAL`，也不授权模型 API、真实数据、
外部访问、自动交接、部署或写操作。

## 当前验证结果

2026-08-09，11 项前向评测包专项测试通过，覆盖五类 Case、期望隔离、准备状态、Case
绑定、协议声明、标准输入评分、安全拒绝及无模型/网络/写入客户端。与输入和草稿契约
测试合计 34 项；统一检查还通过 85 份规范文档、14 项 Phase 0、67 项 Worker、81 项
原型测试和 production build，`skill-creator` 快速结构校验通过。

该结果只证明测试材料与确定性评分链路可重复。独立 Codex 会话执行数量仍为 0，
`forward_test_execution_status` 继续是 `NOT_RUN`。
