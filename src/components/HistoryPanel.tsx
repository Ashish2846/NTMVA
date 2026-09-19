import { GitCompareArrows, History } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../services/api";
import type { ScanDiff, ScanRecord } from "../types/domain";
import { formatDate } from "../utils/format";

export function HistoryPanel({
  scans,
  activeId,
  onSelect
}: {
  scans: ScanRecord[];
  activeId?: string;
  onSelect: (scan: ScanRecord) => void;
}): JSX.Element {
  const [baselineId, setBaselineId] = useState("");
  const [diff, setDiff] = useState<ScanDiff>();
  const comparable = useMemo(() => scans.filter((scan) => scan.id !== activeId), [activeId, scans]);

  async function compare(): Promise<void> {
    if (!activeId || !baselineId) {
      return;
    }

    setDiff(await api.diff(activeId, baselineId));
  }

  return (
    <section className="panel history-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">History</p>
          <h2>
            <History size={17} aria-hidden="true" />
            Scan archive
          </h2>
        </div>
      </header>
      <div className="history-list">
        {scans.map((scan) => (
          <button
            className={scan.id === activeId ? "history-item active" : "history-item"}
            key={scan.id}
            type="button"
            onClick={() => onSelect(scan)}
          >
            <span>{scan.name}</span>
            <small>
              {formatDate(scan.startedAt)} · {scan.summary.activeHosts} hosts · {scan.summary.vulnerabilities} findings
            </small>
          </button>
        ))}
      </div>

      <div className="diff-box">
        <div className="diff-controls">
          <select value={baselineId} onChange={(event) => setBaselineId(event.target.value)}>
            <option value="">Baseline scan</option>
            {comparable.map((scan) => (
              <option key={scan.id} value={scan.id}>
                {scan.name}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="button" onClick={() => void compare()}>
            <GitCompareArrows size={16} aria-hidden="true" />
            Compare
          </button>
        </div>
        {diff ? (
          <div className="diff-results">
            <span>New hosts {diff.newHosts.length}</span>
            <span>Deleted hosts {diff.removedHosts.length}</span>
            <span>New vulns {diff.newVulnerabilities.length}</span>
            <span>Resolved {diff.resolvedVulnerabilities.length}</span>
          </div>
        ) : (
          <p className="muted">Choose a baseline to compare inventory and vulnerability drift.</p>
        )}
      </div>
    </section>
  );
}
