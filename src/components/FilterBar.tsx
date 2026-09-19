import { Search, SlidersHorizontal } from "lucide-react";
import type { NetworkDevice, SearchFilters, Severity } from "../types/domain";
import { uniqueSorted } from "../utils/filtering";

const severities: Array<Severity | "all"> = ["all", "critical", "high", "medium", "low", "info"];

export function FilterBar({
  devices,
  filters,
  onChange
}: {
  devices: NetworkDevice[];
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}): JSX.Element {
  const subnets = uniqueSorted(devices.map((device) => device.subnet));
  const vendors = uniqueSorted(devices.map((device) => device.vendor));
  const operatingSystems = uniqueSorted(devices.map((device) => device.os));
  const services = uniqueSorted(devices.flatMap((device) => device.ports.map((port) => port.service)));

  return (
    <section className="filter-bar">
      <label className="search-field">
        <Search size={16} aria-hidden="true" />
        <input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Search IP, hostname, MAC, vendor, port, service, CVE..."
        />
      </label>
      <select value={filters.subnet} onChange={(event) => onChange({ ...filters, subnet: event.target.value })}>
        <option value="all">All subnets</option>
        {subnets.map((subnet) => (
          <option key={subnet} value={subnet}>
            {subnet}
          </option>
        ))}
      </select>
      <select value={filters.vendor} onChange={(event) => onChange({ ...filters, vendor: event.target.value })}>
        <option value="all">All vendors</option>
        {vendors.map((vendor) => (
          <option key={vendor} value={vendor}>
            {vendor}
          </option>
        ))}
      </select>
      <select value={filters.os} onChange={(event) => onChange({ ...filters, os: event.target.value })}>
        <option value="all">All OS</option>
        {operatingSystems.map((os) => (
          <option key={os} value={os}>
            {os}
          </option>
        ))}
      </select>
      <select
        value={filters.severity}
        onChange={(event) => onChange({ ...filters, severity: event.target.value as Severity | "all" })}
      >
        {severities.map((severity) => (
          <option key={severity} value={severity}>
            {severity === "all" ? "All severities" : severity}
          </option>
        ))}
      </select>
      <select value={filters.service} onChange={(event) => onChange({ ...filters, service: event.target.value })}>
        <option value="all">All services</option>
        {services.map((service) => (
          <option key={service} value={service}>
            {service}
          </option>
        ))}
      </select>
      <label className="range-field">
        <SlidersHorizontal size={15} aria-hidden="true" />
        <span>{filters.minRisk}+</span>
        <input
          type="range"
          min="0"
          max="100"
          value={filters.minRisk}
          onChange={(event) => onChange({ ...filters, minRisk: Number(event.target.value) })}
        />
      </label>
    </section>
  );
}
