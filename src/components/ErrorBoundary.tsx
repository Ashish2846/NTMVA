import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryState {
  message?: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { message: error.message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Console render failure", error, info);
  }

  override render(): ReactNode {
    if (this.state.message) {
      return (
        <main className="fatal-panel">
          <div>
            <p className="eyebrow">Runtime fault</p>
            <h1>Console module failed</h1>
            <p>{this.state.message}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload console
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
