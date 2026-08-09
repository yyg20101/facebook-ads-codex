import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers3,
  RefreshCw,
  ShieldCheck,
  WifiOff
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import {
  createOfflineDataQualityAttestation,
  loadOfflineDataQuality,
  type OfflineDataQualityAttestation,
  type OfflineDataQualityCheckCode,
  type OfflineDataQualityCheckUnit,
  type OfflineDataQualityResponse
} from "../../data/offlineDataQuality";
import {
  OfflineComparisonError,
  type OfflineAdAccount
} from "../../data/offlineComparison";
import {
  DEFAULT_OFFLINE_TREND_REQUEST,
  type OfflineTrendRequest
} from "../../data/offlineTrend";
import { Button } from "../ui/Button";
import { Status } from "../ui/Status";

interface OfflineDataQualityPanelProps {
  account: OfflineAdAccount;
  onAttestationChange: (
    attestation: OfflineDataQualityAttestation | null
  ) => void;
}

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; response: OfflineDataQualityResponse }
  | { kind: "error"; code: string; message: string };

const CHECK_LABELS: Record<OfflineDataQualityCheckCode, string> = {
  PRIMARY_GRAIN_UNIQUE: "主粒度唯一",
  DAILY_COVERAGE_COMPLETE: "逐日覆盖完整",
  REPORTING_CONTEXT_CONSISTENT: "报告口径一致",
  OBJECT_HIERARCHY_COMPLETE: "对象层级完整",
  ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP: "账户 → Campaign 逐日对账",
  CAMPAIGN_TO_AD_SET_DAILY_ROLLUP: "Campaign → Ad Set 逐日对账",
  AD_SET_TO_AD_DAILY_ROLLUP: "Ad Set → Ad 逐日对账"
};

const UNIT_LABELS: Record<OfflineDataQualityCheckUnit, string> = {
  ROWS: "行",
  SUBJECT_DAYS: "对象日",
  OBJECTS: "对象",
  PARENT_DAYS: "父对象日"
};

function QualityResult({ response }: { response: OfflineDataQualityResponse }) {
  const { data, context } = response;
  return (
    <div className="offline-object-trend__result offline-data-quality__result">
      <div className="offline-object-trend__success-line">
        <CheckCircle2 aria-hidden="true" size={18} />
        <strong>离线数据质量核验通过</strong>
        <span>
          {data.dataset.observedRows}/{data.dataset.expectedRows} 行 · {data.checks.length} 项检查
        </span>
      </div>

      <dl className="offline-object-trend__context">
        <div>
          <dt>数据粒度</dt>
          <dd>{data.dataset.grain}</dd>
          <small>{data.dataset.subjectCount} 个账户/对象主体</small>
        </div>
        <div>
          <dt>日期范围</dt>
          <dd>{data.requestedRange.dateStart} — {data.requestedRange.dateStop}</dd>
          <small>3–31 日完整覆盖</small>
        </div>
        <div>
          <dt>对象层级</dt>
          <dd>{data.hierarchy.objectCount} 个对象</dd>
          <small>
            {data.hierarchy.campaigns} Campaign · {data.hierarchy.adSets} Ad Set · {data.hierarchy.ads} Ad
          </small>
        </div>
        <div>
          <dt>指标口径</dt>
          <dd>{context.metricContext.currency} · {context.metricContext.timezoneName}</dd>
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
        <span>全部检查必须通过 · 无业务阈值 · 不评价表现 · 非因果 · 不作为 Gate 证据</span>
      </div>

      <section aria-labelledby="offline-data-quality-checks-title">
        <header className="offline-data-quality__checks-heading">
          <div>
            <h4 id="offline-data-quality-checks-title">核验证据</h4>
            <p>只证明这组固定 fixture 在当前范围内可安全用于后续本地分析。</p>
          </div>
          <Status compact severity="success">7/7 PASS</Status>
        </header>
        <ol className="offline-data-quality__checks">
          {data.checks.map((check) => (
            <li key={check.code}>
              <CheckCircle2 aria-hidden="true" size={18} />
              <div>
                <strong>{CHECK_LABELS[check.code]}</strong>
                <code>{check.code}</code>
              </div>
              <span>
                {check.checkedUnits} {UNIT_LABELS[check.unit]}
              </span>
              <Status compact severity="success">{check.status}</Status>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function OfflineDataQualityPanel({
  account,
  onAttestationChange
}: OfflineDataQualityPanelProps) {
  const [request, setRequest] = useState<OfflineTrendRequest>(
    DEFAULT_OFFLINE_TREND_REQUEST
  );
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setState({ kind: "idle" });
    onAttestationChange(null);
  }, [account.id, onAttestationChange]);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    []
  );

  const updateDate =
    (field: keyof OfflineTrendRequest) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      activeRequest.current?.abort();
      activeRequest.current = null;
      setState({ kind: "idle" });
      onAttestationChange(null);
      setRequest((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleLoad = async () => {
    activeRequest.current?.abort();
    onAttestationChange(null);
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ kind: "loading" });

    try {
      const response = await loadOfflineDataQuality(
        account,
        request,
        controller.signal
      );
      if (activeRequest.current === controller) {
        setState({ kind: "success", response });
        onAttestationChange(createOfflineDataQualityAttestation(response));
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
      aria-labelledby="offline-data-quality-title"
      className="offline-object-trend offline-data-quality"
    >
      <header className="offline-object-trend__header">
        <div>
          <span>步骤 2 · 分析 preflight</span>
          <h3 id="offline-data-quality-title">核验离线数据质量</h3>
          <p>先检查账户与全部对象的粒度、覆盖、口径、层级和逐日汇总，再解锁分析。</p>
        </div>
        <Status compact severity="info">3–31 天 · 全量通过才返回</Status>
      </header>

      <div className="offline-object-trend__controls offline-data-quality__controls">
        <label>
          <span>核验开始</span>
          <input
            aria-label="数据质量开始日期"
            onChange={updateDate("dateStart")}
            required
            type="date"
            value={request.dateStart}
          />
        </label>
        <label>
          <span>核验结束</span>
          <input
            aria-label="数据质量结束日期"
            onChange={updateDate("dateStop")}
            required
            type="date"
            value={request.dateStop}
          />
        </label>
        <Button
          icon={<ShieldCheck aria-hidden="true" size={16} />}
          loading={state.kind === "loading"}
          onClick={() => { void handleLoad(); }}
          type="button"
          variant="primary"
        >
          {state.kind === "loading" ? "正在核验离线数据" : "运行离线数据质量核验"}
        </Button>
      </div>

      <div aria-live="polite">
        {state.kind === "idle" ? (
          <div className="offline-object-trend__message">
            <Layers3 aria-hidden="true" size={18} />
            <span>完成核验前，账户与对象指标分析保持锁定。</span>
          </div>
        ) : null}
        {state.kind === "loading" ? (
          <div className="offline-object-trend__message">
            <RefreshCw aria-hidden="true" className="offline-comparison__spinner" size={18} />
            <span>正在原子检查全部主体日粒度与三层父子汇总。</span>
          </div>
        ) : null}
        {state.kind === "error" ? (
          <div className="offline-object-trend__error" role="alert">
            <AlertTriangle aria-hidden="true" size={20} />
            <div>
              <strong>{state.code}</strong>
              <p>{state.message}</p>
              <small>任一检查失败都会拒绝整份报告；没有部分通过、补零或静态回退。</small>
            </div>
          </div>
        ) : null}
        {state.kind === "success" ? <QualityResult response={state.response} /> : null}
      </div>

      <footer className="offline-object-trend__trust">
        <span><Database aria-hidden="true" size={14} /> 固定 fixture</span>
        <span><WifiOff aria-hidden="true" size={14} /> 未连接 Meta</span>
        <span><ShieldCheck aria-hidden="true" size={14} /> 只读 · 非效果评分</span>
      </footer>
    </section>
  );
}
