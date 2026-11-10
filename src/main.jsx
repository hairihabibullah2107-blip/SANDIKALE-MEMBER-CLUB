import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import AdminAuth from "./AdminAuth.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("SANDIKALE MEMBER CLUB render error:", error, info); }
  render() {
    if (this.state.hasError) return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f5f5f2",fontFamily:"Arial"}}><section style={{maxWidth:560,background:"#fff",padding:28}}><b>SANDIKALE MEMBER CLUB</b><h2>Aplikasi mengalami error.</h2><pre style={{whiteSpace:"pre-wrap"}}>{this.state.error?.message}</pre><button onClick={()=>window.location.reload()}>Muat ulang</button></section></main>;
    return this.props.children;
  }
}
const rootElement = document.getElementById("root");
const isAdmin = window.location.pathname.replace(/\/$/,"")==="/admin" || new URLSearchParams(window.location.search).get("view")==="admin";
if (rootElement) ReactDOM.createRoot(rootElement).render(<React.StrictMode><AppErrorBoundary>{isAdmin ? <AdminAuth><Admin /></AdminAuth> : <App />}</AppErrorBoundary></React.StrictMode>);
