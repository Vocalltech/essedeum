import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Clear cookies to prevent 431 Request Header Fields Too Large errors
document.cookie.split(";").forEach((c) => {
  document.cookie = c
    .replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
