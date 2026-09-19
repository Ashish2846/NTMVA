import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, connectScanStream } from "../services/api";
import type {
  NseScript,
  ScanProfile,
  ScanRecord,
  ScanTargetRequest,
  SystemStatus,
  TimelineEvent
} from "../types/domain";

interface UseScanConsoleState {
  system?: SystemStatus;
  scripts: NseScript[];
  scans: ScanRecord[];
  activeScan?: ScanRecord;
  terminal: TimelineEvent[];
  loading: boolean;
  scanning: boolean;
  error?: string;
  refresh: () => Promise<void>;
  selectScan: (scan: ScanRecord) => void;
  start: (request: Omit<ScanTargetRequest, "timeoutSeconds" | "storeHistory"> & {
    timeoutSeconds?: number;
    storeHistory?: boolean;
  }) => Promise<void>;
  loadSample: () => Promise<void>;
  importXml: (xml: string, target: string) => Promise<void>;
}

export function useScanConsole(defaultTimeoutSeconds: number): UseScanConsoleState {
  const [system, setSystem] = useState<SystemStatus>();
  const [scripts, setScripts] = useState<NseScript[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [activeScan, setActiveScan] = useState<ScanRecord>();
  const [terminal, setTerminal] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>();
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  const refresh = useCallback(async () => {
    setError(undefined);
    const [systemStatus, nseScripts, records] = await Promise.all([
      api.system(),
      api.scripts(),
      api.scans()
    ]);
    setSystem(systemStatus);
    setScripts(nseScripts);
    setScans(records);
    setActiveScan((current) => current ?? records[0]);
    setTerminal((current) => (current.length > 0 ? current : records[0]?.terminal ?? []));
  }, []);

  useEffect(() => {
    let mounted = true;

    void refresh()
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load console data");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      cleanupRef.current?.();
    };
  }, [refresh]);

  const selectScan = useCallback((scan: ScanRecord) => {
    setActiveScan(scan);
    setTerminal(scan.terminal);
  }, []);

  const start = useCallback(
    async (
      request: Omit<ScanTargetRequest, "timeoutSeconds" | "storeHistory"> & {
        timeoutSeconds?: number;
        storeHistory?: boolean;
      }
    ) => {
      cleanupRef.current?.();
      setScanning(true);
      setError(undefined);
      setTerminal([]);

      try {
        const payload: ScanTargetRequest = {
          ...request,
          selectedScripts: request.selectedScripts.slice(0, 40),
          profile: request.profile as ScanProfile,
          timeoutSeconds: request.timeoutSeconds ?? defaultTimeoutSeconds,
          storeHistory: request.storeHistory ?? true
        };
        const { sessionId } = await api.startScan(payload);
        cleanupRef.current = connectScanStream(sessionId, {
          onTerminal: (event) => {
            setTerminal((events) => [...events, event].slice(-240));
          },
          onRecord: (record) => {
            setActiveScan(record);
            setScans((records) => [record, ...records.filter((item) => item.id !== record.id)]);
            setTerminal(record.terminal);
            setScanning(false);
            void refresh();
          },
          onError: (message) => {
            setError(message);
            setScanning(false);
          }
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to start scan");
        setScanning(false);
      }
    },
    [defaultTimeoutSeconds, refresh]
  );

  const loadSample = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const record = await api.sample();
      setActiveScan(record);
      setTerminal(record.terminal);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load sample scan");
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const importXml = useCallback(
    async (xml: string, target: string) => {
      setLoading(true);
      setError(undefined);
      try {
        const record = await api.importXml(xml, target);
        setActiveScan(record);
        setTerminal(record.terminal);
        await refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to import XML");
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  return useMemo(
    () => ({
      system,
      scripts,
      scans,
      activeScan,
      terminal,
      loading,
      scanning,
      error,
      refresh,
      selectScan,
      start,
      loadSample,
      importXml
    }),
    [
      activeScan,
      error,
      importXml,
      loadSample,
      loading,
      refresh,
      scanning,
      scans,
      scripts,
      selectScan,
      start,
      system,
      terminal
    ]
  );
}
