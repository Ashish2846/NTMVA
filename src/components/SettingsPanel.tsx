import { Palette, SlidersHorizontal, SunMoon, TimerReset } from "lucide-react";
import type { AppSettings } from "../types/domain";

export function SettingsPanel({
  settings,
  onChange
}: {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}): JSX.Element {
  return (
    <section className="panel settings-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>
            <SlidersHorizontal size={17} aria-hidden="true" />
            Operator preferences
          </h2>
        </div>
      </header>

      <div className="settings-grid">
        <label className="field">
          <span>
            <SunMoon size={14} aria-hidden="true" />
            Theme
          </span>
          <select value={settings.theme} onChange={(event) => onChange({ ...settings, theme: event.target.value as AppSettings["theme"] })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label className="field">
          <span>
            <Palette size={14} aria-hidden="true" />
            Accent
          </span>
          <select value={settings.accent} onChange={(event) => onChange({ ...settings, accent: event.target.value as AppSettings["accent"] })}>
            <option value="cyan">Cyan</option>
            <option value="blue">Blue</option>
            <option value="orange">Orange</option>
            <option value="red">Red</option>
          </select>
        </label>
        <label className="toggle-row">
          <span>Animations</span>
          <input
            checked={settings.animations}
            type="checkbox"
            onChange={(event) => onChange({ ...settings, animations: event.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>Auto refresh</span>
          <input
            checked={settings.autoRefresh}
            type="checkbox"
            onChange={(event) => onChange({ ...settings, autoRefresh: event.target.checked })}
          />
        </label>
        <label className="field">
          <span>
            <TimerReset size={14} aria-hidden="true" />
            Terminal speed
          </span>
          <input
            type="range"
            min="10"
            max="120"
            value={settings.terminalSpeed}
            onChange={(event) => onChange({ ...settings, terminalSpeed: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Scan timeout</span>
          <input
            type="number"
            min="5"
            max="7200"
            value={settings.scanTimeoutSeconds}
            onChange={(event) => onChange({ ...settings, scanTimeoutSeconds: Number(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}
