# 变更日志

本项目的重要文档和实现变化记录在此。项目尚未开始运行时实现，当前版本保持 `1.0.0`。

## [1.0.0] - 2026-07-30

### Added

- 按项目治理、需求、技术、规范、ADR、规划、Runbook 和模板组织的模块化文档体系。
- 稳定的 `FR-*`、`NFR-*`、`SEC-*` 和 `BQ-*` 标识及需求追踪矩阵。
- Product Discovery 文档、`DQ-01`–`DQ-08`、脱敏 `EVD-*` 证据契约和 `DG0`。
- 面向 3–5 名内部用户的访谈、三形态原型比较和产品定义模板。
- 独立的 ADR-001–ADR-006 文件。
- 文档元数据、权威、状态、Git、测试、安全和发布规范。
- 本地与 GitHub 文档质量检查。
- 已批准的根目录安全策略。

### Changed

- 文档入口改为 `docs/README.md`，各领域分别维护唯一事实源。
- 当前阶段和授权集中到项目状态文档。
- 架构、路线图、测试和安全内容拆分到对应领域。
- 具体 Cloudflare 账户事实改由 Phase 0 确认，仓库只保留逻辑名。
- 当前状态纠正为 `PRODUCT_DISCOVERY_REQUIRED` / `PRE_DISCOVERY`。
- Codex、Web、Cloudflare、MCP、自动化、现有需求和 ADR 降为候选假设。
- 原 Phase 0 改为依赖 `DG0`，不再承担目标用户、产品形态和 MVP 定义。

### Removed

- 删除旧单体执行规范及重复的派生架构和路线图，不保留兼容副本。

### Authorization

- 本版本只形成 Product Discovery-ready 文档基线，尚未通过 `DG0`。
- 本版本不包含运行时代码、Cloudflare 部署或 Meta 写能力。
