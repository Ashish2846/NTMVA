import { parseStringPromise } from "xml2js";
import type { NetworkDevice, PortService } from "../../src/types/domain.js";
import { attr, childArray, firstChild, textFromScripts } from "../utils/xml.js";
import { inferDeviceType, subnetOf } from "../utils/network.js";

interface ParsedHostEvidence {
  device: Omit<NetworkDevice, "vulnerabilities" | "riskScore" | "attackSurface">;
  evidence: string;
}

function normalizeServiceName(name: string | undefined): string {
  return (name?.trim().toLowerCase() || "unknown").replaceAll("_", "-");
}

function parsePorts(host: unknown): PortService[] {
  const portNodes = childArray(firstChild(host, "ports"), "port");

  return portNodes.map((portNode, index) => {
    const stateNode = firstChild(portNode, "state");
    const serviceNode = firstChild(portNode, "service");
    const portId = Number(attr(portNode, "portid") ?? 0);
    const service = normalizeServiceName(attr(serviceNode, "name"));
    const product = attr(serviceNode, "product");
    const version = attr(serviceNode, "version");
    const extraInfo = attr(serviceNode, "extrainfo");
    const cpe = childArray(serviceNode, "cpe")
      .map((item) => (typeof item === "string" ? item : undefined))
      .filter((item): item is string => Boolean(item));

    return {
      id: `${attr(portNode, "protocol") ?? "tcp"}-${portId}-${index}`,
      protocol: attr(portNode, "protocol") ?? "tcp",
      port: portId,
      state: attr(stateNode, "state") ?? "unknown",
      service,
      product,
      version,
      extraInfo,
      tunnel: attr(serviceNode, "tunnel"),
      cpe
    };
  });
}

function parseHostname(host: unknown, fallbackIp: string): string {
  const hostnameNode = childArray(firstChild(host, "hostnames"), "hostname")[0];
  return attr(hostnameNode, "name") ?? fallbackIp;
}

function parseOs(host: unknown): string {
  const osMatch = childArray(firstChild(host, "os"), "osmatch")[0];
  return attr(osMatch, "name") ?? "Unknown OS";
}

function parseResponseTime(host: unknown): number | undefined {
  const srtt = Number(attr(firstChild(host, "times"), "srtt"));
  if (!Number.isFinite(srtt) || srtt <= 0) {
    return undefined;
  }

  return Math.round(srtt / 1000);
}

function openSharesFromEvidence(evidence: string): string[] {
  const shares = new Set<string>();

  if (evidence.includes("ipc$")) shares.add("IPC$");
  if (evidence.includes("admin$")) shares.add("ADMIN$");
  if (evidence.includes("smb")) shares.add("SMB service exposed");
  if (evidence.includes("anonymous")) shares.add("Anonymous file access");

  return [...shares];
}

function processesFromPorts(ports: PortService[]): string[] {
  return ports
    .filter((port) => port.state === "open")
    .map((port) => {
      const product = [port.product, port.version].filter(Boolean).join(" ");
      return product || `${port.service} daemon`;
    })
    .slice(0, 8);
}

export async function parseNmapXml(xml: string): Promise<ParsedHostEvidence[]> {
  const parsed = (await parseStringPromise(xml, {
    explicitArray: true,
    trim: true,
    mergeAttrs: false
  })) as Record<string, unknown>;

  const hosts = childArray(parsed.nmaprun, "host");
  const now = new Date().toISOString();

  return hosts
    .map((host): ParsedHostEvidence | undefined => {
      const addresses = childArray(host, "address");
      const ipv4 = addresses.find((address) => attr(address, "addrtype") === "ipv4");
      const ipv6 = addresses.find((address) => attr(address, "addrtype") === "ipv6");
      const mac = addresses.find((address) => attr(address, "addrtype") === "mac");
      const ip = attr(ipv4, "addr") ?? attr(ipv6, "addr");

      if (!ip) {
        return undefined;
      }

      const ports = parsePorts(host);
      const os = parseOs(host);
      const vendor = attr(mac, "vendor") ?? "Unknown vendor";
      const evidence = `${textFromScripts(host)} ${ports
        .map((port) => [port.service, port.product, port.version, port.extraInfo, ...(port.cpe ?? [])].join(" "))
        .join(" ")}`.toLowerCase();
      const status = attr(firstChild(host, "status"), "state") ?? "unknown";

      return {
        evidence,
        device: {
          id: ip,
          ip,
          hostname: parseHostname(host, ip),
          mac: attr(mac, "addr")
            ? {
                address: attr(mac, "addr") ?? "",
                vendor
              }
            : undefined,
          vendor,
          os,
          type: inferDeviceType(
            os,
            vendor,
            ports.map((port) => port.port)
          ),
          responseTimeMs: parseResponseTime(host),
          ttl: Number(attr(firstChild(host, "status"), "reason_ttl")) || undefined,
          ports,
          openShares: openSharesFromEvidence(evidence),
          processes: processesFromPorts(ports),
          status: status === "up" || status === "down" ? status : "unknown",
          subnet: subnetOf(ip),
          vlan: `VLAN-${subnetOf(ip).split(".")[2] ?? "0"}`,
          firstSeen: now,
          lastSeen: now
        }
      };
    })
    .filter((entry): entry is ParsedHostEvidence => Boolean(entry));
}
