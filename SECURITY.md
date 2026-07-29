# Security Policy

## System and Scope

本策略适用于整个 `facebook-ads-codex` 仓库，以及后续按照执行规范实现的：

- Codex Skills 和 Remote MCP。
- Cloudflare Worker、HTTP API、Queues、Workflows、D1 和 R2。
- Web Control Console。
- Meta Marketing API 数据同步与受控写操作。
- 认证、授权、租户隔离、审批、审计和密钥处理代码。

仓库当前处于 Pre-Phase 0，没有可运行代码、生产部署或已授权的 Meta 写能力。
因此，本策略描述的是必须保持的安全边界，不代表控制已经实现或验证。

需要保护的核心资产包括 Meta Token、OAuth Token、加密根密钥、广告账户数据、
工作空间成员关系、审批记录、不可变变更 payload、审计日志和广告对象控制权。

## Threat Model and Trust Boundaries

以下输入默认不可信：

- Codex、MCP 和网页客户端传入的参数。
- `workspace_id`、`ad_account_id`、对象 ID 和角色声明。
- Meta API 响应、分页游标、错误和 Webhook 数据。
- 导入文件、筛选器、breakdown、日期范围和变更理由。
- 重放、过期或被篡改的变更请求。

主要威胁包括：

- 未授权用户读取其他工作空间或广告账户的数据。
- 绕过网页审批、工具确认、预算策略或 Emergency stop。
- 利用任意 URL、任意 Graph API、任意 SQL 或参数注入扩大访问。
- Token、密钥、客户数据或内部堆栈通过日志、错误、浏览器或存储泄露。
- 重放外部写操作、伪造审批身份或篡改审计证据。

服务端认证与授权层、Workspace 边界、Cloudflare 控制平面和 Meta API 是独立的
信任边界。Cloudflare 账户不能被当作 Meta 业务租户。

## Security Invariants

- 服务端必须将认证主体映射为内部用户，再计算工作空间权限。
- 所有业务查询和写入必须应用 `workspace_id` 隔离。
- 客户端或模型传入的角色和对象 ID不能作为授权证据。
- 明文 Token 不得进入仓库、D1、R2、日志、错误响应、浏览器或 Skill。
- 多租户 Token 必须加密；根密钥只能位于 Cloudflare Secrets Store 或 Worker Secret。
- MCP 和 HTTP API 不得支持任意 SQL、任意 URL 或任意 Meta Graph API 请求。
- 外部广告写操作只能接受已批准的 `change_request_id`。
- 执行前必须验证审批状态、权限、TTL、`before_hash`、策略、幂等键和 Emergency stop。
- 审计元数据和 before/after 快照必须脱敏且不能被普通业务流程修改。
- 缺少权限、预算、操作白名单或安全配置时必须安全失败。
- 生产与 staging 必须使用不同的密钥和数据资源。

## Reportable Findings and Severity Context

违反上述不变量且在当前代码、配置或部署中具有现实可达路径的问题应报告。

通常视为严重或关键的问题包括：

- 未授权或跨租户 Meta 写操作。
- 绕过审批状态机、Emergency stop 或操作白名单。
- 可用于控制广告账户或解密租户凭据的密钥泄露。
- 跨工作空间读取广告、成员、审批或审计数据。
- 任意 Graph API、SSRF、任意 URL 或任意 SQL 能力。
- 可成功重放写操作、伪造审批者或破坏审计完整性。

最终严重性必须结合可达性、所需权限、影响账户数量、数据敏感度和可恢复性判断。
仅存在于尚未实现功能中的规范缺口，应先作为设计或文档问题处理，除非它会明确导致
实现采用不安全边界。

## Out of Scope, Exclusions, and Accepted Risk

- Meta、Cloudflare、OpenAI 或其他第三方平台本身的漏洞应报告给对应提供商；但本项目
  对这些平台的不安全配置或集成方式仍属于本仓库范围。
- 未经明确授权，不得对第三方账户、生产资产或真实广告对象执行渗透测试。
- 纯文案、排版或非安全链接错误不属于安全发现，除非它们会导致权限或安全边界误用。
- 当前没有经过所有者确认的永久风险接受项或其他广泛排除项。

## Known Limitations and Compensating Controls

- 当前没有实现代码，因此租户隔离、加密、审批、审计和幂等控制尚未经过测试。
- 外部暴露面、网页认证方式和专用安全报告渠道仍需在 Phase 0 确认。
- `production_deployment_authorized=false` 和
  `meta_write_operations_authorized=false` 阻止当前生产部署及 Meta 写操作。
- Emergency stop、双重审批和写操作策略是后续实现要求，当前不能视为已存在的控制。

这些限制不得用于降低未来实现中安全发现的严重性。

## Reporting a Vulnerability

不要在公开 Issue、日志或聊天中提交 Token、密钥、客户数据或可直接复用的攻击载荷。

在专用安全报告渠道确定前，请通过仅仓库所有者可见的私密沟通渠道报告，并提供：

- 受影响组件和版本或提交。
- 所需前置权限和可达路径。
- 已脱敏的复现步骤。
- 可能影响的工作空间、广告账户或数据类型。
- 建议的临时缓解措施。

正式对外开放或部署生产环境前，项目所有者必须补充明确报告渠道、响应负责人和
响应时限。
