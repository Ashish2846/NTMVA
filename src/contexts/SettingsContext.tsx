import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultSettings } from "../services/api";
import type { AppSettings } from "../types/domain";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (next: AppSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, updateSettings] = useLocalStorage<AppSettings>("ntmva-settings", defaultSettings);
  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }

  return context;
}
