---
doc_id: STD-SECURITY-SECRETS
type: standard
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 安全与密钥规范

本规范实现根目录 [SECURITY.md](../../SECURITY.md) 的政策，不取代安全政策。

## Secret

- Secret 只保存在 Cloudflare Secret 能力或本地未跟踪环境中。
- 仓库、fixture、文档、日志和截图不得包含真实凭据。
- 多租户 Token 使用根密钥加密；根密钥与密文不得位于同一持久化边界。
- staging 与 production 使用不同 Secret 和加密材料。
- 轮换必须支持双版本解密窗口、完成证据和旧密钥撤销。

## 输入与输出

- 所有外部输入在授权和业务处理前经过 schema、长度和 allowlist 校验。
- 禁止通用 URL fetch、SQL、Graph path、云 API 代理和动态代码执行。
- 错误只返回稳定码和必要信息，内部诊断通过受保护日志关联。
- 导出、审计和快照采用最小字段并执行脱敏。

## 身份与授权

- 身份认证与 Workspace 授权是两个独立步骤。
- 每个业务请求重新校验成员、账户绑定和操作权限。
- 管理连接、审批变更和执行变更是不同权限。
- 不信任模型、浏览器或客户端声明的角色。

## 外部写操作

- 当前未授权 Meta 写操作时，服务端和部署配置都必须拒绝。
- 获得授权后仍需网页审批、Codex 工具确认、策略、TTL、`before_hash`、幂等和 Emergency stop。
- 任意校验失败即终止，不降级为更宽松路径。
- 禁止对象硬删除和未经审批的自动恢复写入。

## 安全审查

涉及认证、授权、Token、Workspace 查询、外部请求、审批、执行、日志或 migration
的变更必须包含：

- 威胁与租户影响。
- Secret 和敏感数据流。
- 失败是否安全。
- 负向测试和审计证据。
- 回滚或前向修复方案。
