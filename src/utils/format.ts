import type { Severity } from "../types/domain";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function formatDate(value: string | undefined): string {
  if (!value) {
    return "Not finished";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function severityLabel(severity: Severity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function severityRank(severity: Severity): number {
  switch (severity) {
    case "critical":
      return 5;
    case "high":
      return 4;
    case "medium":
      return 3;
    case "low":
      return 2;
    case "info":
      return 1;
  }
}

export function riskBand(score: number): Severity {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  if (score >= 20) return "low";
  return "info";
}

export function downloadText(filename: string, content: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
