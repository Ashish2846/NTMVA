import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { RiskMetrics, TimelineEvent } from "../types/domain";
import { formatDate } from "../utils/format";

const severityColors: Record<string, string> = {
  critical: "#ff4d62",
  high: "#ff8a3d",
  medium: "#ffd166",
  low: "#59c7d8",
  info: "#8aa3ad"
};

export function DashboardCharts({
  metrics,
  timeline
}: {
  metrics: RiskMetrics;
  timeline: TimelineEvent[];
}): JSX.Element {
  const timelineData = timeline.slice(-18).map((event, index) => ({
    name: `${index + 1}`,
    risk:
      event.severity === "critical"
        ? 100
        : event.severity === "high"
          ? 78
          : event.severity === "medium"
            ? 48
            : event.severity === "low"
              ? 24
              : 8,
    label: `${formatDate(event.time)} ${event.message}`
  }));

  return (
    <section className="dashboard-grid">
      <div className="panel chart-panel">
        <header className="panel-header tight">
          <div>
            <p className="eyebrow">Severity distribution</p>
            <h2>Findings</h2>
          </div>
        </header>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={metrics.severityDistribution}
              dataKey="count"
              nameKey="severity"
              innerRadius={54}
              outerRadius={88}
              paddingAngle={3}
            >
              {metrics.severityDistribution.map((entry) => (
                <Cell fill={severityColors[entry.severity]} key={entry.severity} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#071017", border: "1px solid #1c3e4c" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-panel">
        <header className="panel-header tight">
          <div>
            <p className="eyebrow">Top exposed ports</p>
            <h2>Ports</h2>
          </div>
        </header>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={metrics.ports}>
            <CartesianGrid stroke="#143140" vertical={false} />
            <XAxis dataKey="port" stroke="#78919b" />
            <YAxis stroke="#78919b" allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#071017", border: "1px solid #1c3e4c" }} />
            <Bar dataKey="count" fill="#3ec7e0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-panel">
        <header className="panel-header tight">
          <div>
            <p className="eyebrow">Service footprint</p>
            <h2>Services</h2>
          </div>
        </header>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={metrics.services} layout="vertical" margin={{ left: 18 }}>
            <CartesianGrid stroke="#143140" horizontal={false} />
            <XAxis type="number" stroke="#78919b" allowDecimals={false} />
            <YAxis type="category" dataKey="name" stroke="#78919b" width={78} />
            <Tooltip contentStyle={{ background: "#071017", border: "1px solid #1c3e4c" }} />
            <Bar dataKey="count" fill="#5f8fff" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel chart-panel">
        <header className="panel-header tight">
          <div>
            <p className="eyebrow">Scan timeline</p>
            <h2>Risk pulses</h2>
          </div>
        </header>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={timelineData}>
            <CartesianGrid stroke="#143140" vertical={false} />
            <XAxis dataKey="name" stroke="#78919b" />
            <YAxis stroke="#78919b" domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "#071017", border: "1px solid #1c3e4c" }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
            />
            <Line dataKey="risk" stroke="#ff8a3d" strokeWidth={2} dot={{ fill: "#ff8a3d", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
