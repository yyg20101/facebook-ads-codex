import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  AuditEvent,
  PublishState,
  TestConclusion,
} from "../types";

type ExperienceMode = "guided" | "advanced";

interface PrototypeStateValue {
  mode: ExperienceMode;
  assetRightsConfirmed: boolean;
  pixelEvent: string;
  publishState: PublishState;
  diagnosisSaved: boolean;
  pendingActionCreated: boolean;
  testConclusion: TestConclusion;
  testConclusionSaved: boolean;
  nextTestCreated: boolean;
  auditEvents: AuditEvent[];
  setMode: (mode: ExperienceMode) => void;
  confirmAssetRights: () => void;
  selectPixelEvent: (event: string) => void;
  createPublishRequest: () => void;
  advancePublishState: (
    state: Extract<PublishState, "PUBLISHING" | "PUBLISHED" | "REVIEW_FAILED">,
  ) => void;
  saveDiagnosis: () => void;
  createPendingAction: () => void;
  setTestConclusion: (conclusion: TestConclusion) => void;
  saveTestConclusion: () => void;
  createNextTest: () => void;
  resetPrototype: () => void;
}

const initialAudit: AuditEvent[] = [
  {
    id: "AUD-001",
    at: "08:42",
    actor: "prototype",
    action: "加载虚构数据集",
    object: "DEMO-001",
    result: "未连接外部资源",
  },
  {
    id: "AUD-002",
    at: "08:41",
    actor: "project_owner",
    action: "保存广告草稿",
    object: "夏季轻装转化 v3",
    result: "本地原型状态",
  },
];

const PrototypeStateContext = createContext<PrototypeStateValue | null>(null);

export function PrototypeStateProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ExperienceMode>("guided");
  const [assetRightsConfirmed, setAssetRightsConfirmed] = useState(false);
  const [pixelEvent, setPixelEvent] = useState("");
  const [publishState, setPublishState] = useState<PublishState>("DRAFT");
  const [diagnosisSaved, setDiagnosisSaved] = useState(false);
  const [pendingActionCreated, setPendingActionCreated] = useState(false);
  const [testConclusion, setTestConclusion] =
    useState<TestConclusion>("ITERATE");
  const [testConclusionSaved, setTestConclusionSaved] = useState(false);
  const [nextTestCreated, setNextTestCreated] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAudit);

  const appendAudit = useCallback(
    (action: string, object: string, result: string) => {
      setAuditEvents((events) => [
        {
          id: `AUD-${String(events.length + 1).padStart(3, "0")}`,
          at: new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          actor: "project_owner",
          action,
          object,
          result,
        },
        ...events,
      ]);
    },
    [],
  );

  const confirmAssetRights = useCallback(() => {
    setAssetRightsConfirmed(true);
    appendAudit(
      "确认素材商业使用权",
      "AST-001",
      "仅更新原型状态，未写入外部系统",
    );
  }, [appendAudit]);

  const selectPixelEvent = useCallback(
    (event: string) => {
      setPixelEvent(event);
      appendAudit("选择转化事件", "ADSET-001", `${event} · 本地草稿`);
    },
    [appendAudit],
  );

  const createPublishRequest = useCallback(() => {
    setPublishState("PENDING_CONFIRMATION");
    appendAudit(
      "创建发布确认请求",
      "PR-001",
      "待确认 · 未调用 Meta",
    );
  }, [appendAudit]);

  const advancePublishState = useCallback(
    (
      state: Extract<
        PublishState,
        "PUBLISHING" | "PUBLISHED" | "REVIEW_FAILED"
      >,
    ) => {
      setPublishState(state);
      const labels: Record<typeof state, string> = {
        PUBLISHING: "模拟发布中",
        PUBLISHED: "模拟已发布",
        REVIEW_FAILED: "模拟审核失败",
      };
      appendAudit(
        "推进原型状态",
        "PR-001",
        `${labels[state]} · 无外部请求`,
      );
    },
    [appendAudit],
  );

  const saveDiagnosis = useCallback(() => {
    setDiagnosisSaved(true);
    appendAudit("保存诊断报告", "DR-004", "建议 · 未执行");
  }, [appendAudit]);

  const createPendingAction = useCallback(() => {
    setPendingActionCreated(true);
    appendAudit(
      "创建待确认行动",
      "ACT-004",
      "待确认 · 未产生 Meta 写操作",
    );
  }, [appendAudit]);

  const saveTestConclusion = useCallback(() => {
    setTestConclusionSaved(true);
    appendAudit(
      "保存测试结论",
      "TC-007",
      `${testConclusion} · 记录知识，不自动优化`,
    );
  }, [appendAudit, testConclusion]);

  const createNextTest = useCallback(() => {
    setNextTestCreated(true);
    appendAudit("创建下一轮测试", "TP-008", "准备中 · 本地原型");
  }, [appendAudit]);

  const resetPrototype = useCallback(() => {
    setMode("guided");
    setAssetRightsConfirmed(false);
    setPixelEvent("");
    setPublishState("DRAFT");
    setDiagnosisSaved(false);
    setPendingActionCreated(false);
    setTestConclusion("ITERATE");
    setTestConclusionSaved(false);
    setNextTestCreated(false);
    setAuditEvents(initialAudit);
  }, []);

  const value = useMemo<PrototypeStateValue>(
    () => ({
      mode,
      assetRightsConfirmed,
      pixelEvent,
      publishState,
      diagnosisSaved,
      pendingActionCreated,
      testConclusion,
      testConclusionSaved,
      nextTestCreated,
      auditEvents,
      setMode,
      confirmAssetRights,
      selectPixelEvent,
      createPublishRequest,
      advancePublishState,
      saveDiagnosis,
      createPendingAction,
      setTestConclusion,
      saveTestConclusion,
      createNextTest,
      resetPrototype,
    }),
    [
      mode,
      assetRightsConfirmed,
      pixelEvent,
      publishState,
      diagnosisSaved,
      pendingActionCreated,
      testConclusion,
      testConclusionSaved,
      nextTestCreated,
      auditEvents,
      confirmAssetRights,
      selectPixelEvent,
      createPublishRequest,
      advancePublishState,
      saveDiagnosis,
      createPendingAction,
      saveTestConclusion,
      createNextTest,
      resetPrototype,
    ],
  );

  return (
    <PrototypeStateContext.Provider value={value}>
      {children}
    </PrototypeStateContext.Provider>
  );
}

export function usePrototypeState() {
  const value = useContext(PrototypeStateContext);

  if (!value) {
    throw new Error(
      "usePrototypeState must be used inside PrototypeStateProvider",
    );
  }

  return value;
}
