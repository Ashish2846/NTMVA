import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ScanDiff, ScanRecord, VulnerabilityFinding } from "../../src/types/domain.js";
import { analyzeXmlToRecord } from "./analysisEngine.js";
import { sampleNmapXml } from "../data/sampleXml.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const historyDir = join(currentDir, "..", "data", "history");

async function ensureHistoryDir(): Promise<void> {
  await mkdir(historyDir, { recursive: true });
}

function recordPath(id: string): string {
  return join(historyDir, `${id}.json`);
}

export async function saveScanRecord(record: ScanRecord): Promise<ScanRecord> {
  await ensureHistoryDir();
  await writeFile(recordPath(record.id), JSON.stringify(record, null, 2), "utf8");
  return record;
}

export async function listScanRecords(): Promise<ScanRecord[]> {
  await ensureHistoryDir();
  const files = await readdir(historyDir);
  const records = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const contents = await readFile(join(historyDir, file), "utf8");
        return JSON.parse(contents) as ScanRecord;
      })
  );

  return records.sort(
    (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
  );
}

export async function getScanRecord(id: string): Promise<ScanRecord | undefined> {
  const records = await listScanRecords();
  return records.find((record) => record.id === id);
}

export async function ensureSampleRecord(): Promise<ScanRecord> {
  const records = await listScanRecords();
  const existing = records.find((record) => record.target === "10.10.40.0/24" && record.name.includes("SOC Demo"));

  if (existing) {
    return existing;
  }

  const record = await analyzeXmlToRecord({
    xml: sampleNmapXml,
    target: "10.10.40.0/24",
    profile: "aggressive",
    command: ["nmap", "-A", "-T4", "--script", "default,vuln", "10.10.40.0/24"],
    name: "SOC Demo - Enterprise Segment"
  });

  return saveScanRecord(record);
}

function findingKey(finding: VulnerabilityFinding): string {
  return `${finding.deviceIp}:${finding.port ?? "host"}:${finding.title}`;
}

export function diffScans(current: ScanRecord, baseline: ScanRecord): ScanDiff {
  const baselineHosts = new Set(baseline.topology.devices.map((device) => device.ip));
  const currentHosts = new Set(current.topology.devices.map((device) => device.ip));
  const baselineFindings = new Map(
    baseline.topology.devices.flatMap((device) => device.vulnerabilities).map((finding) => [findingKey(finding), finding])
  );
  const currentFindings = new Map(
    current.topology.devices.flatMap((device) => device.vulnerabilities).map((finding) => [findingKey(finding), finding])
  );

  return {
    currentId: current.id,
    baselineId: baseline.id,
    newHosts: current.topology.devices.filter((device) => !baselineHosts.has(device.ip)),
    removedHosts: baseline.topology.devices.filter((device) => !currentHosts.has(device.ip)),
    newVulnerabilities: [...currentFindings.entries()]
      .filter(([key]) => !baselineFindings.has(key))
      .map(([, finding]) => finding),
    resolvedVulnerabilities: [...baselineFindings.entries()]
      .filter(([key]) => !currentFindings.has(key))
      .map(([, finding]) => finding)
  };
}
