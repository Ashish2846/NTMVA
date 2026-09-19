import { ErrorBoundary } from "./components/ErrorBoundary";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ConsolePage } from "./pages/ConsolePage";

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ConsolePage />
      </SettingsProvider>
    </ErrorBoundary>
  );
}
