import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Admin from "./Admin.jsx";
import "./styles.css";

const isAdmin =
  window.location.pathname.replace(/\/$/, "") === "/admin" ||
  new URLSearchParams(window.location.search).get("view") === "admin";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{isAdmin ? <Admin /> : <App />}</React.StrictMode>
);
