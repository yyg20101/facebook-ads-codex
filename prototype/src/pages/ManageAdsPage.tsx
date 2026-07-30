import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDashed,
  Clock3,
  Filter,
  FlaskConical,
  History,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "../router";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Status, severityForStatus } from "../components/ui/Status";
import { useToast } from "../components/ui/Toast";
import { campaignRows, money } from "../data/demo";
import { usePrototypeState } from "../state/PrototypeState";
import type { PublishState } from "../types";

const publishLabels: Record<
  PublishState,
  { label: string; description: string }
> = {
  DRAFT: {
    label: "草稿",
    description: "配置仍在本地原型草稿中。",
  },
  PENDING_CONFIRMATION: {
    label: "待确认",
    description: "已建立发布意图，但尚未进入模拟发布状态。",
  },
  PUBLISHING: {
    label: "模拟发布中",
    description: "只演示状态变化，没有发送外部请求。",
  },
  PUBLISHED: {
    label: "模拟已发布",
    description: "原型完成态，不代表 Meta 中存在该广告。",
  },
  REVIEW_FAILED: {
    label: "模拟审核失败",
    description: "原型失败态，可返回具体素材或配置修复。",
  },
};

export function ManageAdsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { publishState, advancePublishState, auditEvents } = usePrototypeState();
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [selectedCampaign, setSelectedCampaign] = useState("C-001");
  const currentStatus = publishLabels[publishState];

  const rows = useMemo(() => {
    if (statusFilter === "全部状态") return campaignRows;
    return campaignRows.filter((row) => row.status === statusFilter);
  }, [statusFilter]);

  const moveToPublishing = () => {
    advancePublishState("PUBLISHING");
    notify("状态已推进到“模拟发布中”；未发送任何外部请求");
  };

  const finishSimulation = (result: "PUBLISHED" | "REVIEW_FAILED") => {
    advancePublishState(result);
    notify(
      result === "PUBLISHED"
        ? "已记录“模拟已发布”状态"
        : "已记录“模拟审核失败”状态",
    );
  };

  return (
    <div className="page manage-page">
      <PageHeader
        actions={
          <>
            <Button
              icon={<RefreshCw aria-hidden="true" size={16} />}
              onClick={() => notify("原型数据时间固定为 08:42，不会请求 Meta")}
            >
              刷新状态
            </Button>
            <Button
              icon={<FlaskConical aria-hidden="true" size={16} />}
              onClick={() => navigate("/testing")}
              variant="primary"
            >
              建立测试
            </Button>
          </>
        }
        description="区分本地草稿、待确认、模拟发布、审核失败和已生效状态。"
        title="广告管理"
      />

      <div className="inline-alert inline-alert--info manage-trust">
        <ShieldCheck aria-hidden="true" size={18} />
        <div>
          <strong>所有状态均为原型模拟</strong>
          <p>
            当前未连接 Meta；暂停、发布、预算或排期按钮不会产生真实副作用。
          </p>
        </div>
      </div>

      <section className="manage-toolbar" aria-label="广告对象筛选">
        <label className="search-field">
          <Search aria-hidden="true" size={16} />
          <span className="sr-only">搜索广告对象</span>
          <input placeholder="搜索 Campaign、Ad Set 或 Ad" />
        </label>
        <label className="compact-select compact-select--wide">
          <span className="sr-only">状态筛选</span>
          <select
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option>全部状态</option>
            <option>投放中</option>
            <option>审核失败</option>
            <option>数据不足</option>
          </select>
        </label>
        <Button icon={<Filter aria-hidden="true" size={16} />} size="sm">
          更多筛选
        </Button>
      </section>

      <div className="manage-layout">
        <section className="surface manage-table">
          <header className="surface__header">
            <div>
              <h2>Campaign</h2>
              <p>{rows.length} 个原型对象</p>
            </div>
            <div className="table-header-actions">
              <Button
                disabled
                icon={<Pause aria-hidden="true" size={15} />}
                size="sm"
              >
                暂停
              </Button>
              <Button
                disabled
                icon={<Play aria-hidden="true" size={15} />}
                size="sm"
              >
                启用
              </Button>
            </div>
          </header>
          <div className="table-scroll">
            <table className="data-table data-table--interactive">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>状态</th>
                  <th>消耗</th>
                  <th>购买</th>
                  <th>CPA</th>
                  <th>ROAS</th>
                  <th>预算</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    className={
                      selectedCampaign === row.id
                        ? "data-table__row--selected"
                        : ""
                    }
                    key={row.id}
                    onClick={() => setSelectedCampaign(row.id)}
                  >
                    <td>
                      <button
                        className="object-name object-name--button"
                        onClick={() => setSelectedCampaign(row.id)}
                        type="button"
                      >
                        <strong>{row.name}</strong>
                        <small>{row.id} / ADSET-{row.id.slice(-3)}</small>
                      </button>
                    </td>
                    <td>
                      <Status compact severity={row.severity}>
                        {row.status}
                      </Status>
                    </td>
                    <td>{money(row.spend)}</td>
                    <td>{row.purchases}</td>
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

        <aside className="surface lifecycle-panel">
          <header className="surface__header">
            <div>
              <h2>发布请求 PR-001</h2>
              <p>夏日轻装转化 · v3</p>
            </div>
            <Status severity={severityForStatus(currentStatus.label)}>
              {currentStatus.label}
            </Status>
          </header>

          <div className="lifecycle-summary">
            <strong>{currentStatus.label}</strong>
            <p>{currentStatus.description}</p>
          </div>

          <ol className="status-timeline">
            <TimelineStep
              active={publishState === "DRAFT"}
              complete={publishState !== "DRAFT"}
              label="草稿完成"
              meta="v3 · 08:42"
            />
            <TimelineStep
              active={publishState === "PENDING_CONFIRMATION"}
              complete={[
                "PUBLISHING",
                "PUBLISHED",
                "REVIEW_FAILED",
              ].includes(publishState)}
              label="人工确认"
              meta={
                publishState === "DRAFT" ? "尚未创建确认请求" : "PR-001"
              }
            />
            <TimelineStep
              active={publishState === "PUBLISHING"}
              complete={["PUBLISHED", "REVIEW_FAILED"].includes(publishState)}
              label="模拟发布"
              meta="无 Meta 请求"
            />
            <TimelineStep
              active={["PUBLISHED", "REVIEW_FAILED"].includes(publishState)}
              complete={publishState === "PUBLISHED"}
              failed={publishState === "REVIEW_FAILED"}
              label={
                publishState === "REVIEW_FAILED" ? "审核失败" : "发布结果"
              }
              meta={
                publishState === "PUBLISHED"
                  ? "模拟已发布"
                  : publishState === "REVIEW_FAILED"
                    ? "素材政策原因"
                    : "等待原型结果"
              }
            />
          </ol>

          {publishState === "DRAFT" ? (
            <div className="lifecycle-actions">
              <Button
                icon={<ArrowRight aria-hidden="true" size={16} />}
                onClick={() => navigate("/create")}
                variant="primary"
              >
                返回创建并完成检查
              </Button>
            </div>
          ) : null}

          {publishState === "PENDING_CONFIRMATION" ? (
            <div className="lifecycle-actions">
              <div className="inline-alert inline-alert--warning">
                <Clock3 aria-hidden="true" size={17} />
                <div>
                  <strong>等待人工确认</strong>
                  <p>确认后仍只推进原型状态，不会调用 Meta。</p>
                </div>
              </div>
              <Button onClick={moveToPublishing} variant="primary">
                确认并进入模拟发布
              </Button>
            </div>
          ) : null}

          {publishState === "PUBLISHING" ? (
            <div className="lifecycle-actions">
              <div className="simulation-choice">
                <strong>选择模拟返回结果</strong>
                <p>用于验证成功和失败的返回路径。</p>
              </div>
              <Button
                icon={<CheckCircle2 aria-hidden="true" size={16} />}
                onClick={() => finishSimulation("PUBLISHED")}
                variant="primary"
              >
                模拟返回：已发布
              </Button>
              <Button
                icon={<XCircle aria-hidden="true" size={16} />}
                onClick={() => finishSimulation("REVIEW_FAILED")}
                variant="danger"
              >
                模拟返回：审核失败
              </Button>
            </div>
          ) : null}

          {publishState === "PUBLISHED" ? (
            <div className="lifecycle-actions">
              <div className="inline-alert inline-alert--success">
                <CheckCircle2 aria-hidden="true" size={17} />
                <div>
                  <strong>原型闭环已完成</strong>
                  <p>此状态不代表 Meta 中存在广告或产生消耗。</p>
                </div>
              </div>
              <Button onClick={() => navigate("/analytics")} variant="primary">
                查看模拟表现
              </Button>
            </div>
          ) : null}

          {publishState === "REVIEW_FAILED" ? (
            <div className="lifecycle-actions">
              <div className="inline-alert inline-alert--critical">
                <AlertOctagon aria-hidden="true" size={18} />
                <div>
                  <strong>素材政策原因</strong>
                  <p>
                    审核结果指向 AST-001。保留原草稿和失败原因后返回对应字段。
                  </p>
                </div>
              </div>
              <button
                className="object-link-row"
                onClick={() => navigate("/assets?focus=AST-001")}
                type="button"
              >
                查看问题素材
                <ChevronRight aria-hidden="true" size={16} />
              </button>
              <button
                className="object-link-row"
                onClick={() => navigate("/create")}
                type="button"
              >
                返回广告配置
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          ) : null}

          <details className="audit-details">
            <summary>
              <History aria-hidden="true" size={16} />
              查看原型审计记录
            </summary>
            <div className="audit-list">
              {auditEvents.slice(0, 5).map((event) => (
                <article key={event.id}>
                  <span>{event.at}</span>
                  <div>
                    <strong>{event.action}</strong>
                    <small>
                      {event.object} · {event.result}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}

function TimelineStep({
  label,
  meta,
  active = false,
  complete = false,
  failed = false,
}: {
  label: string;
  meta: string;
  active?: boolean;
  complete?: boolean;
  failed?: boolean;
}) {
  const Icon = failed
    ? XCircle
    : complete
      ? CheckCircle2
      : active
        ? CircleDashed
        : Circle;

  return (
    <li
      className={`status-timeline__item ${
        active ? "status-timeline__item--active" : ""
      } ${complete ? "status-timeline__item--complete" : ""} ${
        failed ? "status-timeline__item--failed" : ""
      }`}
    >
      <Icon aria-hidden="true" size={18} />
      <div>
        <strong>{label}</strong>
        <small>{meta}</small>
      </div>
    </li>
  );
}
