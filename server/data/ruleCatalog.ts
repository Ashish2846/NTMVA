import type { Severity } from "../../src/types/domain.js";

export interface RuleDefinition {
  id: string;
  title: string;
  severity: Severity;
  serviceNames: string[];
  ports: number[];
  productHints: string[];
  evidenceHints: string[];
  reason: string;
  impact: string;
  mitigation: string;
  references: string[];
  mitreTechniques: string[];
  owaspCategories: string[];
}

export const ruleCatalog: RuleDefinition[] = [
  {
    id: "RULE-FTP-ANON",
    title: "FTP anonymous access exposure",
    severity: "high",
    serviceNames: ["ftp"],
    ports: [21],
    productHints: [],
    evidenceHints: ["anonymous", "ftp-anon"],
    reason: "FTP is reachable and scan evidence indicates anonymous login may be enabled.",
    impact:
      "Unauthenticated users may read or write sensitive files and stage payloads.",
    mitigation:
      "Disable anonymous FTP, require strong authentication, and restrict FTP to trusted networks.",
    references: ["https://nmap.org/nsedoc/scripts/ftp-anon.html"],
    mitreTechniques: ["T1078", "T1105"],
    owaspCategories: ["A01:2021-Broken Access Control"]
  },
  {
    id: "RULE-SMBV1",
    title: "SMBv1 or legacy SMB service exposed",
    severity: "critical",
    serviceNames: ["microsoft-ds", "netbios-ssn", "smb"],
    ports: [139, 445],
    productHints: ["smbv1", "windows 7", "windows server 2008"],
    evidenceHints: ["smbv1", "message signing disabled"],
    reason: "Legacy SMB exposure is associated with wormable remote exploitation.",
    impact:
      "Attackers can enumerate shares, relay authentication, or exploit remote code execution flaws.",
    mitigation:
      "Disable SMBv1, require SMB signing, apply vendor patches, and block SMB from untrusted zones.",
    references: ["https://learn.microsoft.com/windows-server/storage/file-server/troubleshoot/detect-enable-and-disable-smbv1-v2-v3"],
    mitreTechniques: ["T1021.002", "T1210"],
    owaspCategories: ["A05:2021-Security Misconfiguration"]
  },
  {
    id: "RULE-WEAK-SSH",
    title: "Weak or legacy SSH service",
    severity: "medium",
    serviceNames: ["ssh"],
    ports: [22],
    productHints: ["openssh 5", "openssh 6", "dropbear"],
    evidenceHints: ["diffie-hellman-group1", "sshv1"],
    reason: "SSH is running with legacy server software or weak cryptographic indicators.",
    impact:
      "Weak algorithms and old daemon versions increase credential theft and downgrade risk.",
    mitigation:
      "Upgrade the SSH daemon, disable weak ciphers/MACs/KEX, and enforce key-based access.",
    references: ["https://nmap.org/nsedoc/scripts/ssh2-enum-algos.html"],
    mitreTechniques: ["T1021.004", "T1110"],
    owaspCategories: ["A02:2021-Cryptographic Failures"]
  },
  {
    id: "RULE-TLS10",
    title: "Legacy TLS protocol enabled",
    severity: "medium",
    serviceNames: ["https", "ssl", "ssl/http"],
    ports: [443, 8443, 9443],
    productHints: [],
    evidenceHints: ["tlsv1.0", "ssl 3.0", "weak cipher"],
    reason: "Legacy TLS or SSL versions appear enabled on an exposed service.",
    impact:
      "Clients may negotiate outdated encryption vulnerable to downgrade and interception attacks.",
    mitigation:
      "Disable SSLv2/SSLv3/TLS 1.0/TLS 1.1 and prefer modern TLS with strong cipher suites.",
    references: ["https://nmap.org/nsedoc/scripts/ssl-enum-ciphers.html"],
    mitreTechniques: ["T1557"],
    owaspCategories: ["A02:2021-Cryptographic Failures"]
  },
  {
    id: "RULE-TELNET",
    title: "Telnet management interface exposed",
    severity: "high",
    serviceNames: ["telnet"],
    ports: [23],
    productHints: [],
    evidenceHints: [],
    reason: "Telnet transmits credentials and session data without encryption.",
    impact:
      "Credentials can be captured on-path and reused for lateral movement.",
    mitigation:
      "Disable Telnet and use SSH with strong authentication and network segmentation.",
    references: ["https://attack.mitre.org/techniques/T1021/001/"],
    mitreTechniques: ["T1021.001", "T1040"],
    owaspCategories: ["A02:2021-Cryptographic Failures"]
  },
  {
    id: "RULE-RDP",
    title: "Remote Desktop exposed",
    severity: "high",
    serviceNames: ["ms-wbt-server", "rdp"],
    ports: [3389],
    productHints: [],
    evidenceHints: [],
    reason: "RDP is reachable and should be treated as high-value remote access surface.",
    impact:
      "RDP exposure increases brute-force, credential stuffing, and remote exploit risk.",
    mitigation:
      "Require VPN or zero-trust access, enforce MFA, patch RDS, and monitor failed logons.",
    references: ["https://attack.mitre.org/techniques/T1021/001/"],
    mitreTechniques: ["T1021.001", "T1110"],
    owaspCategories: ["A07:2021-Identification and Authentication Failures"]
  },
  {
    id: "RULE-REDIS",
    title: "Redis service reachable",
    severity: "critical",
    serviceNames: ["redis"],
    ports: [6379],
    productHints: [],
    evidenceHints: ["no authentication", "redis-info"],
    reason: "Redis is reachable; unauthenticated Redis frequently leads to data theft or code execution.",
    impact:
      "Attackers may write keys, alter jobs, extract data, or persist via configuration abuse.",
    mitigation:
      "Bind Redis to localhost/private interfaces, require authentication, and restrict network ACLs.",
    references: ["https://redis.io/docs/latest/operate/oss_and_stack/management/security/"],
    mitreTechniques: ["T1210", "T1490"],
    owaspCategories: ["A05:2021-Security Misconfiguration"]
  },
  {
    id: "RULE-MONGODB",
    title: "MongoDB service exposed",
    severity: "high",
    serviceNames: ["mongodb"],
    ports: [27017, 27018],
    productHints: [],
    evidenceHints: ["unauthorized", "mongodb-databases"],
    reason: "MongoDB is reachable on the network and may expose sensitive collections.",
    impact:
      "Weak access controls can disclose or destroy databases and backups.",
    mitigation:
      "Enable authentication, bind to trusted interfaces, enforce TLS, and review database roles.",
    references: ["https://www.mongodb.com/docs/manual/administration/security-checklist/"],
    mitreTechniques: ["T1213", "T1485"],
    owaspCategories: ["A01:2021-Broken Access Control"]
  },
  {
    id: "RULE-SNMP",
    title: "Weak SNMP exposure",
    severity: "medium",
    serviceNames: ["snmp"],
    ports: [161],
    productHints: [],
    evidenceHints: ["public", "private", "snmp-info"],
    reason: "SNMP is reachable and may reveal device inventory, routes, users, or community strings.",
    impact:
      "Attackers can enumerate network architecture and sometimes modify device state.",
    mitigation:
      "Disable SNMPv1/v2c, use SNMPv3, rotate community strings, and restrict source networks.",
    references: ["https://nmap.org/nsedoc/scripts/snmp-info.html"],
    mitreTechniques: ["T1046", "T1082"],
    owaspCategories: ["A05:2021-Security Misconfiguration"]
  },
  {
    id: "RULE-HTTP-MISCONFIG",
    title: "HTTP service requires hardening",
    severity: "medium",
    serviceNames: ["http", "https", "ssl/http"],
    ports: [80, 443, 8080, 8443],
    productHints: ["apache 2.4.49", "apache 2.4.50", "iis 6"],
    evidenceHints: ["directory listing", "default page", "server-status"],
    reason: "Web service metadata or script results suggest a hardening gap.",
    impact:
      "Misconfigured HTTP services leak sensitive paths, versions, or administrative surfaces.",
    mitigation:
      "Disable directory listing, remove default apps, patch web servers, and add security headers.",
    references: ["https://owasp.org/www-project-web-security-testing-guide/"],
    mitreTechniques: ["T1592.002", "T1190"],
    owaspCategories: ["A05:2021-Security Misconfiguration"]
  }
];
