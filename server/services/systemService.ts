import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { SystemStatus } from "../../src/types/domain.js";
import { listScanRecords } from "./historyService.js";
import { findNseDirectory } from "./nseService.js";

const execFileAsync = promisify(execFile);

export async function getNmapVersion(): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("nmap", ["--version"], { timeout: 3000 });
    return stdout.split("\n")[0]?.trim();
  } catch {
    return undefined;
  }
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const [nmapVersion, nseDirectory, records] = await Promise.all([
    getNmapVersion(),
    findNseDirectory(),
    listScanRecords()
  ]);

  return {
    nmapAvailable: Boolean(nmapVersion),
    nmapVersion,
    nseDirectory,
    historyCount: records.length,
    sampleAvailable: true
  };
}
