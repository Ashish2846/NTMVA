import type { Severity } from "../types/domain";
import { severityLabel } from "../utils/format";

export function SeverityBadge({ severity }: { severity: Severity }): JSX.Element {
  return <span className={`severity severity-${severity}`}>{severityLabel(severity)}</span>;
}
