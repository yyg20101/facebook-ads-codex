import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  GitBranch,
  Info,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  DEFAULT_OFFLINE_COMPARISON_REQUEST,
  OfflineComparisonError,
  loadOfflineAdAccounts,
  loadOfflineComparison,
  type DiagnosticCode,
  type DiagnosticSignal,
  type MetricChange,
  type OfflineAccountListResponse,
  type OfflineAdAccount,
  type OfflineComparisonRequest,
  type OfflineComparisonResponse,
} from "../../data/offlineComparison";
import {
  loadOfflineDirectChildBreakdown,
  type OfflineDirectChildBreakdownResponse,
} from "../../data/offlineBreakdown";
import {
  loadOfflineAdObjectComparison,
  type OfflineAdObject,
  type OfflineAdObjectComparisonResponse,
  type OfflineAdObjectLevel,
} from "../../data/offlineHierarchy";
import {
  offlineAnalysisContextMatchesAttestation,
  offlineDataQualityAttestsRanges,
  type OfflineDataQualityAttestation,
} from "../../data/offlineDataQuality";
import { Button } from "../ui/Button";
import { Status } from "../ui/Status";
import { OfflineObjectHierarchyPanel } from "./OfflineObjectHierarchyPanel";
import { OfflineObjectTrendPanel } from "./OfflineObjectTrendPanel";
import { OfflineDirectChildTrendPanel } from "./OfflineDirectChildTrendPanel";
import { OfflineDataQualityPanel } from "./OfflineDataQualityPanel";
import { OfflineCodexEvidencePanel } from "./OfflineCodexEvidencePanel";

type AccountLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; response: OfflineAccountListResponse }
  | { kind: "error"; code: string; message: string };

type ComparisonLoadState =
  | { kind: "idle" }
  | { kind: "loading"; scope: ComparisonScope }
  | {
      kind: "success";
      response:
        | OfflineComparisonResponse
        | OfflineAdObjectComparisonResponse
        | OfflineDirectChildBreakdownResponse;
    }
  | { kind: "error"; code: string; message: string };

type ComparisonScope = "ACCOUNT" | "CHILDREN" | "OBJECT";

const EMPTY_ACCOUNTS: OfflineAdAccount[] = [];

const OBJECT_LEVEL_LABELS: Record<OfflineAdObjectLevel, string> = {
  CAMPAIGN: "Campaign",
  AD_SET: "Ad Set",
  AD: "Ad",
};

interface MetricCardDefinition {
  label: string;
  change: MetricChange;
  format: (value: number | null) => string;
}

const DIAGNOSTIC_COPY: Record<
  DiagnosticCode,
  { title: string; description: string }
> = {
  SPEND_WITH_ZERO_CONVERSIONS: {
    title: "有消耗但报告转化为零",
    description: "当前周期存在花费，但所选事件没有报告转化。",
  },
  SPEND_UP_CONVERSIONS_DOWN: {
    title: "消耗上升，报告转化下降",
    description: "两个方向同时出现，只能作为进一步核查信号。",
  },
  CLICKS_UP_CONVERSIONS_NOT_UP: {
    title: "点击上升，报告转化未上升",
    description: "点击增长没有伴随所选事件的报告转化增长。",
  },
  CTR_UP_CONVERSION_RATE_DOWN: {
    title: "CTR 上升，报告转化率下降",
    description: "素材吸引点击与点击后结果呈现相反方向。",
  },
  CONVERSION_VOLUME_UP_COST_DOWN: {
    title: "报告转化上升，同时 CPA 下降",
    description: "当前周期呈现更高转化量和更低单次转化成本。",
  },
};

const NEXT_CHECK_COPY: Record<string, string> = {
  VERIFY_CONVERSION_EVENT_AND_ATTRIBUTION: "核对转化事件与归因口径",
  VERIFY_DATA_COMPLETENESS: "核对数据覆盖和稳定状态",
  REVIEW_POST_CLICK_FLOW: "检查点击后的落地与转化流程",
  VERIFY_COMPARISON_CONTEXT: "核对两个周期的比较口径",
  REVIEW_DELIVERY_AND_AUDIENCE_MIX: "检查投放与受众构成变化",
  REVIEW_CREATIVE_AND_POST_CLICK_FLOW: "检查素材信息与点击后流程",
  VERIFY_CLICK_METRIC_KIND: "核对当前点击指标口径",
  REVIEW_CREATIVE_MESSAGE_MATCH: "检查素材承诺与落地信息是否一致",
  REVIEW_AUDIENCE_QUALITY: "检查受众质量和流量变化",
  VERIFY_PATTERN_PERSISTS: "继续观察该数字模式是否持续",
  REVIEW_DELIVERY_AND_CREATIVE_MIX: "检查投放与素材构成变化",
};

function formatInteger(value: number | null): string {
  return value === null ? "不可用" : new Intl.NumberFormat("zh-CN").format(value);
}

function formatPercent(value: number | null): string {
  return value === null
    ? "不可用"
    : new Intl.NumberFormat("zh-CN", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
}

function formatMoneyMinor(value: number | null, currency: string): string {
  if (value === null) {
    return "不可用";
  }

  try {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currency}`;
  }
}

function formatRelativeChange(change: MetricChange): string {
  if (change.relativeChange !== null) {
    const sign = change.relativeChange > 0 ? "+" : "";
    return `${sign}${(change.relativeChange * 100).toFixed(2)}%`;
  }
  if (change.relativeChangeUnavailableReason === "BASELINE_ZERO") {
    return "基线为 0，百分比不可算";
  }
  return "不可比较";
}

function changeClass(direction: MetricChange["direction"]): string {
  if (direction === "INCREASED") {
    return "offline-metric-card__change--up";
  }
  if (direction === "DECREASED") {
    return "offline-metric-card__change--down";
  }
  return "offline-metric-card__change--flat";
}

function diagnosticSeverity(
  severity: DiagnosticSignal["severity"],
): "info" | "warning" {
  return severity === "INFO" ? "info" : "warning";
}

function isObjectComparisonResponse(
  response: OfflineComparisonResponse | OfflineAdObjectComparisonResponse,
): response is OfflineAdObjectComparisonResponse {
  return "object" in response.data;
}

function ComparisonResult({
  response,
}: {
  response: OfflineComparisonResponse | OfflineAdObjectComparisonResponse;
}) {
  const { data, context } = response;
  const object = isObjectComparisonResponse(response)
    ? response.data.object
    : undefined;
  const currency = context.metricContext.currency;
  const metrics: MetricCardDefinition[] = [
    {
      label: "花费",
      change: data.changes.totals.spendMinorUnits,
      format: (value) => formatMoneyMinor(value, currency),
    },
    {
      label: "点击",
      change: data.changes.totals.clicks,
      format: formatInteger,
    },
    {
      label: "报告转化",
      change: data.changes.totals.conversions,
      format: formatInteger,
    },
    {
      label: "CTR",
      change: data.changes.derived.clickThroughRate,
      format: formatPercent,
    },
    {
      label: "CVR",
      change: data.changes.derived.conversionRate,
      format: formatPercent,
    },
    {
      label: "CPA",
      change: data.changes.derived.costPerConversionMinorUnits,
      format: (value) => formatMoneyMinor(value, currency),
    },
  ];

  return (
    <div className="offline-comparison__result">
      <div className="offline-comparison__success-line">
        <CheckCircle2 aria-hidden="true" size={18} />
        <strong>离线 Worker 已响应</strong>
        <span>
          {object === undefined
            ? `账户 · ${data.account.externalAccountRef}`
            : `${OBJECT_LEVEL_LABELS[object.objectLevel]} · ${object.displayName}`} ·{" "}
          {context.comparisonPolicy.periodLengthDays} 天周期
        </span>
      </div>

      <dl className="offline-comparison__context">
        <div>
          <dt>基线周期</dt>
          <dd>
            {data.baseline.actualRange.dateStart} — {data.baseline.actualRange.dateStop}
          </dd>
          <small>
            覆盖 {data.baseline.coverage.observedDays}/{data.baseline.coverage.expectedDays} 天
          </small>
        </div>
        <div>
          <dt>当前周期</dt>
          <dd>
            {data.current.actualRange.dateStart} — {data.current.actualRange.dateStop}
          </dd>
          <small>
            覆盖 {data.current.coverage.observedDays}/{data.current.coverage.expectedDays} 天
          </small>
        </div>
        <div>
          <dt>指标上下文</dt>
          <dd>
            {currency} · {context.metricContext.timezoneName}
          </dd>
          <small>
            {context.metricContext.clickMetricKind} · {context.metricContext.conversionEventRef}
          </small>
        </div>
        <div>
          <dt>数据状态</dt>
          <dd>
            {context.periodContext.baseline.stabilityStatus} / {context.periodContext.current.stabilityStatus}
          </dd>
          <small>{context.metricContext.apiVersion} · 完整覆盖</small>
        </div>
      </dl>

      <div className="offline-comparison__metrics" aria-label="周期指标变化">
        {metrics.map((metric) => (
          <article className="offline-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <div className="offline-metric-card__values">
              <small>{metric.format(metric.change.baseline)}</small>
              <ArrowRight aria-hidden="true" size={14} />
              <strong>{metric.format(metric.change.current)}</strong>
            </div>
            <p className={changeClass(metric.change.direction)}>
              {formatRelativeChange(metric.change)}
            </p>
          </article>
        ))}
      </div>

      <section className="offline-comparison__diagnostics">
        <header>
          <div>
            <h3>确定性诊断模式</h3>
            <p>只确认响应中的数字方向，不声明广告效果原因。</p>
          </div>
          <Status compact severity="neutral">
            {data.diagnostics.length} 条模式
          </Status>
        </header>

        {data.diagnostics.length === 0 ? (
          <div className="offline-comparison__no-diagnostics">
            <Info aria-hidden="true" size={17} />
            当前数字没有命中预设模式；不会编造诊断。
          </div>
        ) : (
          <div className="offline-diagnostic-list">
            {data.diagnostics.map((diagnostic) => {
              const copy = DIAGNOSTIC_COPY[diagnostic.code];
              return (
                <article key={diagnostic.code}>
                  <div className="offline-diagnostic-list__heading">
                    <Status compact severity={diagnosticSeverity(diagnostic.severity)}>
                      {diagnostic.severity}
                    </Status>
                    <span>{diagnostic.findingConfidence}</span>
                    <strong>不包含因果结论</strong>
                  </div>
                  <h4>{copy.title}</h4>
                  <p>{copy.description}</p>
                  <details>
                    <summary>查看证据字段与后续核查</summary>
                    <dl>
                      <div>
                        <dt>证据字段</dt>
                        <dd>{diagnostic.evidenceMetrics.join("、")}</dd>
                      </div>
                      <div>
                        <dt>后续核查（未执行）</dt>
                        <dd>
                          {diagnostic.nextChecks
                            .map((check) => NEXT_CHECK_COPY[check] ?? check)
                            .join("；")}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function BreakdownMetricCell({
  change,
  format,
}: {
  change: MetricChange;
  format: (value: number | null) => string;
}) {
  return (
    <div className="offline-breakdown__metric">
      <span>
        {format(change.baseline)}
        <ArrowRight aria-hidden="true" size={13} />
        <strong>{format(change.current)}</strong>
      </span>
      <small className={changeClass(change.direction)}>
        {formatRelativeChange(change)}
      </small>
    </div>
  );
}

function DirectChildBreakdownResult({
  response,
}: {
  response: OfflineDirectChildBreakdownResponse;
}) {
  const { data, context } = response;
  const currency = context.metricContext.currency;

  return (
    <div className="offline-comparison__result offline-breakdown">
      <div className="offline-comparison__success-line">
        <CheckCircle2 aria-hidden="true" size={18} />
        <strong>直接子对象拆解已响应</strong>
        <span>
          {OBJECT_LEVEL_LABELS[data.parent.objectLevel]} · {data.parent.displayName}
          {" → "}
          {context.childCount} 个 {OBJECT_LEVEL_LABELS[context.childObjectLevel]}
        </span>
      </div>

      <dl className="offline-comparison__context">
        <div>
          <dt>父对象范围</dt>
          <dd>{data.parent.displayName}</dd>
          <small>{data.parent.externalObjectRef}</small>
        </div>
        <div>
          <dt>基线 / 当前</dt>
          <dd>
            {data.baseline.actualRange.dateStart} / {data.current.actualRange.dateStart}
          </dd>
          <small>{context.comparisonPolicy.periodLengthDays} 天等长周期</small>
        </div>
        <div>
          <dt>父子对账</dt>
          <dd>两个周期均一致</dd>
          <small>花费 · 展示 · 点击 · 报告转化</small>
        </div>
        <div>
          <dt>展示策略</dt>
          <dd>稳定 ID 顺序</dd>
          <small>无排名 · 无阈值 · 非因果</small>
        </div>
      </dl>

      <div className="offline-breakdown__notice">
        <GitBranch aria-hidden="true" size={17} />
        <p>
          下表只拆解直接子对象的数字变化；顺序不代表表现优先级，也不会选择赢家或执行建议。
        </p>
      </div>

      <div className="offline-breakdown__table-wrap">
        <table>
          <caption className="sr-only">直接子对象周期变化</caption>
          <thead>
            <tr>
              <th scope="col">直接子对象</th>
              <th scope="col">花费</th>
              <th scope="col">点击</th>
              <th scope="col">报告转化</th>
              <th scope="col">CTR</th>
              <th scope="col">CPA</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.object.id}>
                <th scope="row">
                  <span>{OBJECT_LEVEL_LABELS[item.object.objectLevel]}</span>
                  <strong>{item.object.displayName}</strong>
                  <code>{item.object.externalObjectRef}</code>
                </th>
                <td>
                  <BreakdownMetricCell
                    change={item.changes.totals.spendMinorUnits}
                    format={(value) => formatMoneyMinor(value, currency)}
                  />
                </td>
                <td>
                  <BreakdownMetricCell
                    change={item.changes.totals.clicks}
                    format={formatInteger}
                  />
                </td>
                <td>
                  <BreakdownMetricCell
                    change={item.changes.totals.conversions}
                    format={formatInteger}
                  />
                </td>
                <td>
                  <BreakdownMetricCell
                    change={item.changes.derived.clickThroughRate}
                    format={formatPercent}
                  />
                </td>
                <td>
                  <BreakdownMetricCell
                    change={item.changes.derived.costPerConversionMinorUnits}
                    format={(value) => formatMoneyMinor(value, currency)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isDirectChildBreakdownResult(
  response:
    | OfflineComparisonResponse
    | OfflineAdObjectComparisonResponse
    | OfflineDirectChildBreakdownResponse,
): response is OfflineDirectChildBreakdownResponse {
  return "parent" in response.data && "items" in response.data;
}

export function OfflineComparisonPanel() {
  const [request, setRequest] = useState<OfflineComparisonRequest>(
    DEFAULT_OFFLINE_COMPARISON_REQUEST,
  );
  const [accountState, setAccountState] = useState<AccountLoadState>({
    kind: "idle",
  });
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAdObject, setSelectedAdObject] =
    useState<OfflineAdObject | null>(null);
  const [comparisonState, setComparisonState] =
    useState<ComparisonLoadState>({ kind: "idle" });
  const [qualityAttestation, setQualityAttestation] =
    useState<OfflineDataQualityAttestation | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const developmentEnabled = import.meta.env.DEV;
  const accounts =
    accountState.kind === "ready"
      ? accountState.response.data.items
      : EMPTY_ACCOUNTS;
  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId,
  );
  const comparisonRanges = [
    { dateStart: request.baselineStart, dateStop: request.baselineStop },
    { dateStart: request.currentStart, dateStop: request.currentStop },
  ];
  const comparisonQualityReady =
    selectedAccount !== undefined &&
    offlineDataQualityAttestsRanges(
      qualityAttestation,
      selectedAccount,
      comparisonRanges,
    );

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    [],
  );

  const handleQualityAttestationChange = useCallback(
    (attestation: OfflineDataQualityAttestation | null) => {
      activeRequest.current?.abort();
      activeRequest.current = null;
      setQualityAttestation(attestation);
      setComparisonState({ kind: "idle" });
    },
    [],
  );

  const handleLoadAccounts = async () => {
    activeRequest.current?.abort();

    const controller = new AbortController();
    activeRequest.current = controller;
    setAccountState({ kind: "loading" });
    setSelectedAccountId("");
    setSelectedAdObject(null);
    setQualityAttestation(null);
    setComparisonState({ kind: "idle" });

    try {
      const response = await loadOfflineAdAccounts(controller.signal);
      if (activeRequest.current === controller) {
        setAccountState({ kind: "ready", response });
        setSelectedAccountId(response.data.items[0]?.id ?? "");
      }
    } catch (error) {
      if (controller.signal.aborted || activeRequest.current !== controller) {
        return;
      }
      if (error instanceof OfflineComparisonError) {
        setAccountState({
          kind: "error",
          code: error.code,
          message: error.message,
        });
      } else {
        setAccountState({
          kind: "error",
          code: "LOCAL_CONNECTION_FAILED",
          message:
            "无法读取本地 fixture 账户。请确认 migration、fixture 和 Worker 已启动。",
        });
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  };

  const updateDate =
    (field: keyof OfflineComparisonRequest) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      activeRequest.current?.abort();
      activeRequest.current = null;
      setComparisonState({ kind: "idle" });
      setRequest((current) => ({ ...current, [field]: value }));
    };

  const handleAccountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setSelectedAccountId(event.target.value);
    setSelectedAdObject(null);
    setQualityAttestation(null);
    setComparisonState({ kind: "idle" });
  };

  const handleObjectSelectionChange = (object: OfflineAdObject | null) => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setSelectedAdObject(object);
    setComparisonState({ kind: "idle" });
  };

  const handleLoadComparison = async (scope: ComparisonScope) => {
    if (selectedAccount === undefined) {
      setComparisonState({
        kind: "error",
        code: "ACCOUNT_CONTEXT_REQUIRED",
        message: "请先从本地 Worker 读取并选择 fixture 广告账户。",
      });
      return;
    }
    if (
      (scope === "OBJECT" || scope === "CHILDREN") &&
      selectedAdObject === null
    ) {
      setComparisonState({
        kind: "error",
        code: "OBJECT_CONTEXT_REQUIRED",
        message: "请先读取对象层级并选择 Campaign、Ad Set 或 Ad。",
      });
      return;
    }
    if (scope === "CHILDREN" && selectedAdObject?.objectLevel === "AD") {
      setComparisonState({
        kind: "error",
        code: "NO_CHILD_OBJECTS",
        message: "Ad 是当前层级的叶子对象，没有可拆解的直接子对象。",
      });
      return;
    }
    const attestation = qualityAttestation;
    const objectId = scope === "ACCOUNT" ? undefined : selectedAdObject?.id;
    if (
      attestation === null ||
      !offlineDataQualityAttestsRanges(
        attestation,
        selectedAccount,
        comparisonRanges,
        objectId,
      )
    ) {
      setComparisonState({
        kind: "error",
        code: "QUALITY_PREFLIGHT_REQUIRED",
        message: "当前账户和比较日期尚未通过步骤 2 数据质量核验。",
      });
      return;
    }

    activeRequest.current?.abort();

    const controller = new AbortController();
    activeRequest.current = controller;
    setComparisonState({ kind: "loading", scope });

    try {
      let response:
        | OfflineComparisonResponse
        | OfflineAdObjectComparisonResponse
        | OfflineDirectChildBreakdownResponse;
      if (scope === "OBJECT" && selectedAdObject !== null) {
        response = await loadOfflineAdObjectComparison(
          selectedAccount,
          selectedAdObject,
          request,
          controller.signal,
        );
      } else if (scope === "CHILDREN" && selectedAdObject !== null) {
        response = await loadOfflineDirectChildBreakdown(
          selectedAccount,
          selectedAdObject,
          request,
          controller.signal,
        );
      } else {
        response = await loadOfflineComparison(
          selectedAccount,
          request,
          controller.signal,
        );
      }
      if (
        !offlineAnalysisContextMatchesAttestation(
          attestation,
          response.context,
        )
      ) {
        throw new OfflineComparisonError(
          "INVALID_RESPONSE",
          "分析响应与步骤 2 的数据质量口径或快照不一致，已拒绝展示。",
        );
      }
      if (activeRequest.current === controller) {
        setComparisonState({ kind: "success", response });
      }
    } catch (error) {
      if (controller.signal.aborted || activeRequest.current !== controller) {
        return;
      }
      if (error instanceof OfflineComparisonError) {
        setComparisonState({
          kind: "error",
          code: error.code,
          message: error.message,
        });
      } else {
        setComparisonState({
          kind: "error",
          code: "LOCAL_CONNECTION_FAILED",
          message: "无法连接本地离线 Worker。请确认 migration、fixture 和 Worker 已启动。",
        });
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleLoadComparison("ACCOUNT");
  };

  return (
    <section className="surface offline-comparison" aria-labelledby="offline-comparison-title">
      <header className="offline-comparison__header">
        <div>
          <span className="offline-comparison__eyebrow">
            <BarChart3 aria-hidden="true" size={15} />
            本地端到端切片
          </span>
          <h2 id="offline-comparison-title">离线周期对比</h2>
          <p>从本机 Worker 读取固定 fixture，验证真实页面状态和契约边界。</p>
        </div>
        <Status severity={developmentEnabled ? "info" : "warning"}>
          {developmentEnabled ? "开发环境 · 显式加载" : "生产构建 · 接入关闭"}
        </Status>
      </header>

      <div className="offline-comparison__trust" aria-label="离线分析信任边界">
        <span>
          <Database aria-hidden="true" size={14} />
          固定虚构数据
        </span>
        <span>
          <WifiOff aria-hidden="true" size={14} />
          未连接 Meta
        </span>
        <span>
          <ShieldCheck aria-hidden="true" size={14} />
          只读 · 不执行建议
        </span>
        <span>
          <Info aria-hidden="true" size={14} />
          无业务阈值 · 非因果
        </span>
      </div>

      {developmentEnabled ? (
        <>
          <section
            aria-labelledby="offline-account-context-title"
            className="offline-comparison__account-step"
          >
            <header>
              <div>
                <span>步骤 1</span>
                <h3 id="offline-account-context-title">读取账户上下文</h3>
                <p>账户只能来自本机 Worker 的 fixture 列表，浏览器不接受手工账户 ID。</p>
              </div>
              <Button
                disabled={comparisonState.kind === "loading"}
                icon={<Database aria-hidden="true" size={16} />}
                loading={accountState.kind === "loading"}
                onClick={handleLoadAccounts}
                type="button"
              >
                {accountState.kind === "ready"
                  ? "重新读取 fixture 账户"
                  : "读取 fixture 账户"}
              </Button>
            </header>

            <div aria-live="polite">
              {accountState.kind === "idle" ? (
                <div className="offline-comparison__account-message">
                  <Database aria-hidden="true" size={18} />
                  <span>先读取账户列表，再选择分析周期。</span>
                </div>
              ) : null}
              {accountState.kind === "loading" ? (
                <div className="offline-comparison__account-message">
                  <RefreshCw
                    aria-hidden="true"
                    className="offline-comparison__spinner"
                    size={18}
                  />
                  <span>正在从本机 Worker 读取固定 fixture 账户。</span>
                </div>
              ) : null}
              {accountState.kind === "error" ? (
                <div className="offline-comparison__error" role="alert">
                  <AlertTriangle aria-hidden="true" size={20} />
                  <div>
                    <strong>{accountState.code}</strong>
                    <p>{accountState.message}</p>
                    <small>未使用手工 ID、静态回退或远程账户替代失败结果。</small>
                  </div>
                </div>
              ) : null}
              {accountState.kind === "ready" && accounts.length === 0 ? (
                <div className="offline-comparison__account-message">
                  <AlertTriangle aria-hidden="true" size={18} />
                  <span>Worker 没有返回可选择的 fixture 账户。</span>
                </div>
              ) : null}
              {accountState.kind === "ready" && selectedAccount !== undefined ? (
                <div className="offline-account-context">
                  <label>
                    <span>Fixture 广告账户</span>
                    <select
                      aria-label="Fixture 广告账户"
                      onChange={handleAccountChange}
                      value={selectedAccountId}
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.externalAccountRef} · {account.currency} · {account.timezoneName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <dl>
                    <div>
                      <dt>账户引用</dt>
                      <dd>{selectedAccount.externalAccountRef}</dd>
                    </div>
                    <div>
                      <dt>币种 / 时区</dt>
                      <dd>
                        {selectedAccount.currency} / {selectedAccount.timezoneName}
                      </dd>
                    </div>
                    <div>
                      <dt>数据截至</dt>
                      <dd>{selectedAccount.dataThrough ?? "无日级数据"}</dd>
                    </div>
                    <div>
                      <dt>账户级 Fixture 行数</dt>
                      <dd>{selectedAccount.insightRowCount}</dd>
                    </div>
                  </dl>
                  <Status compact severity="info">
                    {accounts.length}/10 个本地账户
                  </Status>
                </div>
              ) : null}
            </div>
          </section>

          {selectedAccount !== undefined ? (
            <>
              <OfflineDataQualityPanel
                account={selectedAccount}
                key={`quality-${selectedAccount.id}`}
                onAttestationChange={handleQualityAttestationChange}
              />
              <OfflineObjectHierarchyPanel
                account={selectedAccount}
                key={selectedAccount.id}
                onSelectionChange={handleObjectSelectionChange}
              />
              <form className="offline-comparison__form" onSubmit={handleSubmit}>
                <div className="offline-comparison__form-heading">
                  <span>步骤 4</span>
                  <div>
                    <strong>选择比较周期与分析范围</strong>
                    <p>账户与对象对比都绑定当前账户、口径和实际覆盖范围。</p>
                  </div>
                </div>
                <fieldset disabled={comparisonState.kind === "loading"}>
                  <legend className="sr-only">选择两个离线 fixture 周期</legend>
                  <div className="offline-comparison__date-group">
                    <strong>基线周期</strong>
                    <label>
                      <span>开始</span>
                      <input
                        aria-label="基线开始日期"
                        onChange={updateDate("baselineStart")}
                        required
                        type="date"
                        value={request.baselineStart}
                      />
                    </label>
                    <label>
                      <span>结束</span>
                      <input
                        aria-label="基线结束日期"
                        onChange={updateDate("baselineStop")}
                        required
                        type="date"
                        value={request.baselineStop}
                      />
                    </label>
                  </div>
                  <ArrowRight
                    aria-hidden="true"
                    className="offline-comparison__period-arrow"
                    size={18}
                  />
                  <div className="offline-comparison__date-group">
                    <strong>当前周期</strong>
                    <label>
                      <span>开始</span>
                      <input
                        aria-label="当前开始日期"
                        onChange={updateDate("currentStart")}
                        required
                        type="date"
                        value={request.currentStart}
                      />
                    </label>
                    <label>
                      <span>结束</span>
                      <input
                        aria-label="当前结束日期"
                        onChange={updateDate("currentStop")}
                        required
                        type="date"
                        value={request.currentStop}
                      />
                    </label>
                  </div>
                  <div className="offline-comparison__actions">
                    <Button
                      disabled={!comparisonQualityReady}
                      icon={<RefreshCw aria-hidden="true" size={16} />}
                      loading={
                        comparisonState.kind === "loading" &&
                        comparisonState.scope === "ACCOUNT"
                      }
                      type="submit"
                      variant="primary"
                    >
                      {comparisonState.kind === "loading" &&
                      comparisonState.scope === "ACCOUNT"
                        ? "正在读取 fixture"
                        : "加载所选账户对比"}
                    </Button>
                    <Button
                      disabled={
                        selectedAdObject === null ||
                        !offlineDataQualityAttestsRanges(
                          qualityAttestation,
                          selectedAccount,
                          comparisonRanges,
                          selectedAdObject.id,
                        )
                      }
                      icon={<BarChart3 aria-hidden="true" size={16} />}
                      loading={
                        comparisonState.kind === "loading" &&
                        comparisonState.scope === "OBJECT"
                      }
                      onClick={() => {
                        void handleLoadComparison("OBJECT");
                      }}
                      type="button"
                    >
                      {comparisonState.kind === "loading" &&
                      comparisonState.scope === "OBJECT"
                        ? "正在读取对象 fixture"
                        : "加载所选对象对比"}
                    </Button>
                    <Button
                      disabled={
                        selectedAdObject === null ||
                        selectedAdObject.objectLevel === "AD" ||
                        !offlineDataQualityAttestsRanges(
                          qualityAttestation,
                          selectedAccount,
                          comparisonRanges,
                          selectedAdObject.id,
                        )
                      }
                      icon={<GitBranch aria-hidden="true" size={16} />}
                      loading={
                        comparisonState.kind === "loading" &&
                        comparisonState.scope === "CHILDREN"
                      }
                      onClick={() => {
                        void handleLoadComparison("CHILDREN");
                      }}
                      type="button"
                    >
                      {comparisonState.kind === "loading" &&
                      comparisonState.scope === "CHILDREN"
                        ? "正在拆解直接子对象"
                        : "加载直接子对象拆解"}
                    </Button>
                  </div>
                  <div
                    className={`offline-comparison__preflight ${
                      comparisonQualityReady
                        ? "offline-comparison__preflight--ready"
                        : "offline-comparison__preflight--locked"
                    }`}
                  >
                    <ShieldCheck aria-hidden="true" size={17} />
                    <span>
                      {comparisonQualityReady
                        ? `步骤 2 已覆盖 ${qualityAttestation?.dateStart ?? ""} 至 ${qualityAttestation?.dateStop ?? ""}`
                        : qualityAttestation === null
                          ? "先运行步骤 2；比较周期必须完全位于已核验日期范围内。"
                          : `比较周期必须完全位于已核验日期范围 ${qualityAttestation.dateStart} 至 ${qualityAttestation.dateStop}。`}
                    </span>
                  </div>
                </fieldset>
              </form>
              <OfflineObjectTrendPanel
                account={selectedAccount}
                object={selectedAdObject}
                qualityAttestation={qualityAttestation}
              />
              <OfflineDirectChildTrendPanel
                account={selectedAccount}
                parent={selectedAdObject}
                qualityAttestation={qualityAttestation}
              />
            </>
          ) : null}
        </>
      ) : (
        <div className="offline-comparison__disabled">
          <ShieldCheck aria-hidden="true" size={18} />
          离线 fixture 接入只在本地 Vite 开发服务器启用。
        </div>
      )}

      <div aria-live="polite">
        {comparisonState.kind === "idle" && selectedAccount !== undefined ? (
          <div className="offline-comparison__empty">
            <Database aria-hidden="true" size={22} />
            <div>
              <strong>
                {comparisonQualityReady
                  ? "分析 preflight 已就绪"
                  : qualityAttestation === null
                    ? "等待数据质量 preflight"
                    : "比较周期超出 preflight 覆盖"}
              </strong>
              <p>
                {comparisonQualityReady
                  ? "可加载账户级结果；读取并选择对象后，也可加载对象级结果或直接子对象拆解。"
                  : qualityAttestation === null
                    ? "先完成步骤 2；对象层级可浏览，但指标请求不会提前发送。"
                    : "调整比较周期，或用新的 3–31 日范围重新运行步骤 2；不会沿用旧结果。"}
              </p>
            </div>
          </div>
        ) : null}
        {comparisonState.kind === "loading" ? (
          <div className="offline-comparison__empty">
            <RefreshCw aria-hidden="true" className="offline-comparison__spinner" size={22} />
            <div>
              <strong>
                {comparisonState.scope === "OBJECT"
                  ? "正在读取对象级固定 fixture"
                  : comparisonState.scope === "CHILDREN"
                    ? "正在验证直接子对象与父级对账"
                    : "正在读取固定 fixture"}
              </strong>
              <p>请求只经过本机 Vite 代理，不会访问 Meta 或远程 Cloudflare。</p>
            </div>
          </div>
        ) : null}
        {comparisonState.kind === "error" ? (
          <div className="offline-comparison__error" role="alert">
            <AlertTriangle aria-hidden="true" size={20} />
            <div>
              <strong>{comparisonState.code}</strong>
              <p>{comparisonState.message}</p>
              <small>没有使用静态数据冒充 Worker 结果，也没有执行任何广告操作。</small>
            </div>
          </div>
        ) : null}
        {comparisonState.kind === "success" ? (
          isDirectChildBreakdownResult(comparisonState.response) ? (
            <DirectChildBreakdownResult response={comparisonState.response} />
          ) : (
            <ComparisonResult response={comparisonState.response} />
          )
        ) : null}
      </div>
      {developmentEnabled ? (
        <OfflineCodexEvidencePanel
          qualityAttestation={qualityAttestation}
          source={
            comparisonState.kind === "success"
              ? comparisonState.response
              : null
          }
        />
      ) : null}
    </section>
  );
}
