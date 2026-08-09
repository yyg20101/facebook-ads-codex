import { describe, expect, it } from "vitest";

import {
  compareMetricSets,
  compareMetricValues,
  diagnosePeriodChange
} from "../src/comparison";
import { deriveMetrics, type MetricTotals } from "../src/metrics";

describe("offline period comparison", () => {
  it("preserves direction while refusing a relative change from zero", () => {
    expect(compareMetricValues(0, 10)).toEqual({
      baseline: 0,
      current: 10,
      absoluteChange: 10,
      relativeChange: null,
      direction: "INCREASED",
      relativeChangeUnavailableReason: "BASELINE_ZERO"
    });
  });

  it("marks missing values as not comparable", () => {
    expect(compareMetricValues(null, 10)).toEqual({
      baseline: null,
      current: 10,
      absoluteChange: null,
      relativeChange: null,
      direction: "NOT_COMPARABLE",
      relativeChangeUnavailableReason: "MISSING_VALUE"
    });
  });

  it("emits deterministic warning patterns without causal claims", () => {
    const baseline: MetricTotals = {
      spendMinorUnits: 10_000,
      impressions: 8_000,
      clicks: 160,
      conversions: 4
    };
    const current: MetricTotals = {
      spendMinorUnits: 15_000,
      impressions: 10_000,
      clicks: 300,
      conversions: 0
    };
    const changes = compareMetricSets(
      baseline,
      deriveMetrics(baseline),
      current,
      deriveMetrics(current)
    );
    const diagnostics = diagnosePeriodChange(current, changes);

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "SPEND_WITH_ZERO_CONVERSIONS",
      "SPEND_UP_CONVERSIONS_DOWN",
      "CLICKS_UP_CONVERSIONS_NOT_UP",
      "CTR_UP_CONVERSION_RATE_DOWN"
    ]);
    expect(diagnostics.every((diagnostic) => !diagnostic.causalClaim)).toBe(
      true
    );
  });

  it("recognizes higher conversion volume with lower reported cost", () => {
    const baseline: MetricTotals = {
      spendMinorUnits: 10_000,
      impressions: 8_000,
      clicks: 160,
      conversions: 4
    };
    const current: MetricTotals = {
      spendMinorUnits: 12_345,
      impressions: 10_000,
      clicks: 250,
      conversions: 7
    };
    const changes = compareMetricSets(
      baseline,
      deriveMetrics(baseline),
      current,
      deriveMetrics(current)
    );

    expect(diagnosePeriodChange(current, changes)).toMatchObject([
      {
        code: "CONVERSION_VOLUME_UP_COST_DOWN",
        severity: "INFO",
        findingConfidence: "CONFIRMED_PATTERN",
        causalClaim: false
      }
    ]);
  });
});
