---
doc_id: REQ-RBAC
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 角色与权限需求

产品定义已选择个人和小团队使用的 `OWNER`、`EDITOR`、`VIEWER` 角色。`BQ-11` 已确认
首期使用 Cloudflare Access 且仅允许项目负责人登录；本页不构成 Cloudflare 资源创建、
production 部署或 Meta 写操作授权。

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

Workspace 是候选授权边界；其最终实现及与 Meta Business 的关系仍需架构评审。首期
实际用户只有项目负责人一人，未来角色定义不得被误解为已开放外部客户或多租户。

## 角色矩阵

| Role | 读取数据 | 创建和编辑草稿 | 提交审批 | 最终审批 | 管理连接 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `OWNER` | 是 | 是 | 是 | 是 | 是 |
| `EDITOR` | 是 | 是 | 是 | 否 | 否 |
| `VIEWER` | 是 | 否 | 否 | 否 | 否 |

`BQ-10` 已确认只有 `OWNER` 拥有最终审批权。首期单用户 `OWNER` 可以审批自己提交的
申请，但提交和审批 MUST 是两个独立的显式动作，并分别产生不可修改的审计事件。

## 候选权限规则

- 服务端 MUST 根据认证用户和 `workspace_members` 计算权限。
- 客户端、网页或模型传入的角色不能作为授权证据。
- 所有对象访问 MUST 同时校验 Workspace 和 Meta Ad Account 绑定。
- 跨 Workspace 平台汇总默认拒绝；如后续需要，必须新增显式平台权限和审计。
- 审批人必须具有批准权限，且审批身份不能由系统或 Codex 伪造。
- `EDITOR`、`VIEWER`、Codex、后台任务和 Meta 账户角色均不能推导产品内审批权。
- 管理连接权限不自动授予 Cloudflare 部署、密钥读取或成员管理权限。

## 决策顺序

- `DQ-01`：选择首要内部试点用户。
- `DQ-07`：已选择 Web 业务平台与独立 Codex 前期助手的产品形态。
- `DQ-08`：确认内部试点信任和权限边界。

- `BQ-10`：已确认首期只有 `OWNER` 可以最终审批；单用户阶段不强制不同人员职责分离。
- `BQ-11`：已确认首期使用 Cloudflare Access，不建设外部客户身份系统。

Cloudflare Access 的具体身份提供方、允许列表、撤销和紧急访问策略仍需后续设计与验证；
未来增加其他用户或外部客户时必须重新评审认证和账户恢复要求。
