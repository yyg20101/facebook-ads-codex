import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  CircleAlert,
  Info,
  Plus,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { Link, useNavigate } from "../router";
import { MiniSparkline } from "../components/charts/MiniSparkline";
import { TrendChart } from "../components/charts/TrendChart";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Status } from "../components/ui/Status";
import {
  campaignRows,
  creativeAssets,
  integer,
  money,
  taskItems,
  trendData,
} from "../data/demo";
import type { Severity } from "../types";

const metricItems = [
  {
    label: "消耗",
    value: "¥24,568.32",
    delta: "8.6%",
    direction: "down",
    positive: true,
    spark: [28, 42, 39, 56, 52, 74, 65, 88, 62, 58],
  },
  {
    label: "购买",
    value: "356",
    delta: "12.3%",
    direction: "up",
    positive: true,
    spark: [28, 31, 46, 45, 38, 50, 72, 61, 55, 63],
  },
  {
    label: "单次购买成本",
    value: "¥68.94",
    delta: "5.2%",
    direction: "down",
    positive: true,
    spark: [80, 69, 63, 70, 58, 52, 48, 55, 51, 53],
  },
  {
    label: "ROAS",
    value: "3.21",
    delta: "14.7%",
    direction: "up",
    positive: true,
    spark: [28, 26, 31, 43, 49, 63, 64, 57, 58, 54],
  },
] as const;

const severityIcon = {
  critical: ShieldAlert,
  warning: TriangleAlert,
  info: Info,
  success: Info,
  neutral: Info,
} satisfies Record<Severity, typeof Info>;

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="page dashboard-page">
      <PageHeader
        actions={
          <Button
            icon={<Plus aria-hidden="true" size={17} />}
            onClick={() => navigate("/create")}
            variant="primary"
          >
            创建广告
          </Button>
        }
        title="今日运营总览"
      />

      <section aria-label="关键指标" className="metric-strip">
        {metricItems.map((metric) => {
          const DirectionIcon =
            metric.direction === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <article className="metric-strip__item" key={metric.label}>
              <div className="metric-strip__label">{metric.label}</div>
              <div className="metric-strip__value-row">
                <strong>{metric.value}</strong>
                <MiniSparkline values={[...metric.spark]} />
              </div>
              <div
                className={`metric-strip__delta ${
                  metric.positive
                    ? "metric-strip__delta--positive"
                    : "metric-strip__delta--negative"
                }`}
              >
                较前 7 天
                <span>
                  <DirectionIcon aria-hidden="true" size={14} />
                  {metric.delta}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-grid dashboard-grid--top">
        <section className="surface trend-surface">
          <header className="surface__header">
            <div>
              <h2>投放趋势</h2>
              <p>同一数据范围下比较消耗、购买和 ROAS</p>
            </div>
            <label className="compact-select">
              <span className="sr-only">趋势粒度</span>
              <select defaultValue="day">
                <option value="day">按天</option>
                <option value="week">按周</option>
              </select>
            </label>
          </header>
          <TrendChart data={trendData} />
        </section>

        <section className="surface task-rail">
          <header className="surface__header">
            <div>
              <h2>
                需要处理 <span className="count-mark">4</span>
              </h2>
              <p>按风险和时效排序</p>
            </div>
            <Link className="text-link" to="/manage">
              查看全部 <ChevronRight size={14} />
            </Link>
          </header>
          <div className="task-rail__list">
            {taskItems.map((task) => {
              const Icon = severityIcon[task.severity];
              return (
                <Link
                  className={`task-row task-row--${task.severity}`}
                  key={task.id}
                  to={task.href}
                >
                  <span className="task-row__icon">
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className="task-row__body">
                    <strong>{task.title}</strong>
                    <small>{task.detail}</small>
                  </span>
                  <span className="task-row__action">{task.action}</span>
                  <ChevronRight aria-hidden="true" size={16} />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="dashboard-grid dashboard-grid--bottom">
        <section className="surface campaign-surface">
          <header className="surface__header">
            <div>
              <h2>广告对象</h2>
              <p>按业务层级查看状态和结果</p>
            </div>
            <Link className="text-link" to="/manage">
              打开广告管理 <ChevronRight size={14} />
            </Link>
          </header>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>状态</th>
                  <th>目标</th>
                  <th>消耗</th>
                  <th>购买</th>
                  <th>单次购买成本</th>
                  <th>ROAS</th>
                  <th>预算</th>
                </tr>
              </thead>
              <tbody>
                {campaignRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        className="object-name"
                        to={`/analytics?focus=${row.id}`}
                      >
                        <strong>{row.name}</strong>
                        <small>{row.id}</small>
                      </Link>
                    </td>
                    <td>
                      <Status compact severity={row.severity}>
                        {row.status}
                      </Status>
                    </td>
                    <td>{row.objective}</td>
                    <td>{money(row.spend)}</td>
                    <td>{integer(row.purchases)}</td>
                    <td>{money(row.cpa)}</td>
                    <td
                      className={
                        row.roas < 1 ? "metric-negative" : "metric-positive"
                      }
                    >
                      {row.roas.toFixed(2)}
                    </td>
                    <td>{row.budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface creative-surface">
          <header className="surface__header">
            <div>
              <h2>素材表现</h2>
              <p>表现与投放对象保持关联</p>
            </div>
            <Link className="text-link" to="/assets">
              查看全部 <ChevronRight size={14} />
            </Link>
          </header>
          <div className="creative-rail">
            {creativeAssets.map((asset) => (
              <Link
                className="creative-card"
                key={asset.id}
                to={`/assets?focus=${asset.id}`}
              >
                <div className="creative-card__media">
                  <img alt={`${asset.name} 原型素材`} src={asset.image} />
                  {asset.kind === "视频" ? (
                    <span className="creative-card__video">视频</span>
                  ) : null}
                </div>
                <strong>{asset.name}</strong>
                <dl>
                  <div>
                    <dt>消耗</dt>
                    <dd>{money(asset.spend)}</dd>
                  </div>
                  <div>
                    <dt>点击率</dt>
                    <dd>{asset.ctr.toFixed(2)}%</dd>
                  </div>
                  <div>
                    <dt>购买</dt>
                    <dd>{asset.purchases}</dd>
                  </div>
                  <div>
                    <dt>ROAS</dt>
                    <dd
                      className={
                        asset.roas < 1 ? "metric-negative" : "metric-positive"
                      }
                    >
                      {asset.roas.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
          <div className="mobile-desktop-note">
            <CircleAlert aria-hidden="true" size={16} />
            复杂配置建议使用桌面端
            <Link to="/create">前往创建</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
