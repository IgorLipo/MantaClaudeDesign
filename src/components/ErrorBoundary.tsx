import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

// App-wide error boundary: catches any render crash so the user gets a
// recoverable screen instead of a blank/white page.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary] Caught render error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. You can try again or go back to the dashboard.
          </p>
          {this.state.error?.message && (
            <pre className="text-left text-xs bg-muted rounded-md p-3 overflow-auto max-h-40 text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Try again
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
