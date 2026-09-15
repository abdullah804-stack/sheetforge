"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartDef {
  label: string;
  type: "bar" | "line" | "pie" | string;
  entity: string;
  groupBy: string;
  value?: string;
}

interface ChartPoint {
  group: string;
  value: number;
}

const COLORS = [
  "#0a0a0a",
  "#525252",
  "#a3a3a3",
  "#404040",
  "#737373",
  "#262626",
  "#8c8c8c",
  "#d4d4d4",
  "#171717",
  "#666666",
];

export default function Charts({
  charts,
  dataByChart,
}: {
  charts: ChartDef[];
  dataByChart: ChartPoint[][];
}) {
  if (charts.length === 0) return null;

  return (
    <div
      className={`mb-6 grid gap-4 ${
        charts.length === 1
          ? "grid-cols-1"
          : charts.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-3"
      }`}
    >
      {charts.map((chart, i) => (
        <ChartCard key={i} chart={chart} data={dataByChart[i]} />
      ))}
    </div>
  );
}

function ChartCard({
  chart,
  data,
}: {
  chart: ChartDef;
  data: ChartPoint[];
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900">{chart.label}</p>
        <p className="text-xs text-gray-500">
          {chart.value ? `Sum of ${chart.value}` : "Count"} by {chart.groupBy}
        </p>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(chart.type, data)}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function renderChart(type: string, data: ChartPoint[]) {
  if (type === "line") {
    return (
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="group"
          tick={{ fontSize: 10 }}
          stroke="#9ca3af"
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            border: "1px solid #e5e5e5",
            borderRadius: 6,
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0a0a0a"
          strokeWidth={2}
          dot={{ r: 2, fill: "#0a0a0a" }}
        />
      </LineChart>
    );
  }

  if (type === "pie") {
    return (
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="group"
          cx="50%"
          cy="50%"
          outerRadius={70}
          innerRadius={0}
          label={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            fontSize: 12,
            border: "1px solid #e5e5e5",
            borderRadius: 6,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          layout="horizontal"
          verticalAlign="bottom"
        />
      </PieChart>
    );
  }

  // Default to bar
  return (
    <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis
        dataKey="group"
        tick={{ fontSize: 10 }}
        stroke="#9ca3af"
        interval={0}
        angle={data.length > 6 ? -25 : 0}
        textAnchor={data.length > 6 ? "end" : "middle"}
        height={data.length > 6 ? 55 : 30}
      />
      <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
      <Tooltip
        contentStyle={{
          fontSize: 12,
          border: "1px solid #e5e5e5",
          borderRadius: 6,
        }}
      />
      <Bar dataKey="value" fill="#0a0a0a" radius={[3, 3, 0, 0]} />
    </BarChart>
  );
}