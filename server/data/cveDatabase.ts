import type { CveMatch, Severity } from "../../src/types/domain.js";

export interface CveRecord {
  id: string;
  products: string[];
  versions: string[];
  osFamilies: string[];
  cvss: number;
  severity: Severity;
  description: string;
  references: string[];
  patchAvailable: boolean;
  exploitAvailable: boolean;
}

export const cveDatabase: CveRecord[] = [
  {
    id: "CVE-2011-2523",
    products: ["vsftpd"],
    versions: ["2.3.4"],
    osFamilies: ["linux"],
    cvss: 10,
    severity: "critical",
    description:
      "Backdoored vsftpd build permits remote command execution on affected hosts.",
    references: [
      "https://nvd.nist.gov/vuln/detail/CVE-2011-2523",
      "https://www.rapid7.com/db/modules/exploit/unix/ftp/vsftpd_234_backdoor/"
    ],
    patchAvailable: true,
    exploitAvailable: true
  },
  {
    id: "CVE-2017-0144",
    products: ["microsoft-ds", "smb", "samba"],
    versions: ["1.0", "smbv1", "windows 7", "windows server 2008"],
    osFamilies: ["windows"],
    cvss: 9.3,
    severity: "critical",
    description:
      "SMBv1 remote code execution exposure associated with EternalBlue-class attacks.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2017-0144"],
    patchAvailable: true,
    exploitAvailable: true
  },
  {
    id: "CVE-2021-41773",
    products: ["apache httpd", "apache"],
    versions: ["2.4.49"],
    osFamilies: ["linux", "unix"],
    cvss: 7.5,
    severity: "high",
    description:
      "Apache path traversal and file disclosure issue in vulnerable 2.4.49 deployments.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-41773"],
    patchAvailable: true,
    exploitAvailable: true
  },
  {
    id: "CVE-2021-42013",
    products: ["apache httpd", "apache"],
    versions: ["2.4.50"],
    osFamilies: ["linux", "unix"],
    cvss: 9.8,
    severity: "critical",
    description:
      "Incomplete fix for Apache path traversal that may permit remote command execution.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-42013"],
    patchAvailable: true,
    exploitAvailable: true
  },
  {
    id: "CVE-2016-0777",
    products: ["openssh"],
    versions: ["5.", "6.", "7.1"],
    osFamilies: ["linux", "unix"],
    cvss: 4.3,
    severity: "medium",
    description:
      "OpenSSH roaming information leak affecting legacy client/server combinations.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2016-0777"],
    patchAvailable: true,
    exploitAvailable: false
  },
  {
    id: "CVE-2022-0543",
    products: ["redis"],
    versions: ["5.", "6."],
    osFamilies: ["linux"],
    cvss: 10,
    severity: "critical",
    description:
      "Redis Lua sandbox escape exposure affecting some Linux package builds.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2022-0543"],
    patchAvailable: true,
    exploitAvailable: true
  },
  {
    id: "CVE-2020-0796",
    products: ["microsoft-ds", "smb"],
    versions: ["3.1.1", "windows 10", "windows server 2019"],
    osFamilies: ["windows"],
    cvss: 10,
    severity: "critical",
    description:
      "SMBGhost remote code execution exposure in SMBv3 compression handling.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2020-0796"],
    patchAvailable: true,
    exploitAvailable: true
  },
  {
    id: "CVE-2019-0708",
    products: ["rdp", "ms-wbt-server", "terminal services"],
    versions: ["windows 7", "windows server 2008", "windows xp"],
    osFamilies: ["windows"],
    cvss: 9.8,
    severity: "critical",
    description:
      "BlueKeep remote code execution exposure in legacy Remote Desktop Services.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2019-0708"],
    patchAvailable: true,
    exploitAvailable: true
  },
  {
    id: "CVE-2018-13379",
    products: ["fortinet", "fortigate", "ssl vpn"],
    versions: ["5.", "6.0"],
    osFamilies: ["fortios"],
    cvss: 9.8,
    severity: "critical",
    description:
      "Fortinet SSL VPN path traversal issue enabling sensitive file disclosure.",
    references: ["https://nvd.nist.gov/vuln/detail/CVE-2018-13379"],
    patchAvailable: true,
    exploitAvailable: true
  }
];

export function toCveMatch(record: CveRecord, matchedOn: string): CveMatch {
  return {
    id: record.id,
    cvss: record.cvss,
    severity: record.severity,
    description: record.description,
    references: record.references,
    patchAvailable: record.patchAvailable,
    exploitAvailable: record.exploitAvailable,
    matchedOn
  };
}
