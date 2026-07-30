# Facebook Ads Codex

面向 Meta/Facebook 广告领域的产品发现与后续实现项目。

> 当前正在进行产品发现，目标用户、核心问题、产品形态、产品内容和 MVP 功能尚未确认。
> Codex、Web、Cloudflare、MCP 和自动化均为候选方案，不是已接受的产品前提。
>
> 当前阶段和授权以[项目状态与授权](docs/project/status-and-authorizations.md)为准。

## 当前目标

本轮只建立可验证的产品发现过程：

- 由项目负责人定义面向广泛 Meta 广告使用者的通用投放与数据分析助手。
- 使用至少 3 个代表性端到端场景明确产品能力、流程、异常和安全边界。
- 比较对话式、Web 工作台和混合式三种产品形态。
- 用负责人决策和场景评审确定支持用户、核心任务、产品内容和 MVP 功能。
- 在产品定义通过 `DG0` 前，不进入原 Phase 0 或任何技术实施。

固定范围和治理边界见[项目章程](docs/project/charter.md)，研究流程见
[产品发现入口](docs/discovery/README.md)。

## 候选产品形态

| 形态 | 验证方式 |
| --- | --- |
| Codex 对话式工作流 | 与同一核心任务进行比较测试 |
| Web 工作台式工作流 | 与同一核心任务进行比较测试 |
| Web 工作台 + 内置对话助手 | 与同一核心任务进行比较测试 |

既有[技术文档](docs/technical/README.md)只保存候选方案，不能作为实施依据。
候选状态只在[候选解决方案登记](docs/discovery/solution-hypotheses.md)中维护。

## 文档导航

| 入口 | 用途 |
| --- | --- |
| [项目文档](docs/README.md) | 权威矩阵、任务阅读路径和完整导航 |
| [项目状态与授权](docs/project/status-and-authorizations.md) | 当前阶段和授权事实源 |
| [产品发现](docs/discovery/README.md) | 发现问题、研究、证据、形态验证和 DG0 |
| [需求文档](docs/requirements/README.md) | 产品、功能、质量、角色、指标和追踪 |
| [技术文档](docs/technical/README.md) | 仅供比较的候选架构和实现方案 |
| [工程规范](docs/standards/README.md) | 代码、接口、数据、安全、测试和发布规则 |
| [ADR](docs/decisions/README.md) | 候选长期架构决策 |
| [路线图](docs/planning/roadmap.md) | Product Discovery、Phase 0–5 和 Gate |
| [安全策略](SECURITY.md) | 安全政策、威胁和报告范围 |
| [贡献指南](CONTRIBUTING.md) | 变更和评审流程 |

## 开始工作

当前不需要安装业务依赖或启动服务。开始任何工作前：

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
