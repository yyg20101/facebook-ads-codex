import {
  AlertTriangle,
  Boxes,
  CircleDot,
  GitBranch,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  loadOfflineAdObjectHierarchy,
  type OfflineAdObject,
  type OfflineAdObjectHierarchyResponse,
  type OfflineAdObjectLevel,
} from "../../data/offlineHierarchy";
import {
  OfflineComparisonError,
  type OfflineAdAccount,
} from "../../data/offlineComparison";
import { Button } from "../ui/Button";
import { Status } from "../ui/Status";

type HierarchyLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; response: OfflineAdObjectHierarchyResponse }
  | { kind: "error"; code: string; message: string };

const EMPTY_OBJECTS: OfflineAdObject[] = [];
const IGNORE_SELECTION = (_object: OfflineAdObject | null) => undefined;

const OBJECT_LEVEL_LABELS: Record<OfflineAdObjectLevel, string> = {
  CAMPAIGN: "Campaign",
  AD_SET: "Ad Set",
  AD: "Ad",
};

interface HierarchyObjectButtonProps {
  item: OfflineAdObject;
  selected: boolean;
  onSelect: (id: string) => void;
}

function HierarchyObjectButton({
  item,
  selected,
  onSelect,
}: HierarchyObjectButtonProps) {
  const Icon =
    item.objectLevel === "CAMPAIGN"
      ? Megaphone
      : item.objectLevel === "AD_SET"
        ? GitBranch
        : CircleDot;

  return (
    <button
      aria-pressed={selected}
      className={
        selected
          ? "offline-object-node offline-object-node--selected"
          : "offline-object-node"
      }
      onClick={() => onSelect(item.id)}
      type="button"
    >
      <Icon aria-hidden="true" size={16} />
      <span>
        <small>{OBJECT_LEVEL_LABELS[item.objectLevel]}</small>
        <strong>{item.displayName}</strong>
        <code>{item.externalObjectRef}</code>
      </span>
    </button>
  );
}

export function OfflineObjectHierarchyPanel({
  account,
  onSelectionChange = IGNORE_SELECTION,
}: {
  account: OfflineAdAccount;
  onSelectionChange?: (object: OfflineAdObject | null) => void;
}) {
  const [state, setState] = useState<HierarchyLoadState>({ kind: "idle" });
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const items = state.kind === "ready" ? state.response.data.items : EMPTY_OBJECTS;
  const objectsById = new Map(items.map((item) => [item.id, item]));
  const childrenByParent = new Map<string, OfflineAdObject[]>();
  for (const item of items) {
    if (item.parentObjectId === null) {
      continue;
    }
    const siblings = childrenByParent.get(item.parentObjectId) ?? [];
    siblings.push(item);
    childrenByParent.set(item.parentObjectId, siblings);
  }
  const campaigns = items.filter((item) => item.objectLevel === "CAMPAIGN");
  const selectedObject = objectsById.get(selectedObjectId);
  const selectedParent =
    selectedObject?.parentObjectId === null ||
    selectedObject?.parentObjectId === undefined
      ? undefined
      : objectsById.get(selectedObject.parentObjectId);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    [],
  );

  const handleLoad = async () => {
    activeRequest.current?.abort();

    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ kind: "loading" });
    setSelectedObjectId("");
    onSelectionChange(null);

    try {
      const response = await loadOfflineAdObjectHierarchy(
        account,
        controller.signal,
      );
      if (activeRequest.current === controller) {
        const firstObject = response.data.items[0];
        setState({ kind: "ready", response });
        setSelectedObjectId(firstObject?.id ?? "");
        onSelectionChange(firstObject ?? null);
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
          message:
            "无法读取本地 fixture 对象层级。请确认 migration、fixture 和 Worker 已启动。",
        });
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  };

  const handleSelect = (objectId: string) => {
    const object = objectsById.get(objectId);
    if (object === undefined) {
      return;
    }
    setSelectedObjectId(object.id);
    onSelectionChange(object);
  };

  return (
    <section
      aria-labelledby="offline-object-hierarchy-title"
      className="offline-object-hierarchy"
    >
      <header>
        <div>
          <span>步骤 3</span>
          <h3 id="offline-object-hierarchy-title">浏览广告对象层级</h3>
          <p>
            读取所选账户的 Campaign → Ad Set → Ad 关系，并选择后续分析对象。
          </p>
        </div>
        <Button
          icon={<Boxes aria-hidden="true" size={16} />}
          loading={state.kind === "loading"}
          onClick={handleLoad}
          type="button"
        >
          {state.kind === "ready" ? "重新读取对象层级" : "读取对象层级"}
        </Button>
      </header>

      <div aria-live="polite">
        {state.kind === "idle" ? (
          <div className="offline-comparison__account-message">
            <GitBranch aria-hidden="true" size={18} />
            <span>对象层级尚未读取；仍可单独加载下方账户级周期分析。</span>
          </div>
        ) : null}
        {state.kind === "loading" ? (
          <div className="offline-comparison__account-message">
            <RefreshCw
              aria-hidden="true"
              className="offline-comparison__spinner"
              size={18}
            />
            <span>正在验证 fixture 对象及其父级关系。</span>
          </div>
        ) : null}
        {state.kind === "error" ? (
          <div className="offline-comparison__error" role="alert">
            <AlertTriangle aria-hidden="true" size={20} />
            <div>
              <strong>{state.code}</strong>
              <p>{state.message}</p>
              <small>未使用静态回退、手工对象 ID 或不完整父级关系。</small>
            </div>
          </div>
        ) : null}
        {state.kind === "ready" && items.length === 0 ? (
          <div className="offline-comparison__account-message">
            <AlertTriangle aria-hidden="true" size={18} />
            <span>该 fixture 账户没有可导航的广告对象。</span>
          </div>
        ) : null}
        {state.kind === "ready" && items.length > 0 ? (
          <div className="offline-object-hierarchy__content">
            <div className="offline-object-hierarchy__summary">
              <div>
                <Status compact severity="info">
                  已验证层级 · 可选对象分析
                </Status>
                <span>
                  {state.response.data.counts.campaigns} Campaign ·{" "}
                  {state.response.data.counts.adSets} Ad Set ·{" "}
                  {state.response.data.counts.ads} Ad
                </span>
              </div>
              <small>最多 50 个本地 fixture 对象；这不是产品容量承诺。</small>
            </div>

            <div className="offline-object-hierarchy__layout">
              <nav aria-label="Fixture 广告对象层级">
                <ul className="offline-object-tree">
                  {campaigns.map((campaign) => (
                    <li key={campaign.id}>
                      <HierarchyObjectButton
                        item={campaign}
                        onSelect={handleSelect}
                        selected={selectedObjectId === campaign.id}
                      />
                      <ul>
                        {(childrenByParent.get(campaign.id) ?? []).map(
                          (adSet) => (
                            <li key={adSet.id}>
                              <HierarchyObjectButton
                                item={adSet}
                                onSelect={handleSelect}
                                selected={selectedObjectId === adSet.id}
                              />
                              <ul>
                                {(childrenByParent.get(adSet.id) ?? []).map(
                                  (ad) => (
                                    <li key={ad.id}>
                                      <HierarchyObjectButton
                                        item={ad}
                                        onSelect={handleSelect}
                                        selected={selectedObjectId === ad.id}
                                      />
                                    </li>
                                  ),
                                )}
                              </ul>
                            </li>
                          ),
                        )}
                      </ul>
                    </li>
                  ))}
                </ul>
              </nav>

              {selectedObject !== undefined ? (
                <aside aria-label="当前 fixture 对象" className="offline-object-detail">
                  <span>{OBJECT_LEVEL_LABELS[selectedObject.objectLevel]}</span>
                  <h4>{selectedObject.displayName}</h4>
                  <code>{selectedObject.externalObjectRef}</code>
                  <dl>
                    <div>
                      <dt>父级</dt>
                      <dd>
                        {selectedParent?.displayName ?? account.externalAccountRef}
                      </dd>
                    </div>
                    <div>
                      <dt>同步批次</dt>
                      <dd>{selectedObject.syncRunId}</dd>
                    </div>
                    <div>
                      <dt>Fixture 获取时间</dt>
                      <dd>{selectedObject.fetchedAt}</dd>
                    </div>
                  </dl>
                  <p>
                    {selectedObject.objectLevel === "AD"
                      ? "可加载当前 Ad 的周期对比；Ad 是本切片叶子，没有直接子对象拆解。"
                      : "可加载当前对象的周期对比，也可显式拆解其直接子对象。"}
                  </p>
                </aside>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
