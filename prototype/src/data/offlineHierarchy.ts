import {
  OfflineComparisonError,
  isOfflineComparisonResponse,
  type OfflineAdAccount,
  type OfflineComparisonRequest,
  type OfflineComparisonResponse,
} from "./offlineComparison";

export type OfflineAdObjectLevel = "CAMPAIGN" | "AD_SET" | "AD";

export interface OfflineAdObject {
  id: string;
  externalObjectRef: string;
  objectLevel: OfflineAdObjectLevel;
  parentObjectId: string | null;
  displayName: string;
  sourceKind: "FIXTURE";
  syncRunId: string;
  fetchedAt: string;
}

interface OfflineAdObjectCounts {
  campaigns: number;
  adSets: number;
  ads: number;
}

export interface OfflineAdObjectHierarchyResponse {
  ok: true;
  data: {
    account: OfflineAdAccount;
    items: OfflineAdObject[];
    counts: OfflineAdObjectCounts;
  };
  context: {
    requestId: string;
    workspaceId: string;
    adAccountId: string;
    sourceKind: "FIXTURE";
  };
  warnings: string[];
  nextCursor: null;
  truncated: false;
}

export interface OfflineAdObjectComparisonResponse
  extends Omit<OfflineComparisonResponse, "data" | "context"> {
  data: OfflineComparisonResponse["data"] & {
    object: OfflineAdObject;
  };
  context: OfflineComparisonResponse["context"] & {
    objectId: string;
    objectLevel: OfflineAdObjectLevel;
    parentObjectId: string | null;
  };
}

const FIXTURE_WORKSPACE_ID = "ws_fixture_01";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OFFLINE_ID = /^[a-z0-9][a-z0-9_-]{2,63}$/;
const MAX_OFFLINE_AD_OBJECTS = 50;
const OBJECT_LEVELS: readonly string[] = ["CAMPAIGN", "AD_SET", "AD"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isFixtureAccount(value: unknown): value is OfflineAdAccount {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    OFFLINE_ID.test(value.id) &&
    typeof value.externalAccountRef === "string" &&
    value.externalAccountRef.length > 0 &&
    typeof value.currency === "string" &&
    value.currency.length > 0 &&
    typeof value.timezoneName === "string" &&
    value.timezoneName.length > 0 &&
    value.sourceKind === "FIXTURE" &&
    (value.dataThrough === null || typeof value.dataThrough === "string") &&
    isNonNegativeInteger(value.insightRowCount)
  );
}

export function isFixtureAdObject(value: unknown): value is OfflineAdObject {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    OFFLINE_ID.test(value.id) &&
    typeof value.externalObjectRef === "string" &&
    value.externalObjectRef.length > 0 &&
    typeof value.objectLevel === "string" &&
    OBJECT_LEVELS.includes(value.objectLevel) &&
    (value.parentObjectId === null ||
      (typeof value.parentObjectId === "string" &&
        OFFLINE_ID.test(value.parentObjectId))) &&
    typeof value.displayName === "string" &&
    value.displayName.length > 0 &&
    value.sourceKind === "FIXTURE" &&
    typeof value.syncRunId === "string" &&
    OFFLINE_ID.test(value.syncRunId) &&
    typeof value.fetchedAt === "string" &&
    value.fetchedAt.length > 0
  );
}

function hasRequiredFixtureWarnings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((warning) => typeof warning === "string") &&
    value.includes("FIXTURE_DATA_ONLY") &&
    value.includes("NO_EXTERNAL_CONNECTION")
  );
}

function hasValidHierarchy(items: OfflineAdObject[]): boolean {
  const objectsById = new Map(items.map((item) => [item.id, item]));

  for (const item of items) {
    if (item.objectLevel === "CAMPAIGN") {
      if (item.parentObjectId !== null) {
        return false;
      }
      continue;
    }

    const parent =
      item.parentObjectId === null
        ? undefined
        : objectsById.get(item.parentObjectId);
    const expectedParentLevel =
      item.objectLevel === "AD_SET" ? "CAMPAIGN" : "AD_SET";
    if (parent?.objectLevel !== expectedParentLevel) {
      return false;
    }
  }

  return true;
}

function isExpectedAccount(
  value: unknown,
  expectedAccount: OfflineAdAccount,
): value is OfflineAdAccount {
  return (
    isFixtureAccount(value) &&
    value.id === expectedAccount.id &&
    value.externalAccountRef === expectedAccount.externalAccountRef &&
    value.currency === expectedAccount.currency &&
    value.timezoneName === expectedAccount.timezoneName &&
    value.sourceKind === expectedAccount.sourceKind
  );
}

function isExpectedAdObject(
  value: unknown,
  expectedObject: OfflineAdObject,
): value is OfflineAdObject {
  return (
    isFixtureAdObject(value) &&
    value.id === expectedObject.id &&
    value.externalObjectRef === expectedObject.externalObjectRef &&
    value.objectLevel === expectedObject.objectLevel &&
    value.parentObjectId === expectedObject.parentObjectId &&
    value.displayName === expectedObject.displayName &&
    value.sourceKind === expectedObject.sourceKind &&
    value.syncRunId === expectedObject.syncRunId &&
    value.fetchedAt === expectedObject.fetchedAt
  );
}

function isHierarchyResponse(
  value: unknown,
  expectedAccount: OfflineAdAccount,
): value is OfflineAdObjectHierarchyResponse {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.context)) {
    return false;
  }

  const items = value.data.items;
  const counts = value.data.counts;
  if (
    !Array.isArray(items) ||
    items.length > MAX_OFFLINE_AD_OBJECTS ||
    !items.every(isFixtureAdObject) ||
    !isRecord(counts) ||
    !isNonNegativeInteger(counts.campaigns) ||
    !isNonNegativeInteger(counts.adSets) ||
    !isNonNegativeInteger(counts.ads)
  ) {
    return false;
  }

  const uniqueIds = new Set(items.map((item) => item.id));
  const uniqueExternalRefs = new Set(
    items.map((item) => item.externalObjectRef),
  );
  const actualCounts: OfflineAdObjectCounts = {
    campaigns: items.filter((item) => item.objectLevel === "CAMPAIGN").length,
    adSets: items.filter((item) => item.objectLevel === "AD_SET").length,
    ads: items.filter((item) => item.objectLevel === "AD").length,
  };

  return (
    value.ok === true &&
    isExpectedAccount(value.data.account, expectedAccount) &&
    uniqueIds.size === items.length &&
    uniqueExternalRefs.size === items.length &&
    hasValidHierarchy(items) &&
    counts.campaigns === actualCounts.campaigns &&
    counts.adSets === actualCounts.adSets &&
    counts.ads === actualCounts.ads &&
    counts.campaigns + counts.adSets + counts.ads === items.length &&
    typeof value.context.requestId === "string" &&
    value.context.workspaceId === FIXTURE_WORKSPACE_ID &&
    value.context.adAccountId === expectedAccount.id &&
    value.context.sourceKind === "FIXTURE" &&
    hasRequiredFixtureWarnings(value.warnings) &&
    value.nextCursor === null &&
    value.truncated === false
  );
}

function isObjectComparisonResponse(
  value: unknown,
  expectedAccount: OfflineAdAccount,
  expectedObject: OfflineAdObject,
  expectedRequest: OfflineComparisonRequest,
): value is OfflineAdObjectComparisonResponse {
  if (!isOfflineComparisonResponse(value, expectedAccount, expectedRequest)) {
    return false;
  }

  const data: unknown = value.data;
  const context: unknown = value.context;
  if (!isRecord(data) || !isRecord(context)) {
    return false;
  }

  return (
    isExpectedAdObject(data.object, expectedObject) &&
    context.objectId === expectedObject.id &&
    context.objectLevel === expectedObject.objectLevel &&
    context.parentObjectId === expectedObject.parentObjectId
  );
}

function errorFromEnvelope(value: unknown, status: number) {
  if (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  ) {
    return new OfflineComparisonError(value.error.code, value.error.message);
  }

  return new OfflineComparisonError(
    `HTTP_${status}`,
    "离线 Worker 返回了无法识别的对象层级错误响应。",
  );
}

export async function loadOfflineAdObjectHierarchy(
  account: OfflineAdAccount,
  signal: AbortSignal,
): Promise<OfflineAdObjectHierarchyResponse> {
  if (!isFixtureAccount(account)) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "必须先从本地 fixture 账户列表选择有效账户。",
    );
  }

  const path =
    `/offline-api/v1/workspaces/${FIXTURE_WORKSPACE_ID}` +
    `/ad-accounts/${encodeURIComponent(account.id)}/objects`;
  const response = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    credentials: "omit",
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "离线 Worker 没有返回有效的对象层级 JSON。",
    );
  }

  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isHierarchyResponse(body, account)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "对象响应缺少 fixture、账户绑定或完整父级关系，已拒绝使用。",
    );
  }

  return body;
}

export async function loadOfflineAdObjectComparison(
  account: OfflineAdAccount,
  object: OfflineAdObject,
  request: OfflineComparisonRequest,
  signal: AbortSignal,
): Promise<OfflineAdObjectComparisonResponse> {
  if (!isFixtureAccount(account) || !isFixtureAdObject(object)) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "必须先从已验证的 fixture 层级选择广告对象。",
    );
  }

  const dates = [
    request.baselineStart,
    request.baselineStop,
    request.currentStart,
    request.currentStop,
  ];
  if (!dates.every((date) => ISO_DATE.test(date))) {
    throw new OfflineComparisonError(
      "INVALID_ARGUMENT",
      "四个周期日期都必须使用 YYYY-MM-DD。",
    );
  }

  const parameters = new URLSearchParams({
    baseline_start: request.baselineStart,
    baseline_stop: request.baselineStop,
    current_start: request.currentStart,
    current_stop: request.currentStop,
  });
  const path =
    `/offline-api/v1/workspaces/${FIXTURE_WORKSPACE_ID}` +
    `/ad-accounts/${encodeURIComponent(account.id)}` +
    `/objects/${encodeURIComponent(object.id)}/comparison?${parameters.toString()}`;
  const response = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    credentials: "omit",
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "离线 Worker 没有返回有效的对象分析 JSON。",
    );
  }

  if (!response.ok) {
    throw errorFromEnvelope(body, response.status);
  }
  if (!isObjectComparisonResponse(body, account, object, request)) {
    throw new OfflineComparisonError(
      "INVALID_RESPONSE",
      "对象分析响应缺少 fixture、对象绑定或非因果信任标记，已拒绝展示。",
    );
  }

  return body;
}
