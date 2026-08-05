---
doc_id: PLAN-DOC-MIGRATION
type: planning
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-08-05
---

# 文档基线迁移清单

本清单记录初始单体执行规范的内容去向。Git 历史保存旧文件，仓库不保留兼容副本。
迁移完成只表示内容没有静默丢失，不表示旧规范中的产品、功能或架构已经接受。

## 旧规范章节映射

| Section | 原主题 | 新事实源 | 处理 | 状态 |
| --- | --- | --- | --- | --- |
| 0 | Codex 执行契约与授权 | `project/status-and-authorizations.md`、`AGENTS.md` | 拆分授权与工作规则 | COMPLETE |
| 1 | 最终目标与成功结果 | `discovery/solution-hypotheses.md`、`requirements/product.md` | 保留为候选假设 | COMPLETE |
| 2 | ADR-001–006 | `decisions/ADR-001-*.md`–`ADR-006-*.md` | 拆分并降为 DRAFT | COMPLETE |
| 3 | Cloudflare 状态 | `technical/deployment-and-operations.md`、BQ-12 | 保留逻辑账户；删除个人标识 | COMPLETE |
| 4 | 范围 | `project/charter.md`、`requirements/product.md` | 章程只固定 Meta 领域 | COMPLETE |
| 5 | 用户、Workspace、租户 | `requirements/roles-and-permissions.md`、`technical/domain-and-data.md` | 拆分需求与模型 | COMPLETE |
| 6 | 目标系统结构 | `technical/architecture.md`、`standards/engineering.md` | 拆分设计与规范 | COMPLETE |
| 7 | Meta 接入 | `technical/meta-integration-and-sync.md`、`standards/security-and-secrets.md` | 拆分接入和 Secret 规范 | COMPLETE |
| 8 | 同步与存储 | `technical/domain-and-data.md`、`technical/meta-integration-and-sync.md` | 按数据和流程拆分 | COMPLETE |
| 9 | 指标语义 | `requirements/metrics-and-reporting.md` | 迁移公式与口径 | COMPLETE |
| 10 | Codex 分析流程 | `technical/codex-skills.md` | 迁移完整流程 | COMPLETE |
| 11 | Codex Skills | `technical/codex-skills.md` | 迁移原四个并按产品范围扩展候选 Skill | COMPLETE |
| 12 | Remote MCP 契约 | `technical/api-and-mcp-contracts.md` | 迁移工具与响应边界 | COMPLETE |
| 13 | 审批状态机 | `technical/auth-approval-and-audit.md` | 迁移状态、策略和操作矩阵 | COMPLETE |
| 14 | Web 产品 | `technical/architecture.md`、FR-011 | 从原控制台扩展为完整运营平台 | COMPLETE |
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
- [x] 六份 ADR 独立存在且因产品未定义统一为 `DRAFT`。
- [x] 新增 Product Discovery、DQ-01–DQ-08、EVD 契约和 DG0。
- [x] 旧产品、功能、技术和实现规范明确降为候选方案。
- [x] 本地文档校验通过，GitHub CI 已配置为运行同一命令。
- [x] 版本保持 `1.0.0`；当前新增内容仅为固定虚构数据的离线脚手架，没有部署或外部
  资源访问。
