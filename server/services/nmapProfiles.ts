import type { ScanProfile } from "../../src/types/domain.js";

export const nmapProfiles: Record<ScanProfile, string[]> = {
  quick: ["-T4", "-F"],
  intense: ["-T4", "-A", "-v"],
  "os-detection": ["-O"],
  "service-detection": ["-sV"],
  "version-detection": ["-sV", "--version-all"],
  udp: ["-sU", "--top-ports", "200"],
  "tcp-syn": ["-sS"],
  ack: ["-sA"],
  null: ["-sN"],
  fin: ["-sF"],
  xmas: ["-sX"],
  stealth: ["-sS", "-T2", "--data-length", "24"],
  aggressive: ["-A", "-T4"],
  ipv6: ["-6"],
  "ping-sweep": ["-sn"],
  traceroute: ["--traceroute"],
  custom: []
};

const strippedOutputFlags = new Set(["-oX", "-oN", "-oG", "-oA", "-oS"]);

export function tokenizeCustomArguments(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | "\"" | undefined;

  for (const char of input.trim()) {
    if ((char === "'" || char === "\"") && quote === undefined) {
      quote = char;
      continue;
    }

    if (char === quote) {
      quote = undefined;
      continue;
    }

    if (/\s/.test(char) && quote === undefined) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens.filter((token, index, allTokens) => {
    if (strippedOutputFlags.has(token)) {
      return false;
    }

    const previous = allTokens[index - 1];
    return previous === undefined || !strippedOutputFlags.has(previous);
  });
}

export function buildNmapCommand(params: {
  target: string;
  profile: ScanProfile;
  customArguments: string;
  selectedScripts: string[];
}): string[] {
  const profileArgs = nmapProfiles[params.profile] ?? [];
  const customArgs = params.profile === "custom" ? tokenizeCustomArguments(params.customArguments) : [];
  const scriptArgs =
    params.selectedScripts.length > 0 ? ["--script", params.selectedScripts.join(",")] : [];

  return [
    ...profileArgs,
    ...customArgs,
    ...scriptArgs,
    "-oX",
    "-",
    params.target
  ];
}
