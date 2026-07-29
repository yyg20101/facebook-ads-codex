---
doc_id: REQ-NONFUNCTIONAL
type: requirements
status: DRAFT
owner: project_owner
last_reviewed: 2026-07-30
---

# 非功能与安全需求

## NFR-001：租户隔离

- 状态：`ACCEPTED`
- 要求：所有业务数据 MUST 由 `workspace_id` 隔离，外部 Meta ID 只能在 Workspace 作用域内唯一。
- 验收：水平越权、对象 ID 枚举和跨 Workspace 查询测试全部被服务端拒绝。

## NFR-002：指标一致性

- 状态：`ACCEPTED`
- 要求：币种、时区、归因窗口、转化事件和指标公式 MUST 显式记录并在比较前兼容。
- 验收：系统拒绝不兼容聚合；零分母返回 `null`，不返回 `0` 或无穷值。

## NFR-003：幂等

- 状态：`ACCEPTED`
- 要求：同步写入、任务重试和外部变更 MUST 使用稳定幂等键。
- 验收：重复运行不产生重复逻辑数据，同一外部操作最多成功一次。

## NFR-004：外部 API 韧性

- 状态：`ACCEPTED`
- 要求：Meta 客户端 MUST 处理分页、限流、重试、异步报表、权限错误和部分失败。
- 验收：重试有上限并可观测，非重试错误不会无限循环。

## NFR-005：可观测性

- 状态：`ACCEPTED`
- 要求：系统 MUST 监控同步新鲜度、失败率、限流、数据质量、MCP 延迟、审批队列和 Emergency stop。
- 验收：每项关键失败都能通过结构化日志、指标或审计事件定位。

## NFR-006：可恢复性

- 状态：`ACCEPTED`
- 要求：D1 migration MUST 可回滚或具备前向修复方案；广告变更通过新的反向申请恢复。
- 验收：恢复测试不依赖删除审计或原始证据，不把对象删除作为默认回滚。

## NFR-007：可访问与自适应界面

- 状态：`ACCEPTED`
- 要求：控制台 SHOULD 支持键盘操作、清晰状态、错误反馈和常用屏幕尺寸。
- 验收：Phase 3 完成 accessibility、响应式和关键流程 E2E 检查。

## NFR-008：性能与容量

- 状态：`DRAFT`
- 依赖：`BQ-02`
- 要求：同步批量、日期跨度、分页、查询行数和并发 MUST 受限。
- 验收：Phase 0 确认账户规模后定义容量基线和延迟目标。

## NFR-009：API 兼容性

- 状态：`ACCEPTED`
- 要求：Meta API 版本 MUST 显式固定，公开 MCP/HTTP 契约变化 MUST 可追踪并经过回归测试。
- 验收：版本升级在 staging 回归通过后才能用于 production。

## NFR-010：可维护性

- 状态：`ACCEPTED`
- 要求：MVP SHOULD 使用单一控制平面和共享业务层，避免无证据的微服务拆分。
- 验收：MCP 与 HTTP 使用同一认证、授权、查询、策略和审计实现。

## SEC-001：最小权限与服务端授权

- 状态：`ACCEPTED`
- 要求：系统 MUST 使用最小权限，并由服务端将认证主体映射为用户后计算权限。
- 验收：客户端传入的 `role`、`workspace_id` 或对象 ID 不能提升权限。

## SEC-002：凭据保密与加密

- 状态：`ACCEPTED`
- 要求：明文 Token 和根密钥 MUST NOT 进入仓库、D1、R2、日志、错误、浏览器或 Skill。
- 验收：租户 Token 服务端加密，根密钥只存在于 Cloudflare Secret 能力中。

## SEC-003：服务端 Meta 访问

- 状态：`ACCEPTED`
- 要求：Meta API 请求和 Token 解密 MUST 仅在服务端当前调用范围内发生。
- 验收：浏览器、Codex 和 Skill 无法取得 Token 或直接调用 Meta。

## SEC-004：受限接口能力

- 状态：`ACCEPTED`
- 要求：MCP/HTTP MUST NOT 接受任意 SQL、URL、Meta Graph path 或 Cloudflare API 请求。
- 验收：allowlist、schema 和负向安全测试阻止能力扩大。

## SEC-005：审批式外部写入

- 状态：`ACCEPTED`
- 要求：外部写入 MUST 基于网页批准、未过期、不可变且策略合规的 `change_request_id`。
- 验收：Codex 无法绕过网页审批或向执行工具传入任意 payload。

## SEC-006：审计与快照完整性

- 状态：`ACCEPTED`
- 要求：外部变更 MUST 保存脱敏 before/after 快照和不可由普通业务路径修改的审计事件。
- 验收：执行结果可关联 actor、request、目标、审批、幂等键和快照。

## SEC-007：安全失败与 Emergency stop

- 状态：`ACCEPTED`
- 要求：Emergency stop 默认开启；缺少策略、权限或口径时 MUST 安全失败。
- 验收：开启 Emergency stop 时所有 Meta 写操作被拒绝并产生审计事件。

## SEC-008：环境隔离

- 状态：`ACCEPTED`
- 要求：staging 和 production MUST 使用不同的密钥和数据资源。
- 验收：部署配置和 CI Token 按环境隔离且最小授权。

## SEC-009：安全日志与错误

- 状态：`ACCEPTED`
- 要求：日志和错误 MUST NOT 返回 Authorization Header、Token、原始认证响应、请求密钥字段或内部堆栈。
- 验收：日志与错误泄密测试覆盖成功、失败和重试路径。

## SEC-010：防重放与状态校验

- 状态：`ACCEPTED`
- 要求：执行前 MUST 校验审批状态、TTL、`before_hash`、策略、幂等键和 Emergency stop。
- 验收：过期、被篡改、对象已变化或已执行的请求不能再次成功。
