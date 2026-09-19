import { Clock3, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { NseCategory, NseScript } from "../types/domain";
import { SeverityBadge } from "./SeverityBadge";

const categories: Array<NseCategory | "all"> = [
  "all",
  "authentication",
  "discovery",
  "brute-force",
  "vulnerability",
  "http",
  "ftp",
  "smb",
  "ssh",
  "dns",
  "snmp",
  "malware",
  "safe",
  "intrusive"
];

export function NseScriptManager({
  scripts,
  selected,
  onSelectedChange
}: {
  scripts: NseScript[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
}): JSX.Element {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NseCategory | "all">("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return scripts.filter((script) => {
      const matchesCategory = category === "all" || script.category === category;
      const matchesQuery =
        normalized.length === 0 ||
        script.id.includes(normalized) ||
        script.name.toLowerCase().includes(normalized) ||
        script.description.toLowerCase().includes(normalized);

      return matchesCategory && matchesQuery;
    });
  }, [category, query, scripts]);

  function toggle(scriptId: string): void {
    onSelectedChange(
      selected.includes(scriptId)
        ? selected.filter((id) => id !== scriptId)
        : [...selected, scriptId]
    );
  }

  return (
    <section className="panel nse-manager">
      <header className="panel-header">
        <div>
          <p className="eyebrow">NSE script manager</p>
          <h2>
            <ShieldAlert size={17} aria-hidden="true" />
            Local scripts
          </h2>
        </div>
        <span>{selected.length} enabled</span>
      </header>

      <div className="nse-toolbar">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scripts" />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value as NseCategory | "all")}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All categories" : item}
            </option>
          ))}
        </select>
      </div>

      <div className="nse-list">
        {filtered.map((script) => (
          <article className={selected.includes(script.id) ? "nse-card enabled" : "nse-card"} key={script.id}>
            <div className="nse-card-top">
              <label className="toggle">
                <input
                  checked={selected.includes(script.id)}
                  type="checkbox"
                  onChange={() => toggle(script.id)}
                />
                <span />
              </label>
              <div>
                <strong>{script.name}</strong>
                <code>{script.id}</code>
              </div>
              <SeverityBadge severity={script.risk} />
            </div>
            <p>{script.description}</p>
            <footer>
              <span>{script.category}</span>
              <span>
                <Clock3 size={13} aria-hidden="true" />
                {Math.round(script.averageExecutionMs / 100) / 10}s avg
              </span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
