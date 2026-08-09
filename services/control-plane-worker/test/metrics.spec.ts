import { describe, expect, it } from "vitest";

import { deriveMetrics } from "../src/metrics";

describe("offline metric derivation", () => {
  it("derives bounded rates from compatible totals", () => {
    expect(
      deriveMetrics({
        spendMinorUnits: 33345,
        impressions: 27000,
        clicks: 608,
        conversions: 16
      })
    ).toEqual({
      clickThroughRate: 0.022519,
      conversionRate: 0.026316,
      costPerClickMinorUnits: 54.84375,
      costPerThousandImpressionsMinorUnits: 1235,
      costPerConversionMinorUnits: 2084.0625
    });
  });

  it("returns null for missing values and zero denominators", () => {
    expect(
      deriveMetrics({
        spendMinorUnits: 0,
        impressions: 0,
        clicks: 0,
        conversions: null
      })
    ).toEqual({
      clickThroughRate: null,
      conversionRate: null,
      costPerClickMinorUnits: null,
      costPerThousandImpressionsMinorUnits: null,
      costPerConversionMinorUnits: null
    });
  });
});
