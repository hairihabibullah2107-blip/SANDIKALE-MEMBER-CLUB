import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("SANDIKALE MEMBER CLUB render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f5f2", color: "#191919", fontFamily: "Arial, sans-serif" }}>
          <section style={{ width: "min(100%, 460px)", background: "#fff", border: "1px solid #e5e5df", padding: 28 }}>
            <div style={{ fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>SANDIKALE</div>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "#888", marginBottom: 18 }}>MEMBER CLUB</div>
            <h1 style={{ fontSize: 22 }}>Halaman sedang mengalami gangguan.</h1>
            <p style={{ color: "#666", lineHeight: 1.6 }}>Tampilan gagal dimuat. Muat ulang halaman untuk mencoba kembali.</p>
            <button onClick={() => window.location.reload()} style={{ border: 0, background: "#191919", color: "#fff", padding: "12px 18px", cursor: "pointer" }}>Muat ulang halaman</button>
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
