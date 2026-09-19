import { Terminal } from "lucide-react";
import { useEffect, useRef } from "react";
import type { TimelineEvent } from "../types/domain";
import { formatDate } from "../utils/format";
import { SeverityBadge } from "./SeverityBadge";

export function LiveTerminal({ events, scanning }: { events: TimelineEvent[]; scanning: boolean }): JSX.Element {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events]);

  return (
    <section className="panel terminal-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Live terminal</p>
          <h2>
            <Terminal size={17} aria-hidden="true" />
            Scan stream
          </h2>
        </div>
        <span className={`status-dot ${scanning ? "status-running" : ""}`} />
      </header>
      <div className="terminal-body">
        {events.length === 0 ? (
          <p className="terminal-line muted">$ waiting for scan telemetry...</p>
        ) : (
          events.map((event) => (
            <div className="terminal-line" key={event.id}>
              <span>{formatDate(event.time)}</span>
              <SeverityBadge severity={event.severity} />
              <code>{event.message}</code>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
