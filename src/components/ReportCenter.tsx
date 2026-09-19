import { Download, FileJson, FileText, ImageDown, Printer } from "lucide-react";
import type { ExportFormat, ScanRecord } from "../types/domain";
import { api } from "../services/api";
import { downloadText } from "../utils/format";

export function ReportCenter({ scan }: { scan?: ScanRecord }): JSX.Element {
  function topologySvg(): string {
    if (!scan) {
      return "";
    }

    const width = 1200;
    const height = 760;
    const centerX = 220;
    const centerY = 360;
    const devices = scan.topology.devices;
    const gateway = devices.find((device) => device.id === scan.topology.gatewayId) ?? devices[0];
    const positions = new Map<string, { x: number; y: number }>();

    if (gateway) {
      positions.set(gateway.id, { x: centerX, y: centerY });
    }

    devices
      .filter((device) => device.id !== gateway?.id)
      .forEach((device, index, peers) => {
        const angle = (index / Math.max(peers.length, 1)) * Math.PI * 2;
        positions.set(device.id, {
          x: 680 + Math.cos(angle) * 330,
          y: 360 + Math.sin(angle) * 260
        });
      });

    const edgeMarkup = scan.topology.edges
      .map((edge) => {
        const source = positions.get(edge.source);
        const target = positions.get(edge.target);
        if (!source || !target) {
          return "";
        }

        return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="#3ec7e0" stroke-width="${edge.animated ? 3 : 1.5}" opacity="0.72" />`;
      })
      .join("");

    const nodeMarkup = devices
      .map((device) => {
        const position = positions.get(device.id);
        if (!position) {
          return "";
        }

        const color = device.riskScore >= 75 ? "#ff4d62" : device.riskScore >= 45 ? "#ff8a3d" : "#3ec7e0";
        return `<g><rect x="${position.x - 82}" y="${position.y - 34}" width="164" height="68" rx="8" fill="#071923" stroke="${color}" /><text x="${position.x - 70}" y="${position.y - 8}" fill="#d8e8f0" font-family="monospace" font-size="13">${device.hostname}</text><text x="${position.x - 70}" y="${position.y + 14}" fill="#8aa3ad" font-family="monospace" font-size="12">${device.ip} · risk ${device.riskScore}</text></g>`;
      })
      .join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#05090d"/><text x="32" y="44" fill="#d8e8f0" font-family="Inter,Arial" font-size="24">${scan.name}</text><text x="32" y="72" fill="#8aa3ad" font-family="monospace" font-size="13">${scan.target} · ${new Date().toISOString()}</text>${edgeMarkup}${nodeMarkup}</svg>`;
  }

  async function exportTopology(kind: "svg" | "png"): Promise<void> {
    if (!scan) {
      return;
    }

    const svg = topologySvg();
    if (kind === "svg") {
      downloadText(`${scan.id}-topology.svg`, svg, "image/svg+xml");
      return;
    }

    const image = new Image();
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(svgUrl);
        return;
      }
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(svgUrl);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${scan.id}-topology.png`;
        link.click();
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(svgUrl);
      }, "image/png");
    };
    image.src = svgUrl;
  }

  function openExport(format: ExportFormat): void {
    if (!scan) {
      return;
    }

    window.open(api.exportUrl(scan.id, format), "_blank", "noopener,noreferrer");
  }

  return (
    <section className="panel report-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Security report</p>
          <h2>
            <FileText size={17} aria-hidden="true" />
            Evidence export
          </h2>
        </div>
      </header>

      <div className="report-summary">
        <strong>{scan?.name ?? "No active scan"}</strong>
        <span>
          {scan
            ? `${scan.summary.activeHosts} hosts, ${scan.summary.openPorts} ports, ${scan.summary.vulnerabilities} findings`
            : "Run or import a scan to generate reports."}
        </span>
      </div>

      <div className="export-grid">
        <button type="button" disabled={!scan} onClick={() => openExport("html")}>
          <Printer size={16} aria-hidden="true" />
          HTML/PDF
        </button>
        <button type="button" disabled={!scan} onClick={() => openExport("json")}>
          <FileJson size={16} aria-hidden="true" />
          JSON
        </button>
        <button type="button" disabled={!scan} onClick={() => openExport("csv")}>
          <Download size={16} aria-hidden="true" />
          CSV
        </button>
        <button type="button" disabled={!scan} onClick={() => openExport("xml")}>
          <FileText size={16} aria-hidden="true" />
          XML
        </button>
        <button type="button" disabled={!scan} onClick={() => void exportTopology("png")}>
          <ImageDown size={16} aria-hidden="true" />
          PNG
        </button>
        <button type="button" disabled={!scan} onClick={() => void exportTopology("svg")}>
          <ImageDown size={16} aria-hidden="true" />
          SVG
        </button>
      </div>
    </section>
  );
}
