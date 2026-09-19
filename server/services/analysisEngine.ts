import { nanoid } from "nanoid";
import type {
  CveMatch,
  NetworkDevice,
  PortService,
  RiskMetrics,
  ScanProfile,
  ScanRecord,
  ScanSummary,
  Severity,
  TimelineEvent,
  TopologyEdge,
  TopologySnapshot,
  VulnerabilityFinding
} from "../../src/types/domain.js";

import {
  cveDatabase,
  toCveMatch,
  type CveRecord
} from "../data/cveDatabase.js";

import {
  ruleCatalog,
  type RuleDefinition
} from "../data/ruleCatalog.js";

import {
  clamp,
  hostSortValue,
  maxSeverity,
  severityWeight
} from "../utils/network.js";

import { parseNmapXml } from "./xmlParser.js";

interface HostAnalysisInput {
  device: Omit<
    NetworkDevice,
    "vulnerabilities" | "riskScore" | "attackSurface"
  >;
  evidence: string;
}

/**
 * Returns true only when a port is actually open.
 *
 * Vulnerability findings, CVEs, risk calculations and attack-surface
 * calculations should be based on exposed/open services.
 */
function isOpenPort(port: PortService): boolean {
  return String(port.state).toLowerCase() === "open";
}

/**
 * Normalize a value before comparing it.
 */
function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Build searchable text from a port and operating-system information.
 */
function textForPort(port: PortService, os: string): string {
  return [
    port.service,
    port.product,
    port.version,
    port.extraInfo,
    port.tunnel,
    os,
    ...(port.cpe ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Match a CVE against an OPEN port.
 *
 * Important:
 * - Closed/filtered ports are ignored.
 * - Product must match.
 * - If a CVE specifies versions, the scanned version must match.
 * - If the CVE specifies OS families and has no version requirement,
 *   the OS family must match.
 */
function matchesCve(
  record: CveRecord,
  port: PortService,
  os: string
): CveMatch | undefined {
  // Never report a CVE against a closed/filtered port.
  if (!isOpenPort(port)) {
    return undefined;
  }

  const haystack = textForPort(port, os);

  const productMatched =
    record.products.length === 0 ||
    record.products.some((product) =>
      haystack.includes(normalize(product))
    );

  if (!productMatched) {
    return undefined;
  }

  const versionMatched =
    record.versions.length === 0 ||
    record.versions.some((version) =>
      haystack.includes(normalize(version))
    );

  const osMatched =
    record.osFamilies.length === 0 ||
    record.osFamilies.some((family) =>
      haystack.includes(normalize(family))
    );

  /*
   * If a CVE specifies a version, do not treat an OS match alone
   * as proof that the installed version is vulnerable.
   */
  if (record.versions.length > 0 && !versionMatched) {
    return undefined;
  }

  /*
   * If there are no version requirements but there are OS requirements,
   * the OS must match.
   */
  if (
    record.versions.length === 0 &&
    record.osFamilies.length > 0 &&
    !osMatched
  ) {
    return undefined;
  }

  /*
   * If neither versions nor OS families are specified, the product
   * match is sufficient.
   */
  if (
    record.versions.length === 0 &&
    record.osFamilies.length === 0
  ) {
    return toCveMatch(
      record,
      `${port.service} ${port.product ?? ""} ${port.version ?? ""}`.trim()
    );
  }

  return toCveMatch(
    record,
    `${port.service} ${port.product ?? ""} ${port.version ?? ""}`.trim()
  );
}

/**
 * Determine whether a vulnerability rule applies to an OPEN port.
 *
 * This is the main protection against the Telnet false-positive bug:
 *
 *     23/tcp telnet closed
 *
 * must NOT trigger the Telnet vulnerability.
 */
function matchesRule(
  rule: RuleDefinition,
  port: PortService,
  evidence: string
): boolean {
  // Never apply vulnerability rules to closed/filtered ports.
  if (!isOpenPort(port)) {
    return false;
  }

  const serviceName = normalize(port.service);

  const serviceMatched =
    rule.serviceNames.length === 0 ||
    rule.serviceNames.some(
      (service) => normalize(service) === serviceName
    );

  const portMatched =
    rule.ports.length === 0 ||
    rule.ports.includes(port.port);

  const portText = textForPort(port, evidence);
  const normalizedEvidence = normalize(evidence);

  const productHintMatched =
    rule.productHints.length > 0 &&
    rule.productHints.some((hint) =>
      portText.includes(normalize(hint))
    );

  const evidenceHintMatched =
    rule.evidenceHints.length > 0 &&
    rule.evidenceHints.some((hint) =>
      normalizedEvidence.includes(normalize(hint))
    );

  /*
   * If the rule has no product/evidence requirements,
   * service or port matching is enough.
   */
  if (
    rule.productHints.length === 0 &&
    rule.evidenceHints.length === 0
  ) {
    return serviceMatched || portMatched;
  }

  const hintMatched =
    productHintMatched || evidenceHintMatched;

  return (serviceMatched || portMatched) && hintMatched;
}

/**
 * Convert a rule match into a vulnerability finding.
 */
function findingFromRule(
  rule: RuleDefinition,
  device: HostAnalysisInput["device"],
  port: PortService
): VulnerabilityFinding {
  return {
    id: `${rule.id}-${device.ip}-${port.protocol}-${port.port}`,
    title: rule.title,
    severity: rule.severity,
    reason: rule.reason,
    impact: rule.impact,
    mitigation: rule.mitigation,
    references: rule.references,
    evidence:
      `${port.protocol}/${port.port} ` +
      `${port.service} ` +
      `${port.product ?? ""} ` +
      `${port.version ?? ""}`.trim(),
    deviceIp: device.ip,
    port: port.port,
    service: port.service,
    mitreTechniques: rule.mitreTechniques,
    owaspCategories: rule.owaspCategories
  };
}

/**
 * Convert a CVE match into a vulnerability finding.
 */
function findingFromCve(
  cve: CveMatch,
  device: HostAnalysisInput["device"],
  port: PortService
): VulnerabilityFinding {
  return {
    id: `${cve.id}-${device.ip}-${port.protocol}-${port.port}`,

    title:
      `${cve.id}: ${port.product ?? port.service} ` +
      `${port.version ?? ""}`.trim(),

    severity: cve.severity,

    reason: cve.description,

    impact:
      cve.exploitAvailable
        ? "Public exploit signals exist; prioritize validation and remediation."
        : "Known vulnerable service version detected; exposure should be patched or mitigated.",

    mitigation:
      cve.patchAvailable
        ? "Apply the vendor patch or upgrade to a non-vulnerable service release."
        : "Restrict access, add compensating controls, and monitor until a vendor fix is available.",

    references: cve.references,

    evidence: cve.matchedOn,

    deviceIp: device.ip,

    port: port.port,

    service: port.service,

    cve,

    mitreTechniques: ["T1190", "T1210"],

    owaspCategories: [
      "A06:2021-Vulnerable and Outdated Components"
    ]
  };
}

/**
 * Remove duplicate findings.
 */
function uniqueFindings(
  findings: VulnerabilityFinding[]
): VulnerabilityFinding[] {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key =
      `${finding.deviceIp}-${finding.title}-` +
      `${finding.port ?? "host"}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/**
 * Calculate risk for a single device.
 *
 * Only OPEN ports contribute to exposure.
 */
function calculateDeviceRisk(
  ports: PortService[],
  findings: VulnerabilityFinding[]
): number {
  const openPorts = ports.filter(isOpenPort).length;

  const severityScore = findings.reduce(
    (sum, finding) =>
      sum + severityWeight(finding.severity),
    0
  );

  const serviceExposure = openPorts * 5;

  /*
   * Remote-access services only contribute when actually OPEN.
   *
   * 22  = SSH
   * 23  = Telnet
   * 3389 = RDP
   * 445 = SMB
   */
  const remoteAccessBonus = ports.some(
    (port) =>
      isOpenPort(port) &&
      [22, 23, 3389, 445].includes(port.port)
  )
    ? 12
    : 0;

  return Math.round(
    clamp(
      serviceExposure +
        severityScore / 2.8 +
        remoteAccessBonus,
      0,
      100
    )
  );
}

/**
 * Calculate attack surface.
 *
 * Closed/filtered administrative ports do NOT count as exposed.
 */
function calculateAttackSurface(
  ports: PortService[],
  findings: VulnerabilityFinding[]
): number {
  const exposedAdmin = ports.filter(
    (port) =>
      isOpenPort(port) &&
      [
        22,
        23,
        445,
        3389,
        5900,
        6379,
        27017
      ].includes(port.port)
  ).length;

  const critical = findings.filter(
    (finding) => finding.severity === "critical"
  ).length;

  const openPortScore =
    ports.filter(isOpenPort).length * 10;

  const adminExposureScore =
    exposedAdmin * 12;

  const criticalScore =
    critical * 18;

  return Math.round(
    clamp(
      openPortScore +
        adminExposureScore +
        criticalScore,
      0,
      100
    )
  );
}

/**
 * Analyze one host.
 *
 * Defense in depth:
 * Closed ports are skipped before entering the rule/CVE engines.
 */
function analyzeHost(
  input: HostAnalysisInput
): NetworkDevice {
  const findings = uniqueFindings(
    input.device.ports.flatMap((port) => {
      /*
       * Never analyze closed or filtered ports.
       *
       * This prevents false positives even if a future rule
       * accidentally forgets to check the port state.
       */
      if (!isOpenPort(port)) {
        return [];
      }

      const ruleFindings = ruleCatalog
        .filter((rule) =>
          matchesRule(
            rule,
            port,
            input.evidence
          )
        )
        .map((rule) =>
          findingFromRule(
            rule,
            input.device,
            port
          )
        );

      const cveFindings = cveDatabase
        .map((record) =>
          matchesCve(
            record,
            port,
            input.device.os
          )
        )
        .filter(
          (cve): cve is CveMatch =>
            Boolean(cve)
        )
        .map((cve) =>
          findingFromCve(
            cve,
            input.device,
            port
          )
        );

      return [
        ...ruleFindings,
        ...cveFindings
      ];
    })
  );

  return {
    ...input.device,

    vulnerabilities: findings,

    riskScore: calculateDeviceRisk(
      input.device.ports,
      findings
    ),

    attackSurface: calculateAttackSurface(
      input.device.ports,
      findings
    )
  };
}

/**
 * Build network topology.
 */
function buildTopology(
  devices: NetworkDevice[]
): TopologySnapshot {
  const sortedDevices = [...devices].sort(
    (left, right) =>
      hostSortValue(left.ip) -
      hostSortValue(right.ip)
  );

  const gateway =
    sortedDevices.find(
      (device) =>
        device.type === "firewall" ||
        device.type === "router"
    ) ??
    sortedDevices.find(
      (device) => device.ip.endsWith(".1")
    ) ??
    sortedDevices[0];

  const gatewayId = gateway?.id;

  const edges: TopologyEdge[] =
    sortedDevices
      .filter(
        (device) => device.id !== gatewayId
      )
      .map((device) => {
        const riskyPorts =
          device.ports.filter(isOpenPort);

        const severities =
          device.vulnerabilities.map(
            (finding) => finding.severity
          );

        const highest =
          maxSeverity(severities);

        const protocol =
          riskyPorts[0]?.protocol ?? "icmp";

        const label =
          riskyPorts.length > 0
            ? `${riskyPorts.length} open ports`
            : "host discovered";

        return {
          id:
            `${gatewayId ?? "root"}-${device.id}`,

          source:
            gatewayId ?? device.id,

          target:
            device.id,

          label,

          protocol,

          risk:
            highest,

          animated:
            device.riskScore >= 60
        };
      });

  return {
    devices: sortedDevices,
    edges,
    gatewayId
  };
}

/**
 * Count occurrences of values.
 */
function countBy<T extends string | number>(
  items: T[]
): Array<{
  name: string;
  count: number;
}> {
  const counts = new Map<T, number>();

  for (const item of items) {
    counts.set(
      item,
      (counts.get(item) ?? 0) + 1
    );
  }

  return [...counts.entries()]
    .map(([name, count]) => ({
      name: String(name),
      count
    }))
    .sort(
      (left, right) =>
        right.count - left.count
    );
}

/**
 * Build dashboard metrics.
 */
function buildMetrics(
  devices: NetworkDevice[]
): RiskMetrics {
  /*
   * Only open ports are included in exposure/service metrics.
   */
  const openPorts = devices.flatMap(
    (device) =>
      device.ports.filter(isOpenPort)
  );

  const findings =
    devices.flatMap(
      (device) => device.vulnerabilities
    );

  const severityDistribution = (
    [
      "critical",
      "high",
      "medium",
      "low",
      "info"
    ] as Severity[]
  ).map((severity) => ({
    severity,

    count:
      findings.filter(
        (finding) =>
          finding.severity === severity
      ).length
  }));

  const averageRisk =
    devices.length === 0
      ? 0
      : Math.round(
          devices.reduce(
            (sum, device) =>
              sum + device.riskScore,
            0
          ) / devices.length
        );

  const attackSurfaceScore =
    devices.length === 0
      ? 0
      : Math.round(
          devices.reduce(
            (sum, device) =>
              sum + device.attackSurface,
            0
          ) / devices.length
        );

  const serviceCounts =
    countBy(
      openPorts.map(
        (port) => port.service
      )
    );

  /*
   * Calculate service severity only from OPEN ports.
   *
   * Also preserve the highest severity when multiple
   * devices/ports expose the same service.
   */
  const severityByService =
    new Map<string, Severity>();

  for (const device of devices) {
    for (const port of device.ports) {
      if (!isOpenPort(port)) {
        continue;
      }

      const service =
        port.service;

      const related =
        device.vulnerabilities.filter(
          (finding) =>
            normalize(
              finding.service
            ) === normalize(service)
        );

      const currentSeverity =
        maxSeverity(
          related.map(
            (finding) =>
              finding.severity
          )
        );

      const previousSeverity =
        severityByService.get(
          service
        );

      if (previousSeverity) {
        severityByService.set(
          service,
          maxSeverity([
            previousSeverity,
            currentSeverity
          ])
        );
      } else {
        severityByService.set(
          service,
          currentSeverity
        );
      }
    }
  }

  const subnets = [
    ...new Set(
      devices.map(
        (device) => device.subnet
      )
    )
  ];

  return {
    overallNetworkScore:
      Math.round(
        clamp(
          averageRisk * 0.65 +
            attackSurfaceScore * 0.35,
          0,
          100
        )
      ),

    securityScore:
      Math.round(
        clamp(
          100 -
            (averageRisk * 0.7 +
              attackSurfaceScore * 0.3),
          0,
          100
        )
      ),

    averageRisk,

    attackSurfaceScore,

    criticalDevices:
      devices.filter(
        (device) =>
          device.riskScore >= 75
      ).length,

    severityDistribution,

    topExposedServices:
      serviceCounts
        .slice(0, 8)
        .map((service) => ({
          service: service.name,

          count:
            service.count,

          severity:
            severityByService.get(
              service.name
            ) ?? "info"
        })),

    operatingSystems:
      countBy(
        devices.map(
          (device) => device.os
        )
      )
        .slice(0, 8),

    ports:
      countBy(
        openPorts.map(
          (port) => port.port
        )
      )
        .map((item) => ({
          port: Number(item.name),
          count: item.count
        }))
        .slice(0, 10),

    services:
      serviceCounts.slice(0, 10),

    riskHeatMap:
      subnets.map((subnet) => {
        const subnetDevices =
          devices.filter(
            (device) =>
              device.subnet === subnet
          );

        return {
          subnet,

          hosts:
            subnetDevices.length,

          averageRisk:
            subnetDevices.length === 0
              ? 0
              : Math.round(
                  subnetDevices.reduce(
                    (sum, device) =>
                      sum +
                      device.riskScore,
                    0
                  ) /
                    subnetDevices.length
                )
        };
      })
  };
}

/**
 * Build scan summary.
 */
function buildSummary(
  devices: NetworkDevice[],
  metrics: RiskMetrics
): ScanSummary {
  const openPorts =
    devices.flatMap(
      (device) =>
        device.ports.filter(
          isOpenPort
        )
    );

  return {
    totalHosts:
      devices.length,

    activeHosts:
      devices.filter(
        (device) =>
          device.status === "up"
      ).length,

    criticalHosts:
      metrics.criticalDevices,

    openPorts:
      openPorts.length,

    vulnerabilities:
      devices.flatMap(
        (device) =>
          device.vulnerabilities
      ).length,

    services:
      new Set(
        openPorts.map(
          (port) => port.service
        )
      ).size,

    averageRisk:
      metrics.averageRisk
  };
}

/**
 * Build scan timeline.
 */
function timelineForRecord(
  devices: NetworkDevice[],
  extraEvents: TimelineEvent[] = []
): TimelineEvent[] {
  const now =
    new Date().toISOString();

  const openPorts =
    devices.flatMap(
      (device) =>
        device.ports.filter(
          isOpenPort
        )
    );

  const vulnerabilities =
    devices.flatMap(
      (device) =>
        device.vulnerabilities
    );

  return [
    {
      id: nanoid(),

      time: now,

      phase: "discovery",

      message:
        `Running Host Discovery... ` +
        `${devices.length} responsive hosts identified`,

      severity: "info"
    },

    {
      id: nanoid(),

      time: now,

      phase: "port-scan",

      message:
        `Open Port Found... ` +
        `${openPorts.length} reachable services mapped`,

      severity: "info"
    },

    {
      id: nanoid(),

      time: now,

      phase: "nse",

      message:
        "Running NSE Scripts... service evidence normalized",

      severity: "info"
    },

    ...vulnerabilities
      .slice(0, 8)
      .map((finding) => ({
        id: nanoid(),

        time: now,

        phase:
          "analysis" as const,

        message:
          `Vulnerability Found... ` +
          `${finding.title} on ${finding.deviceIp}`,

        severity:
          finding.severity
      })),

    ...extraEvents,

    {
      id: nanoid(),

      time: now,

      phase: "finished",

      message: "Finished",

      severity:
        vulnerabilities.some(
          (finding) =>
            finding.severity ===
            "critical"
        )
          ? "critical"
          : "info"
    }
  ];
}

/**
 * Parse Nmap XML and produce the complete scan record.
 */
export async function analyzeXmlToRecord(
  params: {
    xml: string;
    target: string;
    profile: ScanProfile;
    command: string[];
    name?: string;
    terminal?: TimelineEvent[];
  }
): Promise<ScanRecord> {
  const parsedHosts =
    await parseNmapXml(
      params.xml
    );

  const devices =
    parsedHosts.map(
      analyzeHost
    );

  const topology =
    buildTopology(
      devices
    );

  const metrics =
    buildMetrics(
      devices
    );

  const summary =
    buildSummary(
      devices,
      metrics
    );

  const terminal =
    timelineForRecord(
      devices,
      params.terminal
    );

  const now =
    new Date().toISOString();

  return {
    id: nanoid(12),

    name:
      params.name ??
      `${params.profile} scan - ${params.target}`,

    target:
      params.target,

    profile:
      params.profile,

    status:
      "completed",

    startedAt:
      now,

    finishedAt:
      now,

    command:
      params.command,

    terminal,

    topology,

    metrics,

    summary,

    rawXml:
      params.xml
  };
}

/**
 * Empty metrics used before a scan exists.
 */
export function emptyMetrics(): RiskMetrics {
  return {
    overallNetworkScore: 0,

    securityScore: 100,

    averageRisk: 0,

    attackSurfaceScore: 0,

    criticalDevices: 0,

    severityDistribution:
      (
        [
          "critical",
          "high",
          "medium",
          "low",
          "info"
        ] as Severity[]
      ).map(
        (severity) => ({
          severity,
          count: 0
        })
      ),

    topExposedServices: [],

    operatingSystems: [],

    ports: [],

    services: [],

    riskHeatMap: []
  };
}