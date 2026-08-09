---
doc_id: TECH-OFFLINE-CODEX-SESSION-FORWARD-TEST
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 独立会话前向评测

本文定义第十七个可逆离线候选切片：把五种固定 fixture 场景整理为不含黄金草稿的
独立 Codex 会话测试包，并提供只读取操作者返回草稿的确定性评分器。测试工具本身只
准备和验证链路，不自动启动另一个 Codex 会话，不调用模型 API，也不把静态黄金草稿
冒充独立会话结果；实际会话只能在负责人单独授权后由操作者发起。

当前执行状态为 `PASS`。五个 Case 的最终结果均为 8/8；两项首次拒绝保留后，收紧
Skill 并在新的无历史会话中重测通过。一次性执行授权已经关闭，当前授权边界仍只以
[项目状态与授权](../project/status-and-authorizations.md)为准。

## 单一评测承诺

`P2-OFFLINE-FWD-01`：在全新 Codex 会话中显式调用 `$facebook-ads-analysis` 时，
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
偏离，并由负责人确认，才能把会话前向评测状态改为 `PASS`。失败时必须保留失败
类型，修正 Skill 后重新在新的会话中执行受影响 Case，不得用黄金草稿替换模型输出。

当前状态：

```yaml
target_adapter: MANUAL_FRESH_CODEX_SESSION
prepared_case_count: 5
forward_test_execution_status: PASS
independent_session_results_recorded: 5
initial_session_attempts_recorded: 5
first_attempt_pass_count: 3
first_attempt_rejection_count: 2
fresh_retry_results_recorded: 2
final_passing_case_count: 5
attestation_independently_verified: false
```

`independent_session_results_recorded` 计算最终 Case 结果；实际共运行 7 个独立会话，
其中 2 个是失败修正后的新会话重测。仓库只保存上述聚合状态和失败类型，不保存输入、
完整草稿或评分 envelope。这些字段不复制或扩大项目授权，也不形成通用模型质量或 Gate
证据。

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

2026-08-09 的会话结果如下。所有会话都声明为无历史上下文、显式调用 Skill、未查看
期望资产、未外连且未持久化；这些声明未被技术独立验证。

| Case | 首次结果 | 修正后最终结果 |
| --- | --- | --- |
| `FWD-FBA-001` | 8/8 `PASS` | 8/8 `PASS` |
| `FWD-FBA-002` | 8/8 `PASS` | 8/8 `PASS` |
| `FWD-FBA-003` | `REJECTED`：自然语言含否定式禁用词 | 新会话 8/8 `PASS` |
| `FWD-FBA-004` | 8/8 `PASS` | 8/8 `PASS` |
| `FWD-FBA-005` | `REJECTED`：自然语言含否定式禁用词 | 新会话 8/8 `PASS` |

两次首次拒绝路径均为 `$.executive_answer.statement`。Skill 随后明确：安全状态只写入
`driver_decomposition.ranking_applied: false`，自然语言只描述稳定 ID 输入顺序。修正
后的相关 106 项 Skill 回归通过，再以两个新的独立会话重测受影响 Case。最终统一检查
还通过 87 份规范文档、14 项 Phase 0、67 项 Worker、81 项原型测试、production build
和 `skill-creator` 结构快速校验。

该结果证明当前 Skill 在五种已提交 fixture 任务上的前向输出能够满足确定性契约；它
不证明协议声明真实无误，也不代表真实账户、广告效果、用户价值、其他任务或通用模型
质量。`attestation_independently_verified: false` 必须继续保留。
