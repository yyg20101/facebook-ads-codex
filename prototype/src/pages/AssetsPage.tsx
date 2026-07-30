import {
  Check,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Filter,
  ImagePlus,
  Link2,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "../router";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Status } from "../components/ui/Status";
import { useToast } from "../components/ui/Toast";
import { creativeAssets, money } from "../data/demo";
import { usePrototypeState } from "../state/PrototypeState";

type AssetTab = "全部" | "图片" | "视频" | "需要处理";

export function AssetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AssetTab>("全部");
  const [query, setQuery] = useState("");
  const [rightsDialogOpen, setRightsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [rightsAcknowledged, setRightsAcknowledged] = useState(false);
  const { assetRightsConfirmed, confirmAssetRights } = usePrototypeState();
  const { notify } = useToast();
  const selectedId = searchParams.get("focus") ?? creativeAssets[0].id;
  const selectedAsset =
    creativeAssets.find((asset) => asset.id === selectedId) ?? creativeAssets[0];

  const visibleAssets = useMemo(() => {
    return creativeAssets.filter((asset) => {
      const effectiveRights =
        asset.id === "AST-001" && assetRightsConfirmed
          ? "已确认"
          : asset.rights;
      const matchesTab =
        tab === "全部" ||
        asset.kind === tab ||
        (tab === "需要处理" && effectiveRights === "待确认");
      const matchesQuery =
        !query ||
        asset.name.toLowerCase().includes(query.toLowerCase()) ||
        asset.id.toLowerCase().includes(query.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [assetRightsConfirmed, query, tab]);

  const selectedRights =
    selectedAsset.id === "AST-001" && assetRightsConfirmed
      ? "已确认"
      : selectedAsset.rights;

  const selectAsset = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("focus", id);
    setSearchParams(next);
  };

  const handleRightsConfirm = () => {
    confirmAssetRights();
    setRightsDialogOpen(false);
    notify("素材权利已在原型中标记为已确认");
  };

  return (
    <div className="page assets-page">
      <PageHeader
        actions={
          <>
            <Button
              icon={<WandSparkles aria-hidden="true" size={17} />}
              onClick={() =>
                notify("已建立 AI 变体草稿；前期由独立 Codex 会话辅助生成")
              }
            >
              AI 变体
            </Button>
            <Button
              icon={<Upload aria-hidden="true" size={17} />}
              onClick={() => setUploadDialogOpen(true)}
              variant="primary"
            >
              上传素材
            </Button>
          </>
        }
        description="集中管理来源、权利、规格、版本、关联广告和历史表现。"
        title="素材中心"
      />

      <section className="asset-toolbar" aria-label="素材筛选">
        <div className="tab-list" role="tablist">
          {(["全部", "图片", "视频", "需要处理"] as AssetTab[]).map(
            (item) => (
              <button
                aria-selected={tab === item}
                className={tab === item ? "tab-button tab-button--active" : "tab-button"}
                key={item}
                onClick={() => setTab(item)}
                role="tab"
                type="button"
              >
                {item}
                {item === "需要处理" && !assetRightsConfirmed ? (
                  <span className="tab-count">1</span>
                ) : null}
              </button>
            ),
          )}
        </div>
        <label className="search-field">
          <Search aria-hidden="true" size={16} />
          <span className="sr-only">搜索素材</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索名称或 ID"
            value={query}
          />
        </label>
        <Button icon={<Filter aria-hidden="true" size={16} />} size="sm">
          筛选
        </Button>
      </section>

      <div className="asset-workspace">
        <section className="asset-library" aria-label="素材列表">
          {visibleAssets.length ? (
            <div className="asset-grid">
              {visibleAssets.map((asset) => {
                const rights =
                  asset.id === "AST-001" && assetRightsConfirmed
                    ? "已确认"
                    : asset.rights;
                return (
                  <button
                    aria-pressed={selectedAsset.id === asset.id}
                    className={`asset-card ${
                      selectedAsset.id === asset.id
                        ? "asset-card--selected"
                        : ""
                    }`}
                    key={asset.id}
                    onClick={() => selectAsset(asset.id)}
                    type="button"
                  >
                    <div className="asset-card__media">
                      <img alt={`${asset.name} 原型素材`} src={asset.image} />
                      <div className="asset-card__markers">
                        <Status
                          compact
                          severity={rights === "已确认" ? "success" : "warning"}
                        >
                          {rights === "已确认" ? "权利已确认" : "权利待确认"}
                        </Status>
                        {asset.aiGenerated ? (
                          <Status compact severity="info">
                            AI 生成
                          </Status>
                        ) : null}
                      </div>
                    </div>
                    <span className="asset-card__body">
                      <strong>{asset.name}</strong>
                      <small>
                        {asset.kind} · {asset.dimensions} · {asset.fileSize}
                      </small>
                      <span className="asset-card__metrics">
                        <span>
                          CTR <b>{asset.ctr.toFixed(2)}%</b>
                        </span>
                        <span>
                          购买 <b>{asset.purchases}</b>
                        </span>
                        <span>
                          ROAS <b>{asset.roas.toFixed(2)}</b>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="asset-empty">
              <ImagePlus aria-hidden="true" size={28} />
              <strong>没有符合条件的素材</strong>
              <span>调整筛选条件后重试。</span>
            </div>
          )}
        </section>

        <aside className="asset-inspector">
          <header className="asset-inspector__header">
            <div>
              <small>{selectedAsset.id}</small>
              <h2>{selectedAsset.name}</h2>
            </div>
            <Status
              severity={selectedRights === "已确认" ? "success" : "warning"}
            >
              {selectedRights === "已确认" ? "可用于广告" : "需要处理"}
            </Status>
          </header>
          <img
            alt={`${selectedAsset.name} 预览`}
            className="asset-inspector__preview"
            src={selectedAsset.image}
          />
          <dl className="detail-list">
            <div>
              <dt>来源</dt>
              <dd>{selectedAsset.source}</dd>
            </div>
            <div>
              <dt>商业使用权</dt>
              <dd>
                <Status
                  compact
                  severity={selectedRights === "已确认" ? "success" : "warning"}
                >
                  {selectedRights}
                </Status>
              </dd>
            </div>
            <div>
              <dt>生成标记</dt>
              <dd>{selectedAsset.aiGenerated ? "AI 生成" : "非 AI 生成"}</dd>
            </div>
            <div>
              <dt>规格</dt>
              <dd>
                {selectedAsset.dimensions} · {selectedAsset.fileSize}
              </dd>
            </div>
            <div>
              <dt>关联广告</dt>
              <dd>{selectedAsset.linkedAds} 个原型广告对象</dd>
            </div>
            <div>
              <dt>历史消耗</dt>
              <dd>{money(selectedAsset.spend)}</dd>
            </div>
          </dl>
          {selectedRights === "待确认" ? (
            <div className="inline-alert inline-alert--warning">
              <CircleAlert aria-hidden="true" size={18} />
              <div>
                <strong>发布前阻断项</strong>
                <p>必须核对来源证明和商业使用范围，不能根据文件名推断权利。</p>
              </div>
            </div>
          ) : (
            <div className="inline-alert inline-alert--success">
              <ShieldCheck aria-hidden="true" size={18} />
              <div>
                <strong>权利检查已完成</strong>
                <p>该结果仅保存在本地原型状态。</p>
              </div>
            </div>
          )}
          <div className="asset-inspector__actions">
            {selectedRights === "待确认" ? (
              <Button
                icon={<FileCheck2 aria-hidden="true" size={17} />}
                onClick={() => setRightsDialogOpen(true)}
                variant="primary"
              >
                核对并确认权利
              </Button>
            ) : (
              <Button
                icon={<Check aria-hidden="true" size={17} />}
                onClick={() => navigate("/create")}
                variant="primary"
              >
                用于广告创建
              </Button>
            )}
            <Button
              icon={<Sparkles aria-hidden="true" size={17} />}
              onClick={() => navigate("/testing")}
            >
              建立测试变体
            </Button>
          </div>
          <button
            className="object-link-row"
            onClick={() => navigate("/analytics?focus=AST-001")}
            type="button"
          >
            <Link2 aria-hidden="true" size={16} />
            查看关联表现和诊断
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </aside>
      </div>

      <Dialog
        description="这里只记录脱敏的原型确认结果，不上传合同或客户资料。"
        footer={
          <>
            <Button onClick={() => setRightsDialogOpen(false)}>取消</Button>
            <Button
              disabled={!rightsAcknowledged}
              onClick={handleRightsConfirm}
              variant="primary"
            >
              确认并保存原型状态
            </Button>
          </>
        }
        onClose={() => setRightsDialogOpen(false)}
        open={rightsDialogOpen}
        title="核对素材商业使用权"
      >
        <div className="rights-review">
          <dl className="review-summary">
            <div>
              <dt>素材</dt>
              <dd>AST-001 · 夏日轻装_主图_01</dd>
            </div>
            <div>
              <dt>声明来源</dt>
              <dd>品牌拍摄 · 合同 DEMO-LIC-01</dd>
            </div>
            <div>
              <dt>允许范围</dt>
              <dd>Meta 广告投放 · 原型示例</dd>
            </div>
          </dl>
          <label className="check-row">
            <input
              checked={rightsAcknowledged}
              onChange={(event) => setRightsAcknowledged(event.target.checked)}
              type="checkbox"
            />
            <span>
              我已核对来源和允许范围，并理解这只是 Product Discovery
              原型记录。
            </span>
          </label>
        </div>
      </Dialog>

      <Dialog
        description="原型不读取文件，也不会上传到任何外部服务。"
        footer={
          <>
            <Button onClick={() => setUploadDialogOpen(false)}>取消</Button>
            <Button
              onClick={() => {
                setUploadDialogOpen(false);
                notify("已模拟加入素材草稿；没有读取或上传真实文件");
              }}
              variant="primary"
            >
              模拟加入素材库
            </Button>
          </>
        }
        onClose={() => setUploadDialogOpen(false)}
        open={uploadDialogOpen}
        title="上传素材"
      >
        <div className="upload-dropzone">
          <Upload aria-hidden="true" size={28} />
          <strong>将素材加入本地原型草稿</strong>
          <p>支持图片或视频；此演示不会读取设备文件。</p>
        </div>
      </Dialog>
    </div>
  );
}
