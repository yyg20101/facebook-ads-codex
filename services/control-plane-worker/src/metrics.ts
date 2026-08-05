export interface MetricTotals {
  spendMinorUnits: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
}

export interface DerivedMetrics {
  clickThroughRate: number | null;
  costPerClickMinorUnits: number | null;
  costPerThousandImpressionsMinorUnits: number | null;
  costPerConversionMinorUnits: number | null;
}

function scaledRatio(
  numerator: number | null,
  denominator: number | null,
  scale = 1
): number | null {
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }

  return Math.round((numerator / denominator) * scale * 1_000_000) / 1_000_000;
}

export function deriveMetrics(totals: MetricTotals): DerivedMetrics {
  return {
    clickThroughRate: scaledRatio(totals.clicks, totals.impressions),
    costPerClickMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.clicks
    ),
    costPerThousandImpressionsMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.impressions,
      1000
    ),
    costPerConversionMinorUnits: scaledRatio(
      totals.spendMinorUnits,
      totals.conversions
    )
  };
}
