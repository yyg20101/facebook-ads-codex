import {
  AlertTriangle,
  CheckCircle2,
  Database,
  GitBranch,
  LineChart,
  RefreshCw,
  ShieldCheck,
  WifiOff
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent
} from "react";

import {
  loadOfflineDirectChildTrend,
  type OfflineDirectChildTrendResponse
} from "../../data/offlineChildTrend";
import {
  OfflineComparisonError,
  type OfflineAdAccount
} from "../../data/offlineComparison";
import {
  offlineAnalysisContextMatchesAttestation,
  offlineDataQualityAttestsRanges,
  type OfflineDataQualityAttestation
} from "../../data/offlineDataQuality";
import type { OfflineAdObject } from "../../data/offlineHierarchy";
import {
  DEFAULT_OFFLINE_TREND_REQUEST,
  OFFLINE_TREND_METRIC_KEYS,
  trendMetricValue,
  type OfflineDailyTrendItem,
  type OfflineTrendMetricKey,
  type OfflineTrendRequest
} from "../../data/offlineTrend";
import { Button } from "../ui/Button";
import { Status } from "../ui/Status";
import { OfflineCodexEvidencePanel } from "./OfflineCodexEvidencePanel";

interface OfflineDirectChildTrendPanelProps {
  account: OfflineAdAccount;
  parent: OfflineAdObject | null;
  qualityAttestation: OfflineDataQualityAttestation | null;
}

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; response: OfflineDirectChildTrendResponse }
  | { kind: "error"; code: string; message: string };

interface TrendMetricDefinition {
  label: string;
  unit: string;
  format: (value: number | null, currency: string) => string;
}

interface TrendSeries {
  id: string;
  label: string;
  reference: string;
  items: readonly OfflineDailyTrendItem[];
  parent: boolean;
}

interface SeriesStyle extends CSSProperties {
  "--series-color": string;
}

interface ChartPoint {
  item: OfflineDailyTrendItem;
  value: number;
  x: number;
  y: number;
}

const SERIES_COLORS = [
  "#f1c36b",
  "#61d9bf",
  "#75a7ff",
  "#d58cff",
  "#ff8e8e",
  "#65c8ff",
  "#a6d96a",
  "#ffb86b",
  "#b8a1ff",
  "#75df8a",
  "#f28ad7"
] as const;

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

function buildChartSegments(
  items: readonly OfflineDailyTrendItem[],
  metric: OfflineTrendMetricKey,
  maximum: number
): ChartPoint[][] {
  const chartWidth = 720;
  const chartHeight = 260;
  const horizontalPadding = 44;
  const verticalPadding = 30;
  const usableWidth = chartWidth - horizontalPadding * 2;
  const usableHeight = chartHeight - verticalPadding * 2;
  const xStep = items.length <= 1 ? 0 : usableWidth / (items.length - 1);
  const segments: ChartPoint[][] = [];
  let current: ChartPoint[] = [];

  for (const [index, item] of items.entries()) {
    const value = trendMetricValue(item, metric);
    if (value === null) {
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

function DirectChildTrendChart({
  series,
  metric,
  request,
  currency
}: {
  series: readonly TrendSeries[];
  metric: OfflineTrendMetricKey;
  request: OfflineTrendRequest;
  currency: string;
}) {
  const definition = TREND_METRICS[metric];
  const values = series.flatMap((entry) =>
    entry.items.map((point) => trendMetricValue(point, metric))
  );
  const finiteValues = values.filter((value): value is number => value !== null);
  const maximum = Math.max(1, ...finiteValues);
  const format = (value: number | null) => definition.format(value, currency);

  return (
    <div className="offline-object-trend__chart offline-direct-child-trend__chart">
      <svg
        aria-label={`直接子对象${definition.label}日趋势 ${request.dateStart} 至 ${request.dateStop}`}
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 720 260"
      >
        <title>父对象与直接子对象 · {definition.label}日趋势</title>
        {[0, 1, 2, 3].map((line) => {
          const y = 30 + line * (200 / 3);
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
        {series.map((entry, seriesIndex) => {
          const color = SERIES_COLORS[seriesIndex] ?? SERIES_COLORS[0];
          const style: SeriesStyle = { "--series-color": color };
          const segments = buildChartSegments(entry.items, metric, maximum);
          return (
            <g key={entry.id} style={style}>
              {segments.map((segment, segmentIndex) => (
                <path
                  className={
                    entry.parent
                      ? "offline-direct-child-trend__line offline-direct-child-trend__line--parent"
                      : "offline-direct-child-trend__line"
                  }
                  d={segment
                    .map((point, index) =>
                      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
                    )
                    .join(" ")}
                  key={`${entry.id}-${segmentIndex}`}
                />
              ))}
              {segments.flatMap((segment) =>
                segment.map((point) => (
                  <circle
                    className="offline-direct-child-trend__point"
                    cx={point.x}
                    cy={point.y}
                    key={`${entry.id}-${point.item.date}`}
                    r={entry.parent ? 5 : 4}
                  >
                    <title>
                      {entry.label} · {point.item.date}：{format(point.value)}
                    </title>
                  </circle>
                ))
              )}
            </g>
          );
        })}
      </svg>
      <div aria-hidden="true" className="offline-object-trend__axis-labels">
        {series[0]?.items.map((point) => (
          <span key={point.date}>{point.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

function TrendResult({
  response,
  metric
}: {
  response: OfflineDirectChildTrendResponse;
  metric: OfflineTrendMetricKey;
}) {
  const { data, context } = response;
  const definition = TREND_METRICS[metric];
  const currency = context.metricContext.currency;
  const format = (value: number | null) => definition.format(value, currency);
  const series: TrendSeries[] = [
    {
      id: data.parent.id,
      label: `${data.parent.displayName}（父对象）`,
      reference: data.parent.externalObjectRef,
      items: data.parentItems,
      parent: true
    },
    ...data.items.map((entry) => ({
      id: entry.object.id,
      label: entry.object.displayName,
      reference: entry.object.externalObjectRef,
      items: entry.items,
      parent: false
    }))
  ];

  return (
    <div className="offline-object-trend__result">
      <div className="offline-object-trend__success-line">
        <CheckCircle2 aria-hidden="true" size={18} />
        <strong>逐日父子对账通过</strong>
        <span>
          {data.parent.displayName} · {context.childCount} 个直接子对象 · {context.pointCount} 天
        </span>
      </div>

      <dl className="offline-object-trend__context">
        <div>
          <dt>父对象</dt>
          <dd>{data.parent.displayName}</dd>
          <small>{data.parent.externalObjectRef}</small>
        </div>
        <div>
          <dt>子对象范围</dt>
          <dd>{context.childCount} 个 {context.childObjectLevel}</dd>
          <small>稳定对象 ID 顺序</small>
        </div>
        <div>
          <dt>日期范围</dt>
          <dd>{data.requestedRange.dateStart} — {data.requestedRange.dateStop}</dd>
          <small>{context.pointCount} 天完整覆盖</small>
        </div>
        <div>
          <dt>指标口径</dt>
          <dd>{currency} · {context.metricContext.timezoneName}</dd>
          <small>{context.metricContext.clickMetricKind} · {context.metricContext.conversionEventRef}</small>
        </div>
        <div>
          <dt>数据状态</dt>
          <dd>{context.stabilityStatus}</dd>
          <small>{context.fetchedAt}</small>
        </div>
        <div>
          <dt>同步批次</dt>
          <dd>{context.syncRunIds.join("、")}</dd>
          <small>{context.metricContext.apiVersion}</small>
        </div>
      </dl>

      <div className="offline-object-trend__policy">
        <ShieldCheck aria-hidden="true" size={17} />
        <span>逐日对账 · 单指标 · 无排名 · 无阈值 · 非因果 · 不解释趋势 · 不执行建议</span>
      </div>

      <section aria-labelledby="offline-direct-child-trend-chart-title">
        <header className="offline-object-trend__chart-heading">
          <div>
            <h4 id="offline-direct-child-trend-chart-title">{definition.label}父子日趋势</h4>
            <p>父对象仅作逐日对账参考；颜色和顺序不表达表现优劣。</p>
          </div>
          <Status compact severity="neutral">仅数字事实</Status>
        </header>

        <div className="offline-direct-child-trend__legend" aria-label="趋势图例">
          {series.map((entry, index) => {
            const color = SERIES_COLORS[index] ?? SERIES_COLORS[0];
            const style: SeriesStyle = { "--series-color": color };
            return (
              <div key={entry.id} style={style}>
                <span aria-hidden="true" />
                <strong>{entry.label}</strong>
                <small>{entry.reference}</small>
              </div>
            );
          })}
        </div>

        <DirectChildTrendChart
          currency={currency}
          metric={metric}
          request={data.requestedRange}
          series={series}
        />
      </section>

      <div className="offline-object-trend__table-wrap">
        <table aria-label="父子对象日级趋势精确值">
          <caption>父子对象日级趋势精确值</caption>
          <thead>
            <tr>
              <th scope="col">日期</th>
              {series.map((entry) => (
                <th key={entry.id} scope="col">{entry.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.parentItems.map((parentItem, dayIndex) => (
              <tr key={parentItem.date}>
                <th scope="row">{parentItem.date}</th>
                {series.map((entry) => (
                  <td key={entry.id}>
                    {format(
                      entry.items[dayIndex] === undefined
                        ? null
                        : trendMetricValue(entry.items[dayIndex], metric)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OfflineDirectChildTrendPanel({
  account,
  parent,
  qualityAttestation
}: OfflineDirectChildTrendPanelProps) {
  const [request, setRequest] = useState<OfflineTrendRequest>(
    DEFAULT_OFFLINE_TREND_REQUEST
  );
  const [metric, setMetric] = useState<OfflineTrendMetricKey>("spendMinorUnits");
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const activeRequest = useRef<AbortController | null>(null);
  const supportedParent = parent !== null && parent.objectLevel !== "AD";
  const qualityReady =
    supportedParent &&
    parent !== null &&
    offlineDataQualityAttestsRanges(
      qualityAttestation,
      account,
      [request],
      parent.id
    );

  useEffect(() => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setState({ kind: "idle" });
  }, [
    account.id,
    parent?.id,
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
    if (!supportedParent || parent === null) {
      return;
    }
    const attestation = qualityAttestation;
    if (
      attestation === null ||
      !offlineDataQualityAttestsRanges(attestation, account, [request], parent.id)
    ) {
      setState({
        kind: "error",
        code: "QUALITY_PREFLIGHT_REQUIRED",
        message: "当前父对象和趋势日期尚未通过步骤 2 数据质量核验。"
      });
      return;
    }
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ kind: "loading" });

    try {
      const response = await loadOfflineDirectChildTrend(
        account,
        parent,
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
          "直接子对象趋势与步骤 2 的数据质量口径或快照不一致，已拒绝展示。"
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
      aria-labelledby="offline-direct-child-trend-title"
      className="offline-object-trend offline-direct-child-trend"
    >
      <header className="offline-object-trend__header">
        <div>
          <span>步骤 6</span>
          <h3 id="offline-direct-child-trend-title">读取直接子对象日趋势</h3>
          <p>把父对象和全部直接子对象按日并列，并逐日验证四项可加指标。</p>
        </div>
        <Status compact severity="info">3–31 天 · 最多 10 个子对象</Status>
      </header>

      <div className="offline-object-trend__controls">
        <label>
          <span>趋势开始</span>
          <input
            aria-label="直接子对象趋势开始日期"
            onChange={updateDate("dateStart")}
            required
            type="date"
            value={request.dateStart}
          />
        </label>
        <label>
          <span>趋势结束</span>
          <input
            aria-label="直接子对象趋势结束日期"
            onChange={updateDate("dateStop")}
            required
            type="date"
            value={request.dateStop}
          />
        </label>
        <label>
          <span>展示指标</span>
          <select
            aria-label="直接子对象趋势指标"
            onChange={(event) =>
              setMetric(event.target.value as OfflineTrendMetricKey)
            }
            value={metric}
          >
            {OFFLINE_TREND_METRIC_KEYS.map((key) => (
              <option key={key} value={key}>{TREND_METRICS[key].label}</option>
            ))}
          </select>
          <small>指标切换只更新本地视图，不重新请求或产生排名。</small>
        </label>
        <Button
          disabled={!qualityReady}
          icon={<GitBranch aria-hidden="true" size={16} />}
          loading={state.kind === "loading"}
          onClick={() => { void handleLoad(); }}
          type="button"
          variant="primary"
        >
          {state.kind === "loading" ? "正在读取直接子对象趋势" : "加载直接子对象趋势"}
        </Button>
      </div>

      <div aria-live="polite">
        {parent === null ? (
          <div className="offline-object-trend__message">
            <Database aria-hidden="true" size={18} />
            <span>请先选择 Campaign 或 Ad Set；Ad 叶子不支持该读取。</span>
          </div>
        ) : parent.objectLevel === "AD" ? (
          <div className="offline-object-trend__message">
            <GitBranch aria-hidden="true" size={18} />
            <span>Ad 是叶子对象，没有直接子对象；入口已安全禁用。</span>
          </div>
        ) : !qualityReady ? (
          <div className="offline-object-trend__message">
            <ShieldCheck aria-hidden="true" size={18} />
            <span>先完成步骤 2；趋势日期必须位于已核验范围，且父对象必须在核验层级中。</span>
          </div>
        ) : state.kind === "idle" ? (
          <div className="offline-object-trend__message">
            <LineChart aria-hidden="true" size={18} />
            <span>当前父对象为 {parent.displayName}；对象或日期变化会清除旧结果。</span>
          </div>
        ) : null}
        {state.kind === "loading" ? (
          <div className="offline-object-trend__message">
            <RefreshCw aria-hidden="true" className="offline-comparison__spinner" size={18} />
            <span>正在验证全部子对象连续覆盖、统一口径和逐日父子汇总。</span>
          </div>
        ) : null}
        {state.kind === "error" ? (
          <div className="offline-object-trend__error" role="alert">
            <AlertTriangle aria-hidden="true" size={20} />
            <div>
              <strong>{state.code}</strong>
              <p>{state.message}</p>
              <small>没有展示部分序列、补零、排名、远程数据或执行建议。</small>
            </div>
          </div>
        ) : null}
        {state.kind === "success" ? (
          <>
            <TrendResult metric={metric} response={state.response} />
            <OfflineCodexEvidencePanel
              instanceId="direct-child-trend"
              qualityAttestation={qualityAttestation}
              source={state.response}
              stepLabel="直接子对象趋势 · 手动交接"
            />
          </>
        ) : null}
      </div>

      <footer className="offline-object-trend__trust">
        <span><Database aria-hidden="true" size={14} /> 固定 fixture</span>
        <span><WifiOff aria-hidden="true" size={14} /> 未连接 Meta</span>
        <span><ShieldCheck aria-hidden="true" size={14} /> 无排名 · 不解释趋势</span>
      </footer>
    </section>
  );
}
