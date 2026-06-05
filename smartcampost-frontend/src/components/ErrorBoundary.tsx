import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches unhandled render errors in the component tree
 * and displays a user-friendly fallback instead of a blank/broken screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in development; in production this should go to Sentry
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            fontFamily: "'Inter', sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "48px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>⚠️</div>

            <h1
              style={{
                color: "#f1f5f9",
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "15px",
                lineHeight: 1.6,
                marginBottom: "32px",
              }}
            >
              An unexpected error occurred in the SmartCAMPOST application.
              Our team has been notified. Please try again or contact support if
              the problem persists.
            </p>

            {/* Error details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <summary
                  style={{
                    color: "#f87171",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Error details (development only)
                </summary>
                <pre
                  style={{
                    color: "#fca5a5",
                    fontSize: "12px",
                    marginTop: "8px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 32px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
              }
              onMouseOut={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
