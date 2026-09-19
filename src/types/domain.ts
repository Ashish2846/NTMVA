export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type ScanStatus = "queued" | "running" | "completed" | "failed";

export type DeviceType =
  | "workstation"
  | "server"
  | "router"
  | "switch"
  | "firewall"
  | "printer"
  | "iot"
  | "cloud"
  | "unknown";

export type ScanProfile =
  | "quick"
  | "intense"
  | "os-detection"
  | "service-detection"
  | "version-detection"
  | "udp"
  | "tcp-syn"
  | "ack"
  | "null"
  | "fin"
  | "xmas"
  | "stealth"
  | "aggressive"
  | "ipv6"
  | "ping-sweep"
  | "traceroute"
  | "custom";

export type ScanPhase =
  | "queued"
  | "discovery"
  | "port-scan"
  | "service-detection"
  | "os-detection"
  | "nse"
  | "analysis"
  | "finished"
  | "error";

export type ExportFormat = "json" | "csv" | "html" | "xml";

export type NseCategory =
  | "authentication"
  | "discovery"
  | "brute-force"
  | "vulnerability"
  | "http"
  | "ftp"
  | "smb"
  | "ssh"
  | "dns"
  | "snmp"
  | "malware"
  | "safe"
  | "intrusive";

export interface NseScript {
  id: string;
  name: string;
  category: NseCategory;
  description: string;
  risk: Severity;
  averageExecutionMs: number;
  path?: string;
  enabledByDefault: boolean;
}

export interface ScanTargetRequest {
  target: string;
  profile: ScanProfile;
  customArguments: string;
  selectedScripts: string[];
  timeoutSeconds: number;
  storeHistory: boolean;
  simulate?: boolean;
}

export interface MacIdentity {
  address: string;
  vendor: string;
}

export interface PortService {
  id: string;
  protocol: "tcp" | "udp" | "sctp" | string;
  port: number;
  state: "open" | "closed" | "filtered" | "open|filtered" | string;
  service: string;
  product?: string;
  version?: string;
  extraInfo?: string;
  tunnel?: string;
  cpe?: string[];
}

export interface CveMatch {
  id: string;
  cvss: number;
  severity: Severity;
  description: string;
  references: string[];
  patchAvailable: boolean;
  exploitAvailable: boolean;
  matchedOn: string;
}

export interface VulnerabilityFinding {
  id: string;
  title: string;
  severity: Severity;
  reason: string;
  impact: string;
  mitigation: string;
  references: string[];
  evidence: string;
  deviceIp: string;
  port?: number;
  service?: string;
  cve?: CveMatch;
  mitreTechniques: string[];
  owaspCategories: string[];
}

export interface TimelineEvent {
  id: string;
  time: string;
  phase: ScanPhase;
  message: string;
  severity: Severity;
}

export interface NetworkDevice {
  id: string;
  ip: string;
  hostname: string;
  mac?: MacIdentity;
  vendor: string;
  os: string;
  type: DeviceType;
  responseTimeMs?: number;
  ttl?: number;
  ports: PortService[];
  openShares: string[];
  processes: string[];
  vulnerabilities: VulnerabilityFinding[];
  riskScore: number;
  attackSurface: number;
  status: "up" | "down" | "unknown";
  subnet: string;
  vlan?: string;
  firstSeen: string;
  lastSeen: string;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol: string;
  risk: Severity;
  animated: boolean;
}

export interface TopologySnapshot {
  devices: NetworkDevice[];
  edges: TopologyEdge[];
  gatewayId?: string;
}

export interface SeverityCount {
  severity: Severity;
  count: number;
}

export interface RiskMetrics {
  overallNetworkScore: number;
  securityScore: number;
  averageRisk: number;
  attackSurfaceScore: number;
  criticalDevices: number;
  severityDistribution: SeverityCount[];
  topExposedServices: Array<{ service: string; count: number; severity: Severity }>;
  operatingSystems: Array<{ name: string; count: number }>;
  ports: Array<{ port: number; count: number }>;
  services: Array<{ name: string; count: number }>;
  riskHeatMap: Array<{ subnet: string; averageRisk: number; hosts: number }>;
}

export interface ScanSummary {
  totalHosts: number;
  activeHosts: number;
  criticalHosts: number;
  openPorts: number;
  vulnerabilities: number;
  services: number;
  averageRisk: number;
}

export interface ScanRecord {
  id: string;
  name: string;
  target: string;
  profile: ScanProfile;
  status: ScanStatus;
  startedAt: string;
  finishedAt?: string;
  command: string[];
  terminal: TimelineEvent[];
  topology: TopologySnapshot;
  metrics: RiskMetrics;
  summary: ScanSummary;
  rawXml?: string;
  error?: string;
}

export interface ScanDiff {
  currentId: string;
  baselineId: string;
  newHosts: NetworkDevice[];
  removedHosts: NetworkDevice[];
  newVulnerabilities: VulnerabilityFinding[];
  resolvedVulnerabilities: VulnerabilityFinding[];
}

export interface SystemStatus {
  nmapAvailable: boolean;
  nmapVersion?: string;
  nseDirectory?: string;
  historyCount: number;
  sampleAvailable: boolean;
}

export interface AppSettings {
  theme: "dark" | "light";
  accent: "cyan" | "blue" | "orange" | "red";
  animations: boolean;
  terminalSpeed: number;
  scanTimeoutSeconds: number;
  autoRefresh: boolean;
}

export interface SearchFilters {
  query: string;
  subnet: string;
  vendor: string;
  os: string;
  severity: Severity | "all";
  service: string;
  minRisk: number;
}

export interface ApiError {
  message: string;
  details?: unknown;
}
