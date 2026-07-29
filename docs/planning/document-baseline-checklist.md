---
doc_id: PLAN-DOC-MIGRATION
type: planning
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 文档基线迁移清单

本清单记录初始单体执行规范的内容去向。Git 历史保存旧文件，仓库不保留兼容副本。

## 旧规范章节映射

| Section | 原主题 | 新事实源 | 处理 | 状态 |
| --- | --- | --- | --- | --- |
| 0 | Codex 执行契约与授权 | `project/status-and-authorizations.md`、`AGENTS.md` | 拆分授权与工作规则 | COMPLETE |
| 1 | 最终目标与成功结果 | `project/charter.md`、`requirements/product.md` | 拆分目标与验收 | COMPLETE |
| 2 | ADR-001–006 | `decisions/ADR-001-*.md`–`ADR-006-*.md` | 拆成独立 ADR | COMPLETE |
| 3 | Cloudflare 状态 | `technical/deployment-and-operations.md`、BQ-12 | 保留逻辑账户；删除个人标识 | COMPLETE |
| 4 | 范围 | `project/charter.md`、`requirements/product.md` | 章程成为范围事实源 | COMPLETE |
| 5 | 用户、Workspace、租户 | `requirements/roles-and-permissions.md`、`technical/domain-and-data.md` | 拆分需求与模型 | COMPLETE |
| 6 | 目标系统结构 | `technical/architecture.md`、`standards/engineering.md` | 拆分设计与规范 | COMPLETE |
| 7 | Meta 接入 | `technical/meta-integration-and-sync.md`、`standards/security-and-secrets.md` | 拆分接入和 Secret 规范 | COMPLETE |
| 8 | 同步与存储 | `technical/domain-and-data.md`、`technical/meta-integration-and-sync.md` | 按数据和流程拆分 | COMPLETE |
| 9 | 指标语义 | `requirements/metrics-and-reporting.md` | 迁移公式与口径 | COMPLETE |
| 10 | Codex 分析流程 | `technical/codex-skills.md` | 迁移完整流程 | COMPLETE |
| 11 | 四个 Codex Skills | `technical/codex-skills.md` | 迁移四个聚焦 Skill | COMPLETE |
| 12 | Remote MCP 契约 | `technical/api-and-mcp-contracts.md` | 迁移工具与响应边界 | COMPLETE |
| 13 | 审批状态机 | `technical/auth-approval-and-audit.md` | 迁移状态、策略和操作矩阵 | COMPLETE |
| 14 | Web Console | `technical/architecture.md`、FR-011 | 迁移页面与行为 | COMPLETE |
| 15 | 定时任务 | `technical/deployment-and-operations.md`、`technical/codex-skills.md` | 按执行主体拆分 | COMPLETE |
| 16 | 安全要求 | `SECURITY.md`、`technical/security-architecture.md`、安全规范 | 政策、设计、实践分层 | COMPLETE |
| 17 | 可观测性与质量 | `technical/deployment-and-operations.md`、日志规范、数据设计 | 按责任拆分 | COMPLETE |
| 18 | Phase 0–5 | `planning/roadmap.md`、`planning/gates-and-evidence.md` | 拆分任务与 Gate | COMPLETE |
| 19 | 测试矩阵 | `standards/testing.md` | 迁移四类测试 | COMPLETE |
| 20 | Definition of Done | `planning/gates-and-evidence.md` | 迁移三层完成定义 | COMPLETE |
| 21 | Blocking Questions | `planning/phase-0-questionnaire.md` | 保持 BQ-01–BQ-12 | COMPLETE |
| 22 | 官方参考 | `docs/README.md` | 迁移官方链接 | COMPLETE |
| 23 | 变更规则 | `standards/documentation.md`、`standards/git-review-and-release.md` | 按文档和发布拆分 | COMPLETE |

## 旧派生文档

| 旧文件 | 处理 | 状态 |
| --- | --- | --- |
| 旧 architecture 概览 | 由 `docs/technical/architecture.md` 替换 | COMPLETE |
| 旧 docs 根级路线图 | 移入 `docs/planning/roadmap.md` 并扩充 | COMPLETE |
| `docs/glossary.md` | 保留路径并升级元数据 | COMPLETE |
| `docs/decisions/README.md` | 改为独立 ADR 索引 | COMPLETE |
| `docs/runbooks/README.md` | 保留并增加标准模板 | COMPLETE |

## 完成检查

- [x] 删除单体执行规范，不保留 stub。
- [x] 删除旧架构概览和旧位置路线图。
- [x] 根 README、AGENTS、贡献指南和变更日志已更新。
- [x] 仓库中旧规范路径引用为零。
- [x] 12 个阻塞问题全部保留且只定义一次。
- [x] 六份 ADR 独立存在且状态为 `ACCEPTED`。
- [x] 本地文档校验通过，GitHub CI 已配置为运行同一命令。
- [x] 本轮交付目标固定为 `dev`，`main` 不在变更范围。
