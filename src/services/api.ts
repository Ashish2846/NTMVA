import type {
  AppSettings,
  ExportFormat,
  NseScript,
  ScanDiff,
  ScanRecord,
  ScanTargetRequest,
  SystemStatus,
  TimelineEvent
} from "../types/domain";

const jsonHeaders = {
  "Content-Type": "application/json"
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: response.statusText }))) as {
      message?: string;
    };
    throw new Error(body.message ?? `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  system: () => request<SystemStatus>("/api/system"),
  scripts: () => request<NseScript[]>("/api/nse-scripts"),
  scans: () => request<ScanRecord[]>("/api/scans"),
  scan: (id: string) => request<ScanRecord>(`/api/scans/${id}`),
  sample: () => request<ScanRecord>("/api/scans/sample", { method: "POST" }),
  startScan: (payload: ScanTargetRequest) =>
    request<{ sessionId: string }>("/api/scans", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(payload)
    }),
  importXml: (xml: string, target: string) =>
    request<ScanRecord>(`/api/analyze/xml?target=${encodeURIComponent(target)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml"
      },
      body: xml
    }),
  diff: (currentId: string, baselineId: string) =>
    request<ScanDiff>(`/api/scans/${currentId}/diff/${baselineId}`),
  exportUrl: (scanId: string, format: ExportFormat) => `/api/scans/${scanId}/export/${format}`
};

export interface ScanStreamHandlers {
  onTerminal: (event: TimelineEvent) => void;
  onRecord: (record: ScanRecord) => void;
  onError: (message: string) => void;
}

export function connectScanStream(sessionId: string, handlers: ScanStreamHandlers): () => void {
  const source = new EventSource(`/api/scans/${sessionId}/events`);

  source.addEventListener("terminal", (event) => {
    handlers.onTerminal(JSON.parse(event.data) as TimelineEvent);
  });
  source.addEventListener("record", (event) => {
    handlers.onRecord(JSON.parse(event.data) as ScanRecord);
    source.close();
  });
  source.onerror = () => {
    handlers.onError("Live scan stream disconnected");
    source.close();
  };

  return () => source.close();
}

export const defaultSettings: AppSettings = {
  theme: "dark",
  accent: "cyan",
  animations: true,
  terminalSpeed: 42,
  scanTimeoutSeconds: 300,
  autoRefresh: false
};
