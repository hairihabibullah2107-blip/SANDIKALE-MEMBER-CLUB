import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SANDIKALE MEMBER CLUB render error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || "Unknown render error";
      const componentStack = this.state.errorInfo?.componentStack || "";
      return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f5f2", color: "#191919", fontFamily: "Arial, sans-serif" }}>
          <section style={{ width: "min(100%, 560px)", background: "#fff", border: "1px solid #e5e5df", padding: 28 }}>
            <div style={{ fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>SANDIKALE</div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#888", marginBottom: 18 }}>MEMBER CLUB</div>
            <h1 style={{ fontSize: 22 }}>Aplikasi mengalami error.</h1>
            <p style={{ color: "#666", lineHeight: 1.6 }}>Pesan teknis untuk pemeriksaan:</p>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#f4f3ef", padding: 12, fontSize: 12, color: "#8a2929" }}>{message}</pre>
            {componentStack && <details style={{ marginTop: 12, fontSize: 11 }}><summary>Detail komponen</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{componentStack}</pre></details>}
            <button onClick={() => window.location.reload()} style={{ border: 0, background: "#191919", color: "#fff", padding: "12px 18px", cursor: "pointer", marginTop: 12 }}>Muat ulang halaman</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
const isAdmin =
  window.location.pathname.replace(/\/$/, "") === "/admin" ||
  new URLSearchParams(window.location.search).get("view") === "admin";

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>{isAdmin ? <Admin /> : <App />}</AppErrorBoundary>
    </React.StrictMode>
  );
}
