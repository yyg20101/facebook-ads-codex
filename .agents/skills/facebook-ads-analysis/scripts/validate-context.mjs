import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const INPUT_SCHEMA_VERSION =
  "facebook-ads-offline-analysis-context/v2";
export const PREFLIGHT_SCHEMA_VERSION =
  "facebook-ads-offline-analysis-preflight/v1";

const TOP_LEVEL_KEYS = [
  "schema_version",
  "artifact_type",
  "source_kind",
  "analysis_kind",
  "scope_and_freshness",
  "quality_evidence",
  "fact_evidence",
  "observed_patterns",
  "driver_inputs",
  "unknowns",
  "guardrails",
  "codex_handoff",
  "warnings",
];
const ANALYSIS_KINDS = new Set([
  "ACCOUNT_COMPARISON",
  "OBJECT_COMPARISON",
  "DIRECT_CHILD_BREAKDOWN",
  "OBJECT_DAILY_TREND",
  "DIRECT_CHILD_DAILY_TREND",
]);
const TOTAL_KEYS = [
  "spendMinorUnits",
  "impressions",
  "clicks",
  "conversions",
];
const DERIVED_KEYS = [
  "clickThroughRate",
  "conversionRate",
  "costPerClickMinorUnits",
  "costPerThousandImpressionsMinorUnits",
  "costPerConversionMinorUnits",
];
const TREND_METRIC_KEYS = [...TOTAL_KEYS, ...DERIVED_KEYS];
const UNKNOWN_STATEMENTS = new Map([
  ["CAUSAL_DRIVERS_NOT_ESTABLISHED", "离线周期差异不构成因果解释。"],
  ["BUSINESS_THRESHOLDS_NOT_DEFINED", "fixture 不定义业务目标、赢家规则或优化阈值。"],
  ["REAL_ACCOUNT_NOT_CONNECTED", "当前上下文未连接或验证任何真实广告账户。"],
  ["EXTERNAL_CONVERSION_DATA_NOT_INCLUDED", "当前上下文不包含站外、CRM 或其他客户转化数据。"],
]);
const DIAGNOSTIC_CATALOG = {
  SPEND_WITH_ZERO_CONVERSIONS: {
    severity: "WARNING",
    summary: "The current period has reported spend and zero reported conversions.",
    evidencePaths: [
      "current.totals.spendMinorUnits",
      "current.totals.conversions",
    ],
  },
  SPEND_UP_CONVERSIONS_DOWN: {
    severity: "WARNING",
    summary: "Reported spend increased while reported conversions decreased.",
    evidencePaths: [
      "changes.totals.spendMinorUnits",
      "changes.totals.conversions",
    ],
  },
  CLICKS_UP_CONVERSIONS_NOT_UP: {
    severity: "WATCH",
    summary: "Reported clicks increased without an increase in reported conversions.",
    evidencePaths: [
      "changes.totals.clicks",
      "changes.totals.conversions",
    ],
  },
  CTR_UP_CONVERSION_RATE_DOWN: {
    severity: "WATCH",
    summary: "Click-through rate increased while reported conversion rate decreased.",
    evidencePaths: [
      "changes.derived.clickThroughRate",
      "changes.derived.conversionRate",
    ],
  },
  CONVERSION_VOLUME_UP_COST_DOWN: {
    severity: "INFO",
    summary: "Reported conversions increased while reported cost per conversion decreased.",
    evidencePaths: [
      "changes.totals.conversions",
      "changes.derived.costPerConversionMinorUnits",
    ],
  },
};
const SENSITIVE_KEYS = new Set([
  "authorization",
  "authorizationheader",
  "accesstoken",
  "refreshtoken",
  "clientsecret",
  "token",
  "secret",
  "password",
  "requestid",
  "cookie",
]);
const REQUIRED_WARNINGS = ["FIXTURE_DATA_ONLY", "NO_EXTERNAL_CONNECTION"];
const REQUIRED_LABELS = ["FACT", "INFERENCE", "UNKNOWN"];
const REQUIRED_PROHIBITED_USES = [
  "CLAIM_REAL_DATA",
  "CLAIM_CAUSALITY",
  "EXECUTE_AD_WRITE",
  "INVENT_BUSINESS_THRESHOLDS",
];

export class InvalidOfflineAnalysisContext extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "InvalidOfflineAnalysisContext";
    this.code = "INVALID_OFFLINE_ANALYSIS_CONTEXT";
    this.path = path;
  }
}

function fail(path, reason) {
  throw new InvalidOfflineAnalysisContext(path, reason);
}

function asRecord(value, path) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "必须是 object");
  }
  return value;
}

function exactRecord(value, keys, path) {
  const record = asRecord(value, path);
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    fail(path, `字段必须且只能是 ${keys.join(", ")}`);
  }
  return record;
}

function expectLiteral(value, expected, path) {
  if (value !== expected) {
    fail(path, `必须为 ${JSON.stringify(expected)}`);
  }
}

function expectString(value, path, { fixture = false, max = 200 } = {}) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > max ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    fail(path, "必须是非空且不含控制字符的短字符串");
  }
  if (fixture && !value.toLowerCase().includes("fixture")) {
    fail(path, "必须是明确的 fixture 引用");
  }
  return value;
}

function expectArray(value, path) {
  if (!Array.isArray(value)) {
    fail(path, "必须是 array");
  }
  return value;
}

function expectExactStringArray(value, expected, path) {
  const items = expectArray(value, path);
  if (
    items.length !== expected.length ||
    items.some((item, index) => item !== expected[index])
  ) {
    fail(path, `必须按固定顺序包含 ${expected.join(", ")}`);
  }
}

function expectFiniteOrNull(value, path, { integer = false } = {}) {
  if (value === null) {
    return;
  }
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    (integer && !Number.isSafeInteger(value))
  ) {
    fail(path, integer ? "必须是非负安全整数或 null" : "必须是非负有限数或 null");
  }
}

function expectIsoDate(value, path) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(path, "必须使用 YYYY-MM-DD");
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  ) {
    fail(path, "不是有效日期");
  }
  return timestamp;
}

function expectTimestampOrNull(value, path) {
  if (value === null) {
    return;
  }
  expectTimestamp(value, path);
}

function expectTimestamp(value, path) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    fail(path, "必须是 ISO timestamp");
  }
}

function expectDateRange(value, path, startKey = "dateStart", stopKey = "dateStop") {
  const record = exactRecord(value, [startKey, stopKey], path);
  const start = expectIsoDate(record[startKey], `${path}.${startKey}`);
  const stop = expectIsoDate(record[stopKey], `${path}.${stopKey}`);
  if (start > stop) {
    fail(path, "开始日期不得晚于结束日期");
  }
  return { start, stop, startValue: record[startKey], stopValue: record[stopKey] };
}

function inclusiveDates(startValue, stopValue) {
  const start = Date.parse(`${startValue}T00:00:00Z`);
  const stop = Date.parse(`${stopValue}T00:00:00Z`);
  const result = [];
  for (let value = start; value <= stop; value += 86_400_000) {
    result.push(new Date(value).toISOString().slice(0, 10));
  }
  return result;
}

function approximatelyEqual(actual, expected) {
  if (actual === null || expected === null) {
    return actual === expected;
  }
  return Math.abs(actual - expected) <= 0.000001;
}

function scaledRatio(numerator, denominator, scale = 1) {
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }
  return Math.round((numerator / denominator) * scale * 1_000_000) / 1_000_000;
}

function deriveMetrics(totals) {
  return {
    clickThroughRate: scaledRatio(totals.clicks, totals.impressions),
    conversionRate: scaledRatio(totals.conversions, totals.clicks),
    costPerClickMinorUnits: scaledRatio(totals.spendMinorUnits, totals.clicks),
    costPerThousandImpressionsMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.impressions,
      1_000,
    ),
    costPerConversionMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.conversions,
    ),
  };
}

function validateTotals(value, path) {
  const totals = exactRecord(value, TOTAL_KEYS, path);
  for (const key of TOTAL_KEYS) {
    expectFiniteOrNull(totals[key], `${path}.${key}`, { integer: true });
  }
  return totals;
}

function validateDerived(value, totals, path) {
  const derived = exactRecord(value, DERIVED_KEYS, path);
  const expected = deriveMetrics(totals);
  for (const key of DERIVED_KEYS) {
    expectFiniteOrNull(derived[key], `${path}.${key}`);
    if (!approximatelyEqual(derived[key], expected[key])) {
      fail(`${path}.${key}`, "与原始指标重新计算结果不一致");
    }
  }
  return derived;
}

function validateObjectReference(value, path) {
  const object = exactRecord(
    value,
    ["display_label", "level", "object_ref"],
    path,
  );
  const label = expectString(object.display_label, `${path}.display_label`);
  if (!/fixture|虚构/i.test(label)) {
    fail(`${path}.display_label`, "必须明确标记为 fixture 或虚构对象");
  }
  if (!new Set(["CAMPAIGN", "AD_SET", "AD"]).has(object.level)) {
    fail(`${path}.level`, "必须是 CAMPAIGN、AD_SET 或 AD");
  }
  expectString(object.object_ref, `${path}.object_ref`, { fixture: true });
  return object;
}

function validateMetricContext(value, path) {
  const context = exactRecord(
    value,
    [
      "currency",
      "timezoneName",
      "clickMetricKind",
      "conversionEventRef",
      "attributionSpecHash",
      "apiVersion",
    ],
    path,
  );
  if (typeof context.currency !== "string" || !/^[A-Z]{3}$/.test(context.currency)) {
    fail(`${path}.currency`, "必须是三位大写币种代码");
  }
  expectString(context.timezoneName, `${path}.timezoneName`);
  if (!new Set(["ALL_CLICKS", "LINK_CLICKS"]).has(context.clickMetricKind)) {
    fail(`${path}.clickMetricKind`, "必须是 ALL_CLICKS 或 LINK_CLICKS");
  }
  expectString(context.conversionEventRef, `${path}.conversionEventRef`, {
    fixture: true,
  });
  expectString(context.attributionSpecHash, `${path}.attributionSpecHash`, {
    fixture: true,
  });
  if (typeof context.apiVersion !== "string" || !/^v\d+\.\d+$/.test(context.apiVersion)) {
    fail(`${path}.apiVersion`, "必须使用 vN.N 格式");
  }
  return context;
}

function validateSnapshot(value, path, qualitySnapshot) {
  const snapshot = exactRecord(
    value,
    ["stabilityStatus", "fetchedAt", "syncRunIds"],
    path,
  );
  if (!new Set(["PROVISIONAL", "RECONCILING", "STABLE"]).has(snapshot.stabilityStatus)) {
    fail(`${path}.stabilityStatus`, "不是支持的稳定状态");
  }
  expectTimestamp(snapshot.fetchedAt, `${path}.fetchedAt`);
  const syncRunIds = expectArray(snapshot.syncRunIds, `${path}.syncRunIds`);
  if (syncRunIds.length === 0 || new Set(syncRunIds).size !== syncRunIds.length) {
    fail(`${path}.syncRunIds`, "必须是非空且唯一的同步批次数组");
  }
  syncRunIds.forEach((item, index) =>
    expectString(item, `${path}.syncRunIds[${index}]`, { fixture: true }),
  );
  if (
    qualitySnapshot &&
    (snapshot.stabilityStatus !== qualitySnapshot.stability_status ||
      snapshot.fetchedAt !== qualitySnapshot.fetched_at ||
      JSON.stringify(syncRunIds) !== JSON.stringify(qualitySnapshot.sync_run_ids))
  ) {
    fail(path, "与 quality_evidence.snapshot 不一致");
  }
  return snapshot;
}

function validatePeriod(value, path, qualitySnapshot, withSnapshot) {
  const keys = ["requestedRange", "actualRange", "coverage", "totals", "derived"];
  if (withSnapshot) {
    keys.push("snapshot");
  }
  const period = exactRecord(value, keys, path);
  const requested = expectDateRange(period.requestedRange, `${path}.requestedRange`);
  const actual = expectDateRange(period.actualRange, `${path}.actualRange`);
  if (
    requested.startValue !== actual.startValue ||
    requested.stopValue !== actual.stopValue
  ) {
    fail(path, "requestedRange 与 actualRange 必须完全一致");
  }
  const coverage = exactRecord(
    period.coverage,
    ["expectedDays", "observedDays", "complete"],
    `${path}.coverage`,
  );
  const expectedDays = inclusiveDates(requested.startValue, requested.stopValue).length;
  if (
    !Number.isSafeInteger(coverage.expectedDays) ||
    coverage.expectedDays !== expectedDays ||
    coverage.observedDays !== expectedDays ||
    coverage.complete !== true
  ) {
    fail(`${path}.coverage`, "周期必须完整覆盖请求日期");
  }
  const totals = validateTotals(period.totals, `${path}.totals`);
  validateDerived(period.derived, totals, `${path}.derived`);
  if (withSnapshot) {
    validateSnapshot(period.snapshot, `${path}.snapshot`, qualitySnapshot);
  }
  return period;
}

function expectedChange(baseline, current) {
  if (baseline === null || current === null) {
    return {
      absoluteChange: null,
      relativeChange: null,
      direction: "NOT_COMPARABLE",
      reason: "MISSING_VALUE",
    };
  }
  const absoluteChange = current - baseline;
  return {
    absoluteChange,
    relativeChange: baseline === 0 ? null : absoluteChange / baseline,
    direction:
      current === baseline
        ? "UNCHANGED"
        : current > baseline
          ? "INCREASED"
          : "DECREASED",
    reason: baseline === 0 ? "BASELINE_ZERO" : null,
  };
}

function validateMetricChange(value, path, baseline, current) {
  const change = exactRecord(
    value,
    [
      "baseline",
      "current",
      "absoluteChange",
      "relativeChange",
      "direction",
      "relativeChangeUnavailableReason",
    ],
    path,
  );
  for (const key of ["baseline", "current", "absoluteChange", "relativeChange"]) {
    if (change[key] !== null && (typeof change[key] !== "number" || !Number.isFinite(change[key]))) {
      fail(`${path}.${key}`, "必须是有限数或 null");
    }
  }
  if (!approximatelyEqual(change.baseline, baseline) || !approximatelyEqual(change.current, current)) {
    fail(path, "baseline/current 与周期事实不一致");
  }
  const expected = expectedChange(baseline, current);
  if (
    !approximatelyEqual(change.absoluteChange, expected.absoluteChange) ||
    !approximatelyEqual(change.relativeChange, expected.relativeChange) ||
    change.direction !== expected.direction ||
    change.relativeChangeUnavailableReason !== expected.reason
  ) {
    fail(path, "变化值、方向或不可比较原因不一致");
  }
}

function validateChanges(value, path, baseline, current) {
  const changes = exactRecord(value, ["totals", "derived"], path);
  const totalChanges = exactRecord(changes.totals, TOTAL_KEYS, `${path}.totals`);
  const derivedChanges = exactRecord(
    changes.derived,
    DERIVED_KEYS,
    `${path}.derived`,
  );
  for (const key of TOTAL_KEYS) {
    validateMetricChange(
      totalChanges[key],
      `${path}.totals.${key}`,
      baseline.totals[key],
      current.totals[key],
    );
  }
  for (const key of DERIVED_KEYS) {
    validateMetricChange(
      derivedChanges[key],
      `${path}.derived.${key}`,
      baseline.derived[key],
      current.derived[key],
    );
  }
  return changes;
}

function validateDailyItem(value, path) {
  const item = exactRecord(value, ["date", "totals", "derived"], path);
  expectIsoDate(item.date, `${path}.date`);
  const totals = validateTotals(item.totals, `${path}.totals`);
  validateDerived(item.derived, totals, `${path}.derived`);
  return item;
}

function validateSubject(value, path, analysisKind) {
  if (analysisKind === "ACCOUNT_COMPARISON") {
    const subject = exactRecord(value, ["kind", "object"], path);
    expectLiteral(subject.kind, "ACCOUNT", `${path}.kind`);
    expectLiteral(subject.object, null, `${path}.object`);
    return subject;
  }
  if (analysisKind === "OBJECT_COMPARISON" || analysisKind === "OBJECT_DAILY_TREND") {
    const subject = exactRecord(value, ["kind", "object"], path);
    expectLiteral(subject.kind, "OBJECT", `${path}.kind`);
    validateObjectReference(subject.object, `${path}.object`);
    return subject;
  }
  const subject = exactRecord(value, ["kind", "parent", "child_level"], path);
  expectLiteral(subject.kind, "DIRECT_CHILDREN", `${path}.kind`);
  validateObjectReference(subject.parent, `${path}.parent`);
  if (!new Set(["AD_SET", "AD"]).has(subject.child_level)) {
    fail(`${path}.child_level`, "必须是 AD_SET 或 AD");
  }
  return subject;
}

function validateQuality(value, path) {
  const quality = exactRecord(
    value,
    ["status", "all_checks_required", "attested_range", "covered_object_count", "snapshot"],
    path,
  );
  expectLiteral(quality.status, "PASS", `${path}.status`);
  expectLiteral(quality.all_checks_required, true, `${path}.all_checks_required`);
  const attested = expectDateRange(
    quality.attested_range,
    `${path}.attested_range`,
    "date_start",
    "date_stop",
  );
  if (!Number.isSafeInteger(quality.covered_object_count) || quality.covered_object_count < 0) {
    fail(`${path}.covered_object_count`, "必须是非负安全整数");
  }
  const snapshot = exactRecord(
    quality.snapshot,
    ["stability_status", "fetched_at", "sync_run_ids"],
    `${path}.snapshot`,
  );
  if (!new Set(["PROVISIONAL", "RECONCILING", "STABLE"]).has(snapshot.stability_status)) {
    fail(`${path}.snapshot.stability_status`, "不是支持的稳定状态");
  }
  expectTimestamp(snapshot.fetched_at, `${path}.snapshot.fetched_at`);
  const syncRunIds = expectArray(snapshot.sync_run_ids, `${path}.snapshot.sync_run_ids`);
  if (syncRunIds.length === 0 || new Set(syncRunIds).size !== syncRunIds.length) {
    fail(`${path}.snapshot.sync_run_ids`, "必须是非空且唯一的同步批次数组");
  }
  syncRunIds.forEach((item, index) =>
    expectString(item, `${path}.snapshot.sync_run_ids[${index}]`, { fixture: true }),
  );
  return { quality, attested, snapshot };
}

function ensureRangeAttested(range, attested, path) {
  if (range.start < attested.start || range.stop > attested.stop) {
    fail(path, "日期范围超出 quality_evidence.attested_range");
  }
}

function validateFactEvidence(value, path, analysisKind, quality) {
  const comparison = analysisKind.endsWith("COMPARISON") || analysisKind === "DIRECT_CHILD_BREAKDOWN";
  if (comparison) {
    const fact = exactRecord(value, ["claim_type", "kind", "baseline", "current", "changes"], path);
    expectLiteral(fact.claim_type, "FACT", `${path}.claim_type`);
    expectLiteral(fact.kind, "PERIOD_COMPARISON", `${path}.kind`);
    const baseline = validatePeriod(fact.baseline, `${path}.baseline`, quality.snapshot, true);
    const current = validatePeriod(fact.current, `${path}.current`, quality.snapshot, true);
    const baselineRange = expectDateRange(baseline.actualRange, `${path}.baseline.actualRange`);
    const currentRange = expectDateRange(current.actualRange, `${path}.current.actualRange`);
    ensureRangeAttested(baselineRange, quality.attested, `${path}.baseline.actualRange`);
    ensureRangeAttested(currentRange, quality.attested, `${path}.current.actualRange`);
    if (baselineRange.stop >= currentRange.start) {
      fail(path, "基线与当前周期必须按时间顺序且不重叠");
    }
    validateChanges(fact.changes, `${path}.changes`, baseline, current);
    return fact;
  }

  const fact = exactRecord(
    value,
    ["claim_type", "kind", "requested_range", "point_count", "metric_keys", "daily_items"],
    path,
  );
  expectLiteral(fact.claim_type, "FACT", `${path}.claim_type`);
  expectLiteral(fact.kind, "DAILY_TREND", `${path}.kind`);
  const requested = expectDateRange(fact.requested_range, `${path}.requested_range`);
  ensureRangeAttested(requested, quality.attested, `${path}.requested_range`);
  const expected = inclusiveDates(requested.startValue, requested.stopValue);
  if (expected.length < 3 || expected.length > 31 || fact.point_count !== expected.length) {
    fail(`${path}.point_count`, "必须与 3–31 日连续请求范围一致");
  }
  expectExactStringArray(fact.metric_keys, TREND_METRIC_KEYS, `${path}.metric_keys`);
  const dailyItems = expectArray(fact.daily_items, `${path}.daily_items`);
  if (dailyItems.length !== expected.length) {
    fail(`${path}.daily_items`, "必须完整覆盖请求日期");
  }
  dailyItems.forEach((item, index) => {
    const parsed = validateDailyItem(item, `${path}.daily_items[${index}]`);
    if (parsed.date !== expected[index]) {
      fail(`${path}.daily_items[${index}].date`, "日期必须连续且按升序排列");
    }
  });
  return fact;
}

function expectedPatternCodes(fact) {
  const codes = [];
  if (
    fact.current.totals.spendMinorUnits !== null &&
    fact.current.totals.spendMinorUnits > 0 &&
    fact.current.totals.conversions === 0
  ) {
    codes.push("SPEND_WITH_ZERO_CONVERSIONS");
  }
  if (
    fact.changes.totals.spendMinorUnits.direction === "INCREASED" &&
    fact.changes.totals.conversions.direction === "DECREASED"
  ) {
    codes.push("SPEND_UP_CONVERSIONS_DOWN");
  }
  if (
    fact.changes.totals.clicks.direction === "INCREASED" &&
    new Set(["DECREASED", "UNCHANGED"]).has(
      fact.changes.totals.conversions.direction,
    )
  ) {
    codes.push("CLICKS_UP_CONVERSIONS_NOT_UP");
  }
  if (
    fact.changes.derived.clickThroughRate.direction === "INCREASED" &&
    fact.changes.derived.conversionRate.direction === "DECREASED"
  ) {
    codes.push("CTR_UP_CONVERSION_RATE_DOWN");
  }
  if (
    fact.changes.totals.conversions.direction === "INCREASED" &&
    fact.changes.derived.costPerConversionMinorUnits.direction === "DECREASED"
  ) {
    codes.push("CONVERSION_VOLUME_UP_COST_DOWN");
  }
  return codes;
}

function validateObservedPatterns(value, path, analysisKind, fact) {
  const patterns = expectArray(value, path);
  if ((analysisKind.includes("TREND") || analysisKind === "DIRECT_CHILD_BREAKDOWN") && patterns.length !== 0) {
    fail(path, "该 analysis_kind 不允许预生成 pattern");
  }
  patterns.forEach((item, index) => {
    const patternPath = `${path}[${index}]`;
    const pattern = exactRecord(
      item,
      ["claim_type", "code", "severity", "finding_confidence", "causal_claim", "summary", "evidence_metric_paths"],
      patternPath,
    );
    expectLiteral(pattern.claim_type, "FACT", `${patternPath}.claim_type`);
    const catalogEntry = DIAGNOSTIC_CATALOG[pattern.code];
    if (!catalogEntry) {
      fail(`${patternPath}.code`, "不是固定确定性 pattern code");
    }
    expectLiteral(pattern.severity, catalogEntry.severity, `${patternPath}.severity`);
    expectLiteral(pattern.finding_confidence, "CONFIRMED_PATTERN", `${patternPath}.finding_confidence`);
    expectLiteral(pattern.causal_claim, false, `${patternPath}.causal_claim`);
    expectLiteral(pattern.summary, catalogEntry.summary, `${patternPath}.summary`);
    expectExactStringArray(
      pattern.evidence_metric_paths,
      catalogEntry.evidencePaths,
      `${patternPath}.evidence_metric_paths`,
    );
  });
  if (
    (analysisKind === "ACCOUNT_COMPARISON" || analysisKind === "OBJECT_COMPARISON") &&
    JSON.stringify(patterns.map((pattern) => pattern.code)) !==
      JSON.stringify(expectedPatternCodes(fact))
  ) {
    fail(path, "确定性 pattern 集合与 comparison 事实不一致");
  }
}

function nullableSum(values) {
  return values.some((value) => value === null)
    ? null
    : values.reduce((sum, value) => sum + value, 0);
}

function validateDriverInputs(value, path, analysisKind, fact, subject) {
  const driver = asRecord(value, path);
  const expectedKind =
    analysisKind === "DIRECT_CHILD_BREAKDOWN"
      ? "DIRECT_CHILDREN"
      : analysisKind === "DIRECT_CHILD_DAILY_TREND"
        ? "DIRECT_CHILDREN_DAILY"
        : "NONE";
  if (expectedKind === "NONE") {
    const none = exactRecord(
      driver,
      ["claim_type", "kind", "ordering", "ranking_applied", "reconciliation", "items"],
      path,
    );
    expectLiteral(none.claim_type, "FACT", `${path}.claim_type`);
    expectLiteral(none.kind, "NONE", `${path}.kind`);
    expectLiteral(none.ordering, "NOT_APPLICABLE", `${path}.ordering`);
    expectLiteral(none.ranking_applied, false, `${path}.ranking_applied`);
    expectLiteral(none.reconciliation, null, `${path}.reconciliation`);
    if (!Array.isArray(none.items) || none.items.length !== 0) {
      fail(`${path}.items`, "NONE driver 必须为空");
    }
    return;
  }

  const expanded = exactRecord(
    driver,
    ["claim_type", "kind", "ordering", "ranking_applied", "reconciliation", "items"],
    path,
  );
  expectLiteral(expanded.claim_type, "FACT", `${path}.claim_type`);
  expectLiteral(expanded.kind, expectedKind, `${path}.kind`);
  expectLiteral(expanded.ordering, "STABLE_FIXTURE_OBJECT_ID_ASC", `${path}.ordering`);
  expectLiteral(expanded.ranking_applied, false, `${path}.ranking_applied`);
  const items = expectArray(expanded.items, `${path}.items`);
  if (items.length === 0) {
    fail(`${path}.items`, "direct children 不得为空");
  }
  const objectRefs = new Set();

  if (expectedKind === "DIRECT_CHILDREN") {
    const reconciliation = exactRecord(
      expanded.reconciliation,
      ["additive_metric_keys", "baseline_matches_parent", "current_matches_parent"],
      `${path}.reconciliation`,
    );
    expectExactStringArray(
      reconciliation.additive_metric_keys,
      TOTAL_KEYS,
      `${path}.reconciliation.additive_metric_keys`,
    );
    expectLiteral(reconciliation.baseline_matches_parent, true, `${path}.reconciliation.baseline_matches_parent`);
    expectLiteral(reconciliation.current_matches_parent, true, `${path}.reconciliation.current_matches_parent`);
    const parsedItems = items.map((item, index) => {
      const itemPath = `${path}.items[${index}]`;
      const entry = exactRecord(item, ["claim_type", "object", "baseline", "current", "changes"], itemPath);
      expectLiteral(entry.claim_type, "FACT", `${itemPath}.claim_type`);
      const object = validateObjectReference(entry.object, `${itemPath}.object`);
      if (object.level !== subject.child_level || objectRefs.has(object.object_ref)) {
        fail(`${itemPath}.object`, "子对象层级必须匹配且引用必须唯一");
      }
      objectRefs.add(object.object_ref);
      const baseline = validatePeriod(entry.baseline, `${itemPath}.baseline`, null, false);
      const current = validatePeriod(entry.current, `${itemPath}.current`, null, false);
      validateChanges(entry.changes, `${itemPath}.changes`, baseline, current);
      return { baseline, current };
    });
    for (const key of TOTAL_KEYS) {
      const baselineSum = nullableSum(parsedItems.map((item) => item.baseline.totals[key]));
      const currentSum = nullableSum(parsedItems.map((item) => item.current.totals[key]));
      if (
        !approximatelyEqual(baselineSum, fact.baseline.totals[key]) ||
        !approximatelyEqual(currentSum, fact.current.totals[key])
      ) {
        fail(path, `子对象 ${key} 两期汇总与父对象不一致`);
      }
    }
    return;
  }

  const reconciliation = exactRecord(
    expanded.reconciliation,
    ["additive_metric_keys", "daily_matches_parent"],
    `${path}.reconciliation`,
  );
  expectExactStringArray(
    reconciliation.additive_metric_keys,
    TOTAL_KEYS,
    `${path}.reconciliation.additive_metric_keys`,
  );
  expectLiteral(reconciliation.daily_matches_parent, true, `${path}.reconciliation.daily_matches_parent`);
  const parsedItems = items.map((item, index) => {
    const itemPath = `${path}.items[${index}]`;
    const entry = exactRecord(item, ["claim_type", "object", "daily_items"], itemPath);
    expectLiteral(entry.claim_type, "FACT", `${itemPath}.claim_type`);
    const object = validateObjectReference(entry.object, `${itemPath}.object`);
    if (object.level !== subject.child_level || objectRefs.has(object.object_ref)) {
      fail(`${itemPath}.object`, "子对象层级必须匹配且引用必须唯一");
    }
    objectRefs.add(object.object_ref);
    const dailyItems = expectArray(entry.daily_items, `${itemPath}.daily_items`);
    if (dailyItems.length !== fact.daily_items.length) {
      fail(`${itemPath}.daily_items`, "必须与父对象日期长度一致");
    }
    dailyItems.forEach((dailyItem, dayIndex) => {
      const parsed = validateDailyItem(dailyItem, `${itemPath}.daily_items[${dayIndex}]`);
      if (parsed.date !== fact.daily_items[dayIndex].date) {
        fail(`${itemPath}.daily_items[${dayIndex}].date`, "必须与父对象日期一致");
      }
    });
    return dailyItems;
  });
  fact.daily_items.forEach((parentItem, dayIndex) => {
    for (const key of TOTAL_KEYS) {
      const sum = nullableSum(parsedItems.map((itemsForObject) => itemsForObject[dayIndex].totals[key]));
      if (!approximatelyEqual(sum, parentItem.totals[key])) {
        fail(path, `子对象第 ${dayIndex + 1} 日 ${key} 汇总与父对象不一致`);
      }
    }
  });
}

function validateUnknowns(value, path) {
  const unknowns = expectArray(value, path);
  const seen = new Set();
  unknowns.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    const unknown = exactRecord(item, ["claim_type", "code", "statement"], itemPath);
    expectLiteral(unknown.claim_type, "UNKNOWN", `${itemPath}.claim_type`);
    if (!UNKNOWN_STATEMENTS.has(unknown.code) || seen.has(unknown.code)) {
      fail(`${itemPath}.code`, "必须是唯一的固定 UNKNOWN code");
    }
    seen.add(unknown.code);
    expectLiteral(
      unknown.statement,
      UNKNOWN_STATEMENTS.get(unknown.code),
      `${itemPath}.statement`,
    );
  });
  if (seen.size !== UNKNOWN_STATEMENTS.size) {
    fail(path, "必须保留全部固定 UNKNOWN 项");
  }
}

function validateGuardrails(value, path) {
  const guardrails = exactRecord(
    value,
    [
      "quality_preflight_passed",
      "fixture_data_only",
      "real_data_connected",
      "thresholds_applied",
      "causal_claims",
      "ranking_applied",
      "recommendations_generated",
      "external_write",
      "persisted",
    ],
    path,
  );
  const expected = {
    quality_preflight_passed: true,
    fixture_data_only: true,
    real_data_connected: false,
    thresholds_applied: false,
    causal_claims: false,
    ranking_applied: false,
    recommendations_generated: false,
    external_write: false,
    persisted: false,
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    expectLiteral(guardrails[key], expectedValue, `${path}.${key}`);
  }
}

function validateHandoff(value, path) {
  const handoff = exactRecord(
    value,
    ["intended_skill", "mode", "context_only", "required_claim_labels", "prohibited_uses"],
    path,
  );
  expectLiteral(handoff.intended_skill, "facebook-ads-analysis", `${path}.intended_skill`);
  expectLiteral(handoff.mode, "MANUAL_CONTEXT", `${path}.mode`);
  expectLiteral(handoff.context_only, true, `${path}.context_only`);
  expectExactStringArray(handoff.required_claim_labels, REQUIRED_LABELS, `${path}.required_claim_labels`);
  expectExactStringArray(handoff.prohibited_uses, REQUIRED_PROHIBITED_USES, `${path}.prohibited_uses`);
}

function assertNoSensitiveKeys(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveKeys(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) {
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
    if (SENSITIVE_KEYS.has(normalized)) {
      fail(`${path}.${key}`, "包含禁止的敏感或请求追踪字段");
    }
    assertNoSensitiveKeys(nested, `${path}.${key}`);
  }
}

export function validateOfflineAnalysisContext(value) {
  assertNoSensitiveKeys(value);
  const context = exactRecord(value, TOP_LEVEL_KEYS, "$");
  expectLiteral(context.schema_version, INPUT_SCHEMA_VERSION, "$.schema_version");
  expectLiteral(context.artifact_type, "CODEX_ANALYSIS_INPUT", "$.artifact_type");
  expectLiteral(context.source_kind, "FIXTURE", "$.source_kind");
  if (!ANALYSIS_KINDS.has(context.analysis_kind)) {
    fail("$.analysis_kind", "不是支持的离线 analysis_kind");
  }

  const scope = exactRecord(
    context.scope_and_freshness,
    ["workspace_ref", "account_ref", "subject", "data_through", "metric_context"],
    "$.scope_and_freshness",
  );
  expectString(scope.workspace_ref, "$.scope_and_freshness.workspace_ref", { fixture: true });
  expectString(scope.account_ref, "$.scope_and_freshness.account_ref", { fixture: true });
  const subject = validateSubject(
    scope.subject,
    "$.scope_and_freshness.subject",
    context.analysis_kind,
  );
  expectTimestampOrNull(scope.data_through, "$.scope_and_freshness.data_through");
  validateMetricContext(scope.metric_context, "$.scope_and_freshness.metric_context");

  const quality = validateQuality(context.quality_evidence, "$.quality_evidence");
  const fact = validateFactEvidence(
    context.fact_evidence,
    "$.fact_evidence",
    context.analysis_kind,
    quality,
  );
  validateObservedPatterns(
    context.observed_patterns,
    "$.observed_patterns",
    context.analysis_kind,
    fact,
  );
  validateDriverInputs(
    context.driver_inputs,
    "$.driver_inputs",
    context.analysis_kind,
    fact,
    subject,
  );
  validateUnknowns(context.unknowns, "$.unknowns");
  validateGuardrails(context.guardrails, "$.guardrails");
  validateHandoff(context.codex_handoff, "$.codex_handoff");
  expectExactStringArray(context.warnings, REQUIRED_WARNINGS, "$.warnings");
  return context;
}

export function buildOfflineAnalysisPreflight(value) {
  const context = validateOfflineAnalysisContext(value);
  const facts = [
    {
      claim_type: "FACT",
      code: "FIXTURE_SOURCE_VALIDATED",
      statement: "输入明确为固定 fixture，且未连接外部数据源。",
      evidence_paths: ["source_kind", "guardrails.fixture_data_only", "guardrails.real_data_connected"],
    },
    {
      claim_type: "FACT",
      code: "QUALITY_PREFLIGHT_VALIDATED",
      statement: "输入声明全部质量检查通过，范围和快照结构已复核。",
      evidence_paths: ["quality_evidence.status", "quality_evidence.all_checks_required", "quality_evidence.snapshot"],
    },
  ];
  if (context.fact_evidence.kind === "PERIOD_COMPARISON") {
    facts.push({
      claim_type: "FACT",
      code: "PERIOD_COMPARISON_VALIDATED",
      statement: "基线与当前周期完整、不重叠，变化值与两期事实一致。",
      evidence_paths: ["fact_evidence.baseline", "fact_evidence.current", "fact_evidence.changes"],
    });
  } else {
    facts.push({
      claim_type: "FACT",
      code: "DAILY_TREND_VALIDATED",
      statement: `连续 ${context.fact_evidence.point_count} 日的固定 9 项指标已通过结构和公式复核。`,
      evidence_paths: ["fact_evidence.requested_range", "fact_evidence.metric_keys", "fact_evidence.daily_items"],
    });
  }
  if (context.driver_inputs.kind !== "NONE") {
    facts.push({
      claim_type: "FACT",
      code: "DIRECT_CHILDREN_RECONCILED",
      statement: "直接子对象保持非排名顺序，四项可加指标与父对象对账。",
      evidence_paths: ["driver_inputs.ordering", "driver_inputs.ranking_applied", "driver_inputs.reconciliation"],
    });
  }
  context.observed_patterns.forEach((pattern, index) => {
    facts.push({
      claim_type: "FACT",
      code: pattern.code,
      statement: pattern.summary,
      evidence_paths: pattern.evidence_metric_paths.map(
        (path) => `fact_evidence.${path}`,
      ),
    });
  });
  return {
    schema_version: PREFLIGHT_SCHEMA_VERSION,
    artifact_type: "CODEX_ANALYSIS_PREFLIGHT",
    validation_status: "PASS",
    analysis_kind: context.analysis_kind,
    scope_and_freshness: context.scope_and_freshness,
    facts,
    inference: {
      claim_type: "INFERENCE",
      status: "NOT_GENERATED",
      statement: "确定性校验器不生成解释、排名或建议；由 Skill 在引用 FACT 后形成有限推断。",
    },
    unknowns: context.unknowns,
    guardrails: {
      fixture_data_only: true,
      causal_claims: false,
      ranking_applied: false,
      recommendations_generated: false,
      external_write: false,
      persisted: false,
    },
  };
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || process.argv.length !== 3) {
    process.stderr.write("usage: node validate-context.mjs <context.json|->\n");
    process.exitCode = 2;
    return;
  }
  try {
    const raw = inputPath === "-" ? await readStdin() : await readFile(resolve(inputPath), "utf8");
    if (Buffer.byteLength(raw, "utf8") > 1_000_000) {
      fail("$", "输入超过 1 MB 上限");
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      fail("$", "不是有效 JSON");
    }
    process.stdout.write(`${JSON.stringify(buildOfflineAnalysisPreflight(parsed), null, 2)}\n`);
  } catch (error) {
    if (error instanceof InvalidOfflineAnalysisContext) {
      process.stderr.write(`${error.code} ${error.message}\n`);
      process.exitCode = 2;
      return;
    }
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
