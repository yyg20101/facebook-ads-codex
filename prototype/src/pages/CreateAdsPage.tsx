import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  FileCheck2,
  Info,
  LayoutPanelLeft,
  Monitor,
  Save,
  Send,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "../router";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Status } from "../components/ui/Status";
import { useToast } from "../components/ui/Toast";
import { creativeAssets } from "../data/demo";
import { usePrototypeState } from "../state/PrototypeState";

const steps = ["Campaign", "Ad Set", "Ad", "检查与确认"] as const;

export function CreateAdsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const {
    mode,
    setMode,
    assetRightsConfirmed,
    pixelEvent,
    selectPixelEvent,
    createPublishRequest,
  } = usePrototypeState();
  const [step, setStep] = useState(1);
  const [selectedNode, setSelectedNode] = useState("adset");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "mobile",
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prototypeAcknowledged, setPrototypeAcknowledged] = useState(false);

  const blockers = [
    !assetRightsConfirmed
      ? {
          id: "rights",
          title: "素材商业使用权待确认",
          detail: "该素材的商业使用权尚未确认，可能导致广告审核失败。",
          action: "返回素材中心",
        }
      : null,
    !pixelEvent
      ? {
          id: "pixel",
          title: "落地页 Pixel 事件未选择",
          detail: "未选择用于优化投放效果的原型事件。",
          action: "选择事件",
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    title: string;
    detail: string;
    action: string;
  }>;

  const handleCreateRequest = () => {
    createPublishRequest();
    setConfirmOpen(false);
    notify("已创建待确认请求；未调用 Meta 或任何外部接口");
    navigate("/manage?request=PR-001");
  };

  return (
    <div className="page create-page">
      <PageHeader
        actions={
          <>
            <div className="mode-switch" aria-label="配置模式">
              <button
                aria-pressed={mode === "guided"}
                className={mode === "guided" ? "mode-switch__active" : ""}
                onClick={() => setMode("guided")}
                type="button"
              >
                引导模式
              </button>
              <button
                aria-pressed={mode === "advanced"}
                className={mode === "advanced" ? "mode-switch__active" : ""}
                onClick={() => setMode("advanced")}
                type="button"
              >
                高级模式
              </button>
            </div>
            <Button
              icon={<Save aria-hidden="true" size={16} />}
              onClick={() => notify("v3 草稿已保存到本地原型状态")}
            >
              保存草稿
            </Button>
            <Button
              disabled={blockers.length > 0 || step !== 3}
              icon={<Send aria-hidden="true" size={16} />}
              onClick={() => setConfirmOpen(true)}
              variant="primary"
            >
              进入人工确认
            </Button>
          </>
        }
        description="夏日轻装转化 · v3 草稿"
        title="创建广告"
      />

      <nav aria-label="广告创建步骤" className="builder-steps">
        {steps.map((label, index) => (
          <button
            aria-current={step === index ? "step" : undefined}
            className={`builder-step ${
              step === index ? "builder-step--active" : ""
            } ${step > index ? "builder-step--complete" : ""}`}
            key={label}
            onClick={() => setStep(index)}
            type="button"
          >
            <span>
              {step > index ? <Check size={14} /> : index + 1}
            </span>
            {label}
          </button>
        ))}
      </nav>

      <div className="builder-layout">
        <aside className="builder-tree surface">
          <header className="surface__header">
            <div>
              <h2>结构</h2>
              <p>v3 草稿</p>
            </div>
          </header>
          <div className="builder-tree__nodes">
            <button
              className={selectedNode === "campaign" ? "tree-node tree-node--active" : "tree-node"}
              onClick={() => {
                setSelectedNode("campaign");
                setStep(0);
              }}
              type="button"
            >
              <span className="tree-node__icon tree-node__icon--success">
                <Check size={14} />
              </span>
              <span>
                <strong>Campaign</strong>
                <small>夏日轻装转化</small>
              </span>
            </button>
            <div className="builder-tree__branch">
              <button
                className={selectedNode === "adset" ? "tree-node tree-node--active" : "tree-node"}
                onClick={() => {
                  setSelectedNode("adset");
                  setStep(1);
                }}
                type="button"
              >
                <span
                  className={`tree-node__icon ${
                    pixelEvent
                      ? "tree-node__icon--success"
                      : "tree-node__icon--critical"
                  }`}
                >
                  {pixelEvent ? <Check size={14} /> : <CircleAlert size={14} />}
                </span>
                <span>
                  <strong>Ad Set</strong>
                  <small>18–44 岁 · 中国大陆 · ¥10,000/天</small>
                </span>
              </button>
              <button
                className={selectedNode === "ad1" ? "tree-node tree-node--active" : "tree-node"}
                onClick={() => {
                  setSelectedNode("ad1");
                  setStep(2);
                }}
                type="button"
              >
                <span
                  className={`tree-node__icon ${
                    assetRightsConfirmed
                      ? "tree-node__icon--success"
                      : "tree-node__icon--warning"
                  }`}
                >
                  {assetRightsConfirmed ? (
                    <Check size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                </span>
                <span>
                  <strong>Ad 1</strong>
                  <small>夏日轻装_主图_01</small>
                </span>
              </button>
              <button
                className={selectedNode === "ad2" ? "tree-node tree-node--active" : "tree-node"}
                onClick={() => {
                  setSelectedNode("ad2");
                  setStep(2);
                }}
                type="button"
              >
                <span className="tree-node__icon">
                  <Circle size={12} />
                </span>
                <span>
                  <strong>Ad 2</strong>
                  <small>夏日轻装_主图_02</small>
                </span>
              </button>
            </div>
          </div>
          <Button
            className="builder-tree__add"
            onClick={() => notify("已模拟新增一个 Ad Set 草稿")}
          >
            新建 Ad Set
          </Button>
        </aside>

        <section className="builder-form surface">
          <header className="surface__header">
            <div>
              <h2>{steps[step]} 设置</h2>
              <p>
                {mode === "guided"
                  ? "关键概念带说明，完成后再进入下一步。"
                  : "显示完整候选字段和高级控制。"}
              </p>
            </div>
            <Button
              icon={<LayoutPanelLeft aria-hidden="true" size={16} />}
              onClick={() => notify("批量编辑仅更新本地原型草稿")}
              size="sm"
            >
              批量编辑
            </Button>
          </header>

          {step === 0 ? <CampaignFields mode={mode} /> : null}
          {step === 1 ? (
            <AdSetFields
              mode={mode}
              pixelEvent={pixelEvent}
              onSelectPixel={selectPixelEvent}
            />
          ) : null}
          {step === 2 ? (
            <AdFields
              rightsConfirmed={assetRightsConfirmed}
              onOpenAssets={() => navigate("/assets?focus=AST-001")}
            />
          ) : null}
          {step === 3 ? (
            <ReviewSummary
              assetRightsConfirmed={assetRightsConfirmed}
              pixelEvent={pixelEvent}
            />
          ) : null}
        </section>

        <section className="builder-preview surface">
          <header className="surface__header">
            <div>
              <h2>广告预览</h2>
              <p>只预览本地草稿</p>
            </div>
            <div className="preview-switch">
              <button
                aria-label="移动端预览"
                aria-pressed={previewDevice === "mobile"}
                className={
                  previewDevice === "mobile"
                    ? "preview-switch__active"
                    : ""
                }
                onClick={() => setPreviewDevice("mobile")}
                type="button"
              >
                <Smartphone size={16} />
              </button>
              <button
                aria-label="桌面端预览"
                aria-pressed={previewDevice === "desktop"}
                className={
                  previewDevice === "desktop"
                    ? "preview-switch__active"
                    : ""
                }
                onClick={() => setPreviewDevice("desktop")}
                type="button"
              >
                <Monitor size={16} />
              </button>
            </div>
          </header>
          <div
            className={`ad-preview ${
              previewDevice === "desktop" ? "ad-preview--desktop" : ""
            }`}
          >
            <header className="ad-preview__profile">
              <span>星</span>
              <div>
                <strong>星桥电商</strong>
                <small>赞助内容 · 原型</small>
              </div>
            </header>
            <p>轻盈透气，夏日出行更自在。</p>
            <img
              alt="夏日轻装广告预览"
              src={creativeAssets[0].image}
            />
            <div className="ad-preview__footer">
              <span>
                <small>星桥电商</small>
                <strong>夏日轻装系列</strong>
                <small>舒适通勤，轻盈自在</small>
              </span>
              <button type="button">立即购买</button>
            </div>
          </div>
        </section>

        <aside className="preflight-panel surface">
          <header className="surface__header">
            <div>
              <h2>发布前检查</h2>
              <p>跨 Campaign、Ad Set 和 Ad</p>
            </div>
            <FileCheck2 aria-hidden="true" size={18} />
          </header>
          <div className="preflight-counts">
            <strong className={blockers.length ? "metric-negative" : "metric-positive"}>
              {blockers.length}
              <small> BLOCKER</small>
            </strong>
            <span />
            <strong className="metric-warning">
              1<small> WARNING</small>
            </strong>
          </div>
          <div className="preflight-list">
            {blockers.length ? (
              blockers.map((blocker) => (
                <article className="preflight-item preflight-item--critical" key={blocker.id}>
                  <ShieldAlert aria-hidden="true" size={18} />
                  <div>
                    <strong>{blocker.title}</strong>
                    <p>{blocker.detail}</p>
                    {blocker.id === "rights" ? (
                      <button
                        onClick={() => navigate("/assets?focus=AST-001")}
                        type="button"
                      >
                        {blocker.action}
                      </button>
                    ) : (
                      <button
                        onClick={() => selectPixelEvent("Purchase")}
                        type="button"
                      >
                        {blocker.action}
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <article className="preflight-item preflight-item--success">
                <CheckCircle2 aria-hidden="true" size={18} />
                <div>
                  <strong>没有阻断项</strong>
                  <p>可以进入人工确认；仍不会向 Meta 提交。</p>
                </div>
              </article>
            )}
            <article className="preflight-item preflight-item--warning">
              <AlertTriangle aria-hidden="true" size={18} />
              <div>
                <strong>受众范围较宽</strong>
                <p>建议根据业务目标评估是否需要进一步收窄。</p>
                <button
                  onClick={() =>
                    notify("说明：广泛受众不是阻断项，需结合目标和数据评估")
                  }
                  type="button"
                >
                  查看说明
                </button>
              </div>
            </article>
          </div>
          <div className="inline-alert inline-alert--info">
            <Info aria-hidden="true" size={17} />
            <div>
              <strong>原型边界</strong>
              <p>检查结果和确认只存在于浏览器内存，不代表 Meta 已接受配置。</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="builder-footer">
        <Button
          disabled={step === 0}
          icon={<ChevronLeft aria-hidden="true" size={16} />}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          上一步
        </Button>
        <div>
          <CheckCircle2 aria-hidden="true" size={16} />
          已自动保存 08:42 · 版本 v3 草稿
        </div>
        {step < 3 ? (
          <Button
            icon={<ChevronRight aria-hidden="true" size={16} />}
            onClick={() => setStep((value) => Math.min(3, value + 1))}
            variant="primary"
          >
            下一步
          </Button>
        ) : (
          <Button
            disabled={blockers.length > 0}
            icon={<Send aria-hidden="true" size={16} />}
            onClick={() => setConfirmOpen(true)}
            variant="primary"
          >
            进入人工确认
          </Button>
        )}
      </div>

      <Dialog
        description="这一步只建立待确认的原型对象，不会发布广告。"
        footer={
          <>
            <Button onClick={() => setConfirmOpen(false)}>返回修改</Button>
            <Button
              disabled={!prototypeAcknowledged}
              onClick={handleCreateRequest}
              variant="primary"
            >
              创建待确认请求
            </Button>
          </>
        }
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="人工确认发布意图"
      >
        <div className="confirmation-summary">
          <dl className="review-summary">
            <div>
              <dt>对象</dt>
              <dd>1 Campaign · 1 Ad Set · 2 Ads</dd>
            </div>
            <div>
              <dt>预算</dt>
              <dd>¥10,000 / 天 · 2025-05-20—2025-05-27</dd>
            </div>
            <div>
              <dt>发布前检查</dt>
              <dd>0 BLOCKER · 1 WARNING</dd>
            </div>
            <div>
              <dt>目标状态</dt>
              <dd>待确认 · 未发布</dd>
            </div>
          </dl>
          <label className="check-row">
            <input
              checked={prototypeAcknowledged}
              onChange={(event) =>
                setPrototypeAcknowledged(event.target.checked)
              }
              type="checkbox"
            />
            <span>
              我理解这只是原型状态演示，不会连接 Meta、创建广告或产生消耗。
            </span>
          </label>
        </div>
      </Dialog>
    </div>
  );
}

function FieldRow({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field-row">
      <div className="field-row__label">
        <label>{label}</label>
        {help ? <small>{help}</small> : null}
      </div>
      <div className="field-row__control">{children}</div>
    </div>
  );
}

function CampaignFields({ mode }: { mode: "guided" | "advanced" }) {
  return (
    <div className="form-stack">
      <FieldRow label="Campaign 名称" help="使用可识别的业务目标和日期。">
        <input defaultValue="夏日轻装转化" />
      </FieldRow>
      <FieldRow label="投放目标" help="目标决定后续可用的优化事件和字段。">
        <select defaultValue="sales">
          <option value="sales">销售</option>
          <option value="traffic">流量</option>
        </select>
      </FieldRow>
      <FieldRow label="购买类型">
        <select defaultValue="auction">
          <option value="auction">竞价</option>
        </select>
      </FieldRow>
      <FieldRow label="特殊广告类别">
        <select defaultValue="none">
          <option value="none">无</option>
        </select>
      </FieldRow>
      {mode === "advanced" ? (
        <FieldRow label="Campaign 预算优化">
          <select defaultValue="off">
            <option value="off">关闭，按 Ad Set 设置</option>
            <option value="on">开启</option>
          </select>
        </FieldRow>
      ) : null}
    </div>
  );
}

function AdSetFields({
  mode,
  pixelEvent,
  onSelectPixel,
}: {
  mode: "guided" | "advanced";
  pixelEvent: string;
  onSelectPixel: (event: string) => void;
}) {
  return (
    <div className="form-stack">
      <FieldRow label="转化位置" help="用户最终完成购买的位置。">
        <select defaultValue="website">
          <option value="website">网站</option>
        </select>
      </FieldRow>
      <FieldRow label="转化事件" help="用于优化和报告的主要事件。">
        <select
          className={!pixelEvent ? "field-control--error" : ""}
          onChange={(event) => onSelectPixel(event.target.value)}
          value={pixelEvent}
        >
          <option value="">请选择事件</option>
          <option value="Purchase">Purchase</option>
          <option value="InitiateCheckout">InitiateCheckout</option>
        </select>
      </FieldRow>
      <FieldRow label="受众" help="当前原型使用宽泛受众。">
        <div className="compound-control">
          <input defaultValue="18–44 岁 · 中国大陆" />
          <button type="button">编辑</button>
        </div>
      </FieldRow>
      <FieldRow label="预算" help="每日预算仅作为原型字段展示。">
        <div className="split-control">
          <input defaultValue="¥ 10,000" />
          <select defaultValue="daily">
            <option value="daily">每天</option>
          </select>
        </div>
      </FieldRow>
      <FieldRow label="排期">
        <div className="split-control">
          <input defaultValue="2025-05-20" type="text" />
          <input defaultValue="2025-05-27" type="text" />
        </div>
      </FieldRow>
      <FieldRow label="版位">
        <select defaultValue="automatic">
          <option value="automatic">自动版位</option>
          <option value="manual">手动版位</option>
        </select>
      </FieldRow>
      {mode === "advanced" ? (
        <>
          <FieldRow label="出价策略">
            <select defaultValue="lowest">
              <option value="lowest">最低成本</option>
            </select>
          </FieldRow>
          <FieldRow label="频次控制">
            <input defaultValue="不限制" />
          </FieldRow>
        </>
      ) : null}
    </div>
  );
}

function AdFields({
  rightsConfirmed,
  onOpenAssets,
}: {
  rightsConfirmed: boolean;
  onOpenAssets: () => void;
}) {
  return (
    <div className="form-stack">
      <FieldRow label="广告名称">
        <input defaultValue="夏日轻装_转化_01" />
      </FieldRow>
      <FieldRow label="素材" help="来源和商业使用权必须可追溯。">
        <div
          className={`selected-asset ${
            rightsConfirmed ? "" : "selected-asset--error"
          }`}
        >
          <img alt="夏日轻装素材缩略图" src={creativeAssets[0].image} />
          <span>
            <strong>夏日轻装_主图_01</strong>
            <small>1080 × 1350 · JPG · 512 KB</small>
          </span>
          <Status
            compact
            severity={rightsConfirmed ? "success" : "critical"}
          >
            {rightsConfirmed ? "权利已确认" : "权利待确认"}
          </Status>
          <button onClick={onOpenAssets} type="button">
            更换素材
          </button>
        </div>
      </FieldRow>
      <FieldRow label="主要文案">
        <textarea defaultValue="轻盈透气，夏日出行更自在。" rows={4} />
      </FieldRow>
      <FieldRow label="标题">
        <input defaultValue="夏日轻装系列" />
      </FieldRow>
      <FieldRow label="落地页">
        <input defaultValue="https://example.invalid/summer" />
      </FieldRow>
      <FieldRow label="行动号召">
        <select defaultValue="shop">
          <option value="shop">立即购买</option>
          <option value="learn">了解更多</option>
        </select>
      </FieldRow>
    </div>
  );
}

function ReviewSummary({
  assetRightsConfirmed,
  pixelEvent,
}: {
  assetRightsConfirmed: boolean;
  pixelEvent: string;
}) {
  return (
    <div className="review-page">
      <div className="review-page__intro">
        <CheckCircle2 aria-hidden="true" size={22} />
        <div>
          <h3>确认完整广告结构</h3>
          <p>核对目标、受众、预算、素材、转化和风险后再创建确认请求。</p>
        </div>
      </div>
      <dl className="review-summary">
        <div>
          <dt>Campaign</dt>
          <dd>夏日轻装转化 · 销售</dd>
        </div>
        <div>
          <dt>Ad Set</dt>
          <dd>18–44 岁 · 中国大陆 · 自动版位</dd>
        </div>
        <div>
          <dt>预算与排期</dt>
          <dd>¥10,000/天 · 2025-05-20—2025-05-27</dd>
        </div>
        <div>
          <dt>转化事件</dt>
          <dd>{pixelEvent || "未选择"}</dd>
        </div>
        <div>
          <dt>素材</dt>
          <dd>
            夏日轻装_主图_01 ·
            {assetRightsConfirmed ? " 权利已确认" : " 权利待确认"}
          </dd>
        </div>
        <div>
          <dt>目标结果</dt>
          <dd>建立待确认请求，不调用 Meta</dd>
        </div>
      </dl>
    </div>
  );
}
