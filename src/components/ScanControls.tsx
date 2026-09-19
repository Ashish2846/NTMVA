import {
  Activity,
  FileInput,
  Play,
  Radar,
  RotateCcw,
  ShieldCheck,
  Upload
} from "lucide-react";
import { useMemo, useState } from "react";
import type { NseScript, ScanProfile, ScanTargetRequest, SystemStatus } from "../types/domain";

const profiles: Array<{ id: ScanProfile; label: string }> = [
  { id: "quick", label: "Quick" },
  { id: "intense", label: "Intense" },
  { id: "os-detection", label: "OS" },
  { id: "service-detection", label: "Service" },
  { id: "version-detection", label: "Version" },
  { id: "udp", label: "UDP" },
  { id: "tcp-syn", label: "SYN" },
  { id: "ack", label: "ACK" },
  { id: "null", label: "NULL" },
  { id: "fin", label: "FIN" },
  { id: "xmas", label: "XMAS" },
  { id: "stealth", label: "Stealth" },
  { id: "aggressive", label: "Aggressive" },
  { id: "ipv6", label: "IPv6" },
  { id: "ping-sweep", label: "Ping" },
  { id: "traceroute", label: "Trace" },
  { id: "custom", label: "Custom" }
];

interface ScanControlsProps {
  system?: SystemStatus;
  scripts: NseScript[];
  selectedScripts: string[];
  scanning: boolean;
  timeoutSeconds: number;
  onSelectedScriptsChange: (scripts: string[]) => void;
  onStart: (request: Omit<ScanTargetRequest, "timeoutSeconds" | "storeHistory">) => Promise<void>;
  onSample: () => Promise<void>;
  onImportXml: (xml: string, target: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function ScanControls({
  system,
  scripts,
  selectedScripts,
  scanning,
  timeoutSeconds,
  onSelectedScriptsChange,
  onStart,
  onSample,
  onImportXml,
  onRefresh
}: ScanControlsProps): JSX.Element {
  const [target, setTarget] = useState("10.10.40.0/24");
  const [profile, setProfile] = useState<ScanProfile>("aggressive");
  const [customArguments, setCustomArguments] = useState("-A -T4 --traceroute");
  const [importTarget, setImportTarget] = useState("imported-network");

  const featuredScripts = useMemo(() => scripts.slice(0, 12), [scripts]);

  function toggleScript(id: string): void {
    onSelectedScriptsChange(
      selectedScripts.includes(id)
        ? selectedScripts.filter((scriptId) => scriptId !== id)
        : [...selectedScripts, id]
    );
  }

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    await onImportXml(await file.text(), importTarget);
  }

  return (
    <section className="panel scan-controls">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Scanner control</p>
          <h2>
            <Radar size={17} aria-hidden="true" />
            Nmap mission
          </h2>
        </div>
        <button className="icon-button" type="button" onClick={() => void onRefresh()} title="Refresh">
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="system-strip">
        <span className={system?.nmapAvailable ? "online" : "offline"}>
          <ShieldCheck size={14} aria-hidden="true" />
          {system?.nmapAvailable ? system.nmapVersion : "Nmap not detected"}
        </span>
        <span>
          <Activity size={14} aria-hidden="true" />
          {system?.historyCount ?? 0} saved scans
        </span>
      </div>

      <label className="field">
        <span>Target</span>
        <input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="CIDR, IP, hostname" />
      </label>

      <div className="profile-grid" role="group" aria-label="Scan profile">
        {profiles.map((item) => (
          <button
            className={profile === item.id ? "chip active" : "chip"}
            key={item.id}
            type="button"
            onClick={() => setProfile(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {profile === "custom" ? (
        <label className="field">
          <span>Custom arguments</span>
          <input
            value={customArguments}
            onChange={(event) => setCustomArguments(event.target.value)}
            placeholder="-sS -sV --script vuln"
          />
        </label>
      ) : null}

      <div className="script-picks">
        {featuredScripts.map((script) => (
          <button
            className={selectedScripts.includes(script.id) ? "script-pill enabled" : "script-pill"}
            key={script.id}
            type="button"
            title={script.description}
            onClick={() => toggleScript(script.id)}
          >
            {script.id}
          </button>
        ))}
      </div>

      <div className="action-row">
        <button
          className="primary-button"
          disabled={scanning}
          type="button"
          onClick={() =>
            void onStart({
              target,
              profile,
              customArguments,
              selectedScripts,
              simulate: false
            })
          }
        >
          <Play size={16} aria-hidden="true" />
          Start scan
        </button>
        <button
          className="secondary-button"
          disabled={scanning}
          type="button"
          onClick={() =>
            void onStart({
              target,
              profile,
              customArguments,
              selectedScripts,
              simulate: true
            })
          }
        >
          <Radar size={16} aria-hidden="true" />
          Replay sample
        </button>
      </div>

      <div className="import-row">
        <label className="field compact">
          <span>XML target label</span>
          <input value={importTarget} onChange={(event) => setImportTarget(event.target.value)} />
        </label>
        <label className="file-button">
          <Upload size={16} aria-hidden="true" />
          Import XML
          <input
            type="file"
            accept=".xml,text/xml,application/xml"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </label>
        <button className="secondary-button" type="button" onClick={() => void onSample()}>
          <FileInput size={16} aria-hidden="true" />
          Load demo
        </button>
      </div>

      <p className="microcopy">Timeout: {timeoutSeconds}s. Scans execute locally through the API service.</p>
    </section>
  );
}
