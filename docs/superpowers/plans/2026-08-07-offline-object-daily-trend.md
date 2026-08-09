---
doc_id: PLAN-OFFLINE-OBJECT-DAILY-TREND
type: planning
status: DRAFT
owner: project_owner
last_reviewed: 2026-08-07
---

# Offline Object Daily Trend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task by task.

**Goal:** 在不连接任何外部系统的前提下，为已验证的固定 fixture Campaign、Ad Set 和
Ad 增加连续 3–31 天的日级趋势读取、严格客户端校验和本地 Web 单指标展示。

**Architecture:** Worker 通过专用固定路由解析日期并从现有 D1 日级 fixture 原子读取
趋势；读取模型验证完整覆盖和统一口径后，HTTP 层返回固定 envelope。Web 使用独立
`offlineTrend` 客户端复核账户、对象、日期、九项指标、派生公式和信任标记，独立组件
负责请求、单指标切换、可访问图表和日值表。既有账户、对象层级和周期对比保持不变。

**Tech Stack:** TypeScript 5.7、Cloudflare Workers、D1、Vitest、React 19、Vite 6、
Testing Library、现有 CSS；不增加运行时或图表依赖。

---

## 实施约束

- 设计事实源是
  [离线对象多日趋势设计](../specs/2026-08-07-offline-object-daily-trend-design.md)。
- 只在 `dev` 工作；不创建新分支，不访问 Meta、Cloudflare 远程资源或 production
  Secret，不部署，不增加写操作。
- 当前工作区包含同一成果链的既有未提交变更。每项任务先用精确文件范围检查差异，
  不覆盖或回退用户变更。
- 本计划中的 Git 检查点只描述建议提交边界。除非项目负责人再次明确要求提交，执行者
  不得暂存、提交或推送。
- 使用红—绿—重构循环：先运行新增测试并确认其因缺失行为失败，再写最小实现，再运行
  同一测试和相邻回归测试。
- 不新增 migration 或 fixture。现有 `2026-08-02` 至 `2026-08-04` 三日数据是成功路径；
  31 日范围只验证参数合法，随后必须因数据不足安全失败。

## 固定接口契约

```text
GET /offline/v1/workspaces/{workspace_id}/ad-accounts/{ad_account_id}
    /objects/{object_id}/trend
    ?date_start=YYYY-MM-DD&date_stop=YYYY-MM-DD
```

成功响应必须保持以下形状；字段名不得在实施中自行扩展：

```ts
interface OfflineObjectTrendResponse {
  ok: true;
  data: {
    account: FixtureAdAccount;
    object: FixtureAdObject;
    requestedRange: { dateStart: string; dateStop: string };
    items: Array<{
      date: string;
      totals: MetricTotals;
      derived: DerivedMetrics;
    }>;
  };
  context: {
    requestId: string;
    workspaceId: string;
    adAccountId: string;
    objectId: string;
    objectLevel: "CAMPAIGN" | "AD_SET" | "AD";
    parentObjectId: string | null;
    metricContext: {
      currency: string;
      timezoneName: string;
      clickMetricKind: "ALL_CLICKS" | "LINK_CLICKS";
      conversionEventRef: string;
      attributionSpecHash: string;
      apiVersion: string;
    };
    stabilityStatus: "PROVISIONAL" | "RECONCILING" | "STABLE";
    fetchedAt: string;
    syncRunIds: string[];
    pointCount: number;
    trendPolicy: {
      minimumDays: 3;
      maximumDays: 31;
      metricSelection: "SINGLE";
      thresholdsApplied: false;
      causalClaims: false;
      trendInterpretationApplied: false;
    };
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}
```

## Task 1：用测试定义 Worker 日级读取模型

**Files:**

- Create: `services/control-plane-worker/test/object-trend.spec.ts`
- Modify: `services/control-plane-worker/src/read-model.ts`
- Reuse: `services/control-plane-worker/src/metrics.ts`

### 1.1 写读取模型失败测试

- [ ] 在新测试文件中导入 `getFixtureAdObjectTrend` 和
  `listFixtureAdObjects`，从完整层级中分别取得 Campaign、Ad Set 和 Ad。
- [ ] 对每个层级请求 `2026-08-02` 至 `2026-08-04`，断言三点按日期升序、原始指标
  精确且派生指标使用六位小数契约。
- [ ] 对不存在数据的范围断言 `data_unavailable`。
- [ ] 在隔离测试数据中删除一天，断言 `incomplete_coverage`；插入相同日期的第二口径行，
  先断言重复日期被判为 `incomplete_coverage`，而不是返回部分数据。
- [ ] 插入连续日期但改变币种、时区、点击口径、转化事件、归因哈希或 API 版本，断言
  `incompatible_context`。
- [ ] 插入零展示、零点击和零转化的三日对象行，断言相应派生值为 `null`，JSON 中不出现
  `Infinity` 或 `NaN`。

测试中的核心成功断言使用现有 fixture 真值：

```ts
expect(result).toMatchObject({
  kind: "ok",
  trend: {
    requestedRange: {
      dateStart: "2026-08-02",
      dateStop: "2026-08-04"
    },
    items: [
      {
        date: "2026-08-02",
        totals: {
          spendMinorUnits: 3500,
          impressions: 2800,
          clicks: 60,
          conversions: 2
        },
        derived: {
          clickThroughRate: 0.021429,
          conversionRate: 0.033333,
          costPerClickMinorUnits: 58.333333,
          costPerThousandImpressionsMinorUnits: 1250,
          costPerConversionMinorUnits: 1750
        }
      },
      { date: "2026-08-03" },
      { date: "2026-08-04" }
    ]
  }
});
```

### 1.2 运行测试并确认红灯原因

Run:

```bash
npm run worker:test -- object-trend.spec.ts
```

Expected: FAIL，因为 `getFixtureAdObjectTrend` 尚未导出；不得通过删除断言或放宽类型消除
该失败。

### 1.3 实现专用读取模型

- [ ] 在 `read-model.ts` 增加并导出以下类型，不改变既有 summary/comparison 类型：

```ts
export interface FixtureDailyTrendItem {
  date: string;
  totals: MetricTotals;
  derived: DerivedMetrics;
}

export interface FixtureAdObjectTrend {
  account: FixtureAdAccount;
  object: FixtureAdObject;
  requestedRange: { dateStart: string; dateStop: string };
  items: FixtureDailyTrendItem[];
  context: SummaryContext;
}

export type AdObjectTrendResult =
  | { kind: "ok"; trend: FixtureAdObjectTrend }
  | { kind: "data_unavailable" }
  | { kind: "incomplete_coverage" }
  | { kind: "incompatible_context" };
```

- [ ] 增加 `getFixtureAdObjectTrend`。SQL 必须只选择固定列、使用六个绑定参数、按
  `date_start ASC` 排序并以 32 行封顶：

```sql
SELECT
  date_start,
  date_stop,
  object_level,
  object_ref,
  currency,
  timezone_name,
  click_metric_kind,
  conversion_event_ref,
  attribution_spec_hash,
  api_version,
  sync_run_id,
  spend_minor_units,
  impressions,
  clicks,
  conversions,
  stability_status,
  fetched_at
FROM insights_daily
WHERE workspace_id = ?1
  AND ad_account_id = ?2
  AND object_level = ?3
  AND object_ref = ?4
  AND date_start >= ?5
  AND date_stop <= ?6
ORDER BY date_start ASC
LIMIT 32
```

- [ ] 先验证 `rows.length`、每日 `date_start === date_stop`、首尾、唯一和连续性，再验证
  统一口径。这样重复日期稳定映射到 `incomplete_coverage`。
- [ ] 复用 `requireString`、`nullableNonNegativeInteger`、`inclusiveUtcDays`、
  `resolveStabilityStatus` 和 `deriveMetrics`；不得复制另一套舍入公式。
- [ ] 要求每行 `object_level`、`object_ref` 与已验证对象精确一致；币种和时区还必须与
  已验证账户一致。
- [ ] `syncRunIds` 去重后按字典序排列，`fetchedAt` 取合法时间字符串中的最大值；不同
  stability 使用既有 `PROVISIONAL > RECONCILING > STABLE` 规则汇总。

连续日期检查使用 UTC 自然日，不依赖宿主时区：

```ts
function isoDateAtOffset(dateStart: string, offset: number): string {
  const timestamp = Date.parse(`${dateStart}T00:00:00Z`) + offset * 86_400_000;
  return new Date(timestamp).toISOString().slice(0, 10);
}
```

### 1.4 运行聚焦和相邻回归测试

Run:

```bash
npm run worker:test -- object-trend.spec.ts metrics.spec.ts object-analysis.spec.ts
```

Expected: PASS；既有 summary、comparison、直接子对象拆解语义不变。

### 1.5 检查任务差异

Run:

```bash
git diff --check -- services/control-plane-worker/src/read-model.ts \
  services/control-plane-worker/test/object-trend.spec.ts
```

Expected: 无输出，退出码为 0。

## Task 2：用测试定义固定趋势 HTTP 契约

**Files:**

- Modify: `services/control-plane-worker/test/object-trend.spec.ts`
- Modify: `services/control-plane-worker/src/http.ts`

### 2.1 写 HTTP 失败测试

- [ ] 为 Campaign、Ad Set、Ad 三种 ID 请求固定 `/trend` 路由并断言完整 envelope。
- [ ] 断言只有 `date_start` 和 `date_stop` 各一次时才合法。
- [ ] 覆盖 1 日、2 日、32 日、倒序、无效日期、重复参数和未知参数，均返回
  `INVALID_ARGUMENT`。
- [ ] 使用完整 31 日参数请求，断言不是 `INVALID_ARGUMENT`，而是
  `DATA_UNAVAILABLE` 或 `INCOMPLETE_PERIOD_COVERAGE`。
- [ ] 覆盖未知对象、账户错配和跨 Workspace，统一返回 `NOT_FOUND`。
- [ ] 覆盖数据缺口、重复日期和口径冲突，分别返回稳定的
  `INCOMPLETE_PERIOD_COVERAGE` 与 `INCOMPATIBLE_METRIC_CONTEXT`。

成功 envelope 的策略断言必须完整：

```ts
expect(body).toMatchObject({
  ok: true,
  context: {
    pointCount: 3,
    trendPolicy: {
      minimumDays: 3,
      maximumDays: 31,
      metricSelection: "SINGLE",
      thresholdsApplied: false,
      causalClaims: false,
      trendInterpretationApplied: false
    },
    sourceKind: "FIXTURE"
  },
  warnings: ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"],
  nextCursor: null,
  truncated: false
});
```

### 2.2 运行 HTTP 测试并确认红灯原因

Run:

```bash
npm run worker:test -- object-trend.spec.ts
```

Expected: FAIL，新增请求当前返回 `NOT_FOUND`。

### 2.3 增加路由和严格日期解析

- [ ] 在 `Route` 联合类型和 `parseRoute` 增加 `ad_object_trend`，并放在通用对象列表路由
  之前匹配：

```ts
| {
    kind: "ad_object_trend";
    workspaceId: string;
    adAccountId: string;
    objectId: string;
  }
```

- [ ] 增加固定参数解析器，复用 `hasOnlyExpectedParameters`、`parseIsoDate` 和
  `inclusiveDays`：

```ts
const TREND_PARAMETERS = ["date_start", "date_stop"] as const;

interface ParsedTrendRequest {
  dateStart: string;
  dateStop: string;
  dayCount: number;
}

function parseTrendRequest(
  searchParams: URLSearchParams
): ParsedTrendRequest | null {
  // 精确参数集合；有效 ISO 日期；3 <= dayCount <= 31。
}
```

- [ ] 解析器不得读取 metric、level、breakdown、sort 或任意 Graph path 参数。

### 2.4 组装成功和失败响应

- [ ] 路由处理先验证三个 ID，再调用 `listFixtureAdObjects`；只允许从该完整层级查找对象。
- [ ] 复用既有层级错误映射；未知对象不得直接查询 D1，也不得区分“跨账户存在”。
- [ ] 调用 `getFixtureAdObjectTrend` 并按以下稳定映射返回：

```text
data_unavailable       -> 404 DATA_UNAVAILABLE
incomplete_coverage    -> 409 INCOMPLETE_PERIOD_COVERAGE
incompatible_context   -> 409 INCOMPATIBLE_METRIC_CONTEXT
```

- [ ] 成功响应包含固定接口契约中的全部字段；warnings 使用
  `fixtureWarnings(trend.context.stabilityStatus)`，但必须至少包含两项 fixture 信任标记。
- [ ] 不增加 CORS、远程 host、写方法或 Worker 内部 `fetch()`。

### 2.5 运行 Worker 全套检查

Run:

```bash
npm run worker:check
```

Expected: 类型生成检查、两个 TypeScript 检查和全部 Worker 测试 PASS。

## Task 3：用测试定义 Web 严格趋势客户端

**Files:**

- Create: `prototype/src/data/offlineTrend.ts`
- Create: `prototype/src/data/offlineTrend.test.ts`
- Reuse: `prototype/src/data/offlineComparison.ts`
- Reuse: `prototype/src/data/offlineHierarchy.ts`

### 3.1 写客户端失败测试

- [ ] 构造一个完整三日 Ad 响应，断言客户端发出同源相对 GET 请求：

```text
/offline-api/v1/workspaces/ws_fixture_01/ad-accounts/aa_fixture_01/
objects/ad_fixture_01/trend?date_start=2026-08-02&date_stop=2026-08-04
```

- [ ] 逐项篡改账户、对象、请求范围、日期顺序、日期连续性、点数、九项指标、派生公式、
  metric context、stability、warnings、pointCount 或 trendPolicy，断言
  `OfflineComparisonError("INVALID_RESPONSE", ...)`。
- [ ] 断言额外指标 key 被拒绝，避免响应变成任意指标容器。
- [ ] 断言 HTTP 错误使用安全业务码，非 JSON 返回 `INVALID_RESPONSE`。
- [ ] 断言零分母的派生值必须为 `null`；非有限数、负数和错误舍入均被拒绝。

### 3.2 运行测试并确认红灯原因

Run:

```bash
npm run prototype:test -- offlineTrend.test.ts
```

Expected: FAIL，因为 `offlineTrend.ts` 尚不存在。

### 3.3 实现固定类型、九项指标和公式复核

- [ ] 导出固定请求、指标 key 和响应类型：

```ts
export interface OfflineTrendRequest {
  dateStart: string;
  dateStop: string;
}

export const DEFAULT_OFFLINE_TREND_REQUEST: OfflineTrendRequest = {
  dateStart: "2026-08-02",
  dateStop: "2026-08-04"
};

export type OfflineTrendMetricKey =
  | "spendMinorUnits"
  | "impressions"
  | "clicks"
  | "conversions"
  | "clickThroughRate"
  | "conversionRate"
  | "costPerClickMinorUnits"
  | "costPerThousandImpressionsMinorUnits"
  | "costPerConversionMinorUnits";
```

- [ ] 运行时校验复用 `isFixtureAccount`、`isMetricContext`、
  `hasRequiredFixtureWarnings` 和 `isFixtureAdObject`，同时精确比较当前选择的全部账户与
  对象字段。
- [ ] 实现客户端派生公式复核，使用与 Worker 相同的六位小数舍入：

```ts
function roundSix(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
```

- [ ] 分别定义 totals 和 derived 的固定 key 数组，校验对象 key 集合精确相等；不得通过
  TypeScript 断言绕过 `unknown` 响应验证。
- [ ] 日期使用 UTC 逐日生成预期序列，要求 3–31 天、升序、唯一、连续，并要求
  `context.pointCount === data.items.length === expectedDays`。

### 3.4 实现同源加载函数

```ts
export async function loadOfflineAdObjectTrend(
  account: OfflineAdAccount,
  object: OfflineAdObject,
  request: OfflineTrendRequest,
  signal: AbortSignal
): Promise<OfflineObjectTrendResponse> {
  // 验证输入；URLSearchParams 固定两个日期；credentials: "omit"；无静态回退。
}
```

- [ ] 路径只使用 `FIXTURE_WORKSPACE_ID` 和经过 `encodeURIComponent` 的已验证账户、对象
  ID；不得接受 remote base URL 或手工 ID。
- [ ] fetch 选项固定为 GET、JSON accept、`cache: "no-store"`、
  `credentials: "omit"` 和调用方 signal。

### 3.5 运行客户端测试与类型检查

Run:

```bash
npm run prototype:test -- offlineTrend.test.ts
npm run prototype:build
```

Expected: PASS；生产构建成功，但不会因此启用本地 Worker 入口。

## Task 4：用组件测试驱动独立单指标趋势面板

**Files:**

- Create: `prototype/src/components/analytics/OfflineObjectTrendPanel.tsx`
- Create: `prototype/src/components/analytics/OfflineObjectTrendPanel.test.tsx`
- Modify: `prototype/src/components/analytics/OfflineComparisonPanel.tsx`
- Modify: `prototype/src/styles/pages.css`
- Modify: `prototype/src/styles/responsive.css`

### 4.1 写交互失败测试

- [ ] 未选择对象时显示明确说明并禁用“加载所选对象趋势”。
- [ ] Campaign、Ad Set、Ad 三种 props 均生成绑定当前对象的请求；不允许输入对象 ID。
- [ ] 默认日期为 `2026-08-02` 至 `2026-08-04`，默认展示指标为
  `spendMinorUnits`，并明确它只是 fixture 初始视图。
- [ ] 成功后同时出现单指标 SVG 和语义化日值表，表格包含三天精确值。
- [ ] 依次切换九项指标，图表标题、单位和表格同步变化，fetch 调用次数保持 1。
- [ ] `null` 显示“不可用”，SVG 不为该点生成连续线段或虚构的零值点。
- [ ] 修改日期、对象或账户会清空旧结果并中止旧请求；层级组件重新加载导致父组件传入
  `object=null` 时也执行相同行为。
- [ ] 加载、错误、成功和清空状态不会出现 Product Discovery 静态 demo 数据。

### 4.2 运行组件测试并确认红灯原因

Run:

```bash
npm run prototype:test -- OfflineObjectTrendPanel.test.tsx
```

Expected: FAIL，因为趋势面板尚不存在。

### 4.3 实现组件状态边界

- [ ] 组件 props 只接受已验证选择，不接收 ID 字符串：

```ts
interface OfflineObjectTrendPanelProps {
  account: OfflineAdAccount;
  object: OfflineAdObject | null;
}
```

- [ ] 使用独立 `AbortController`、`idle | loading | success | error` 状态和
  `OfflineTrendMetricKey` 选择状态；不得复用 comparison 的 request controller。
- [ ] 在 account ID、object ID 或任一趋势日期变化时 abort 并清空；卸载时 abort。
- [ ] 请求完成前核对 controller 仍为 active，防止旧响应覆盖新上下文。
- [ ] 指标元数据使用固定映射，包含中文标签、单位和格式函数；金额由账户币种格式化，
  ratio 显示百分比，计数显示整数。

### 4.4 实现可访问的单指标 SVG 和表格

- [ ] SVG 使用固定 `viewBox` 与 `width: 100%`，根据非 null 值计算 y 比例；全零序列使用
  安全的非零绘图上界。
- [ ] 将连续的非 null 点切分为独立 path；跨 `null` 不连接。每个实际点包含
  `<title>`，SVG 有包含对象、指标和范围的 `aria-label`。
- [ ] 日值表使用 `<caption>`、`<th scope="row">` 和同一格式函数；图表不是唯一数据
  表达。
- [ ] 显示对象层级、名称、日期范围、币种、时区、转化事件、归因哈希、数据截至、
  stability、同步批次和三项 false 策略。

### 4.5 接入既有账户和对象选择

- [ ] 在 `OfflineComparisonPanel.tsx` 导入并渲染趋势面板，将
  `selectedAccount` 与 `selectedAdObject` 作为唯一上下文来源。
- [ ] 保留既有账户级 comparison、对象 comparison 和直接子对象拆解按钮、状态和结果；
  趋势组件不得加入 `ComparisonLoadState` 联合类型。
- [ ] 账户重新读取、账户切换和层级重新读取现有流程都会先把对象设为 `null`，用集成
  测试确认这能清除趋势。

### 4.6 增加响应式样式

- [ ] 在 `pages.css` 新增 `offline-object-trend*` 类，桌面显示清晰的控制区、上下文、图表
  和表格。
- [ ] 在 `responsive.css` 的现有断点中将控制区改为单列，表格包装器只在自身需要时滚动，
  页面根节点不得横向溢出。
- [ ] 尊重现有 focus-visible、颜色 token 和 reduced-motion 规则，不添加第三方图表 CSS。

### 4.7 运行 Web 全套检查

Run:

```bash
npm run prototype:check
```

Expected: 全部组件测试、TypeScript 和 Vite production build PASS。

## Task 5：把授权与文档治理变成可执行校验

**Files:**

- Modify: `scripts/validate-docs.mjs`
- Modify: `docs/project/status-and-authorizations.md`
- Modify: `AGENTS.md`
- Create: `docs/technical/offline-object-daily-trend.md`
- Modify: `docs/technical/README.md`
- Modify: `docs/README.md`

### 5.1 先增加会失败的治理规则

- [ ] 在 `REQUIRED_DOCS` 加入设计、计划和技术文档路径，在 `CANDIDATE_TECH_DOCS` 加入
  技术文档。
- [ ] 增加 `OFFLINE_OBJECT_DAILY_TREND_FILES`，精确包含 Worker 读取模型、HTTP、Worker
  测试、Web 客户端、客户端测试、组件和组件测试。
- [ ] 读取并校验新布尔值 `offline_object_daily_trend_authorized`。
- [ ] 在状态文档将该值设为 `true`，但先不创建技术文档，然后运行：

```bash
npm run docs:validate
```

Expected: FAIL，至少报告缺失
`docs/technical/offline-object-daily-trend.md`；这证明授权会触发文件依赖，而不是成为无效
布尔值。

### 5.2 增加授权依赖和源码不变量

- [ ] 新授权必须依赖 `offline_direct_child_breakdown_authorized: true`，并继续要求 DG0
  `PASS`、Phase 0 `IN_PROGRESS`、G0 `PARTIAL`。
- [ ] 新授权必须要求 Meta read validation、runtime availability、production deployment
  和 Meta write 全部为 `false`。
- [ ] 对源码执行以下 marker 校验：

```text
read-model: getFixtureAdObjectTrend, ORDER BY date_start ASC, LIMIT 32,
            deriveMetrics
http:       ad_object_trend, segments[9] === "trend", minimumDays: 3,
            maximumDays: 31, metricSelection: "SINGLE",
            trendInterpretationApplied: false
client:     loadOfflineAdObjectTrend, expectedAccount.id, expectedObject.id,
            deriveExpectedMetrics, FIXTURE_DATA_ONLY, NO_EXTERNAL_CONNECTION
panel:      加载所选对象趋势, OfflineTrendMetricKey, 不解释趋势
tests:      31-day range, different object, does not refetch
```

- [ ] 禁止 Worker 趋势代码中的外部 `fetch()`，禁止客户端绝对 HTTP URL，并对所有新增
  TypeScript 文件禁止 `as unknown as`。

### 5.3 写候选技术文档与代理约束

- [ ] `docs/technical/offline-object-daily-trend.md` 使用规范元数据、`DRAFT` 状态和“候选”
  表述，记录接口、数据完整性、九项指标、Web 交互、错误、测试证据与明确非目标。
- [ ] 状态文档说明该授权只允许固定 fixture 对象的 3–31 日只读趋势和本地展示，不改变
  项目阶段、runtime availability、Meta/Cloudflare 授权或任何 FR/ADR 状态。
- [ ] `AGENTS.md` 增加同一最小例外，并明确不得解释趋势、设置业务阈值、推荐动作或使用
  真实数据。
- [ ] 两个文档入口加入新技术文档，但不把它描述为正式产品能力。

### 5.4 运行治理检查

Run:

```bash
npm run docs:check
```

Expected: Markdown、链接、元数据、状态、需求追踪、敏感信息和新授权依赖全部 PASS。

## Task 6：同步候选需求落点、路线图和运行说明

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/planning/roadmap.md`
- Modify: `docs/planning/gates-and-evidence.md`
- Modify: `docs/planning/phase-0-questionnaire.md`
- Modify: `docs/requirements/metrics-and-reporting.md`
- Modify: `docs/requirements/traceability.md`
- Modify: `docs/runbooks/local-control-plane.md`
- Modify: `services/control-plane-worker/README.md`
- Modify: `prototype/README.md`

### 6.1 更新状态但不接受产品需求

- [ ] 路线图将本切片记录为第九个“已授权、待验证/已验证”的可逆离线切片，完成状态只在
  全套检查和浏览器验证后写入。
- [ ] `FR-003`、`FR-005`、`FR-011` 保持 `DRAFT`；追踪矩阵只增加候选技术落点和验证
  方法，不把它们标为接受或已满足。
- [ ] 指标文档记录九项固定 fixture 指标、日粒度、六位小数和单指标展示，但明确主 KPI、
  阈值和趋势解释仍未由真实账户证据确认。
- [ ] Gate 文档明确该结果不是 G0、G1、真实 Meta 对账、性能或产品价值证据。

### 6.2 记录负责人决定和可复现命令

- [ ] 在 Phase 0 脱敏证据表追加下一个连续 `EVD-*`，记录负责人确认 9 项指标、单指标
  展示和设计通过；不得保存账户 ID、Token 或真实响应。
- [ ] Worker README 记录本机趋势 URL、3–31 日规则和错误码。
- [ ] Prototype README 记录操作路径：读取账户 → 读取层级 → 选择对象 → 加载趋势 → 切换
  指标。
- [ ] Runbook 记录 migration、seed、Worker、Vite、curl/browser 验证与停止端口步骤。
- [ ] 根 README 和 CHANGELOG 只描述候选离线能力，版本保持 `1.0.0`。

### 6.3 再次运行文档检查

Run:

```bash
npm run docs:check
```

Expected: PASS，且敏感信息检查没有新增命中。

## Task 7：全套验证、本地浏览器验收和收尾

**Files:**

- Verify only: all files changed in Tasks 1–6
- Update after observed verification: `docs/runbooks/local-control-plane.md`
- Update after observed verification: `docs/planning/gates-and-evidence.md`

### 7.1 静态安全和差异检查

Run:

```bash
git diff --check
rg -n "as unknown as|wrangler deploy|--remote|Authorization: Bearer" \
  services/control-plane-worker/src prototype/src/data/offlineTrend.ts \
  prototype/src/components/analytics/OfflineObjectTrendPanel.tsx
rg -n "https?://|remoteBase|baseUrl" prototype/src/data/offlineTrend.ts
```

Expected: `git diff --check` 无输出；其余扫描不命中新趋势代码中的不安全双重断言、部署、
凭据或远程基址。Worker `http.ts` 只保留入口函数签名中的 `fetch`，不发起外部请求。

### 7.2 运行仓库统一检查

Run:

```bash
npm run check
```

Expected: 文档、Phase 0、本地 Worker、Web 测试、TypeScript 和 production build 全部
PASS。记录实际测试数量，不预写未经观察的数字。

### 7.3 启动纯本地服务

依次运行：

```bash
npm run worker:db:migrate:local
npm run worker:db:seed:local
npm run worker:dev:web
```

在另一终端运行：

```bash
npm run prototype:dev
```

Expected: Worker 仅监听 `127.0.0.1:8791`，Vite 仅监听本机；没有登录、部署、Secret 或
外部网络步骤。

### 7.4 验证 HTTP 和浏览器主流程

- [ ] 用本地请求验证 Ad 三日趋势为 200、三点升序和完整信任标记。
- [ ] 验证 2 日请求为 400、31 日请求不是 400、未知对象为 404。
- [ ] 桌面视口完成：读取账户 → 读取层级 → 选择 Ad → 加载三日趋势 → 从花费切换到
  CTR、报告转化和 CPA → 核对日值表。
- [ ] 移动视口重复关键流程；确认页面根节点无横向溢出，趋势表格只在自身容器内处理
  宽度。
- [ ] 检查页面身份、实际请求路径、loading/error/success 状态、控制台 error/warn、错误
  overlay 和生产构建关闭提示。
- [ ] 确认切换指标不会新增网络请求；切换对象或日期会立即清空旧图并中止旧请求。
- [ ] 确认界面持续显示 fixture、未连接 Meta、只读、无阈值和非因果边界。

### 7.5 停止服务并记录观察证据

- [ ] 终止 Worker 和 Vite 进程。
- [ ] 验证 `127.0.0.1:8791` 与 Vite 端口均无监听。
- [ ] 只把实际观察到的命令、测试结果、视口和限制写入 runbook/Gate 记录；不得宣称真实
  数据准确、广告效果、产品价值或正式阶段转换。
- [ ] 更新证据后再次运行：

```bash
npm run docs:check
git diff --check
git status --short --branch
```

Expected: 两项检查 PASS；状态只包含本成果链的已知变更，没有新增临时产物、凭据或本地
D1 状态文件被暂存。

## 建议 Git 检查点

项目负责人明确要求提交后，先审阅完整 diff 和 staged diff，再使用一个能覆盖当前连续
离线成果链的提交。若届时既有切片已被单独提交，可将本切片提交为：

```bash
git commit -m "feat: add offline object daily trends"
```

推送目标只能是 `dev`。合入 `main`、真实 Meta 配置、Cloudflare 部署和下一切片均需新的
负责人指令。

## 完成定义

- Worker 对三种对象层级返回严格、完整、同口径的 3 日 fixture 趋势，并安全拒绝所有
  非法、不完整或错配输入。
- Web 严格复核响应，一次只显示一个固定指标，图表与日值表可访问，指标切换不重新请求。
- 账户、对象和日期变化能清除并中止旧趋势，失败时没有静态回退。
- 新授权、技术文档、候选需求落点、运行说明和校验器一致。
- `npm run check`、本地 HTTP、桌面与移动浏览器验证全部有实际通过证据。
- 项目仍为 `1.0.0`、G0 `PARTIAL`、`runtime_implementation_available: false`，没有外部
  访问、部署、真实 Meta 数据、阈值、趋势解释、因果结论或写操作。
