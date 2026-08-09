---
doc_id: PLAN-OFFLINE-DIRECT-CHILD-DAILY-TREND
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# 离线直接子对象日趋势实施计划

## 范围

实施第十个可逆离线切片：在固定 fixture 上读取 Campaign/Ad Set 的全部直接子对象连续
日趋势，逐日与父对象对账，并接入本地 Web。设计事实源见
[离线直接子对象日趋势设计](../specs/2026-08-07-offline-direct-child-daily-trend-design.md)。

## 任务

1. 在项目状态、Phase 0 证据和校验器中登记有限授权；保持 G0 `PARTIAL` 与所有外部
   权限关闭。
2. 在 Worker 增加纯组合器，校验父子层级、统一上下文、稳定 ID 顺序和每日四项可加
   指标汇总。
3. 增加固定 `children-trend` GET 路由，复用既有趋势读取模型并对任一失败原子拒绝。
4. 先补 Worker 失败/成功测试，再实现路由；覆盖 Campaign、Ad Set、Ad、跨作用域、
   缺日、口径冲突和逐日对账错误。
5. 增加同源严格客户端，复算日期、9 项派生/原始指标、父子逐日汇总及所有信任边界。
6. 增加独立 Web 面板、多序列图与精确值表；指标切换不重新请求，Ad 入口禁用。
7. 同步技术、README、路线图、追踪、Runbook 和变更日志；运行 `npm run check`、
   production build 与桌面/手机本地浏览器验收。

## 完成定义

- 所有新增测试先证明缺失行为，再随实现通过。
- HTTP、客户端和 UI 均保留“无排名、无阈值、非因果、不解释趋势、不执行建议”。
- Worker 代码没有外部 `fetch`，Web 没有远程基址或手工 ID 输入。
- 生产构建仍关闭离线入口；没有真实配置、外部请求、部署或 Meta 写操作。
- 项目版本保持 `1.0.0`，阶段和 Gate 不转换。
