import {
  Cpu,
  EthernetPort,
  Fingerprint,
  HardDrive,
  Network,
  ShieldAlert,
  Timer
} from "lucide-react";
import type { NetworkDevice } from "../types/domain";
import { formatDate, riskBand } from "../utils/format";
import { SeverityBadge } from "./SeverityBadge";

export function DeviceInspector({ device }: { device?: NetworkDevice }): JSX.Element {
  if (!device) {
    return (
      <aside className="panel inspector empty">
        <p className="eyebrow">Device inspector</p>
        <h2>Select a topology node</h2>
        <p>Click any host in the graph or inventory to inspect services, findings, attack surface, and timeline.</p>
      </aside>
    );
  }

  const criticalFindings = device.vulnerabilities.filter((finding) => finding.severity === "critical").length;

  return (
    <aside className="panel inspector">
      <header className="inspector-hero">
        <div>
          <p className="eyebrow">Device inspector</p>
          <h2>{device.hostname}</h2>
          <span>{device.ip}</span>
        </div>
        <div className="risk-orbit">
          <strong>{device.riskScore}</strong>
          <span>Risk</span>
        </div>
      </header>

      <div className="inspector-meta">
        <span>
          <Fingerprint size={14} aria-hidden="true" />
          {device.mac?.address ?? "No MAC"} · {device.mac?.vendor ?? device.vendor}
        </span>
        <span>
          <Cpu size={14} aria-hidden="true" />
          {device.os}
        </span>
        <span>
          <Network size={14} aria-hidden="true" />
          {device.subnet} · {device.vlan ?? "No VLAN"}
        </span>
        <span>
          <Timer size={14} aria-hidden="true" />
          RTT {device.responseTimeMs ?? "?"}ms · TTL {device.ttl ?? "?"}
        </span>
      </div>

      <div className="inspector-kpis">
        <div>
          <span>Open ports</span>
          <strong>{device.ports.filter((port) => port.state === "open").length}</strong>
        </div>
        <div>
          <span>Attack surface</span>
          <strong>{device.attackSurface}</strong>
        </div>
        <div>
          <span>Critical</span>
          <strong>{criticalFindings}</strong>
        </div>
      </div>

      <section className="inspector-section">
        <h3>
          <EthernetPort size={15} aria-hidden="true" />
          Services
        </h3>
        <div className="port-list">
          {device.ports.map((port) => (
            <div className="port-row" key={port.id}>
              <code>
                {port.protocol}/{port.port}
              </code>
              <span>{port.service}</span>
              <small>{[port.product, port.version].filter(Boolean).join(" ") || port.state}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="inspector-section">
        <h3>
          <ShieldAlert size={15} aria-hidden="true" />
          Detected vulnerabilities
        </h3>
        <div className="finding-list">
          {device.vulnerabilities.length === 0 ? (
            <p className="muted">No local rule or CVE findings for this host.</p>
          ) : (
            device.vulnerabilities.map((finding) => (
              <article className={`finding-card finding-${finding.severity}`} key={finding.id}>
                <div>
                  <SeverityBadge severity={finding.severity} />
                  <strong>{finding.title}</strong>
                </div>
                <p>{finding.reason}</p>
                <p>{finding.impact}</p>
                <small>{finding.mitigation}</small>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="inspector-section">
        <h3>
          <HardDrive size={15} aria-hidden="true" />
          Host timeline
        </h3>
        <div className="timeline-mini">
          <span>First seen {formatDate(device.firstSeen)}</span>
          <span>Last seen {formatDate(device.lastSeen)}</span>
          <span>
            Classification <SeverityBadge severity={riskBand(device.riskScore)} />
          </span>
        </div>
      </section>
    </aside>
  );
}
