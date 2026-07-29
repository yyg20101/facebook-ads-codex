# 项目文档

本目录保存项目的规范性文档、派生说明和实施工作记录。

## 权威级别

发生冲突时按以下顺序处理：

1. 用户当前明确指令和平台安全要求。
2. [`FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md`](FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md)。
3. 已接受 ADR；当前 ADR 的规范正文仍位于执行规范中。
4. 架构、路线图、术语表等派生说明。
5. 问卷、计划和运行记录等工作文档。

派生文档不得扩大权限、降低安全要求或重新定义指标口径。发现冲突时应停止相关实现，
记录差异，并优先修正规范或派生文档。

## 文档地图

| 文档 | 类型 | 状态 | 说明 |
| --- | --- | --- | --- |
| [执行规范](FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md) | 规范性 | Ready for planning | 需求、ADR、接口、安全、阶段和 Gate |
| [架构概览](architecture/overview.md) | 派生说明 | Current | 组件、边界、数据流和运行模式 |
| [实施路线图](roadmap.md) | 派生说明 | Current | Phase 0–5 摘要和当前状态 |
| [术语表](glossary.md) | 派生说明 | Current | 业务、数据和执行术语 |
| [Phase 0 问卷](planning/phase-0-questionnaire.md) | 工作文档 | Not started | 阻塞问题、证据和 G0 检查 |
| [ADR 索引](decisions/README.md) | 导航 | Current | ADR-001–006 与新增 ADR 规则 |
| [ADR 模板](decisions/ADR-TEMPLATE.md) | 模板 | Ready | 新增架构决策的标准结构 |
| [Runbook 索引](runbooks/README.md) | 规划 | Planned | 运维文档清单和发布门槛 |
| [贡献指南](../CONTRIBUTING.md) | 流程 | Current | 文档和实现变更规则 |
| [安全策略](../SECURITY.md) | 策略 | Current | 威胁模型、安全不变量和报告范围 |
| [变更日志](../CHANGELOG.md) | 记录 | Current | 规范及项目变化 |

## 目录约定

```text
docs/
  FACEBOOK_ADS_CODEX_EXECUTION_SPEC.md  # 唯一规范性事实源
  README.md                              # 文档索引
  roadmap.md                             # 阶段摘要
  glossary.md                            # 术语
  architecture/                         # 派生架构说明
  decisions/                            # ADR 索引和未来 ADR
  planning/                             # 问卷、计划和 Gate 证据
  runbooks/                             # 经验证的运维流程
```

## 维护规则

- 规范性内容变化时递增规范版本并更新根目录变更日志。
- 派生文档应注明依据的规范版本和复核日期。
- 工作文档应注明状态、负责人和最后更新时间。
- Runbook 只有在实际环境验证并记录证据后才能标记为 `Operational`。
- 不在多个文件中复制完整规范段落；使用摘要和相对链接。
- 不在文档中保存密钥、Token、客户个人数据或未脱敏生产响应。
