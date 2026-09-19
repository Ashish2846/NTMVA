import type { DeviceType, Severity } from "../../src/types/domain.js";

export function subnetOf(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return "ipv6/local";
  }

  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

export function hostSortValue(ip: string): number {
  return ip
    .split(".")
    .map((part) => Number(part.padStart(3, "0")))
    .reduce((acc, part) => acc * 1000 + (Number.isFinite(part) ? part : 0), 0);
}

export function inferDeviceType(os: string, vendor: string, ports: number[]): DeviceType {
  const source = `${os} ${vendor}`.toLowerCase();

  if (source.includes("fortios") || source.includes("firewall") || source.includes("palo alto")) {
    return "firewall";
  }

  if (source.includes("router") || ports.includes(179)) {
    return "router";
  }

  if (source.includes("switch")) {
    return "switch";
  }

  if (source.includes("printer") || ports.includes(9100) || ports.includes(515)) {
    return "printer";
  }

  if (source.includes("iot") || source.includes("embedded") || source.includes("camera")) {
    return "iot";
  }

  if (source.includes("server") || ports.includes(445) || ports.includes(3389) || ports.includes(6379)) {
    return "server";
  }

  if (source.includes("linux") || source.includes("windows") || source.includes("mac os")) {
    return "workstation";
  }

  return "unknown";
}

export function severityWeight(severity: Severity): number {
  switch (severity) {
    case "critical":
      return 100;
    case "high":
      return 75;
    case "medium":
      return 45;
    case "low":
      return 20;
    case "info":
      return 5;
  }
}

export function maxSeverity(severities: Severity[]): Severity {
  const ordered: Severity[] = ["critical", "high", "medium", "low", "info"];
  return ordered.find((severity) => severities.includes(severity)) ?? "info";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
