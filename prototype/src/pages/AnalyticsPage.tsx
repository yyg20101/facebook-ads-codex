import {
  AlertTriangle,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Info,
  Lightbulb,
  Search,
  ShieldAlert,
  Target,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "../router";
import { OfflineComparisonPanel } from "../components/analytics/OfflineComparisonPanel";
import { TrendChart } from "../components/charts/TrendChart";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Status } from "../components/ui/Status";
import { useToast } from "../components/ui/Toast";
import {
  contributionRows,
  diagnosisEvidence,
  money,
  trendData,
} from "../data/demo";
import { usePrototypeState } from "../state/PrototypeState";

type LevelTab = "Campaign" | "Ad Set" | "Ad" | "素材";

const evidenceIcons = {
  evidence: CheckCircle2,
  counter: Check,
  missing: AlertTriangle,
} as const;

const evidenceTitles = {
  evidence: "证据",
  counter: "反证",
  missing: "缺失数据",
} as const;

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const {
    diagnosisSaved,
    pendingActionCreated,
    saveDiagnosis,
    createPendingAction,
  } = usePrototypeState();
  const [level, setLevel] = useState<LevelTab>("Ad");
  const [selectedRow, setSelectedRow] = useState("AD-002");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionAcknowledged, setActionAcknowledged] = useState(false);

  const handleSaveDiagnosis = () => {
    saveDiagnosis();
    notify("诊断报告 DR-004 已保存；结论仍为“建议 · 未执行”");
  };

  const handleCreateAction = () => {
    createPendingAction();
    setActionDialogOpen(false);
    notify("已创建待确认行动 ACT-004；没有执行广告变更");
  };

  return (
    <div className="page analytics-page">
      <PageHeader
        actions={
          <>
            <Button
              icon={<Download aria-hidden="true" size={16} />}
              onClick={() =>
                notify("已模拟生成脱敏导出；原型不会下载真实账户数据")
              }
            >
              导出
            </Button>
            <Button
              icon={<Bookmark aria-hidden="true" size={16} />}
              onClick={() => notify("当前筛选视图已保存到原型状态")}
            >
              保存视图
            </Button>
          </>
        }
        title="数据分析"
      />

      <OfflineComparisonPanel />

      <div className="analytics-static-divider" role="separator">
        <span>以下为 Product Discovery 静态流程演示，不是 Worker 返回结果</span>
      </div>

      <section className="analytics-filterbar" aria-label="分析范围">
        <label className="compact-select compact-select--wide">
          <span className="sr-only">Campaign 范围</span>
          <select defaultValue="all">
            <option value="all">全部 Campaign</option>
            <option value="C-001">夏季轻装转化</option>
          </select>
        </label>
        <label className="compact-select">
          <span className="sr-only">时间粒度</span>
          <select defaultValue="day">
            <option value="day">按天</option>
            <option value="week">按周</option>
          </select>
        </label>
        <label className="compact-select compact-select--wide">
          <span className="sr-only">比较范围</span>
          <select defaultValue="previous">
            <option value="previous">与前 7 天对比</option>
          </select>
        </label>
        <label className="compact-select">
          <span className="sr-only">主要结果</span>
          <select defaultValue="purchase">
            <option value="purchase">购买</option>
          </select>
        </label>
        <Button icon={<Filter aria-hidden="true" size={16} />} size="sm">
          筛选
        </Button>
      </section>

      <div className="scope-band">
        <span>2025-05-11—2025-05-17</span>
        <i />
        <span>Asia/Shanghai</span>
        <i />
        <span>7 天点击 / 1 天浏览</span>
        <i />
        <Status compact severity="success">
          数据已稳定
        </Status>
      </div>

      <div className="analytics-layout">
        <div className="analytics-main">
          <section className="surface analytics-trend">
            <header className="surface__header">
              <div>
                <h2>结果趋势</h2>
                <p>异常标记基于同一数据范围和口径</p>
              </div>
              <button className="text-button" type="button">
                图表设置 <ChevronDown size={14} />
              </button>
            </header>
            <TrendChart
              annotation={{ date: "05-16", label: "异常：购买下降" }}
              data={trendData}
            />
          </section>

          <section className="surface contribution-panel">
            <header className="surface__header">
              <div>
                <h2>贡献对象</h2>
                <p>从 Campaign 下钻到素材</p>
              </div>
            </header>
            <div className="tab-list contribution-tabs" role="tablist">
              {(["Campaign", "Ad Set", "Ad", "素材"] as LevelTab[]).map(
                (item) => (
                  <button
                    aria-selected={level === item}
                    className={
                      level === item
                        ? "tab-button tab-button--active"
                        : "tab-button"
                    }
                    key={item}
                    onClick={() => setLevel(item)}
                    role="tab"
                    type="button"
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <div className="contribution-toolbar">
              <label className="search-field">
                <Search aria-hidden="true" size={16} />
                <span className="sr-only">搜索名称或 ID</span>
                <input placeholder="搜索名称或 ID" />
              </label>
              <Button icon={<Filter aria-hidden="true" size={15} />} size="sm">
                添加筛选
              </Button>
            </div>
            <div className="table-scroll">
              <table className="data-table data-table--interactive">
                <thead>
                  <tr>
                    <th>名称 / ID</th>
                    <th>层级</th>
                    <th>消耗</th>
                    <th>CTR</th>
                    <th>购买</th>
                    <th>CPA</th>
                    <th>ROAS</th>
                    <th>与前 7 天对比</th>
                  </tr>
                </thead>
                <tbody>
                  {contributionRows.map((row) => (
                    <tr
                      className={
                        selectedRow === row.id
                          ? "data-table__row--selected"
                          : ""
                      }
                      key={row.id}
                      onClick={() => setSelectedRow(row.id)}
                    >
                      <td>
                        <button
                          className="hierarchy-name"
                          onClick={() => setSelectedRow(row.id)}
                          style={{ paddingInlineStart: `${row.depth * 18}px` }}
                          type="button"
                        >
                          <ChevronRight
                            aria-hidden="true"
                            size={14}
                            style={{
                              transform:
                                row.depth < 3 ? "rotate(90deg)" : undefined,
                            }}
                          />
                          <span>
                            <strong>{row.name}</strong>
                            <small>{row.id}</small>
                          </span>
                        </button>
                      </td>
                      <td>{row.level}</td>
                      <td>{money(row.spend)}</td>
                      <td>{row.ctr.toFixed(2)}%</td>
                      <td>{row.purchases}</td>
                      <td>{money(row.cpa)}</td>
                      <td>{row.roas.toFixed(2)}</td>
                      <td
                        className={
                          row.change < -30
                            ? "metric-negative"
                            : "metric-positive"
                        }
                      >
                        ↓ {Math.abs(row.change).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="surface diagnosis-panel">
          <header className="diagnosis-panel__header">
            <div>
              <h2>诊断报告 <small>DR-004</small></h2>
              <Status severity={pendingActionCreated ? "warning" : "success"}>
                {pendingActionCreated ? "行动待确认" : "建议 · 未执行"}
              </Status>
            </div>
            <button
              aria-label="查看诊断来源"
              className="icon-button"
              onClick={() => notify("诊断基于当前原型数据范围和规则")}
              type="button"
            >
              <Info size={17} />
            </button>
          </header>

          <div className="diagnosis-headline">
            <span>
              <ShieldAlert aria-hidden="true" size={20} />
            </span>
            <div>
              <h3>有点击，购买下降</h3>
              <p>过去 3 天购买下降 <strong>42%</strong></p>
            </div>
            <Status severity="critical">HIGH</Status>
          </div>

          <div className="diagnosis-evidence">
            {(["evidence", "counter", "missing"] as const).map((kind) => (
              <section key={kind}>
                <h3>{evidenceTitles[kind]}</h3>
                {diagnosisEvidence
                  .filter((item) => item.kind === kind)
                  .map((item) => {
                    const Icon = evidenceIcons[item.kind];
                    return (
                      <details className={`evidence-row evidence-row--${kind}`} key={item.id}>
                        <summary>
                          <Icon aria-hidden="true" size={17} />
                          <span>{item.label}</span>
                          <ChevronRight aria-hidden="true" size={15} />
                        </summary>
                        <p>{item.detail}</p>
                      </details>
                    );
                  })}
              </section>
            ))}
          </div>

          <div className="confidence-row">
            <span>
              <Target aria-hidden="true" size={16} />
              置信度
            </span>
            <strong>LIKELY</strong>
          </div>

          <section className="recommendation-list">
            <h3>建议行动</h3>
            {[
              "检查落地页结账路径",
              "保留当前广告 24 小时收集样本",
              "创建素材替代测试",
            ].map((action, index) => (
              <article key={action}>
                <span>{index + 1}</span>
                <strong>{action}</strong>
                <Status compact severity="info">
                  待确认
                </Status>
              </article>
            ))}
          </section>

          <details className="methodology">
            <summary>
              方法论
              <ChevronDown aria-hidden="true" size={15} />
            </summary>
            <p>
              先检查数据质量，再分解 CPM、CTR、CPC、CVR 和购买价值。当前只支持
              LIKELY，不声明因果。
            </p>
          </details>

          <div className="diagnosis-panel__actions">
            <Button
              icon={<FileText aria-hidden="true" size={16} />}
              onClick={handleSaveDiagnosis}
            >
              {diagnosisSaved ? "诊断已保存" : "保存诊断"}
            </Button>
            <Button
              disabled={pendingActionCreated}
              icon={<Lightbulb aria-hidden="true" size={16} />}
              onClick={() => setActionDialogOpen(true)}
              variant="primary"
            >
              {pendingActionCreated ? "行动已待确认" : "创建待确认行动"}
            </Button>
          </div>

          <button
            className="object-link-row"
            onClick={() => navigate("/assets?focus=AST-001")}
            type="button"
          >
            <ExternalLink aria-hidden="true" size={16} />
            查看关联素材 AST-001
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </aside>
      </div>

      <Dialog
        description="行动建议与已执行变更必须保持区分。"
        footer={
          <>
            <Button onClick={() => setActionDialogOpen(false)}>取消</Button>
            <Button
              disabled={!actionAcknowledged}
              onClick={handleCreateAction}
              variant="primary"
            >
              保存为待确认行动
            </Button>
          </>
        }
        onClose={() => setActionDialogOpen(false)}
        open={actionDialogOpen}
        title="创建待确认行动"
      >
        <div className="confirmation-summary">
          <dl className="review-summary">
            <div>
              <dt>行动对象</dt>
              <dd>AD-002 · 夏日轻装_转化_02</dd>
            </div>
            <div>
              <dt>建议</dt>
              <dd>检查落地页结账路径并保留 24 小时样本</dd>
            </div>
            <div>
              <dt>证据状态</dt>
              <dd>LIKELY · 存在缺失数据</dd>
            </div>
            <div>
              <dt>执行状态</dt>
              <dd>待确认 · 不写入 Meta</dd>
            </div>
          </dl>
          <label className="check-row">
            <input
              checked={actionAcknowledged}
              onChange={(event) =>
                setActionAcknowledged(event.target.checked)
              }
              type="checkbox"
            />
            <span>
              我理解这只是保存建议，不会暂停广告、调整预算或修改投放状态。
            </span>
          </label>
        </div>
      </Dialog>
    </div>
  );
}
