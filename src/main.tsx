import "./styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.querySelector("#app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);