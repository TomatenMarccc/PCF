import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartPoint, PartChartData } from "../types";

const CHART_COLORS = [
  "#007bc0",
  "#18837e",
  "#9e2896",
  "#00884a",
  "#71767c",
  "#4da3d1",
];

interface PcfChartsProps {
  charts: PartChartData;
}

export default function PcfCharts({ charts }: PcfChartsProps) {
  return (
    <section className="pcf-charts" aria-labelledby="pcf-calculation-title">
      <div className="pcf-charts-heading">
        <p className="eyebrow">Calculation analytics</p>
        <h2 id="pcf-calculation-title">Your PCF Calculation</h2>
      </div>

      <div className="chart-grid">
        <WaterfallCard
          title="Top Parts PCF Breakdown"
          points={charts.top_parts}
          totalLabel="BOM-based PCF"
          decimals={2}
        />
        <WaterfallCard
          title="PCF Breakdown"
          points={charts.pcf_breakdown}
          totalLabel="Total PCF"
          decimals={2}
        />
        <MaterialBreakdownCard points={charts.material_breakdown} />
        <WaterfallCard
          title="G2G Dashboard"
          points={charts.g2g_breakdown}
          totalLabel="G2G PCF total"
          decimals={3}
        />
      </div>
    </section>
  );
}

function WaterfallCard({
  title,
  points,
  totalLabel,
  decimals,
}: {
  title: string;
  points: ChartPoint[];
  totalLabel: string;
  decimals: number;
}) {
  const data = createWaterfallData(points, totalLabel);
  const maximum = Math.max(...data.map((point) => point.end), 1);

  return (
    <article className="chart-card">
      <h3>{title}</h3>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 22, right: 12, bottom: 78, left: 10 }}
          >
            <CartesianGrid vertical={false} stroke="rgba(113, 118, 124, 0.22)" />
            <XAxis
              dataKey="label"
              interval={0}
              angle={-42}
              textAnchor="end"
              height={88}
              tick={{ fill: "#3b3f42", fontSize: 10 }}
              tickFormatter={truncateLabel}
            />
            <YAxis
              domain={[0, maximum * 1.15]}
              tick={{ fill: "#71767c", fontSize: 10 }}
              tickFormatter={(value: number) => formatAxisValue(value, decimals)}
              width={52}
            >
              <Label
                value="kgCO2eq/pc"
                angle={-90}
                position="insideLeft"
                style={{ fill: "#71767c", fontSize: 10 }}
              />
            </YAxis>
            <Tooltip
              cursor={{ fill: "rgba(0, 123, 192, 0.05)" }}
              contentStyle={{
                border: "1px solid rgba(113, 118, 124, 0.35)",
                borderRadius: 0,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                fontSize: 12,
              }}
              formatter={(_value, _name, item) => [
                `${Number(item.payload.value).toFixed(decimals)} kgCO2eq/pc`,
                item.payload.isTotal ? "Total" : "Contribution",
              ]}
            />
            <Bar dataKey="range" isAnimationActive={false}>
              {data.map((point) => (
                <Cell
                  key={point.label}
                  fill={point.isTotal ? "#9b9b9b" : "#007bc0"}
                />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value) => Number(value).toFixed(decimals)}
                style={{ fill: "#000000", fontSize: 10, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function MaterialBreakdownCard({ points }: { points: ChartPoint[] }) {
  return (
    <article className="chart-card">
      <h3>Top Materials PCF Breakdown</h3>
      <div className="material-chart-layout">
        <div className="material-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={points}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="42%"
                outerRadius="76%"
                paddingAngle={1}
                isAnimationActive={false}
              >
                {points.map((point, index) => (
                  <Cell
                    key={point.label}
                    fill={
                      CHART_COLORS[index % CHART_COLORS.length] ??
                      "#007bc0"
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Share"]}
                contentStyle={{
                  border: "1px solid rgba(113, 118, 124, 0.35)",
                  borderRadius: 0,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="material-legend" aria-label="Material shares">
          {points.map((point, index) => (
            <li key={point.label}>
              <span
                className="material-color"
                style={{
                  backgroundColor:
                    CHART_COLORS[index % CHART_COLORS.length] ?? "#007bc0",
                }}
              />
              <span>{point.label}</span>
              <strong>{Number(point.value).toFixed(1)}%</strong>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

interface WaterfallPoint {
  label: string;
  range: [number, number];
  value: number;
  end: number;
  isTotal: boolean;
}

function createWaterfallData(
  points: ChartPoint[],
  totalLabel: string,
): WaterfallPoint[] {
  let runningTotal = 0;
  const contributions = points.map((point) => {
    const start = runningTotal;
    runningTotal += Number(point.value);

    return {
      label: point.label,
      range: [start, runningTotal] as [number, number],
      value: Number(point.value),
      end: runningTotal,
      isTotal: false,
    };
  });

  return [
    ...contributions,
    {
      label: totalLabel,
      range: [0, runningTotal],
      value: runningTotal,
      end: runningTotal,
      isTotal: true,
    },
  ];
}

function truncateLabel(value: string): string {
  return value.length > 18 ? `${value.slice(0, 16)}...` : value;
}

function formatAxisValue(value: number, decimals: number): string {
  if (value >= 100) {
    return value.toFixed(0);
  }

  return value.toFixed(decimals === 3 ? 2 : 1);
}
