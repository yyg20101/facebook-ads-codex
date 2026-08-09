---
doc_id: TECH-OFFLINE-CODEX-WORKFLOW-SESSION-FORWARD-TEST
type: technical
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 离线 Codex 工作流 Skills 独立会话前向评测

本文定义第二十个可逆离线候选切片：为 `facebook-ads-creative`、
`facebook-ads-campaign-builder`、`facebook-ads-daily-brief`、
`facebook-ads-optimization` 和 `facebook-ads-change-management` 建立不含黄金草稿的
独立 Codex 会话测试包，并用现有确定性契约评分操作者返回的草稿。

当前执行状态为 `PASS`。五个 Case 的最终结果均为 8/8；三项首次拒绝在收紧对应
Skill 契约后，分别由新的无历史会话复测通过。一次性会话执行授权已经关闭，后续若需
再次运行，必须先在[项目状态与授权](../project/status-and-authorizations.md)取得新授权。

## 单一评测承诺

`P2-OFFLINE-WF-FWD-01`：五个全新 Codex 会话分别显式调用对应 Skill 时，针对已提交
fixture 上下文生成的最终 JSON 草稿应通过共同的 8 项确定性契约；测试会话不得看到
黄金草稿、连接外部系统或把输入、输出写入仓库及其他持久化介质。

本切片不评测：

- 隐式触发、真实素材、真实 Meta 数据、账户权限或客户数据；
- 主观创意质量、广告效果、Meta 政策、版权结论或模型版本比较；
- Web 自动交接、MCP、Cloudflare、部署、审批提交或广告写操作；
- 产品能力、G0、G2、G3、G4 或通用模型质量。

## 评测资产

```text
evals/facebook-ads-workflow-skills/
  session-cases.mjs
scripts/
  prepare-facebook-ads-workflow-forward-test.mjs
  score-facebook-ads-workflow-forward-test.mjs
tests/
  facebook-ads-workflow-forward-test.test.mjs
```

`P2-OFFLINE-WF-FWD-02`：`session-cases.mjs` 为五个 Skill 各提供一个自然语言任务与完整
脱敏上下文。生成包不包含最终草稿、期望答案或评分路径，并逐项列出允许读取的 Skill、
两份契约和输入 validator，以及禁止读取的黄金草稿、评分器和回归测试。

| Case | Skill | 代表性路径 |
| --- | --- | --- |
| `FWD-FBW-001` | `facebook-ads-creative` | 权利已确认的三组受控素材草稿 |
| `FWD-FBW-002` | `facebook-ads-campaign-builder` | Campaign、Ad Set、Ad 三层草稿 |
| `FWD-FBW-003` | `facebook-ads-daily-brief` | 已声明审核事件和人工查看事项 |
| `FWD-FBW-004` | `facebook-ads-optimization` | 样本不足时强制 `INCONCLUSIVE` |
| `FWD-FBW-005` | `facebook-ads-change-management` | 不可提交、不可执行的变更草稿 |

## 准备测试输入

列出用例但不启动会话：

```text
npm run skill:workflow:forward-test:list
```

生成单个会话包：

```text
npm run skill:workflow:forward-test:prepare -- FWD-FBW-001
```

准备器固定返回 `execution_status: NOT_RUN`，只向标准输出写 JSON。它不调用模型、网络或
文件写入客户端。真正执行时，每个 Case 必须使用无历史上下文的新会话，只把包内
`prompt` 与 `context` 作为任务事实，并遵守包内文件隔离清单。

## 接收和评分结果

`P2-OFFLINE-WF-FWD-03`：评分器只接受标准输入中的下列 envelope：

```json
{
  "case_id": "FWD-FBW-001",
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
npm run skill:workflow:forward-test:score -- -
```

评分器按 `case_id` 重建固定上下文，不接受操作者替换上下文，并复用
`evaluateWorkflowDraft` 校验输入、顶层结构、preflight、scope、未知项、工作流契约、
handoff 和安全不变量。它拒绝结果文件路径，只允许标准输入，避免把会话证据持久化。

`protocol_attestation` 仍只是操作者声明，结果必须保持
`attestation_independently_verified: false`。评分通过不能技术证明会话全新或文件隔离
真实成立。

## 通过规则与真实状态

`P2-OFFLINE-WF-FWD-04`：只有五个 Case 均在独立新会话中执行、分别获得 8/8、没有协议
偏离，并由负责人确认，才能把状态改为 `PASS`。首次失败必须按原错误路径保留；修正
Skill 后只能在新的无历史会话中重测受影响 Case，不得用黄金草稿替代模型输出。

当前状态：

```yaml
target_adapter: MANUAL_FRESH_CODEX_SESSION
prepared_case_count: 5
forward_test_execution_status: PASS
independent_session_results_recorded: 5
initial_session_attempts_recorded: 5
first_attempt_pass_count: 2
first_attempt_rejection_count: 3
fresh_retry_results_recorded: 3
final_passing_case_count: 5
scored_independent_session_count: 8
unscored_infrastructure_interruptions: 3
attestation_independently_verified: false
```

| Case | 首次结果 | 脱敏失败类型 | 全新复测 | 最终结果 |
| --- | --- | --- | --- | --- |
| `FWD-FBW-001` | `REJECTED` | `creative_brief.product_message` 未精确映射已批准信息点 | 8/8 | `PASS` |
| `FWD-FBW-002` | `REJECTED` | `ad_draft.fields` 增加契约外 `asset_ref` | 8/8 | `PASS` |
| `FWD-FBW-003` | `REJECTED` | `data_status` 增加契约外 `delivery_summary` | 8/8 | `PASS` |
| `FWD-FBW-004` | 8/8 | 无 | 不需要 | `PASS` |
| `FWD-FBW-005` | 8/8 | 无 | 不需要 | `PASS` |

三项首次拒绝分别促成精确批准信息点及来源路径、三层广告字段白名单、日报状态字段
白名单的契约收紧和回归覆盖。八个可评分独立会话都返回完整协议声明；另外三次基础设施
传输中断没有返回 envelope，因此既不评分，也不计入首次或复测结果。

仓库只允许保存最终聚合状态和脱敏失败类型，不保存完整 prompt、context、draft 或评分
envelope。任何 `PASS` 都只覆盖五个已提交 fixture 任务。

## 本地验证

```text
npm run skill:workflow:forward-test:check
npm run skill:check
```

专项回归验证五个隔离包、无黄金答案、未知 Case、`NOT_RUN` 准备器、固定 context 绑定、
协议声明、标准输入评分、安全拒绝和无模型、网络、持久化客户端。测试中的黄金草稿只用于
证明评分器能识别已知合格对象，不能登记为独立会话回答。

最终全仓验证通过：专项前向回归 12 项、工作流契约回归 72 项、统一 Skill 回归 119 项、
Phase 0 14 项、Worker 67 项、Web 原型 81 项以及 production build；文档校验覆盖 88 份
规范文档。沙箱内首次全仓运行仅因 Wrangler 日志目录和本机监听被拒绝而失败，在允许
Wrangler 写本机日志和绑定 `127.0.0.1` 的同一命令重跑后通过。

本切片不增加或修改 Web、Worker、HTTP、D1、Meta、MCP 或模型接口，不接受新的
`FR-*`、`NFR-*`、ADR 或候选架构，不改变 G0 `PARTIAL`，也不授权模型 API、真实数据、
外部访问、部署、审批提交或写操作。
