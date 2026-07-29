---
doc_id: REQ-RBAC
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 角色与权限需求

## 逻辑层级

```text
User
  -> Workspace
      -> Meta Connection
          -> Meta Business
              -> Meta Ad Account
                  -> Campaign
                      -> Ad Set
                          -> Ad
```

Workspace 是授权边界。Cloudflare 账户和 Meta Business 不得取代 Workspace。

## 候选角色矩阵

| Role | 读取数据 | 创建建议 | 提交变更 | 审批变更 | 管理连接 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `OWNER` | 是 | 是 | 是 | 是 | 是 |
| `ADMIN` | 是 | 是 | 是 | 是 | 是 |
| `OPERATOR` | 是 | 是 | 是 | 否 | 否 |
| `ANALYST` | 是 | 是 | 否 | 否 | 否 |
| `VIEWER` | 是 | 否 | 否 | 否 | 否 |

矩阵继承自初始设计，但文档保持 `DRAFT`，因为实际成员、审批者和认证方式仍依赖
`BQ-10` 与 `BQ-11`。

## 权限规则

- 服务端 MUST 根据认证用户和 `workspace_members` 计算权限。
- 客户端、网页或模型传入的角色不能作为授权证据。
- 所有对象访问 MUST 同时校验 Workspace 和 Meta Ad Account 绑定。
- 跨 Workspace 平台汇总默认拒绝；如后续需要，必须新增显式平台权限和审计。
- 审批人必须具有批准权限，且审批身份不能由系统或 Codex 伪造。
- 管理连接权限不自动授予 Cloudflare 部署、密钥读取或成员管理权限。

## Phase 0 决策

- `BQ-10`：确定哪些用户可以审批，以及是否要求职责分离。
- `BQ-11`：选择 Cloudflare Access 或面向外部客户的认证系统。

关闭问题时必须记录用户类型、身份提供方、角色分配、邀请/撤销流程和紧急访问策略。
