# Facebook Ads Codex

面向 Meta/Facebook 广告全流程运营平台的产品发现与后续实现项目。

> 项目负责人已确认业务产品主体是完整 Web 运营平台，前期 AI 助手使用独立 Codex
> 会话、上下文、信息文档和 Skills。正确产品形态的本地交互原型和 Codex 场景包已
> 完成；`DG0` 仍为 `PARTIAL`，等待项目负责人完成产品走查。Cloudflare、MCP 和
> 运行时架构仍为候选方案。
>
> 当前阶段和授权以[项目状态与授权](docs/project/status-and-authorizations.md)为准。

## 当前目标

本轮只完成 `DG0` 剩余的产品形态验证：

- 已建立覆盖素材、广告创建与发布、投放管理、数据分析和持续优化的 Web 信息架构。
- 已使用 `SC-01`–`SC-03` 实现连续、可交互的本地 Web 产品流程。
- 已为三个场景准备使用上下文、信息文档和 Skills 的 Codex 辅助流程。
- 下一步由项目负责人走查并确认关键步骤覆盖率不低于 80%，且关键误解为 0。
- 结果通过后关闭 `DQ-08` 并评估 `DG0`。
- 在产品定义通过 `DG0` 前，不进入原 Phase 0 或任何技术实施。

固定范围和治理边界见[项目章程](docs/project/charter.md)，研究流程见
[产品发现入口](docs/discovery/README.md)。

## 已确认产品形态

| 层 | 职责 |
| --- | --- |
| Web 运营平台 | 业务对象、状态、素材、广告创建与管理、图表、操作和审计 |
| Codex 会话 | 前期 AI 生成、解释、诊断和建议，使用上下文、信息文档和 Skills |
| 后续受控工具 | 经独立评审后提供实时数据、保存对象和受控 Meta 操作 |

既有[技术文档](docs/technical/README.md)只保存候选方案，不能作为实施依据。
候选状态只在[候选解决方案登记](docs/discovery/solution-hypotheses.md)中维护。

## 文档导航

| 入口 | 用途 |
| --- | --- |
| [项目文档](docs/README.md) | 权威矩阵、任务阅读路径和完整导航 |
| [项目状态与授权](docs/project/status-and-authorizations.md) | 当前阶段和授权事实源 |
| [产品发现](docs/discovery/README.md) | 发现问题、研究、证据、形态验证和 DG0 |
| [产品设计](docs/superpowers/specs/2026-07-30-meta-ads-operations-platform-design.md) | 全流程 Web 平台与 Codex 辅助形态设计 |
| [原型计划](docs/superpowers/plans/2026-07-30-full-web-platform-prototype.md) | 正确产品形态的完整原型实施与验收 |
| [本地交互原型](prototype/README.md) | 启动方式、页面范围、流程和验收证据 |
| [Codex 场景包](docs/discovery/codex-prototype/README.md) | 三个场景的上下文、Skill 契约和 Web 交接 |
| [需求文档](docs/requirements/README.md) | 产品、功能、质量、角色、指标和追踪 |
| [技术文档](docs/technical/README.md) | 仅供比较的候选架构和实现方案 |
| [工程规范](docs/standards/README.md) | 代码、接口、数据、安全、测试和发布规则 |
| [ADR](docs/decisions/README.md) | 候选长期架构决策 |
| [路线图](docs/planning/roadmap.md) | Product Discovery、Phase 0–5 和 Gate |
| [安全策略](SECURITY.md) | 安全政策、威胁和报告范围 |
| [贡献指南](CONTRIBUTING.md) | 变更和评审流程 |

## 本地原型

原型只使用固定虚构数据，不包含后端、真实登录、Meta 连接或外部写入：

```bash
npm install
npm run prototype:dev
```

打开命令输出的本地地址。运行完整检查：

```bash
npm run check
```

开始任何工作前：

1. 阅读[项目文档入口](docs/README.md)中的通用阅读清单。
2. 确认[项目状态与授权](docs/project/status-and-authorizations.md)允许目标动作。
3. 检查并保留工作区已有变更。
4. 只实施当前明确授权的阶段。

当前只允许开展 Product Discovery。`DG0` 通过前不得启动原 Phase 0。

## 文档校验

安装开发依赖后运行：

```bash
npm run docs:check
```

该命令检查 Markdown、内部链接、元数据、稳定 ID、发现状态、需求追踪和常见敏感信息。

## 核心安全边界

- Token、Authorization Header、密钥、个人信息和客户数据不得进入仓库或研究证据。
- 未经明确授权，不得访问 Meta/Cloudflare 资源或创建、修改广告对象。
- 任何候选方案都不得把客户端或模型输入当作授权证据。
- 后续外部写能力必须先形成已接受的产品、安全和审批设计。

完整政策见 [SECURITY.md](SECURITY.md)。
