import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  failed: boolean;
};

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Momentum screen failed to render", error, info);
    }
  }

  private returnHome = () => {
    window.history.replaceState(null, "", "/");
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="app-recovery" role="alert">
        <div className="app-recovery-mark" aria-hidden="true">◇</div>
        <span className="text-label">Momentum recovery</span>
        <h1 className="font-pixel">This screen paused.</h1>
        <p>
          Your local data has not been changed. Reload Momentum to try the
          screen again, or return home if this route keeps failing.
        </p>
        <div>
          <button type="button" onClick={() => window.location.reload()}>
            Reload Momentum
          </button>
          <button type="button" onClick={this.returnHome}>
            Return home
          </button>
        </div>
      </main>
    );
  }
}
