---
doc_id: STD-ENGINEERING
type: standard
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 工程规范

## 技术基线

- 运行时代码使用 TypeScript，并启用严格类型检查。
- Cloudflare Worker 是服务端运行时，React + Vite 是控制台基线。
- 输入、环境变量、第三方响应和持久化边界使用运行时 schema 验证。
- MVP 使用一个控制平面 Worker 和共享业务层，不提前拆分微服务。

## 模块边界

- `auth`：身份映射、Workspace 权限和 RBAC。
- `domain`：业务实体、规则和用例，不依赖传输层。
- `http` 与 `mcp`：只负责协议适配和 schema。
- `meta`：允许的 Meta API 适配，不暴露通用 Graph path。
- `sync` 与 `workflows`：批次、幂等、回补和恢复。
- `audit`：追加式脱敏事件和快照引用。

HTTP 与 MCP 必须复用 domain、auth 和 audit 逻辑。

## 类型与错误

- 禁止在受信任边界外使用未经验证的 `any`。
- 外部枚举、ID、日期和金额必须使用明确的领域类型或 schema。
- 货币值必须保留币种，不使用裸浮点数表示可变预算策略。
- 可预期失败返回稳定机器错误码；异常堆栈只用于受保护的内部诊断。
- `null`、缺失和零具有不同语义，不能互相替代。

## 依赖

- 只引入解决明确需求的依赖，优先选择维护活跃且可锁定版本的包。
- 生产和开发依赖使用 lockfile，CI 必须执行可重复安装。
- 新增高权限、网络、加密、schema 或持久化依赖时说明安全和供应链影响。

## 变更原则

- 每次变更关联需求 ID 和阶段任务。
- 不通过代码改变文档定义的指标、权限、状态机或安全策略。
- 不在未授权阶段创建后续能力的“隐藏开关”。
- 对不可逆数据或外部副作用提供前置验证、幂等和恢复路径。
