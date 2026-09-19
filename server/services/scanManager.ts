import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { nanoid } from "nanoid";
import type { ScanRecord, ScanTargetRequest, TimelineEvent } from "../../src/types/domain.js";
import { sampleNmapXml } from "../data/sampleXml.js";
import { analyzeXmlToRecord, emptyMetrics } from "./analysisEngine.js";
import { saveScanRecord } from "./historyService.js";
import { buildNmapCommand } from "./nmapProfiles.js";
import { getNmapVersion } from "./systemService.js";

interface ScanSession {
  id: string;
  emitter: EventEmitter;
  events: TimelineEvent[];
  record?: ScanRecord;
}

const sessions = new Map<string, ScanSession>();

function createEvent(phase: TimelineEvent["phase"], message: string, severity: TimelineEvent["severity"]): TimelineEvent {
  return {
    id: nanoid(),
    time: new Date().toISOString(),
    phase,
    message,
    severity
  };
}

function emit(session: ScanSession, event: TimelineEvent): void {
  session.events.push(event);
  session.emitter.emit("event", event);
}

function createEmptyFailedRecord(
  request: ScanTargetRequest,
  command: string[],
  terminal: TimelineEvent[],
  error: string
): ScanRecord {
  const now = new Date().toISOString();

  return {
    id: nanoid(12),
    name: `${request.profile} scan - ${request.target}`,
    target: request.target,
    profile: request.profile,
    status: "failed",
    startedAt: now,
    finishedAt: now,
    command,
    terminal,
    topology: {
      devices: [],
      edges: []
    },
    metrics: emptyMetrics(),
    summary: {
      totalHosts: 0,
      activeHosts: 0,
      criticalHosts: 0,
      openPorts: 0,
      vulnerabilities: 0,
      services: 0,
      averageRisk: 0
    },
    error
  };
}

async function runSimulatedScan(session: ScanSession, request: ScanTargetRequest, command: string[]): Promise<void> {
  const phases: Array<[TimelineEvent["phase"], string, TimelineEvent["severity"], number]> = [
    ["queued", "Starting Scan... offline sample analysis requested", "info", 150],
    ["discovery", "Running Host Discovery... replaying Nmap XML fixture", "info", 400],
    ["os-detection", "Running OS Detection... normalizing host fingerprints", "info", 650],
    ["nse", "Running NSE Scripts... evaluating local evidence", "info", 900],
    ["analysis", "Vulnerability Found... local rule engine produced findings", "high", 1150]
  ];

  for (const [phase, message, severity, delayMs] of phases) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    emit(session, createEvent(phase, message, severity));
  }

  const record = await analyzeXmlToRecord({
    xml: sampleNmapXml,
    target: request.target || "10.10.40.0/24",
    profile: request.profile,
    command,
    name: "SOC Demo - Enterprise Segment",
    terminal: session.events
  });

  session.record = request.storeHistory ? await saveScanRecord(record) : record;
  emit(session, createEvent("finished", "Finished", "info"));
  session.emitter.emit("record", session.record);
}

async function runRealNmap(session: ScanSession, request: ScanTargetRequest, command: string[]): Promise<void> {
  const version = await getNmapVersion();

  if (!version) {
    const event = createEvent("error", "Nmap executable not found. Install nmap or run sample/XML analysis.", "high");
    emit(session, event);
    const record = createEmptyFailedRecord(request, ["nmap", ...command], session.events, event.message);
    session.record = request.storeHistory ? await saveScanRecord(record) : record;
    session.emitter.emit("record", session.record);
    return;
  }

  emit(session, createEvent("queued", `Starting Scan... ${version}`, "info"));
  emit(session, createEvent("discovery", "Running Host Discovery...", "info"));

  const child = spawn("nmap", command, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });
  let stdout = "";
  let stderr = "";
  const timeout = setTimeout(() => {
    child.kill("SIGTERM");
    emit(session, createEvent("error", `Scan timeout reached after ${request.timeoutSeconds}s`, "high"));
  }, Math.max(request.timeoutSeconds, 5) * 1000);

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
    if (chunk.includes("<port ")) {
      emit(session, createEvent("port-scan", "Open Port Found... XML port evidence streaming", "info"));
    }
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
    for (const line of chunk.split("\n").filter(Boolean).slice(0, 8)) {
      emit(session, createEvent("port-scan", line.trim(), "info"));
    }
  });

  child.on("error", async (error) => {
    clearTimeout(timeout);
    const event = createEvent("error", error.message, "high");
    emit(session, event);
    const record = createEmptyFailedRecord(request, ["nmap", ...command], session.events, error.message);
    session.record = request.storeHistory ? await saveScanRecord(record) : record;
    session.emitter.emit("record", session.record);
  });

  child.on("close", async (code) => {
    clearTimeout(timeout);

    if (code !== 0 || !stdout.includes("<nmaprun")) {
      const error = stderr || `nmap exited with code ${code ?? "unknown"} and did not produce XML`;
      emit(session, createEvent("error", error.slice(0, 400), "high"));
      const record = createEmptyFailedRecord(request, ["nmap", ...command], session.events, error);
      session.record = request.storeHistory ? await saveScanRecord(record) : record;
      session.emitter.emit("record", session.record);
      return;
    }

    emit(session, createEvent("service-detection", "Running Service Detection... parsing Nmap XML", "info"));
    emit(session, createEvent("analysis", "Running local CVE, rule, and risk engines...", "info"));

    try {
      const record = await analyzeXmlToRecord({
        xml: stdout,
        target: request.target,
        profile: request.profile,
        command: ["nmap", ...command],
        terminal: session.events
      });
      session.record = request.storeHistory ? await saveScanRecord(record) : record;
      emit(session, createEvent("finished", "Finished", "info"));
      session.emitter.emit("record", session.record);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to parse Nmap XML";
      emit(session, createEvent("error", message, "high"));
      const record = createEmptyFailedRecord(request, ["nmap", ...command], session.events, message);
      session.record = request.storeHistory ? await saveScanRecord(record) : record;
      session.emitter.emit("record", session.record);
    }
  });
}

export function startScan(request: ScanTargetRequest): ScanSession {
  const id = nanoid(12);
  const command = buildNmapCommand(request);
  const session: ScanSession = {
    id,
    emitter: new EventEmitter(),
    events: [],
  };
  sessions.set(id, session);

  void (request.simulate ? runSimulatedScan(session, request, ["sample-xml"]) : runRealNmap(session, request, command));

  return session;
}

export function getScanSession(id: string): ScanSession | undefined {
  return sessions.get(id);
}
