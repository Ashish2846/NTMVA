import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NseCategory, NseScript, Severity } from "../../src/types/domain.js";
import { fallbackNseScripts } from "../data/nseCatalog.js";

const commonScriptDirs = [
  "/opt/homebrew/share/nmap/scripts",
  "/usr/local/share/nmap/scripts",
  "/usr/share/nmap/scripts",
  "/Applications/Nmap.app/Contents/Resources/share/nmap/scripts"
];

const preferredDefaultScripts = new Set([
  "ftp-anon",
  "smb-protocols",
  "smb-vuln-ms17-010",
  "ssh2-enum-algos",
  "ssl-enum-ciphers",
  "http-title",
  "http-security-headers",
  "snmp-info",
  "dns-recursion",
  "mongodb-info",
  "redis-info"
]);

const preferredOrder = [
  "http-title",
  "http-security-headers",
  "ssl-enum-ciphers",
  "ssh2-enum-algos",
  "ftp-anon",
  "smb-protocols",
  "smb-vuln-ms17-010",
  "snmp-info",
  "dns-recursion",
  "mongodb-info",
  "redis-info"
];

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function findNseDirectory(): Promise<string | undefined> {
  for (const candidate of commonScriptDirs) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function inferCategory(scriptName: string): NseCategory {
  if (scriptName.startsWith("http")) return "http";
  if (scriptName.startsWith("ftp")) return "ftp";
  if (scriptName.startsWith("smb")) return "smb";
  if (scriptName.startsWith("ssh")) return "ssh";
  if (scriptName.startsWith("dns")) return "dns";
  if (scriptName.startsWith("snmp")) return "snmp";
  if (scriptName.includes("brute")) return "brute-force";
  if (scriptName.includes("vuln")) return "vulnerability";
  if (scriptName.includes("malware")) return "malware";
  if (scriptName.includes("auth")) return "authentication";
  if (scriptName.includes("discover") || scriptName.includes("info")) return "discovery";
  if (scriptName.includes("intrusive")) return "intrusive";
  return "safe";
}

function inferRisk(category: NseCategory, scriptName: string): Severity {
  if (category === "malware" || category === "brute-force" || scriptName.includes("dos")) return "high";
  if (category === "vulnerability" || category === "intrusive") return "medium";
  if (category === "safe" || category === "discovery") return "low";
  return "info";
}

function descriptionFromScript(contents: string, fallback: string): string {
  const descriptionMatch = contents.match(/description\s*=\s*\[\[([\s\S]*?)\]\]/m);
  if (descriptionMatch?.[1]) {
    return descriptionMatch[1].replace(/\s+/g, " ").trim().slice(0, 260);
  }

  const shortMatch = contents.match(/description\s*=\s*"([^"]+)"/m);
  return shortMatch?.[1]?.trim() ?? fallback;
}

export async function listNseScripts(): Promise<NseScript[]> {
  const directory = await findNseDirectory();

  if (!directory) {
    return fallbackNseScripts;
  }

  const files = (await readdir(directory)).filter((file) => file.endsWith(".nse")).slice(0, 450);
  const discovered = await Promise.all(
    files.map(async (file) => {
      const id = file.replace(/\.nse$/, "");
      const category = inferCategory(id);
      const path = join(directory, file);
      const contents = await readFile(path, "utf8").catch(() => "");

      return {
        id,
        name: id
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        category,
        description: descriptionFromScript(contents, `Local NSE script: ${id}`),
        risk: inferRisk(category, id),
        averageExecutionMs: category === "brute-force" ? 12000 : category === "vulnerability" ? 5000 : 1200,
        path,
        enabledByDefault: preferredDefaultScripts.has(id)
      } satisfies NseScript;
    })
  );

  const merged = new Map<string, NseScript>();
  for (const script of [...fallbackNseScripts, ...discovered]) {
    merged.set(script.id, script);
  }

  return [...merged.values()].sort((left, right) => {
    const leftPriority = preferredOrder.indexOf(left.id);
    const rightPriority = preferredOrder.indexOf(right.id);

    if (leftPriority !== -1 || rightPriority !== -1) {
      return (leftPriority === -1 ? Number.MAX_SAFE_INTEGER : leftPriority) -
        (rightPriority === -1 ? Number.MAX_SAFE_INTEGER : rightPriority);
    }

    return left.category.localeCompare(right.category) || left.name.localeCompare(right.name);
  });
}
