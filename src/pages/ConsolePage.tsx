import {
  Activity,
  AlertTriangle,
  Boxes,
  Bug,
  Gauge,
  HardDrive,
  Network,
  Shield,
  ShieldAlert,
  Wifi
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardCharts } from "../components/DashboardCharts";
import { DeviceInspector } from "../components/DeviceInspector";
import { DeviceTable } from "../components/DeviceTable";
import { FilterBar } from "../components/FilterBar";
import { HistoryPanel } from "../components/HistoryPanel";
import { LiveTerminal } from "../components/LiveTerminal";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { MetricCard } from "../components/MetricCard";
import { NseScriptManager } from "../components/NseScriptManager";
import { ReportCenter } from "../components/ReportCenter";
import { ScanControls } from "../components/ScanControls";
import { SettingsPanel } from "../components/SettingsPanel";
import { TopologyMap } from "../components/TopologyMap";
import { useSettings } from "../contexts/SettingsContext";
import { useScanConsole } from "../hooks/useScanConsole";
import type { NetworkDevice, SearchFilters } from "../types/domain";
import { filterDevices } from "../utils/filtering";
import { formatNumber } from "../utils/format";

const defaultFilters: SearchFilters = {
  query: "",
  subnet: "all",
  vendor: "all",
  os: "all",
  severity: "all",
  service: "all",
  minRisk: 0
};

type ViewKey = "overview" | "topology" | "scripts" | "history" | "reports" | "settings";

const navItems: Array<{ id: ViewKey; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "topology", label: "Topology" },
  { id: "scripts", label: "NSE" },
  { id: "history", label: "History" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" }
];

export function ConsolePage(): JSX.Element {
  const { settings, updateSettings } = useSettings();
  const consoleState = useScanConsole(settings.scanTimeoutSeconds);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice>();
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);

  const activeScan = consoleState.activeScan;
  const devices = activeScan?.topology.devices ?? [];
  const filteredDevices = useMemo(() => filterDevices(devices, filters), [devices, filters]);
  const topology = useMemo(
    () => ({
      devices: filteredDevices,
      edges: (activeScan?.topology.edges ?? []).filter(
        (edge) =>
          filteredDevices.some((device) => device.id === edge.source) &&
          filteredDevices.some((device) => device.id === edge.target)
      ),
      gatewayId: activeScan?.topology.gatewayId
    }),
    [activeScan?.topology.edges, activeScan?.topology.gatewayId, filteredDevices]
  );

  useEffect(() => {
    if (selectedScripts.length === 0 && consoleState.scripts.length > 0) {
      setSelectedScripts(
        consoleState.scripts.filter((script) => script.enabledByDefault).map((script) => script.id)
      );
    }
  }, [consoleState.scripts, selectedScripts.length]);

  useEffect(() => {
    const firstCritical =
      filteredDevices.find((device) => device.riskScore >= 75) ?? filteredDevices[0];
    setSelectedDevice((current) =>
      current && filteredDevices.some((device) => device.id === current.id) ? current : firstCritical
    );
  }, [filteredDevices]);

  useEffect(() => {
    if (!settings.autoRefresh) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void consoleState.refresh();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [consoleState, settings.autoRefresh]);

  const summary = activeScan?.summary;
  const metrics = activeScan?.metrics;

  return (
    <div
      className={`app-shell theme-${settings.theme} accent-${settings.accent} ${
        settings.animations ? "with-motion" : "reduced-motion"
      }`}
    >
      <aside className="side-nav">
        <div className="brand-mark">
          <Shield size={22} aria-hidden="true" />
          <div>
            <strong>NTMVA</strong>
            <span>SOC Console</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              className={activeView === item.id ? "active" : ""}
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="radar-widget">
          <div className="radar-sweep" />
          <span>Local analysis engine</span>
        </div>
      </aside>

      <main className="console-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Network Topology Mapper & Vulnerability Analyzer</p>
            <h1>Enterprise attack surface console</h1>
          </div>
          <div className="topbar-status">
            <span className={consoleState.system?.nmapAvailable ? "online" : "offline"}>
              {consoleState.system?.nmapAvailable ? "Nmap ready" : "Nmap offline"}
            </span>
            <span>{activeScan?.name ?? "No scan selected"}</span>
          </div>
        </header>

        {consoleState.error ? (
          <div className="alert-banner">
            <AlertTriangle size={16} aria-hidden="true" />
            {consoleState.error}
          </div>
        ) : null}

        {consoleState.loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <section className="metrics-grid">
              <MetricCard
                detail="Discovered inventory"
                icon={HardDrive}
                label="Total Hosts"
                value={formatNumber(summary?.totalHosts ?? 0)}
              />
              <MetricCard
                detail="Responsive targets"
                icon={Wifi}
                label="Active Hosts"
                value={formatNumber(summary?.activeHosts ?? 0)}
                tone="good"
              />
              <MetricCard
                detail="High priority nodes"
                icon={ShieldAlert}
                label="Critical Hosts"
                value={formatNumber(summary?.criticalHosts ?? 0)}
                tone={(summary?.criticalHosts ?? 0) > 0 ? "danger" : "neutral"}
              />
              <MetricCard
                detail="Reachable services"
                icon={Network}
                label="Open Ports"
                value={formatNumber(summary?.openPorts ?? 0)}
              />
              <MetricCard
                detail="Rules plus CVE matches"
                icon={Bug}
                label="Vulnerabilities"
                value={formatNumber(summary?.vulnerabilities ?? 0)}
                tone={(summary?.vulnerabilities ?? 0) > 0 ? "warn" : "good"}
              />
              <MetricCard
                detail="Unique service names"
                icon={Boxes}
                label="Services"
                value={formatNumber(summary?.services ?? 0)}
              />
              <MetricCard
                detail="Network risk"
                icon={Gauge}
                label="Average Risk"
                value={summary?.averageRisk ?? 0}
                tone={(summary?.averageRisk ?? 0) >= 70 ? "danger" : "neutral"}
              />
              <MetricCard
                detail="Security score"
                icon={Activity}
                label="Security"
                value={metrics?.securityScore ?? 100}
                tone={(metrics?.securityScore ?? 100) < 55 ? "danger" : "good"}
              />
            </section>

            <section className="primary-grid">
              <ScanControls
                scripts={consoleState.scripts}
                scanning={consoleState.scanning}
                selectedScripts={selectedScripts}
                system={consoleState.system}
                timeoutSeconds={settings.scanTimeoutSeconds}
                onImportXml={consoleState.importXml}
                onRefresh={consoleState.refresh}
                onSample={consoleState.loadSample}
                onSelectedScriptsChange={setSelectedScripts}
                onStart={(request) =>
                  consoleState.start({
                    ...request,
                    selectedScripts
                  })
                }
              />
              <LiveTerminal events={consoleState.terminal} scanning={consoleState.scanning} />
            </section>

            {activeView === "overview" || activeView === "topology" ? (
              <>
                <FilterBar devices={devices} filters={filters} onChange={setFilters} />
                <section className="map-grid">
                  <TopologyMap
                    selectedId={selectedDevice?.id}
                    topology={topology}
                    onSelect={setSelectedDevice}
                  />
                  <DeviceInspector device={selectedDevice} />
                </section>
                <DeviceTable
                  devices={filteredDevices}
                  selectedId={selectedDevice?.id}
                  onSelect={setSelectedDevice}
                />
              </>
            ) : null}

            {activeView === "overview" && metrics ? (
              <DashboardCharts metrics={metrics} timeline={consoleState.terminal} />
            ) : null}

            {activeView === "scripts" ? (
              <NseScriptManager
                scripts={consoleState.scripts}
                selected={selectedScripts}
                onSelectedChange={setSelectedScripts}
              />
            ) : null}

            {activeView === "history" ? (
              <HistoryPanel
                activeId={activeScan?.id}
                scans={consoleState.scans}
                onSelect={consoleState.selectScan}
              />
            ) : null}

            {activeView === "reports" ? <ReportCenter scan={activeScan} /> : null}

            {activeView === "settings" ? (
              <SettingsPanel settings={settings} onChange={updateSettings} />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
