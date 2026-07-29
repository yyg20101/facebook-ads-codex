---
doc_id: STD-TESTING
type: standard
status: ACCEPTED
owner: project_owner
last_reviewed: 2026-07-30
---

# 测试规范

## 原则

- 测试关联需求 ID、阶段任务和 Gate。
- 外部系统使用可重复 fixture 或受控测试资产，不能依赖生产写入。
- 租户、安全、幂等和失败路径与正常路径同等重要。
- 测试通过必须保留命令、环境、提交和结果证据。
- 未执行的测试不得标记为通过。

## 单元测试

至少覆盖：

- KPI 公式、零分母、币种、时区和归因校验。
- Meta 错误分类、退避和重试判断。
- 状态机合法与非法转换。
- 预算、操作白名单和 Emergency stop。
- Token 加密、解密、版本和轮换。
- 同步与执行幂等键生成。
- schema、allowlist、日期和分页限制。

## 集成测试

至少覆盖：

- Meta 分页、限流、部分失败和异步 Insights Job。
- D1 transaction、外键和唯一约束。
- Queue 重试、死信和 Workflow 恢复。
- MCP/HTTP 用户到 Workspace 授权。
- R2 原始快照、导出和脱敏。
- audit 追加性和跨记录关联。
- migration 的空库、已有数据、重复执行与修复。

## E2E 测试

最低场景：

1. 连接 Meta、选择账户、首次同步、Codex 分析。
2. 同步失败、控制台显示、Codex 优先报告数据问题。
3. Codex 草拟变更、网页拒绝、不产生 Meta 调用。
4. 网页批准后对象发生变化，请求转为 `STALE`。
5. 批准请求执行一次，重试不重复修改。
6. Emergency stop 开启，所有 Meta 写操作安全失败。
7. 用户只能看到授权 Workspace，浏览器不出现 Token 或敏感错误。
8. 控制台关键流程支持键盘和目标屏幕尺寸。

## 安全测试

至少覆盖：

- 水平越权和跨 Workspace ID 枚举。
- 任意 Graph API path、URL/SSRF 和 SQL 注入。
- 日志、错误、快照和导出泄密。
- 重放执行、审批者伪造和 TTL 绕过。
- MCP 参数绕过和任意 payload。
- 缺失策略、对象变化和 Emergency stop 的安全失败。

## 文档测试

每次文档变更运行：

```text
npm run docs:check
```

检查 Markdown、内部链接、元数据、状态、ID、追踪矩阵、旧规范引用和常见敏感信息。

## Gate 证据

Gate 记录必须包含：

- 被验证的 requirement、task 和 Gate。
- commit、环境和配置版本。
- 执行命令或操作步骤。
- 预期与实际结果。
- 已知限制、失败和未覆盖范围。
- 证据所有者及日期。

详细 Gate 条件见[Gate 与证据](../planning/gates-and-evidence.md)。
