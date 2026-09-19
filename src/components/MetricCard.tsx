import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "good" | "warn" | "danger";
}

export function MetricCard({ label, value, detail, icon: Icon, tone = "neutral" }: MetricCardProps): JSX.Element {
  return (
    <section className={`metric-card metric-${tone}`}>
      <div className="metric-icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </section>
  );
}
