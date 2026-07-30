import type { TrendPoint } from "../../types";

interface TrendChartProps {
  data: TrendPoint[];
  annotation?: {
    date: string;
    label: string;
  };
  compact?: boolean;
}

const colors = {
  spend: "#075df5",
  purchases: "#099268",
  roas: "#6d3fe0",
};

const width = 760;
const height = 244;
const padding = { top: 24, right: 28, bottom: 34, left: 44 };

function linePath(values: number[], max: number) {
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  return values
    .map((value, index) => {
      const x =
        padding.left +
        (index / Math.max(values.length - 1, 1)) * usableWidth;
      const y = padding.top + (1 - value / max) * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function pointAt(values: number[], index: number, max: number) {
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  return {
    x:
      padding.left +
      (index / Math.max(values.length - 1, 1)) * usableWidth,
    y: padding.top + (1 - values[index] / max) * usableHeight,
  };
}

export function TrendChart({
  data,
  annotation,
  compact = false,
}: TrendChartProps) {
  const spend = data.map((point) => point.spend);
  const purchases = data.map((point) => point.purchases);
  const roas = data.map((point) => point.roas);
  const annotationIndex = annotation
    ? data.findIndex((point) => point.date === annotation.date)
    : -1;
  const annotationPoint =
    annotationIndex >= 0
      ? pointAt(spend, annotationIndex, Math.max(...spend) * 1.12)
      : null;

  return (
    <div className={`trend-chart ${compact ? "trend-chart--compact" : ""}`}>
      <div className="trend-chart__legend" aria-hidden="true">
        <span>
          <i style={{ background: colors.spend }} />消耗
        </span>
        <span>
          <i style={{ background: colors.purchases }} />购买
        </span>
        <span>
          <i style={{ background: colors.roas }} />ROAS
        </span>
      </div>
      <svg
        aria-label="最近七天消耗、购买和 ROAS 趋势图"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="spendArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colors.spend} stopOpacity="0.14" />
            <stop offset="100%" stopColor={colors.spend} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((line) => {
          const y =
            padding.top +
            (line / 4) * (height - padding.top - padding.bottom);
          return (
            <g key={line}>
              <line
                className="trend-chart__grid"
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
              />
              <text className="trend-chart__axis" x={6} y={y + 4}>
                {Math.round((4 - line) * 2000).toLocaleString("zh-CN")}
              </text>
            </g>
          );
        })}
        <path
          className="trend-chart__area"
          d={`${linePath(spend, Math.max(...spend) * 1.12)} L ${
            width - padding.right
          } ${height - padding.bottom} L ${padding.left} ${
            height - padding.bottom
          } Z`}
          fill="url(#spendArea)"
        />
        <path
          d={linePath(spend, Math.max(...spend) * 1.12)}
          fill="none"
          stroke={colors.spend}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.6"
        />
        <path
          d={linePath(purchases, Math.max(...purchases) * 1.22)}
          fill="none"
          stroke={colors.purchases}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />
        <path
          d={linePath(roas, 4)}
          fill="none"
          stroke={colors.roas}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />
        {data.map((point, index) => {
          const spendPoint = pointAt(
            spend,
            index,
            Math.max(...spend) * 1.12,
          );
          const purchasePoint = pointAt(
            purchases,
            index,
            Math.max(...purchases) * 1.22,
          );
          const roasPoint = pointAt(roas, index, 4);

          return (
            <g key={point.date}>
              <circle
                cx={spendPoint.x}
                cy={spendPoint.y}
                fill={colors.spend}
                r="4"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={purchasePoint.x}
                cy={purchasePoint.y}
                fill={colors.purchases}
                r="3.5"
                stroke="white"
                strokeWidth="1.8"
              />
              <circle
                cx={roasPoint.x}
                cy={roasPoint.y}
                fill={colors.roas}
                r="3.5"
                stroke="white"
                strokeWidth="1.8"
              />
              <text
                className="trend-chart__axis trend-chart__axis--date"
                textAnchor="middle"
                x={spendPoint.x}
                y={height - 10}
              >
                {point.date}
              </text>
            </g>
          );
        })}
        {annotationPoint && annotation ? (
          <g>
            <line
              className="trend-chart__annotation-line"
              x1={annotationPoint.x}
              x2={annotationPoint.x}
              y1={padding.top}
              y2={height - padding.bottom}
            />
            <circle
              cx={annotationPoint.x}
              cy={annotationPoint.y}
              fill="#ffffff"
              r="6"
              stroke="#e13b3b"
              strokeWidth="3"
            />
            <rect
              fill="#fff1f1"
              height="25"
              rx="6"
              stroke="#e13b3b"
              width="112"
              x={Math.min(annotationPoint.x - 56, width - 142)}
              y={2}
            />
            <text
              className="trend-chart__annotation-text"
              textAnchor="middle"
              x={Math.min(annotationPoint.x, width - 86)}
              y={19}
            >
              {annotation.label}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
