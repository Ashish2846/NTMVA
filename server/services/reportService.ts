import type { ExportFormat, ScanRecord } from "../../src/types/domain.js";

function escapeCsv(value: string | number | undefined): string {
  const normalized = String(value ?? "");
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function exportScan(record: ScanRecord, format: ExportFormat): { contentType: string; body: string } {
  switch (format) {
    case "json":
      return {
        contentType: "application/json",
        body: JSON.stringify(record, null, 2)
      };
    case "xml":
      return {
        contentType: "application/xml",
        body: record.rawXml ?? "<nmaprun />"
      };
    case "csv": {
      const header = [
        "ip",
        "hostname",
        "vendor",
        "os",
        "risk",
        "port",
        "protocol",
        "service",
        "vulnerability",
        "severity"
      ];
      const rows = record.topology.devices.flatMap((device) => {
        const vulnerabilityRows = device.vulnerabilities.length > 0 ? device.vulnerabilities : [undefined];
        const ports = device.ports.length > 0 ? device.ports : [undefined];

        return ports.flatMap((port) =>
          vulnerabilityRows.map((finding) =>
            [
              device.ip,
              device.hostname,
              device.vendor,
              device.os,
              device.riskScore,
              port?.port,
              port?.protocol,
              port?.service,
              finding?.title,
              finding?.severity
            ]
              .map(escapeCsv)
              .join(",")
          )
        );
      });

      return {
        contentType: "text/csv",
        body: [header.join(","), ...rows].join("\n")
      };
    }
    case "html": {
      const findings = record.topology.devices.flatMap((device) => device.vulnerabilities);
      const rows = record.topology.devices
        .map(
          (device) => `<tr><td>${device.ip}</td><td>${device.hostname}</td><td>${device.os}</td><td>${device.riskScore}</td><td>${device.ports.length}</td><td>${device.vulnerabilities.length}</td></tr>`
        )
        .join("");
      const findingRows = findings
        .map(
          (finding) => `<tr><td>${finding.severity}</td><td>${finding.deviceIp}</td><td>${finding.title}</td><td>${finding.mitigation}</td></tr>`
        )
        .join("");

      return {
        contentType: "text/html",
        body: `<!doctype html><html><head><meta charset="utf-8"><title>${record.name}</title><style>body{font-family:Inter,Arial;background:#071017;color:#d8e8f0;padding:32px}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{border:1px solid #1e4050;padding:8px;text-align:left}th{background:#102430}.critical{color:#ff6070}</style></head><body><h1>${record.name}</h1><p>Target: ${record.target} | Started: ${record.startedAt}</p><h2>Executive Summary</h2><p>Security score ${record.metrics.securityScore}/100. ${record.summary.vulnerabilities} vulnerabilities across ${record.summary.activeHosts} active hosts.</p><h2>Device List</h2><table><thead><tr><th>IP</th><th>Hostname</th><th>OS</th><th>Risk</th><th>Ports</th><th>Findings</th></tr></thead><tbody>${rows}</tbody></table><h2>Recommendations</h2><table><thead><tr><th>Severity</th><th>Host</th><th>Finding</th><th>Mitigation</th></tr></thead><tbody>${findingRows}</tbody></table></body></html>`
      };
    }
  }
}
