---
doc_id: STD-DOCUMENTATION
type: standard
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 文档规范

## 元数据

`docs/` 下每份 Markdown 文件必须以以下 front matter 开头：

```yaml
doc_id: stable-unique-id
type: index | governance | requirements | technical | standard | decision | planning | runbook | template | reference
status: DRAFT | ACCEPTED | SUPERSEDED
owner: responsible-role
last_reviewed: YYYY-MM-DD
```

文档不维护独立版本号；Git 历史和项目版本共同提供版本记录。

## 权威与状态

- `docs/README.md` 定义各领域唯一事实源和阅读顺序。
- 同一规范事实只能有一个维护位置，其他文档使用链接和必要摘要。
- `ACCEPTED` 表示可作为约束；`DRAFT` 不得被描述为已实施；`SUPERSEDED`
  必须链接替代文档。
- 当前执行状态和授权值只在项目状态文档维护。
- 安全政策只在根目录 `SECURITY.md` 定义，其他文档只能细化实现。

## 需求与决策 ID

- 产品发现问题：`DQ-NN`。
- 产品发现证据：`EVD-NNN`。
- 候选解决方案：`SH-NNN`。
- 产品功能决策：`PF-NNN`。
- 功能需求：`FR-NNN`。
- 非功能需求：`NFR-NNN`。
- 安全需求：`SEC-NNN`。
- 阻塞问题：`BQ-NN`。
- 架构决策：`ADR-NNN`。

ID 一经发布不得重新编号或复用于其他含义。新增项使用下一个连续编号。

## 写作

- 使用简体中文描述约束，代码标识、API 名称和状态值保留英文。
- 单个文件只有一个一级标题，标题层级连续。
- 规范要求使用 `MUST`、`MUST NOT`、`SHOULD`、`MAY`。
- 首次出现的项目术语链接术语表或给出定义。
- 示例使用不可用的占位标识，不包含真实账户、Token、个人数据或生产响应。
- Product Discovery 未知值写 `UNRESOLVED` 并关联 `DQ-*`；原 Phase 0 业务值关联
  `BQ-*`，不猜测默认值。
- 研究参与者只使用 `P-NN` 别名；仓库不得保存身份映射、联系方式或原始转录。
- `EVD-*` 只保存脱敏事实、推断、反证和限制，不能伪造或删除不利证据。

## 链接与图表

- 仓库内部使用相对链接，必须通过自动校验。
- 外部链接使用官方来源，但网络可用性不作为 CI Gate。
- Mermaid 图必须有清晰节点名，并在 GitHub 预览中人工检查。
- 删除或移动文件前先更新所有引用。

## 评审与更新

- 需求变化同步更新验收条件和追踪矩阵。
- 产品结论变化同步更新 `DQ-*`、`EVD-*`、产品定义与 `DG0`。
- 架构变化同步更新 ADR 和受影响技术文档。
- Gate 或授权变化同步更新项目状态、路线图和变更日志。
- Runbook 只有在目标环境实际验证并记录日期后才能声明可操作。
- 提交前必须运行 `npm run docs:check`。
