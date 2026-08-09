import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  WifiOff
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent
} from "react";

import {
  DEFAULT_OFFLINE_TREND_REQUEST,
  OFFLINE_TREND_METRIC_KEYS,
  loadOfflineAdObjectTrend,
  trendMetricValue,
  type OfflineDailyTrendItem,
  type OfflineObjectTrendResponse,
  type OfflineTrendMetricKey,
  type OfflineTrendRequest
} from "../../data/offlineTrend";
import {
  OfflineComparisonError,
  type OfflineAdAccount
} from "../../data/offlineComparison";
import {
  type OfflineAdObject,
  type OfflineAdObjectLevel
} from "../../data/offlineHierarchy";
import {
  offlineAnalysisContextMatchesAttestation,
  offlineDataQualityAttestsRanges,
  type OfflineDataQualityAttestation
} from "../../data/offlineDataQuality";
import { Button } from "../ui/Button";
import { Status } from "../ui/Status";
import { OfflineCodexEvidencePanel } from "./OfflineCodexEvidencePanel";

interface OfflineObjectTrendPanelProps {
  account: OfflineAdAccount;
  object: OfflineAdObject | null;
  qualityAttestation: OfflineDataQualityAttestation | null;
}

type TrendLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; response: OfflineObjectTrendResponse }
  | { kind: "error"; code: string; message: string };

interface TrendMetricDefinition {
  label: string;
  unit: string;
  format: (value: number | null, currency: string) => string;
}

const OBJECT_LEVEL_LABELS: Record<OfflineAdObjectLevel, string> = {
  CAMPAIGN: "Campaign",
  AD_SET: "Ad Set",
  AD: "Ad"
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
        maximumFractionDigits: 2
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
      maximumFractionDigits: 2
    }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currency}`;
  }
}

const TREND_METRICS: Record<OfflineTrendMetricKey, TrendMetricDefinition> = {
  spendMinorUnits: {
    label: "花费",
    unit: "账户币种",
    format: formatMoneyMinor
  },
  impressions: {
    label: "展示",
    unit: "次",
    format: (value) => formatInteger(value)
  },
  clicks: {
    label: "点击",
    unit: "次",
    format: (value) => formatInteger(value)
  },
  conversions: {
    label: "报告转化",
    unit: "次",
    format: (value) => formatInteger(value)
  },
  clickThroughRate: {
    label: "CTR",
    unit: "%",
    format: (value) => formatPercent(value)
  },
  conversionRate: {
    label: "CVR",
    unit: "%",
    format: (value) => formatPercent(value)
  },
  costPerClickMinorUnits: {
    label: "CPC",
    unit: "账户币种",
    format: formatMoneyMinor
  },
  costPerThousandImpressionsMinorUnits: {
    label: "CPM",
    unit: "账户币种",
    format: formatMoneyMinor
  },
  costPerConversionMinorUnits: {
    label: "CPA",
    unit: "账户币种",
    format: formatMoneyMinor
  }
};

interface ChartPoint {
  item: OfflineDailyTrendItem;
  value: number;
  x: number;
  y: number;
}

function buildChartSegments(
  items: readonly OfflineDailyTrendItem[],
  metric: OfflineTrendMetricKey
): ChartPoint[][] {
  const values = items.map((item) => trendMetricValue(item, metric));
  const finiteValues = values.filter((value): value is number => value !== null);
  const maximum = Math.max(1, ...finiteValues);
  const chartWidth = 720;
  const chartHeight = 240;
  const horizontalPadding = 44;
  const verticalPadding = 28;
  const usableWidth = chartWidth - horizontalPadding * 2;
  const usableHeight = chartHeight - verticalPadding * 2;
  const xStep = items.length <= 1 ? 0 : usableWidth / (items.length - 1);
  const segments: ChartPoint[][] = [];
  let current: ChartPoint[] = [];

  for (const [index, item] of items.entries()) {
    const value = values[index];
    if (value === null || value === undefined) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      continue;
    }
    current.push({
      item,
      value,
      x: horizontalPadding + index * xStep,
      y: verticalPadding + usableHeight * (1 - value / maximum)
    });
  }
  if (current.length > 0) {
    segments.push(current);
  }
  return segments;
}

function TrendChart({
  items,
  metric,
  object,
  request,
  currency
}: {
  items: readonly OfflineDailyTrendItem[];
  metric: OfflineTrendMetricKey;
  object: OfflineAdObject;
  request: OfflineTrendRequest;
  currency: string;
}) {
  const definition = TREND_METRICS[metric];
  const segments = buildChartSegments(items, metric);
  const format = (value: number | null) => definition.format(value, currency);

  return (
    <div className="offline-object-trend__chart">
      <svg
        aria-label={`${object.displayName} ${definition.label} ${request.dateStart} 至 ${request.dateStop} 日趋势`}
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 720 240"
      >
        <title>
          {object.displayName} · {definition.label}日趋势
        </title>
        {[0, 1, 2, 3].map((line) => {
          const y = 28 + line * (184 / 3);
          return (
            <line
              className="offline-object-trend__grid-line"
              key={line}
              x1="44"
              x2="676"
              y1={y}
              y2={y}
            />
          );
        })}
        {segments.map((segment, segmentIndex) => (
          <path
            className="offline-object-trend__line"
            d={segment
              .map((point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
              )
              .join(" ")}
            key={`segment-${segmentIndex}`}
          />
        ))}
        {segments.flatMap((segment) =>
          segment.map((point) => (
            <circle
              className="offline-object-trend__point"
              cx={point.x}
              cy={point.y}
              data-testid="offline-trend-point"
              key={point.item.date}
              r="5"
            >
              <title>
                {point.item.date}：{format(point.value)}
              </title>
            </circle>
          ))
        )}
      </svg>
      <div aria-hidden="true" className="offline-object-trend__axis-labels">
        {items.map((item) => (
          <span key={item.date}>{item.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

function TrendResult({
  response,
  metric
}: {
  response: OfflineObjectTrendResponse;
  metric: OfflineTrendMetricKey;
}) {
  const { data, context } = response;
  const definition = TREND_METRICS[metric];
  const format = (value: number | null) =>
    definition.format(value, context.metricContext.currency);

  return (
    <div className="offline-object-trend__result">
      <div className="offline-object-trend__success-line">
        <CheckCircle2 aria-hidden="true" size={18} />
        <strong>对象趋势已响应</strong>
        <span>
          {OBJECT_LEVEL_LABELS[data.object.objectLevel]} · {data.object.displayName} ·{" "}
          {context.pointCount} 个日点
        </span>
      </div>

      <dl className="offline-object-trend__context">
        <div>
          <dt>对象范围</dt>
          <dd>{data.object.displayName}</dd>
          <small>{data.object.externalObjectRef}</small>
        </div>
        <div>
          <dt>日期范围</dt>
          <dd>
            {data.requestedRange.dateStart} — {data.requestedRange.dateStop}
          </dd>
          <small>{context.pointCount} 天完整覆盖</small>
        </div>
        <div>
          <dt>指标口径</dt>
          <dd>
            {context.metricContext.currency} · {context.metricContext.timezoneName}
          </dd>
          <small>
            {context.metricContext.clickMetricKind} · {context.metricContext.conversionEventRef}
          </small>
        </div>
        <div>
          <dt>数据状态</dt>
          <dd>{context.stabilityStatus}</dd>
          <small>{context.fetchedAt}</small>
        </div>
        <div>
          <dt>归因 / API</dt>
          <dd>{context.metricContext.attributionSpecHash}</dd>
          <small>{context.metricContext.apiVersion}</small>
        </div>
        <div>
          <dt>同步批次</dt>
          <dd>{context.syncRunIds.join("、")}</dd>
          <small>固定 fixture 来源</small>
        </div>
      </dl>

      <div className="offline-object-trend__policy">
        <ShieldCheck aria-hidden="true" size={17} />
        <span>单指标 · 无阈值 · 非因果 · 不解释趋势 · 不执行建议</span>
      </div>

      <section aria-labelledby="offline-object-trend-chart-title">
        <header className="offline-object-trend__chart-heading">
          <div>
            <h4 id="offline-object-trend-chart-title">{definition.label}日趋势</h4>
            <p>
              单位：{definition.unit}。缺失或零分母值显示为“不可用”，不会补零或跨空值连线。
            </p>
          </div>
          <Status compact severity="neutral">
            仅数字事实
          </Status>
        </header>
        <TrendChart
          currency={context.metricContext.currency}
          items={data.items}
          metric={metric}
          object={data.object}
          request={data.requestedRange}
        />
      </section>

      <div className="offline-object-trend__table-wrap">
        <table>
          <caption>对象日级趋势精确值</caption>
          <thead>
            <tr>
              <th scope="col">日期</th>
              <th scope="col">{definition.label}</th>
              <th scope="col">单位</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.date}>
                <th scope="row">{item.date}</th>
                <td>{format(trendMetricValue(item, metric))}</td>
                <td>{definition.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OfflineObjectTrendPanel({
  account,
  object,
  qualityAttestation
}: OfflineObjectTrendPanelProps) {
  const [request, setRequest] = useState<OfflineTrendRequest>(
    DEFAULT_OFFLINE_TREND_REQUEST
  );
  const [metric, setMetric] = useState<OfflineTrendMetricKey>(
    "spendMinorUnits"
  );
  const [state, setState] = useState<TrendLoadState>({ kind: "idle" });
  const activeRequest = useRef<AbortController | null>(null);
  const qualityReady =
    object !== null &&
    offlineDataQualityAttestsRanges(
      qualityAttestation,
      account,
      [request],
      object.id
    );

  useEffect(() => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setState({ kind: "idle" });
  }, [
    account.id,
    object?.id,
    qualityAttestation?.requestId,
    request.dateStart,
    request.dateStop
  ]);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    []
  );

  const updateDate =
    (field: keyof OfflineTrendRequest) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setRequest((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleLoad = async () => {
    if (object === null) {
      return;
    }
    const attestation = qualityAttestation;
    if (
      attestation === null ||
      !offlineDataQualityAttestsRanges(attestation, account, [request], object.id)
    ) {
      setState({
        kind: "error",
        code: "QUALITY_PREFLIGHT_REQUIRED",
        message: "当前对象和趋势日期尚未通过步骤 2 数据质量核验。"
      });
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ kind: "loading" });

    try {
      const response = await loadOfflineAdObjectTrend(
        account,
        object,
        request,
        controller.signal
      );
      if (
        !offlineAnalysisContextMatchesAttestation(
          attestation,
          response.context
        )
      ) {
        throw new OfflineComparisonError(
          "INVALID_RESPONSE",
          "对象趋势与步骤 2 的数据质量口径或快照不一致，已拒绝展示。"
        );
      }
      if (activeRequest.current === controller) {
        setState({ kind: "success", response });
      }
    } catch (error) {
      if (controller.signal.aborted || activeRequest.current !== controller) {
        return;
      }
      if (error instanceof OfflineComparisonError) {
        setState({ kind: "error", code: error.code, message: error.message });
      } else {
        setState({
          kind: "error",
          code: "LOCAL_CONNECTION_FAILED",
          message: "无法连接本地离线 Worker。请确认 fixture 和开发代理已启动。"
        });
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  };

  return (
    <section
      aria-labelledby="offline-object-trend-title"
      className="offline-object-trend"
    >
      <header className="offline-object-trend__header">
        <div>
          <span>步骤 5</span>
          <h3 id="offline-object-trend-title">读取对象日趋势</h3>
          <p>只展示已验证 fixture 对象的连续日级数字，一次查看一个固定指标。</p>
        </div>
        <Status compact severity="info">
          3–31 天 · 单指标
        </Status>
      </header>

      <div className="offline-object-trend__controls">
        <label>
          <span>趋势开始</span>
          <input
            aria-label="趋势开始日期"
            onChange={updateDate("dateStart")}
            required
            type="date"
            value={request.dateStart}
          />
        </label>
        <label>
          <span>趋势结束</span>
          <input
            aria-label="趋势结束日期"
            onChange={updateDate("dateStop")}
            required
            type="date"
            value={request.dateStop}
          />
        </label>
        <label>
          <span>展示指标</span>
          <select
            aria-label="趋势指标"
            onChange={(event) =>
              setMetric(event.target.value as OfflineTrendMetricKey)
            }
            value={metric}
          >
            {OFFLINE_TREND_METRIC_KEYS.map((key) => (
              <option key={key} value={key}>
                {TREND_METRICS[key].label}
              </option>
            ))}
          </select>
          <small>默认花费只是 fixture 初始视图，不代表产品主 KPI。</small>
        </label>
        <Button
          disabled={!qualityReady}
          icon={<BarChart3 aria-hidden="true" size={16} />}
          loading={state.kind === "loading"}
          onClick={() => {
            void handleLoad();
          }}
          type="button"
          variant="primary"
        >
          {state.kind === "loading" ? "正在读取对象趋势" : "加载所选对象趋势"}
        </Button>
      </div>

      <div aria-live="polite">
        {object === null ? (
          <div className="offline-object-trend__message">
            <Database aria-hidden="true" size={18} />
            <span>请先读取对象层级并选择 Campaign、Ad Set 或 Ad。</span>
          </div>
        ) : !qualityReady ? (
          <div className="offline-object-trend__message">
            <ShieldCheck aria-hidden="true" size={18} />
            <span>先完成步骤 2；趋势日期必须位于已核验范围，且对象必须在核验层级中。</span>
          </div>
        ) : state.kind === "idle" ? (
          <div className="offline-object-trend__message">
            <BarChart3 aria-hidden="true" size={18} />
            <span>
              当前趋势对象为 {object.displayName}（{OBJECT_LEVEL_LABELS[object.objectLevel]}）。
              日期或对象变化会清除旧趋势。
            </span>
          </div>
        ) : null}
        {state.kind === "loading" ? (
          <div className="offline-object-trend__message">
            <RefreshCw
              aria-hidden="true"
              className="offline-comparison__spinner"
              size={18}
            />
            <span>正在验证连续日级覆盖、九项固定指标和统一口径。</span>
          </div>
        ) : null}
        {state.kind === "error" ? (
          <div className="offline-object-trend__error" role="alert">
            <AlertTriangle aria-hidden="true" size={20} />
            <div>
              <strong>{state.code}</strong>
              <p>{state.message}</p>
              <small>没有使用静态趋势回退、补零、远程数据或建议执行。</small>
            </div>
          </div>
        ) : null}
        {state.kind === "success" ? (
          <>
            <TrendResult metric={metric} response={state.response} />
            <OfflineCodexEvidencePanel
              instanceId="object-trend"
              qualityAttestation={qualityAttestation}
              source={state.response}
              stepLabel="对象趋势 · 手动交接"
            />
          </>
        ) : null}
      </div>

      <footer className="offline-object-trend__trust">
        <span>
          <Database aria-hidden="true" size={14} /> 固定 fixture
        </span>
        <span>
          <WifiOff aria-hidden="true" size={14} /> 未连接 Meta
        </span>
        <span>
          <ShieldCheck aria-hidden="true" size={14} /> 只读 · 不解释趋势
        </span>
      </footer>
    </section>
  );
}
