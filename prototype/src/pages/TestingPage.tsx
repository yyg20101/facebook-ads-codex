import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  FlaskConical,
  Info,
  Link2,
  Plus,
  Save,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "../router";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Status, severityForStatus } from "../components/ui/Status";
import { useToast } from "../components/ui/Toast";
import { creativeAssets, money, testPlans } from "../data/demo";
import { usePrototypeState } from "../state/PrototypeState";
import type { TestConclusion } from "../types";

type MetricTab = "核心指标" | "转化指标" | "互动指标" | "价值指标";

export function TestingPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const {
    testConclusion,
    setTestConclusion,
    testConclusionSaved,
    saveTestConclusion,
    nextTestCreated,
    createNextTest,
  } = usePrototypeState();
  const [selectedPlan, setSelectedPlan] = useState("TP-007");
  const [metricTab, setMetricTab] = useState<MetricTab>("核心指标");
  const [nextDialogOpen, setNextDialogOpen] = useState(false);
  const [hypothesisConfirmed, setHypothesisConfirmed] = useState(false);

  const planItems = useMemo(
    () =>
      nextTestCreated
        ? [
            {
              id: "TP-008",
              name: "生活方式首屏构图",
              status: "准备中" as const,
              variable: "首屏构图",
              metric: "单次购买成本",
              period: "待确认",
            },
            ...testPlans,
          ]
        : testPlans,
    [nextTestCreated],
  );
  const plan =
    planItems.find((item) => item.id === selectedPlan) ?? planItems[0];
  const canEvaluate = plan.status === "可评估" && plan.id === "TP-007";

  const handleSaveConclusion = () => {
    saveTestConclusion();
    notify(
      `测试结论已保存为 ${testConclusion}；没有自动调整预算或投放状态`,
    );
  };

  const handleCreateNext = () => {
    createNextTest();
    setSelectedPlan("TP-008");
    setNextDialogOpen(false);
    notify("下一轮测试 TP-008 已建立为本地“准备中”草稿");
  };

  return (
    <div className="page testing-page">
      <PageHeader
        actions={
          <Button
            icon={<Plus aria-hidden="true" size={16} />}
            onClick={() => setNextDialogOpen(true)}
            variant="primary"
          >
            新建测试
          </Button>
        }
        title="测试与优化"
      />

      <div className="testing-layout">
        <aside className="surface test-plan-list">
          <header className="surface__header">
            <div>
              <h2>测试计划</h2>
              <p>{planItems.length} 个原型计划</p>
            </div>
            <label className="compact-select">
              <span className="sr-only">测试状态</span>
              <select defaultValue="all">
                <option value="all">全部状态</option>
              </select>
            </label>
          </header>
          <div className="test-plan-list__items">
            {planItems.map((item) => (
              <button
                aria-pressed={selectedPlan === item.id}
                className={`test-plan-row ${
                  selectedPlan === item.id ? "test-plan-row--active" : ""
                }`}
                key={item.id}
                onClick={() => setSelectedPlan(item.id)}
                type="button"
              >
                <span className="test-plan-row__heading">
                  <strong>
                    {item.id} · {item.name}
                  </strong>
                  <Status compact severity={severityForStatus(item.status)}>
                    {item.status}
                  </Status>
                </span>
                <span>{item.variable}</span>
                <span>{item.metric}</span>
                <small>{item.period}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="test-workspace">
          <div className="surface test-definition">
            <header className="surface__header">
              <div>
                <h2>
                  {plan.id} · {plan.name}
                </h2>
                <Status severity={severityForStatus(plan.status)}>
                  {plan.status}
                </Status>
              </div>
              <Button
                icon={<Settings2 aria-hidden="true" size={16} />}
                onClick={() => notify("测试设置只更新本地原型草稿")}
                size="sm"
              >
                测试设置
              </Button>
            </header>

            {plan.id === "TP-007" ? (
              <>
                <dl className="test-definition__facts">
                  <div>
                    <dt>假设</dt>
                    <dd>生活方式画面比产品静物降低单次购买成本</dd>
                  </div>
                  <div>
                    <dt>主要变量</dt>
                    <dd>画面主题</dd>
                  </div>
                  <div>
                    <dt>主要指标</dt>
                    <dd>单次购买成本</dd>
                  </div>
                  <div>
                    <dt>护栏指标</dt>
                    <dd>CTR、负面反馈</dd>
                  </div>
                  <div>
                    <dt>测试周期</dt>
                    <dd>2025-05-11—2025-05-17</dd>
                  </div>
                </dl>
                <ol className="test-timeline">
                  <TestTimelineItem complete label="计划创建" meta="05-09" />
                  <TestTimelineItem complete label="投放中" meta="05-11" />
                  <TestTimelineItem active label="可评估" meta="05-17" />
                  <TestTimelineItem label="已结束" meta="—" />
                </ol>
                <div className="control-band">
                  <strong>控制条件</strong>
                  <span>相同国家/地区</span>
                  <span>相同受众</span>
                  <span>相同版位</span>
                  <span>购买目标</span>
                  <span>预算分配 50% / 50%</span>
                </div>
              </>
            ) : (
              <div className="test-state-message">
                <AlertTriangle aria-hidden="true" size={22} />
                <div>
                  <h3>{plan.status}</h3>
                  <p>
                    当前计划还不能形成可靠结论。继续收集满足条件的数据，或返回设置修复配置。
                  </p>
                </div>
              </div>
            )}
          </div>

          {plan.id === "TP-007" ? (
            <>
              <div className="variant-grid">
                <VariantCard
                  asset={creativeAssets[0]}
                  label="变体 A · 生活方式"
                  selected
                />
                <VariantCard
                  asset={creativeAssets[1]}
                  label="变体 B · 产品静物"
                />
              </div>

              <section className="surface comparison-panel">
                <header className="comparison-panel__header">
                  <div className="tab-list" role="tablist">
                    {(
                      [
                        "核心指标",
                        "转化指标",
                        "互动指标",
                        "价值指标",
                      ] as MetricTab[]
                    ).map((item) => (
                      <button
                        aria-selected={metricTab === item}
                        className={
                          metricTab === item
                            ? "tab-button tab-button--active"
                            : "tab-button"
                        }
                        key={item}
                        onClick={() => setMetricTab(item)}
                        role="tab"
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <Button size="sm">导出</Button>
                </header>
                <div className="table-scroll">
                  <table className="data-table comparison-table">
                    <thead>
                      <tr>
                        <th>指标</th>
                        <th>变体 A · 生活方式</th>
                        <th>变体 B · 产品静物</th>
                        <th>差异 (B - A)</th>
                        <th>差异百分比</th>
                        <th>结论</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ComparisonRow
                        a="¥4,562.34"
                        b="¥3,128.90"
                        difference="−¥1,433.44"
                        label="花费"
                        percent="−31.41%"
                      />
                      <ComparisonRow
                        a="212,345"
                        b="177,849"
                        difference="−34,496"
                        label="曝光"
                        percent="−16.24%"
                      />
                      <ComparisonRow
                        a="2.15%"
                        b="1.76%"
                        difference="−0.39pp"
                        label="CTR"
                        percent="−18.14%"
                      />
                      <ComparisonRow
                        a="68"
                        b="42"
                        difference="−26"
                        label="购买"
                        percent="−38.24%"
                      />
                      <ComparisonRow
                        a="¥67.09"
                        b="¥74.50"
                        difference="+¥7.41"
                        emphasis
                        label="单次购买成本 (CPA)"
                        percent="+11.04%"
                      />
                      <ComparisonRow
                        a="3.89"
                        b="3.12"
                        difference="−0.77"
                        label="ROAS"
                        percent="−19.79%"
                      />
                    </tbody>
                  </table>
                </div>
                <div className="comparison-note">
                  <Info aria-hidden="true" size={16} />
                  结论仅基于当前原型数据，不进行显著性检验，也不声明因果。
                </div>
              </section>
            </>
          ) : null}
        </section>

        <aside className="surface conclusion-panel">
          <header className="surface__header">
            <div>
              <h2>测试结论 <small>TC-007</small></h2>
              <p>记录知识，不自动优化</p>
            </div>
          </header>

          <section className="validity-checks">
            <h3>数据有效性</h3>
            <div>
              <span>
                <CheckCircle2 size={16} /> 曝光分配偏差 12%
              </span>
              <Status compact severity="warning">
                WARNING
              </Status>
            </div>
            <div>
              <span>
                <CheckCircle2 size={16} /> 追踪事件稳定
              </span>
              <Status compact severity="success">
                OK
              </Status>
            </div>
            <div>
              <span>
                <CheckCircle2 size={16} /> 中途配置变化：无
              </span>
              <Status compact severity="success">
                OK
              </Status>
            </div>
          </section>

          <div className="confidence-row">
            <span>
              <FlaskConical aria-hidden="true" size={16} />
              置信度
            </span>
            <strong>LIKELY</strong>
          </div>

          <section className="conclusion-editor">
            <label>
              <span>结论类型</span>
              <select
                disabled={!canEvaluate}
                onChange={(event) =>
                  setTestConclusion(event.target.value as TestConclusion)
                }
                value={testConclusion}
              >
                <option value="KEEP">KEEP</option>
                <option value="STOP">STOP</option>
                <option value="ITERATE">ITERATE</option>
                <option value="INCONCLUSIVE">INCONCLUSIVE</option>
              </select>
            </label>
            <label>
              <span>测试结论</span>
              <textarea
                defaultValue="保留生活方式方向，下一轮只测试首屏构图。"
                disabled={!canEvaluate}
                rows={4}
              />
            </label>
            <label>
              <span>下一步建议</span>
              <textarea
                defaultValue="进行下一轮测试，验证首屏构图对单次购买成本的影响。"
                disabled={!canEvaluate}
                rows={3}
              />
            </label>
          </section>

          <div className="related-objects">
            <h3>相关内容</h3>
            <button
              onClick={() => navigate("/assets?focus=AST-001")}
              type="button"
            >
              <Link2 size={15} />
              变体 A 素材
              <span>夏日轻装_主图</span>
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => navigate("/assets?focus=AST-002")}
              type="button"
            >
              <Link2 size={15} />
              变体 B 素材
              <span>运动鞋_视频_01</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="conclusion-panel__actions">
            <Button
              disabled={!canEvaluate}
              icon={<Save aria-hidden="true" size={16} />}
              onClick={handleSaveConclusion}
            >
              {testConclusionSaved ? "结论已保存" : "保存结论"}
            </Button>
            <Button
              disabled={!canEvaluate || nextTestCreated}
              icon={<ArrowRight aria-hidden="true" size={16} />}
              onClick={() => setNextDialogOpen(true)}
              variant="primary"
            >
              {nextTestCreated ? "下一轮已创建" : "创建下一轮测试"}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog
        description="只修改一个主要变量，保留当前结论作为可追溯依据。"
        footer={
          <>
            <Button onClick={() => setNextDialogOpen(false)}>取消</Button>
            <Button
              disabled={!hypothesisConfirmed}
              onClick={handleCreateNext}
              variant="primary"
            >
              建立 TP-008 草稿
            </Button>
          </>
        }
        onClose={() => setNextDialogOpen(false)}
        open={nextDialogOpen}
        title="创建下一轮测试"
      >
        <div className="confirmation-summary">
          <dl className="review-summary">
            <div>
              <dt>上一轮结论</dt>
              <dd>{testConclusion} · 保留生活方式方向</dd>
            </div>
            <div>
              <dt>新假设</dt>
              <dd>更聚焦的首屏构图可以继续降低单次购买成本</dd>
            </div>
            <div>
              <dt>主要变量</dt>
              <dd>首屏构图</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>准备中 · 不改变现有广告</dd>
            </div>
          </dl>
          <label className="check-row">
            <input
              checked={hypothesisConfirmed}
              onChange={(event) =>
                setHypothesisConfirmed(event.target.checked)
              }
              type="checkbox"
            />
            <span>我确认下一轮只改变一个主要变量，并保留停止规则。</span>
          </label>
        </div>
      </Dialog>
    </div>
  );
}

function TestTimelineItem({
  label,
  meta,
  complete = false,
  active = false,
}: {
  label: string;
  meta: string;
  complete?: boolean;
  active?: boolean;
}) {
  const Icon = complete ? CheckCircle2 : active ? Circle : Circle;
  return (
    <li className={active ? "test-timeline__active" : ""}>
      <Icon aria-hidden="true" size={16} />
      <strong>{label}</strong>
      <small>{meta}</small>
    </li>
  );
}

function VariantCard({
  asset,
  label,
  selected = false,
}: {
  asset: (typeof creativeAssets)[number];
  label: string;
  selected?: boolean;
}) {
  return (
    <article className={`variant-card ${selected ? "variant-card--selected" : ""}`}>
      <header>
        <span className="variant-card__radio">
          {selected ? <Check size={13} /> : null}
        </span>
        <strong>{label}</strong>
        {selected ? (
          <Status compact severity="success">
            对照组
          </Status>
        ) : null}
      </header>
      <div className="variant-card__content">
        <img alt={`${label} 原型素材`} src={asset.image} />
        <dl>
          <div>
            <dt>花费</dt>
            <dd>{money(asset.spend)}</dd>
          </div>
          <div>
            <dt>曝光</dt>
            <dd>{selected ? "212,345" : "177,849"}</dd>
          </div>
          <div>
            <dt>CTR</dt>
            <dd>{asset.ctr.toFixed(2)}%</dd>
          </div>
          <div>
            <dt>购买</dt>
            <dd>{asset.purchases}</dd>
          </div>
          <div>
            <dt>单次购买成本</dt>
            <dd className={selected ? "metric-positive" : "metric-negative"}>
              {selected ? "¥67.09" : "¥74.50"}
            </dd>
          </div>
          <div>
            <dt>ROAS</dt>
            <dd className="metric-positive">{asset.roas.toFixed(2)}</dd>
          </div>
        </dl>
      </div>
      <footer>
        <button type="button">素材详情</button>
        <button type="button">投放广告（2 个）</button>
      </footer>
    </article>
  );
}

function ComparisonRow({
  label,
  a,
  b,
  difference,
  percent,
  emphasis = false,
}: {
  label: string;
  a: string;
  b: string;
  difference: string;
  percent: string;
  emphasis?: boolean;
}) {
  return (
    <tr>
      <td>{label}</td>
      <td>{a}</td>
      <td>{b}</td>
      <td className={emphasis ? "metric-negative" : ""}>{difference}</td>
      <td className={emphasis ? "metric-negative" : ""}>{percent}</td>
      <td>{emphasis ? "A 更低" : "—"}</td>
    </tr>
  );
}
