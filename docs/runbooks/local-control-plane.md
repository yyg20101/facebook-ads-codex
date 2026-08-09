---
doc_id: RUNBOOK-LOCAL-CONTROL-PLANE
type: runbook
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-09
---

# 本地离线控制平面

## 元数据

- 环境：`local`
- 状态：`DRAFT`
- 所有者：`project_owner`
- 审批者：`project_owner`
- 最近验证：2026-08-08
- 关联任务/Gate：`P1-PREP-*`、`P1-OFFLINE-*`、`P2-OFFLINE-EVAL-*`、
  `P3-OFFLINE-*`；不计入任何 Gate

## 目的与触发

本 Runbook 用于安装、检查和手工启动只包含虚构 fixture 的 Worker/D1 脚手架、已批准
的离线只读汇总、周期诊断与广告对象层级切片，以及本地 Web 分析与账户上下文接入。
它也覆盖后续获准的固定 fixture 对象级周期分析、直接子对象拆解、对象日趋势和直接
子对象日趋势、全账户离线数据质量报告，以及把质量通过结果绑定到本地指标分析的
preflight 和从当前可信 comparison 派生的手动 Codex 分析证据包。
本 Runbook 还覆盖从当前可信对象趋势或直接子对象趋势派生 schema v2 手动输入。
当前还覆盖显式调用项目级 `facebook-ads-analysis` 校验该输入并生成分层只读草稿。
当前进一步覆盖五种固定黄金场景和最终草稿确定性评分，但不调用模型。
它不适用于 staging、production、真实 Meta 数据或 Cloudflare 远程资源。

## 权限与安全边界

- [授权事实源](../project/status-and-authorizations.md)必须允许离线脚手架。
- MUST NOT 执行 `wrangler login`、`wrangler deploy` 或任何 remote D1 命令。
- MUST NOT 替换 Wrangler 中的本地占位 ID、增加 route 或写入 Secret。
- MUST NOT 把真实 ID、Token、响应或广告数据放入 fixture。
- 命令只能操作仓库、依赖缓存和本地 Miniflare 状态。

## 前置检查

1. 使用 Node.js `20.18.1` 或更高版本。
2. 确认当前状态仍禁止 deployment 和 Meta 写操作。
3. 确认 `services/control-plane-worker/wrangler.jsonc` 保持本地占位数据库 ID，且没有 route。
4. 安装锁定依赖：

   ```text
   npm ci
   ```

## 自动验证

执行：

```text
npm run worker:check
npm run skill:check
```

成功条件：

- Wrangler 生成类型与配置一致。
- Worker 与测试 TypeScript 严格检查通过。
- Workers runtime 中所有测试通过。
- D1 migration 和 fixture 可重复应用。
- 没有网络请求、真实凭据、部署或远程资源副作用。
- Skill 校验器、fixture 正反测试、显式调用策略和无外部依赖检查通过。
- 五种黄金草稿、evidence path/原值、未知项、直接子对象覆盖与安全拒绝检查通过。

## 手工本地启动

需要查看健康响应或本地 Web 端到端分析时才执行：

```text
npm run worker:db:migrate:local
npm run worker:db:seed:local
npm run worker:dev:web
```

仅请求本机显示的 `/healthz` 或
[离线只读分析设计](../technical/offline-read-only-analysis.md)列出的 `/offline/` 路径。
周期对比只使用
[离线周期诊断](../technical/offline-period-comparison-and-diagnostics.md)列出的路径。不得
向其他设备暴露端口，也不得增加设计外的业务数据路由。对象层级只使用
[离线广告对象层级](../technical/offline-ad-object-hierarchy.md)列出的无 query 参数路径。
对象级 comparison 只使用
[离线对象级分析](../technical/offline-object-level-analysis.md)列出的已验证对象路径。
直接子对象拆解只使用
[离线直接子对象拆解](../technical/offline-direct-child-breakdown.md)列出的 Campaign 或
Ad Set 路径；不得对 Ad 构造伪子级。
对象日趋势只使用
[离线对象日趋势](../technical/offline-object-daily-trend.md)列出的已验证对象路径和
`date_start`、`date_stop` 参数；不得增加动态指标、排序或 breakdown 参数。
直接子对象日趋势只使用
[离线直接子对象日趋势](../technical/offline-direct-child-daily-trend.md)列出的 Campaign
或 Ad Set `children-trend` 路径；不得对 Ad 构造伪子级，也不得增加排名或动态指标参数。
离线数据质量只使用
[离线数据质量报告](../technical/offline-data-quality-report.md)列出的账户 `data-quality`
路径和 `date_start`、`date_stop`；不得增加效果阈值、排序、指标或 breakdown 参数。
Web preflight 边界见
[离线分析质量 Preflight](../technical/offline-analysis-quality-preflight.md)；它不得新增
Worker 路由，也不得把内存凭证持久化或当作认证与真实授权。
Codex 手动输入边界见
[离线 Codex 分析证据包](../technical/offline-codex-evidence-bundle.md)；它只由 Web 当前
成功结果派生，不得新增 Worker 路由、持久化、自动上传或生成分析结论与建议。
趋势输入扩展见
[离线 Codex 趋势证据包](../technical/offline-codex-trend-evidence.md)；它必须输出完整固定
9 项日值，直接子对象保持稳定顺序并逐日对账，不得解释趋势或排名。
Skill 输出边界见
[离线 Codex 分析 Skill](../technical/offline-codex-analysis-skill.md)；它只能显式读取手动
提供的 schema v2 fixture 输入，不得自动读取页面、连接外部工具或生成优化动作。
草稿回归边界见
[离线 Codex 分析草稿评测](../technical/offline-codex-analysis-evals.md)；它只运行固定
fixture 和确定性评分器，不得调用模型、修改 prompt 或访问外部服务。
独立会话评测边界见
[离线 Codex 独立会话前向评测](../technical/offline-codex-session-forward-test.md)；当前一轮
最终 5/5 Case 为 8/8，一次性执行授权已经关闭。准备和评分工具仍不得自行启动会话，
再次运行须取得新授权。

如需验证 Web 页面，在 Worker 保持运行时打开第二个终端：

```text
npm run prototype:dev
```

只打开 Vite 输出的 `127.0.0.1` 地址。在数据分析页点击“读取 fixture 账户”并从返回列表
选择账户；先确认账户、对象、直接子对象 comparison 和两类趋势按钮均锁定。于“步骤 2”
设置 `2026-08-02` 至 `2026-08-04`，点击“运行离线数据质量核验”，确认 24/24 行、
7/7 项检查、1 个 Campaign、2 个 Ad Set、4 个 Ad 及三层逐日对账均通过，并显示
“分析 preflight 已就绪”“不评价表现”和“不作为 Gate 证据”。

随后读取对象层级并选择 Campaign，确认被同一凭证覆盖的账户、对象和直接子对象
comparison 按钮解锁；加载直接 Ad Set 拆解，确认两个子对象按 ID 稳定展示、两期父子
对账通过并明确无排名。选择一个 Ad 后确认拆解按钮禁用。加载所选对象趋势，切换 CTR
与 CPA 并确认不产生第二次趋势请求、图表和日值表同步更新且页面显示“不解释趋势”。
重新选择 Campaign 并加载直接子对象趋势，确认父对象参考线、稳定子对象序列、逐日
父子对账和“无排名”；切换点击指标不得产生第二次 `children-trend` 请求。

加载账户 comparison，确认“Codex 手动上下文”出现只读 JSON，并核对
`CODEX_ANALYSIS_INPUT`、`source_kind: FIXTURE`、preflight `PASS`、`FACT` / `UNKNOWN`、
`recommendations_generated: false`、`external_write: false` 和 `persisted: false`。
JSON 不得包含 comparison 或质量请求 ID。选择 Campaign 加载直接子对象拆解后，确认
`driver_inputs` 保留两个 Ad Set 的稳定顺序、父子对账和 `ranking_applied: false`。

加载对象趋势后，确认其下方 JSON 为 `OBJECT_DAILY_TREND`、schema v2、完整 9 项指标
和 3 个日点；切换图表指标后 JSON 字节不变。加载 Campaign 的直接子对象趋势后，确认
JSON 为 `DIRECT_CHILD_DAILY_TREND`，`driver_inputs.kind` 为
`DIRECT_CHILDREN_DAILY`，两个 Ad Set 顺序稳定且 `daily_matches_parent: true`。两份 JSON
都不得包含趋势请求追踪值，改变日期、对象或 preflight 后必须与趋势结果同步消失。

在仓库根目录启动独立 Codex 会话，显式使用 `$facebook-ads-analysis`，再手动提供当前
只读 JSON。Skill 必须先返回或内部确认校验通过，最终草稿必须区分 `FACT`、
`INFERENCE`、`UNKNOWN`，事实带 JSON path，推断带置信度和替代解释，并保持
`ranking_applied: false`、`external_write: false`。若需要单独复核校验器，可把 JSON
通过标准输入传给 `.agents/skills/facebook-ads-analysis/scripts/validate-context.mjs -`；
不得把输入保存到仓库或浏览器持久化存储。schema、公式、对账、敏感字段或 guardrail
任一失败时必须停止，不能输出部分分析。

运行 `npm run skill:eval`，确认五种 `analysis_kind` 黄金草稿均返回 8/8；随后检查伪造
路径、错误原值、删除未知项、遗漏子对象、排名、因果/执行措辞和
`external_write: true` 均安全拒绝。运行数据只使用已提交 fixture，不提供 API key，
也不启动 Worker、Web、MCP 或模型服务。

运行 `npm run skill:forward-test:list` 查看五个独立会话 Case，再用
`npm run skill:forward-test:prepare -- FWD-FBA-001` 生成一个只含任务、fixture 上下文和
测试协议的 JSON 包。准备器固定返回 `execution_status: NOT_RUN`；不得在当前受污染会话
内生成回答后冒充全新会话结果，也不得读取 `golden-cases.mjs` 作为回答来源。

未来再次获得独立会话执行授权后，应在每个全新会话中只提供对应包，显式调用
`$facebook-ads-analysis`，再把返回 JSON 与完整 `protocol_attestation` 通过标准输入交给
`npm run skill:forward-test:score -- -`。五个 Case 必须分别 8/8；评分器返回的
`attestation_independently_verified: false` 必须保留。当前一轮已完成最终 5/5 `PASS`，
一次性授权已经关闭；不得把该结果记录为 Gate 或通用模型证据。

五个 Creative/工作流 Skill 使用独立命令：

```text
npm run skill:workflow:forward-test:list
npm run skill:workflow:forward-test:prepare -- FWD-FBW-001
npm run skill:workflow:forward-test:score -- -
npm run skill:workflow:forward-test:check
```

准备器同样固定返回 `NOT_RUN`，评分器只接受标准输入。当前一次性执行最终为 5/5 Case、
每项 8/8；三项首次拒绝只在收紧对应 Skill 后由新的无历史会话复测。执行授权已关闭，
再次运行必须先取得新授权，并继续隔离黄金草稿、评分器、外部连接和持久化。该结果只
覆盖固定 fixture，不代表实际素材、Meta 对象、实时日报、已批准优化或可执行变更。

把任一分析日期改到 preflight 覆盖范围外，确认对应入口立即重新锁定且不会发送指标
请求；重新运行覆盖新范围的质量检查后才可恢复。改变账户、质量日期或重新发起质量请求
时，旧凭证和旧指标结果必须清除。分析响应的口径、稳定状态、获取时间或同步批次不匹配
时必须拒绝，不得回退到旧结果；旧 Codex JSON 也必须同时消失。同时确认账户级与对象级
入口仍独立存在。
账户选择边界见
[离线 Web 账户上下文](../technical/offline-web-account-context.md)。开发代理固定将
`/offline-api/` 重写到 `127.0.0.1:8791` 的 Worker `/offline/`；不得修改为远程目标。
核对完成后使用 `Ctrl-C` 停止两个进程，并确认端口不再监听。

## 失败与恢复

- 类型不一致：重新执行 `npm run worker:types`，审查生成差异后再测试。
- migration 失败：保留错误，检查初始 schema 和 fixture；不得跳过失败或连接远程 D1。
- 本地状态污染：停止 Worker，重新创建本地模拟状态后重跑 migration；不得修改远程资源。
- 依赖审计失败：评估受影响链并更新锁定版本，不运行强制破坏性修复。

## 证据

记录 commit、Node/Wrangler/Vitest 版本、执行命令、测试数量、结果和限制。证据不得包含
本机路径以外的用户信息、Secret、真实账户或未脱敏响应。

## 验证记录

- 2026-08-05：使用 Node.js 24.18.0、Wrangler 4.119.0 和 Vitest 4.1.0 完成全量检查；
  基础脚手架的 5 项 Worker runtime/D1 测试通过，本地 migration 成功，虚构 seed
  连续执行两次成功。
- 2026-08-05：扩展后的 2 个测试文件、15 项 Worker 测试通过；重建本地 fixture D1 后，
  `/healthz`、账户列表和三日指标汇总均返回 `200`。服务仅绑定 `127.0.0.1`，未访问
  外部系统。文档仍为 `DRAFT`，因为候选 API、架构和正式 Phase 1 尚未接受。
- 2026-08-06：3 个测试文件、23 项 Worker 测试通过；覆盖周期比较、零基线、完整范围、
  跨周期口径、跨 Workspace 和非因果诊断模式。本机 `127.0.0.1` comparison 成功路径
  返回 `200`，重叠周期安全失败返回 `400`。该结果只适用于固定 fixture，不形成
  G0/G1/G2 证据。
- 2026-08-06：本机 Worker 使用 `127.0.0.1:8791`，Vite 使用 `127.0.0.1:4173`；固定
  代理的 comparison 返回 `200`。原型共 8 项组件测试及生产构建通过；浏览器在
  `1536 × 1024` 和 `430 × 932` 加载 6 个指标与 1 条非因果诊断，无控制台告警或页面
  横向溢出。验证后两个端口均已停止；结果不形成 G0/G1/G2/G3 证据。
- 2026-08-06：扩展账户上下文后全仓检查通过，包括 14 项 Phase 0、23 项 Worker 和
  13 项原型测试及 production build。本机 Worker `127.0.0.1:8791` 的账户列表与所选
  账户 comparison 均返回 `200`；Vite `127.0.0.1:5173` 在 `1536 × 1024` 和
  `430 × 932` 完成读取、选择和加载流程，无控制台告警、错误层或横向溢出。验证后两个
  端口均已停止；结果不形成任何 Gate 证据。
- 2026-08-06：对象层级扩展后的 4 个 Worker 测试文件共 27 项、3 个原型测试文件共
  18 项及 production build 通过；objects 与 comparison 本机端点均返回 `200`。
  `1280 × 720` 浏览器完成账户读取、7 个对象读取、Ad 选择和账户级 comparison，无
  控制台告警、错误层或横向溢出。当前浏览器运行时不支持视口调整，安全策略阻止临时
  移动容器，本次移动端视觉复验未执行；验证后两个端口均已停止，该限制不形成 Gate
  证据。
- 2026-08-07：对象级分析扩展后的全仓检查通过，包括 71 份文档、14 项 Phase 0、
  31 项 Worker 和 20 项原型测试及 production build。账户列表、objects 与所选 Ad
  comparison 本机端点均返回 `200`；`1280 × 720` 页面显示对象范围、完整覆盖、6 项
  指标和 2 条非因果诊断，并保留账户级入口，无控制台告警、错误层或横向溢出。当前
  浏览器运行时不能调整视口，本切片移动端视觉复验未执行；验证后两个端口均已停止，
  结果不形成 Gate 证据。
- 2026-08-07：直接子对象拆解扩展后的全仓检查通过，包括 72 份文档、14 项 Phase 0、
  36 项 Worker 和 23 项原型测试及 production build。Campaign→2 个 Ad Set、Ad Set→
  2 个 Ad 的 `children-comparison` 均返回 `200`，两期四项可加指标与父对象对账；Ad
  叶子禁用入口。`1280 × 720` 与 `430 × 932` 均无控制台告警、错误层或页面横向溢出，
  验证后 `8791` 与 `5173` 均已停止；结果不形成任何 Gate 证据。
- 2026-08-07：对象日趋势扩展后的全仓检查通过，包括 75 份文档、14 项 Phase 0、
  54 项 Worker 和 45 项原型测试及 production build。本机 Ad 三日趋势返回 `200` 和
  3 个升序日点；两日返回 `400`，合法 31 日因覆盖不足返回 `409`，未知对象返回 `404`。
  `1280 × 720` 与 `430 × 932` 完成对象趋势、CTR/报告转化/CPA 切换和精确日值核对；
  Worker 日志确认指标切换没有新增请求，对象变化清除旧图。两个视口均无控制台告警、
  错误层或页面横向溢出，移动表格只在自身 `overflow-x: auto` 容器滚动。production
  `4173` 预览显示“接入关闭”且不渲染账户或趋势入口；验证后 `8791`、`5173`、`4173`
  均无监听。结果只适用于固定 fixture，不形成任何 Gate 证据。
- 2026-08-07：直接子对象日趋势扩展后的全仓检查通过，包括 78 份规范文档、14 项
  Phase 0、61 项 Worker 和 58 项原型测试及 production build。Campaign→2 个 Ad Set
  与 Ad Set→2 个 Ad 的 `children-trend` 均返回 `200` 并逐日对账；Ad 返回 `409`、两日
  输入返回 `400`、未知对象返回 `404`。`1280 × 720` 与 `430 × 932` 完成多序列趋势、
  指标本地切换、父对象变化清除和 Ad 禁用；无控制台告警或页面横向溢出，移动表格只在
  自身容器滚动。production 预览不渲染账户或直接子对象趋势入口；验证后 `8791`、
  `5173`、`4173` 均无监听。结果只适用于固定 fixture，不形成任何 Gate 证据。
- 2026-08-07：离线数据质量报告扩展后的全仓检查通过，包括 79 份规范文档、14 项
  Phase 0、67 项 Worker 和 68 项原型测试及 production build。三日 `data-quality`
  返回 `200`、24/24 个主体日、8 个主体、7 个对象和 7/7 项检查；两日返回 `400`，未知
  账户返回 `404`。`1280 × 720` 与 `430 × 932` 完成显式核验和日期变化清除，均无控制台
  告警或页面横向溢出。production 预览不渲染 fixture 账户或数据质量按钮；验证后
  `8791`、`5173`、`4173` 均无监听。结果只适用于固定 fixture，不形成任何 Gate 证据。
- 2026-08-08：离线分析质量 preflight 扩展后的全仓检查通过，包括 80 份规范文档、
  14 项 Phase 0、67 项 Worker 和 73 项原型测试及 production build。本机浏览器验证
  preflight 前指标入口锁定、24/24 主体日与 7/7 检查通过后解锁、账户/对象 comparison、
  直接子对象拆解及两类趋势均返回，日期编辑后 comparison 重新锁定。`1280 × 720` 与
  `430 × 932` 无控制台告警或页面横向溢出；production 不渲染 fixture 账户或 preflight
  按钮。验证后 `8791`、`5173`、`4173` 均无监听；结果不形成任何 Gate 证据。
- 2026-08-08：离线 Codex 分析证据包扩展后的全仓检查通过，包括 81 份规范文档、
  14 项 Phase 0、67 项 Worker 和 78 项原型测试及 production build。健康、质量和
  comparison HTTP 均返回 `200`；`1280 × 720` 与 `430 × 932` 验证账户级只读 JSON、
  Campaign→Ad Set 稳定 `driver_inputs`、无请求 ID、无建议/写入/持久化和日期编辑失效，
  且无控制台告警或页面横向溢出。production 不渲染账户、质量或 Codex 上下文入口；
  `8791`、`5173`、`4173` 均已停止。结果只适用于 fixture，不形成 Codex 分析或 Gate 证据。
- 2026-08-08：离线 Codex 趋势证据包扩展后的全仓检查通过，包括 82 份规范文档、
  14 项 Phase 0、67 项 Worker、81 项原型测试及 production build。账户、质量、对象、
  Campaign 对象趋势、Campaign→Ad Set 和 Ad Set→Ad 直接子对象趋势本机请求均返回
  `200`。`1280 × 720` 与 `430 × 932` 验证 schema v2、完整 9 项日值、稳定顺序、逐日
  对账、指标切换后 JSON 不变、对象变化失效、无控制台告警和无页面横向溢出；自动测试
  另覆盖日期失效。production 不渲染离线趋势或 Codex 证据面板，三个端口均已停止。
  结果只适用于 fixture，不形成趋势解释、Codex 分析或 Gate 证据。
- 2026-08-08：项目级 `facebook-ads-analysis` 通过 Skill 结构快速校验和 11 项固定 fixture
  正反测试，覆盖 comparison、直接子对象 daily trend、派生公式、逐日父子对账、schema、
  敏感字段、stdin 和显式调用元数据；统一检查还通过 83 份规范文档、14 项 Phase 0、
  67 项 Worker、81 项原型测试及 production build。该结果不连接 Web、Meta 或 MCP，
  不形成真实账户、优化价值、G2/G3 或外部授权证据。
- 2026-08-08：离线 Codex 草稿评测通过五种黄金场景和 12 项正负测试，与输入测试合计
  23 项；统一检查还通过 84 份规范文档、14 项 Phase 0、67 项 Worker、81 项原型测试及
  production build，官方 Skill 结构校验通过。结果只验证固定 fixture 的结构、证据和值、
  未知项、直接子对象和安全边界，不调用模型，不形成真实账户、用户价值或 Gate 证据。
- 2026-08-09：独立会话前向评测实际运行 5 个首次会话和 2 个失败修正后的全新重测
  会话。`001`、`002`、`004` 首次 8/8；`003`、`005` 首次因否定式禁用词被拒绝，收紧
  Skill 后重测 8/8。最终 5/5 `PASS`；协议隔离只由操作者声明，该记录不是通用模型或
  Gate 证据。
- 2026-08-09：Creative/工作流 Skills 前向评测形成 5 个首次会话和 3 个失败修正后的
  全新重测会话。`004`、`005` 首次 8/8；`001`–`003` 分别因批准信息点、Ad 字段和日报
  状态字段未精确匹配契约被拒绝，收紧 Skill 后重测 8/8。最终 5/5 `PASS`；另有 3 次
  基础设施传输中断未形成结果。一次性授权已关闭，结果不形成通用模型或 Gate 证据。
