import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { ExportFormat, ScanProfile } from "../src/types/domain.js";
import { analyzeXmlToRecord } from "./services/analysisEngine.js";
import {
  diffScans,
  ensureSampleRecord,
  getScanRecord,
  listScanRecords,
  saveScanRecord
} from "./services/historyService.js";
import { listNseScripts } from "./services/nseService.js";
import { exportScan } from "./services/reportService.js";
import { getScanSession, startScan } from "./services/scanManager.js";
import { getSystemStatus } from "./services/systemService.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const currentDir = dirname(fileURLToPath(import.meta.url));
const distDir = join(currentDir, "..", "dist");

const scanProfileSchema = z.enum([
  "quick",
  "intense",
  "os-detection",
  "service-detection",
  "version-detection",
  "udp",
  "tcp-syn",
  "ack",
  "null",
  "fin",
  "xmas",
  "stealth",
  "aggressive",
  "ipv6",
  "ping-sweep",
  "traceroute",
  "custom"
]);

const scanRequestSchema = z.object({
  target: z.string().min(1).max(180),
  profile: scanProfileSchema,
  customArguments: z.string().max(800).default(""),
  selectedScripts: z.array(z.string().min(1).max(80)).max(60).default([]),
  timeoutSeconds: z.number().int().min(5).max(7200).default(300),
  storeHistory: z.boolean().default(true),
  simulate: z.boolean().optional()
});

const exportSchema = z.enum(["json", "csv", "html", "xml"]);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "network-topology-mapper", time: new Date().toISOString() });
});

app.get("/api/system", async (_request, response, next) => {
  try {
    response.json(await getSystemStatus());
  } catch (error) {
    next(error);
  }
});

app.get("/api/nse-scripts", async (_request, response, next) => {
  try {
    response.json(await listNseScripts());
  } catch (error) {
    next(error);
  }
});

app.get("/api/scans", async (_request, response, next) => {
  try {
    response.json(await listScanRecords());
  } catch (error) {
    next(error);
  }
});

app.post("/api/scans", (request, response, next) => {
  try {
    const body = scanRequestSchema.parse(request.body);
    const session = startScan(body);
    response.status(202).json({ sessionId: session.id });
  } catch (error) {
    next(error);
  }
});

app.get("/api/scans/:id", async (request, response, next) => {
  try {
    const record = await getScanRecord(request.params.id);
    if (!record) {
      response.status(404).json({ message: "Scan record not found" });
      return;
    }

    response.json(record);
  } catch (error) {
    next(error);
  }
});

app.get("/api/scans/:id/events", (request, response) => {
  const session = getScanSession(request.params.id);
  if (!session) {
    response.status(404).json({ message: "Scan session not found" });
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  for (const event of session.events) {
    response.write(`event: terminal\ndata: ${JSON.stringify(event)}\n\n`);
  }

  if (session.record) {
    response.write(`event: record\ndata: ${JSON.stringify(session.record)}\n\n`);
  }

  const eventListener = (event: unknown): void => {
    response.write(`event: terminal\ndata: ${JSON.stringify(event)}\n\n`);
  };
  const recordListener = (record: unknown): void => {
    response.write(`event: record\ndata: ${JSON.stringify(record)}\n\n`);
  };

  session.emitter.on("event", eventListener);
  session.emitter.on("record", recordListener);
  request.on("close", () => {
    session.emitter.off("event", eventListener);
    session.emitter.off("record", recordListener);
  });
});

app.post(
  "/api/analyze/xml",
  express.text({ type: ["application/xml", "text/xml", "text/plain"], limit: "40mb" }),
  async (request, response, next) => {
    try {
      const target = typeof request.query.target === "string" ? request.query.target : "imported-xml";
      const profile = scanProfileSchema.safeParse(request.query.profile).success
        ? (request.query.profile as ScanProfile)
        : "custom";
      const xml = typeof request.body === "string" ? request.body : "";

      if (!xml.includes("<nmaprun")) {
        response.status(400).json({ message: "Request body must contain Nmap XML" });
        return;
      }

      const record = await analyzeXmlToRecord({
        xml,
        target,
        profile,
        command: ["import", "nmap-xml"],
        name: `Imported XML - ${target}`
      });
      response.status(201).json(await saveScanRecord(record));
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/scans/sample", async (_request, response, next) => {
  try {
    response.status(201).json(await ensureSampleRecord());
  } catch (error) {
    next(error);
  }
});

app.get("/api/scans/:currentId/diff/:baselineId", async (request, response, next) => {
  try {
    const [current, baseline] = await Promise.all([
      getScanRecord(request.params.currentId),
      getScanRecord(request.params.baselineId)
    ]);

    if (!current || !baseline) {
      response.status(404).json({ message: "Both scan records are required for diff" });
      return;
    }

    response.json(diffScans(current, baseline));
  } catch (error) {
    next(error);
  }
});

app.get("/api/scans/:id/export/:format", async (request, response, next) => {
  try {
    const parsedFormat = exportSchema.safeParse(request.params.format);
    const record = await getScanRecord(request.params.id);

    if (!parsedFormat.success) {
      response.status(400).json({ message: "Unsupported export format" });
      return;
    }

    if (!record) {
      response.status(404).json({ message: "Scan record not found" });
      return;
    }

    const format = parsedFormat.data as ExportFormat;
    const exported = exportScan(record, format);
    response.header("Content-Type", exported.contentType);
    response.header("Content-Disposition", `attachment; filename="${record.id}.${format}"`);
    response.send(exported.body);
  } catch (error) {
    next(error);
  }
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_request, response) => {
    response.sendFile(join(distDir, "index.html"));
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: "Invalid request", details: error.flatten() });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({ message });
});

await ensureSampleRecord();

app.listen(port, "127.0.0.1", () => {
  console.log(`Network Topology Mapper API listening on http://127.0.0.1:${port}`);
});
