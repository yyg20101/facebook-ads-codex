---
doc_id: REQ-RBAC
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 角色与权限需求

本页保存旧多用户方案的候选角色模型。首要用户和是否需要 Workspace、多角色、审批或
外部登录仍依赖 `DQ-01`、`DQ-07` 和 `DQ-08`，不能作为当前产品事实。

## 候选逻辑层级

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

如果产品发现选择多用户或多租户形态，Workspace 可以作为候选授权边界；是否采用及其
与 Meta Business 的关系必须重新评审。

## 候选角色矩阵

| Role | 读取数据 | 创建建议 | 提交变更 | 审批变更 | 管理连接 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `OWNER` | 是 | 是 | 是 | 是 | 是 |
| `ADMIN` | 是 | 是 | 是 | 是 | 是 |
| `OPERATOR` | 是 | 是 | 是 | 否 | 否 |
| `ANALYST` | 是 | 是 | 否 | 否 | 否 |
| `VIEWER` | 是 | 否 | 否 | 否 | 否 |

矩阵继承自初始设计，但文档保持 `DRAFT`。产品是否需要这些角色依赖 `DQ-01`、
`DQ-07`、`DQ-08`；实际成员、审批者和认证方式还依赖后续 `BQ-10` 与 `BQ-11`。

## 候选权限规则

- 服务端 MUST 根据认证用户和 `workspace_members` 计算权限。
- 客户端、网页或模型传入的角色不能作为授权证据。
- 所有对象访问 MUST 同时校验 Workspace 和 Meta Ad Account 绑定。
- 跨 Workspace 平台汇总默认拒绝；如后续需要，必须新增显式平台权限和审计。
- 审批人必须具有批准权限，且审批身份不能由系统或 Codex 伪造。
- 管理连接权限不自动授予 Cloudflare 部署、密钥读取或成员管理权限。

## 决策顺序

- `DQ-01`：选择首要内部试点用户。
- `DQ-07`：选择承载任务的产品形态。
- `DQ-08`：确认内部试点信任和权限边界。

- `BQ-10`：确定哪些用户可以审批，以及是否要求职责分离。
- `BQ-11`：选择 Cloudflare Access 或面向外部客户的认证系统。

只有 `DG0` 证明这些能力属于 MVP 后，Phase 0 才需记录用户类型、身份提供方、角色分配、
邀请/撤销流程和紧急访问策略。
