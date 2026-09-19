import type { NseScript } from "../../src/types/domain.js";

export const fallbackNseScripts: NseScript[] = [
  {
    id: "ftp-anon",
    name: "FTP Anonymous Login",
    category: "ftp",
    description: "Checks whether FTP permits anonymous authentication.",
    risk: "high",
    averageExecutionMs: 850,
    enabledByDefault: true
  },
  {
    id: "smb-protocols",
    name: "SMB Protocol Negotiation",
    category: "smb",
    description: "Detects SMB dialects, including legacy SMBv1 exposure.",
    risk: "critical",
    averageExecutionMs: 1400,
    enabledByDefault: true
  },
  {
    id: "smb-vuln-ms17-010",
    name: "MS17-010 Exposure",
    category: "vulnerability",
    description: "Checks for SMB vulnerabilities associated with MS17-010.",
    risk: "critical",
    averageExecutionMs: 5000,
    enabledByDefault: false
  },
  {
    id: "ssh2-enum-algos",
    name: "SSH Algorithm Audit",
    category: "ssh",
    description: "Enumerates SSH ciphers, MACs, and key exchange algorithms.",
    risk: "medium",
    averageExecutionMs: 1500,
    enabledByDefault: true
  },
  {
    id: "ssl-enum-ciphers",
    name: "TLS Cipher Audit",
    category: "http",
    description: "Enumerates supported SSL/TLS protocols and cipher suites.",
    risk: "medium",
    averageExecutionMs: 4200,
    enabledByDefault: true
  },
  {
    id: "http-title",
    name: "HTTP Title",
    category: "http",
    description: "Retrieves web page titles for service triage.",
    risk: "info",
    averageExecutionMs: 700,
    enabledByDefault: true
  },
  {
    id: "http-security-headers",
    name: "HTTP Security Headers",
    category: "http",
    description: "Assesses common security headers on HTTP responses.",
    risk: "low",
    averageExecutionMs: 1100,
    enabledByDefault: true
  },
  {
    id: "snmp-info",
    name: "SNMP Inventory",
    category: "snmp",
    description: "Extracts device and network information over SNMP.",
    risk: "medium",
    averageExecutionMs: 1800,
    enabledByDefault: false
  },
  {
    id: "dns-recursion",
    name: "DNS Recursion Check",
    category: "dns",
    description: "Tests whether DNS recursion is exposed to clients.",
    risk: "medium",
    averageExecutionMs: 950,
    enabledByDefault: false
  },
  {
    id: "mongodb-info",
    name: "MongoDB Information",
    category: "discovery",
    description: "Collects MongoDB server metadata when reachable.",
    risk: "high",
    averageExecutionMs: 1300,
    enabledByDefault: false
  },
  {
    id: "redis-info",
    name: "Redis Information",
    category: "discovery",
    description: "Collects Redis server metadata and auth behavior.",
    risk: "critical",
    averageExecutionMs: 950,
    enabledByDefault: false
  },
  {
    id: "vulners",
    name: "Vulners NSE Matcher",
    category: "vulnerability",
    description: "Runs local service banner matching when available in the NSE path.",
    risk: "medium",
    averageExecutionMs: 6000,
    enabledByDefault: false
  },
  {
    id: "auth-owners",
    name: "Auth Owner Discovery",
    category: "authentication",
    description: "Identifies owner information for authenticated services when exposed.",
    risk: "low",
    averageExecutionMs: 900,
    enabledByDefault: false
  },
  {
    id: "http-brute",
    name: "HTTP Brute Force",
    category: "brute-force",
    description: "Performs controlled HTTP credential checks; intrusive and disabled by default.",
    risk: "high",
    averageExecutionMs: 12000,
    enabledByDefault: false
  },
  {
    id: "malware-host",
    name: "Malware Host Indicators",
    category: "malware",
    description: "Checks known malware indicators exposed by services.",
    risk: "high",
    averageExecutionMs: 2200,
    enabledByDefault: false
  }
];
