import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { View, Text } from "react-native";
import { useState } from "react";
import { formatCurrency } from "../lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Dataset {
  data: number[]; // exactly 12 values, index 0 = January
  color: string; // hex color for the line
  label: string; // legend label
}

export interface Props {
  datasets: Dataset[];
  height?: number; // default 180
  showZeroLine?: boolean; // draw a dashed zero-line if data crosses zero
  currency?: string; // ISO 4217 code, default "USD"
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PADDING = { top: 16, right: 12, bottom: 28, left: 52 } as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a smooth cubic-bezier SVG path string through an array of {x,y} points. */
function buildCurvePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const cp1x = points[i].x + dx * 0.4;
    const cp1y = points[i].y;
    const cp2x = points[i + 1].x - dx * 0.4;
    const cp2y = points[i + 1].y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  return d;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LineChart({
  datasets,
  height = 180,
  showZeroLine = false,
  currency = "USD",
}: Props) {
  const [width, setWidth] = useState(300);

  // Derived chart-area dimensions
  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  // Global value bounds across every dataset
  const allValues = datasets.flatMap((d) => d.data);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;
  const range = maxVal === minVal ? 1 : maxVal - minVal;

  // Coordinate transforms
  const toX = (index: number) => PADDING.left + (index / 11) * chartWidth;

  const toY = (value: number) =>
    PADDING.top + ((maxVal - value) / range) * chartHeight;

  // Baseline: y position of zero, clamped inside the chart area
  const baselineY = Math.min(
    Math.max(toY(0), PADDING.top),
    PADDING.top + chartHeight,
  );

  // Only draw the zero-line when at least one value is negative
  const hasNegative = allValues.some((v) => v < 0);

  // ── Path builders ──────────────────────────────────────────────────────────

  function getPoints(data: number[]) {
    return data.map((v, i) => ({ x: toX(i), y: toY(v) }));
  }

  function buildLinePath(data: number[]): string {
    return buildCurvePath(getPoints(data));
  }

  function buildFillPath(data: number[]): string {
    const points = getPoints(data);
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    // Start with the same curve, then close at the baseline
    return (
      buildCurvePath(points) +
      ` L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View
      className="w-full"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Svg width={width} height={height}>
        {/* ── Gradient definitions (one per dataset) ── */}
        <Defs>
          {datasets.map((dataset, di) => (
            <LinearGradient
              key={`grad-${di}`}
              id={`grad-${di}`}
              x1={PADDING.left}
              y1={PADDING.top}
              x2={PADDING.left}
              y2={PADDING.top + chartHeight}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={dataset.color} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={dataset.color} stopOpacity="0" />
            </LinearGradient>
          ))}
        </Defs>

        {/* ── Y-axis: max label (top) ── */}
        <SvgText
          x={PADDING.left - 4}
          y={PADDING.top + 9}
          textAnchor="end"
          fontSize={9}
          fill="#9ca3af"
        >
          {formatCurrency(maxVal, currency, { compact: true, decimals: false })}
        </SvgText>

        {/* ── Y-axis: min label (bottom) ── */}
        <SvgText
          x={PADDING.left - 4}
          y={PADDING.top + chartHeight}
          textAnchor="end"
          fontSize={9}
          fill="#9ca3af"
        >
          {formatCurrency(minVal, currency, { compact: true, decimals: false })}
        </SvgText>

        {/* ── Optional dashed zero-line ── */}
        {showZeroLine && hasNegative && (
          <Line
            x1={PADDING.left}
            y1={baselineY}
            x2={PADDING.left + chartWidth}
            y2={baselineY}
            stroke="#9ca3af"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* ── X-axis month labels ── */}
        {MONTHS.map((month, i) => (
          <SvgText
            key={month}
            x={toX(i)}
            y={height - 6}
            textAnchor="middle"
            fontSize={8}
            fill="#9ca3af"
          >
            {month}
          </SvgText>
        ))}

        {/* ── Gradient fill areas (rendered first, behind lines) ── */}
        {datasets.map((dataset, di) => (
          <Path
            key={`fill-${di}`}
            d={buildFillPath(dataset.data)}
            fill={`url(#grad-${di})`}
          />
        ))}

        {/* ── Smooth bezier lines ── */}
        {datasets.map((dataset, di) => (
          <Path
            key={`line-${di}`}
            d={buildLinePath(dataset.data)}
            stroke={dataset.color}
            strokeWidth={2}
            fill="none"
          />
        ))}

        {/* ── Data-point dots ── */}
        {datasets.map((dataset, di) =>
          dataset.data.map((value, i) => (
            <Circle
              key={`dot-${di}-${i}`}
              cx={toX(i)}
              cy={toY(value)}
              r={3}
              fill={dataset.color}
            />
          )),
        )}
      </Svg>

      {/* ── Legend ── */}
      <View
        className="flex-row flex-wrap justify-center mt-2"
        style={{ gap: 12 }}
      >
        {datasets.map((dataset, di) => (
          <View
            key={`legend-${di}`}
            className="flex-row items-center"
            style={{ gap: 6 }}
          >
            {/* Colored line swatch */}
            <View
              style={{
                width: 16,
                height: 2,
                backgroundColor: dataset.color,
                borderRadius: 1,
              }}
            />
            <Text style={{ fontSize: 11, color: "#6b7280" }}>
              {dataset.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
