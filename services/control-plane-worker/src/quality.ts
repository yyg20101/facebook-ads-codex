import { ADDITIVE_METRIC_KEYS } from "./comparison";
import type {
  FixtureAdAccount,
  FixtureAdObject,
  FixtureAdObjectCounts,
  FixtureAdObjectTrend,
  FixtureSubjectTrend,
  SummaryContext
} from "./read-model";

export const OFFLINE_DATA_QUALITY_CHECK_CODES = [
  "PRIMARY_GRAIN_UNIQUE",
  "DAILY_COVERAGE_COMPLETE",
  "REPORTING_CONTEXT_CONSISTENT",
  "OBJECT_HIERARCHY_COMPLETE",
  "ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP",
  "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
  "AD_SET_TO_AD_DAILY_ROLLUP"
] as const;

export type OfflineDataQualityCheckCode =
  (typeof OFFLINE_DATA_QUALITY_CHECK_CODES)[number];

export type OfflineDataQualityCheckUnit =
  | "ROWS"
  | "SUBJECT_DAYS"
  | "OBJECTS"
  | "PARENT_DAYS";

export interface OfflineDataQualityCheck {
  code: OfflineDataQualityCheckCode;
  status: "PASS";
  unit: OfflineDataQualityCheckUnit;
  checkedUnits: number;
  failedUnits: 0;
}

export interface OfflineDataQualityReport {
  account: FixtureAdAccount;
  requestedRange: { dateStart: string; dateStop: string };
  dataset: {
    grain: "SUBJECT_DAY";
    subjectCount: number;
    observedRows: number;
    expectedRows: number;
  };
  hierarchy: FixtureAdObjectCounts & {
    objectCount: number;
    objectIds: string[];
  };
  checks: OfflineDataQualityCheck[];
  context: SummaryContext;
}

export type OfflineDataQualityReportResult =
  | { kind: "ok"; report: OfflineDataQualityReport }
  | { kind: "incompatible_hierarchy" }
  | { kind: "incompatible_context" }
  | { kind: "incompatible_rollup" };

function arraysEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function accountsEqual(
  left: FixtureAdAccount,
  right: FixtureAdAccount
): boolean {
  return (
    left.id === right.id &&
    left.externalAccountRef === right.externalAccountRef &&
    left.currency === right.currency &&
    left.timezoneName === right.timezoneName &&
    left.sourceKind === right.sourceKind &&
    left.dataThrough === right.dataThrough &&
    left.insightRowCount === right.insightRowCount
  );
}

function objectsEqual(left: FixtureAdObject, right: FixtureAdObject): boolean {
  return (
    left.id === right.id &&
    left.externalObjectRef === right.externalObjectRef &&
    left.objectLevel === right.objectLevel &&
    left.parentObjectId === right.parentObjectId &&
    left.displayName === right.displayName &&
    left.sourceKind === right.sourceKind &&
    left.syncRunId === right.syncRunId &&
    left.fetchedAt === right.fetchedAt
  );
}

function contextsEqual(left: SummaryContext, right: SummaryContext): boolean {
  return (
    left.currency === right.currency &&
    left.timezoneName === right.timezoneName &&
    left.clickMetricKind === right.clickMetricKind &&
    left.conversionEventRef === right.conversionEventRef &&
    left.attributionSpecHash === right.attributionSpecHash &&
    left.apiVersion === right.apiVersion &&
    left.stabilityStatus === right.stabilityStatus &&
    left.fetchedAt === right.fetchedAt &&
    arraysEqual(left.syncRunIds, right.syncRunIds)
  );
}

function trendsShareSnapshot(
  accountTrend: FixtureSubjectTrend,
  objectTrend: FixtureAdObjectTrend
): boolean {
  return (
    accountsEqual(accountTrend.account, objectTrend.account) &&
    accountTrend.requestedRange.dateStart ===
      objectTrend.requestedRange.dateStart &&
    accountTrend.requestedRange.dateStop ===
      objectTrend.requestedRange.dateStop &&
    contextsEqual(accountTrend.context, objectTrend.context) &&
    accountTrend.items.length === objectTrend.items.length &&
    accountTrend.items.every(
      (item, index) => item.date === objectTrend.items[index]?.date
    )
  );
}

function metricRollupMatches(
  parentValue: number | null,
  childValues: readonly (number | null)[]
): boolean {
  if (parentValue === null) {
    return childValues.every((value) => value === null);
  }
  if (childValues.some((value) => value === null)) {
    return false;
  }

  let total = 0;
  for (const value of childValues) {
    if (value === null) {
      return false;
    }
    total += value;
    if (!Number.isSafeInteger(total)) {
      return false;
    }
  }
  return total === parentValue;
}

function dailyRollupMatches(
  parent: FixtureSubjectTrend,
  children: readonly FixtureAdObjectTrend[]
): boolean {
  return (
    children.length > 0 &&
    parent.items.every((parentItem, dayIndex) =>
      ADDITIVE_METRIC_KEYS.every((metric) =>
        metricRollupMatches(
          parentItem.totals[metric],
          children.map(
            (child) => child.items[dayIndex]?.totals[metric] ?? null
          )
        )
      )
    )
  );
}

function check(
  code: OfflineDataQualityCheckCode,
  unit: OfflineDataQualityCheckUnit,
  checkedUnits: number
): OfflineDataQualityCheck {
  return { code, status: "PASS", unit, checkedUnits, failedUnits: 0 };
}

export function buildFixtureDataQualityReport(
  accountTrend: FixtureSubjectTrend,
  objects: readonly FixtureAdObject[],
  objectTrends: readonly FixtureAdObjectTrend[]
): OfflineDataQualityReportResult {
  const orderedObjects = [...objects].sort((left, right) =>
    left.id.localeCompare(right.id)
  );
  const objectIds = orderedObjects.map((object) => object.id);
  const externalRefs = orderedObjects.map((object) => object.externalObjectRef);
  if (
    orderedObjects.length === 0 ||
    objectTrends.length !== orderedObjects.length ||
    new Set(objectIds).size !== objectIds.length ||
    new Set(externalRefs).size !== externalRefs.length
  ) {
    return { kind: "incompatible_hierarchy" };
  }

  const objectsById = new Map(
    orderedObjects.map((object) => [object.id, object])
  );
  const trendsByObjectId = new Map<string, FixtureAdObjectTrend>();
  for (const trend of objectTrends) {
    const object = objectsById.get(trend.object.id);
    if (
      object === undefined ||
      trendsByObjectId.has(trend.object.id) ||
      !objectsEqual(object, trend.object)
    ) {
      return { kind: "incompatible_hierarchy" };
    }
    trendsByObjectId.set(trend.object.id, trend);
  }

  const campaigns = orderedObjects.filter(
    (object) => object.objectLevel === "CAMPAIGN"
  );
  const adSets = orderedObjects.filter(
    (object) => object.objectLevel === "AD_SET"
  );
  const ads = orderedObjects.filter((object) => object.objectLevel === "AD");
  if (
    campaigns.length === 0 ||
    adSets.length === 0 ||
    ads.length === 0 ||
    campaigns.some((object) => object.parentObjectId !== null) ||
    adSets.some(
      (object) =>
        object.parentObjectId === null ||
        objectsById.get(object.parentObjectId)?.objectLevel !== "CAMPAIGN"
    ) ||
    ads.some(
      (object) =>
        object.parentObjectId === null ||
        objectsById.get(object.parentObjectId)?.objectLevel !== "AD_SET"
    )
  ) {
    return { kind: "incompatible_hierarchy" };
  }

  const orderedTrends = orderedObjects.map((object) =>
    trendsByObjectId.get(object.id)
  );
  if (orderedTrends.some((trend) => trend === undefined)) {
    return { kind: "incompatible_hierarchy" };
  }
  const completeTrends = orderedTrends.filter(
    (trend): trend is FixtureAdObjectTrend => trend !== undefined
  );
  if (
    completeTrends.some(
      (trend) => !trendsShareSnapshot(accountTrend, trend)
    )
  ) {
    return { kind: "incompatible_context" };
  }

  const trendFor = (object: FixtureAdObject): FixtureAdObjectTrend => {
    const trend = trendsByObjectId.get(object.id);
    if (trend === undefined) {
      throw new Error("Validated fixture trend is missing");
    }
    return trend;
  };
  const campaignTrends = campaigns.map(trendFor);
  if (!dailyRollupMatches(accountTrend, campaignTrends)) {
    return { kind: "incompatible_rollup" };
  }

  for (const campaign of campaigns) {
    const children = adSets
      .filter((object) => object.parentObjectId === campaign.id)
      .map(trendFor);
    if (!dailyRollupMatches(trendFor(campaign), children)) {
      return children.length === 0
        ? { kind: "incompatible_hierarchy" }
        : { kind: "incompatible_rollup" };
    }
  }
  for (const adSet of adSets) {
    const children = ads
      .filter((object) => object.parentObjectId === adSet.id)
      .map(trendFor);
    if (!dailyRollupMatches(trendFor(adSet), children)) {
      return children.length === 0
        ? { kind: "incompatible_hierarchy" }
        : { kind: "incompatible_rollup" };
    }
  }

  const pointCount = accountTrend.items.length;
  const subjectCount = orderedObjects.length + 1;
  const rowCount = subjectCount * pointCount;
  const checks: OfflineDataQualityCheck[] = [
    check("PRIMARY_GRAIN_UNIQUE", "ROWS", rowCount),
    check("DAILY_COVERAGE_COMPLETE", "SUBJECT_DAYS", rowCount),
    check("REPORTING_CONTEXT_CONSISTENT", "ROWS", rowCount),
    check("OBJECT_HIERARCHY_COMPLETE", "OBJECTS", orderedObjects.length),
    check("ACCOUNT_TO_CAMPAIGN_DAILY_ROLLUP", "PARENT_DAYS", pointCount),
    check(
      "CAMPAIGN_TO_AD_SET_DAILY_ROLLUP",
      "PARENT_DAYS",
      campaigns.length * pointCount
    ),
    check(
      "AD_SET_TO_AD_DAILY_ROLLUP",
      "PARENT_DAYS",
      adSets.length * pointCount
    )
  ];

  return {
    kind: "ok",
    report: {
      account: accountTrend.account,
      requestedRange: accountTrend.requestedRange,
      dataset: {
        grain: "SUBJECT_DAY",
        subjectCount,
        observedRows: rowCount,
        expectedRows: rowCount
      },
      hierarchy: {
        campaigns: campaigns.length,
        adSets: adSets.length,
        ads: ads.length,
        objectCount: orderedObjects.length,
        objectIds
      },
      checks,
      context: accountTrend.context
    }
  };
}
