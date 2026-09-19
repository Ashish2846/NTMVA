import type { NetworkDevice, SearchFilters, Severity } from "../types/domain";
import { severityRank } from "./format";

function includes(source: string | undefined, query: string): boolean {
  return (source ?? "").toLowerCase().includes(query);
}

function vulnerabilityMatches(device: NetworkDevice, query: string): boolean {
  return device.vulnerabilities.some(
    (finding) =>
      includes(finding.title, query) ||
      includes(finding.reason, query) ||
      includes(finding.service, query) ||
      includes(finding.cve?.id, query)
  );
}

function serviceMatches(device: NetworkDevice, query: string): boolean {
  return device.ports.some(
    (port) =>
      includes(port.service, query) ||
      includes(port.product, query) ||
      includes(String(port.port), query) ||
      includes(port.version, query)
  );
}

export function filterDevices(devices: NetworkDevice[], filters: SearchFilters): NetworkDevice[] {
  const query = filters.query.trim().toLowerCase();

  return devices.filter((device) => {
    const matchesQuery =
      query.length === 0 ||
      includes(device.ip, query) ||
      includes(device.hostname, query) ||
      includes(device.mac?.address, query) ||
      includes(device.vendor, query) ||
      includes(device.os, query) ||
      serviceMatches(device, query) ||
      vulnerabilityMatches(device, query);
    const matchesSubnet = filters.subnet === "all" || device.subnet === filters.subnet;
    const matchesVendor = filters.vendor === "all" || device.vendor === filters.vendor;
    const matchesOs = filters.os === "all" || device.os === filters.os;
    const matchesService =
      filters.service === "all" || device.ports.some((port) => port.service === filters.service);
    const matchesSeverity =
      filters.severity === "all" ||
      device.vulnerabilities.some(
        (finding) => severityRank(finding.severity) >= severityRank(filters.severity as Severity)
      );
    const matchesRisk = device.riskScore >= filters.minRisk;

    return (
      matchesQuery &&
      matchesSubnet &&
      matchesVendor &&
      matchesOs &&
      matchesService &&
      matchesSeverity &&
      matchesRisk
    );
  });
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
